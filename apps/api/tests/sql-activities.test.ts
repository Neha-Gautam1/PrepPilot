import request from 'supertest';
import { createApp } from '../src/server';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const testEmail = `sql_test_${Date.now()}@example.com`;
const testPassword = 'password123';

describe('Activity ingestion: SQL', () => {
  let cookie: string;
  let exerciseId: string;
  let canonicalQuery: string;

  beforeAll(async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword });
    cookie = signupRes.headers['set-cookie'][0];

    const exercise = await prisma.sqlExercise.findFirstOrThrow({
      where: { topic: { slug: 'sql-joins' } },
    });
    exerciseId = exercise.id;
    canonicalQuery = exercise.canonicalQuery;
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (user) {
      await prisma.skillProfile.deleteMany({ where: { userId: user.id } });
      await prisma.activity.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  it('lists SQL exercises for a topic without exposing the canonical query or expected result', async () => {
    const topic = await prisma.topic.findUniqueOrThrow({ where: { slug: 'sql-joins' } });
    const res = await request(app).get(`/api/topics/${topic.id}/sql-exercises`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).not.toHaveProperty('canonicalQuery');
    expect(res.body[0]).not.toHaveProperty('expectedResultJson');
  });

  it('rejects submission with no auth cookie', async () => {
    const res = await request(app)
      .post('/api/activities/sql')
      .send({ sqlExerciseId: exerciseId, query: canonicalQuery, timeTakenMs: 5000 });

    expect(res.status).toBe(401);
  });

  it('grades the canonical query as correct', async () => {
    const res = await request(app)
      .post('/api/activities/sql')
      .set('Cookie', cookie)
      .send({ sqlExerciseId: exerciseId, query: canonicalQuery, timeTakenMs: 4000 });

    expect(res.status).toBe(201);
    expect(res.body.isCorrect).toBe(true);
    expect(res.body.executionError).toBeNull();
  });

  it('grades a wrong-but-valid query as incorrect', async () => {
    const res = await request(app)
      .post('/api/activities/sql')
      .set('Cookie', cookie)
      .send({ sqlExerciseId: exerciseId, query: 'SELECT name FROM employees', timeTakenMs: 3000 });

    expect(res.status).toBe(201);
    expect(res.body.isCorrect).toBe(false);
  });

  it('captures a genuine SQL error as an incorrect attempt, not a 400', async () => {
    const res = await request(app)
      .post('/api/activities/sql')
      .set('Cookie', cookie)
      .send({ sqlExerciseId: exerciseId, query: 'SELECT nonexistent_column FROM employees', timeTakenMs: 2000 });

    expect(res.status).toBe(201);
    expect(res.body.isCorrect).toBe(false);
    expect(res.body.executionError).not.toBeNull();
  });

  it('rejects a destructive query outright', async () => {
    const res = await request(app)
      .post('/api/activities/sql')
      .set('Cookie', cookie)
      .send({ sqlExerciseId: exerciseId, query: 'DROP TABLE employees', timeTakenMs: 1000 });

    expect(res.status).toBe(400);
  });

  it('rejects a non-existent exercise', async () => {
    const res = await request(app)
      .post('/api/activities/sql')
      .set('Cookie', cookie)
      .send({
        sqlExerciseId: '00000000-0000-0000-0000-000000000000',
        query: 'SELECT 1',
        timeTakenMs: 1000,
      });

    expect(res.status).toBe(404);
  });

  it('rolls SQL attempts into mastery via recompute', async () => {
    const topic = await prisma.topic.findUniqueOrThrow({ where: { slug: 'sql-joins' } });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const res = await request(app).get('/api/analysis/me').set('Cookie', cookie);
    const profile = res.body.find((p: any) => p.topicId === topic.id);

    expect(profile).toBeDefined();
  });
});