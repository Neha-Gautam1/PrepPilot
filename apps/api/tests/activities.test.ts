import request from 'supertest';
import { createApp } from '../src/server';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const testEmail = `activity_test_${Date.now()}@example.com`;
const testPassword = 'password123';

describe('Activity ingestion: MCQ', () => {
  let cookie: string;
  let questionId: string;
  let correctOptionId: string;

  beforeAll(async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword });
    cookie = signupRes.headers['set-cookie'][0];

    const question = await prisma.question.findFirstOrThrow({
      where: { topic: { slug: 'dsa-arrays' } },
    });
    questionId = question.id;
    correctOptionId = question.correctOptionId;
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (user) {
      await prisma.activity.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  it('rejects submission with no auth cookie', async () => {
    const res = await request(app)
      .post('/api/activities/mcq')
      .send({ questionId, selectedOptionId: 'a', timeTakenMs: 5000 });

    expect(res.status).toBe(401);
  });

  it('records a correct attempt', async () => {
    const res = await request(app)
      .post('/api/activities/mcq')
      .set('Cookie', cookie)
      .send({ questionId, selectedOptionId: correctOptionId, timeTakenMs: 4000 });

    expect(res.status).toBe(201);
    expect(res.body.isCorrect).toBe(true);
    expect(res.body.correctOptionId).toBe(correctOptionId);
  });

  it('records an incorrect attempt as a separate row (re-attempt allowed)', async () => {
    const wrongOption = correctOptionId === 'a' ? 'b' : 'a';

    const res = await request(app)
      .post('/api/activities/mcq')
      .set('Cookie', cookie)
      .send({ questionId, selectedOptionId: wrongOption, timeTakenMs: 3000 });

    expect(res.status).toBe(201);
    expect(res.body.isCorrect).toBe(false);
  });

  it('rejects malformed input', async () => {
    const res = await request(app)
      .post('/api/activities/mcq')
      .set('Cookie', cookie)
      .send({ questionId, selectedOptionId: 'a' }); // missing timeTakenMs

    expect(res.status).toBe(400);
  });

  it('rejects a non-existent question', async () => {
    const res = await request(app)
      .post('/api/activities/mcq')
      .set('Cookie', cookie)
      .send({
        questionId: '00000000-0000-0000-0000-000000000000',
        selectedOptionId: 'a',
        timeTakenMs: 1000,
      });

    expect(res.status).toBe(404);
  });

  it('persisted two separate Activity+Attempt rows for the same question', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
    const activities = await prisma.activity.findMany({
      where: { userId: user.id },
      include: { attempt: true },
    });

    expect(activities.length).toBe(2);
    expect(activities[0].attempt).not.toBeNull();
  });

  it('lists activity history for the current user', async () => {
    const res = await request(app).get('/api/activities/me').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('isCorrect');
    expect(res.body[0]).toHaveProperty('questionPrompt');
  });
});