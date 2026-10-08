import request from 'supertest';
import { createApp } from '../src/server';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const testEmail = `dashboard_test_${Date.now()}@example.com`;
const testPassword = 'password123';

describe('Dashboard summary', () => {
  let cookie: string;
  let arraysQuestionId: string;
  let arraysCorrectOptionId: string;
  let joinsQuestionId: string;
  let joinsWrongOptionId: string;

  beforeAll(async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword });
    cookie = signupRes.headers['set-cookie'][0];

    const arraysQ = await prisma.question.findFirstOrThrow({
      where: { topic: { slug: 'dsa-arrays' } },
    });
    arraysQuestionId = arraysQ.id;
    arraysCorrectOptionId = arraysQ.correctOptionId;

    const joinsQ = await prisma.question.findFirstOrThrow({
      where: { topic: { slug: 'sql-joins' } },
    });
    joinsQuestionId = joinsQ.id;
    joinsWrongOptionId = joinsQ.correctOptionId === 'a' ? 'b' : 'a';
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

  it('returns zeroed summary before any activity', async () => {
    const res = await request(app).get('/api/dashboard/summary').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.readiness.score).toBe(0);
    expect(res.body.weakTopics).toEqual([]);
    expect(res.body.heatmap).toEqual([]);
  });

  it('submits a correct DSA attempt and an incorrect SQL attempt', async () => {
    const r1 = await request(app)
      .post('/api/activities/mcq')
      .set('Cookie', cookie)
      .send({ questionId: arraysQuestionId, selectedOptionId: arraysCorrectOptionId, timeTakenMs: 2000 });
    expect(r1.status).toBe(201);

    const r2 = await request(app)
      .post('/api/activities/mcq')
      .set('Cookie', cookie)
      .send({ questionId: joinsQuestionId, selectedOptionId: joinsWrongOptionId, timeTakenMs: 2000 });
    expect(r2.status).toBe(201);

    const recomputeRes = await request(app).post('/api/analysis/recompute').set('Cookie', cookie);
    expect(recomputeRes.status).toBe(200);
  });

  it('reflects both subjects in preparation balance at 50/50', async () => {
    const res = await request(app).get('/api/dashboard/summary').set('Cookie', cookie);
    const dsaBalance = res.body.balance.find((b: any) => b.slug === 'dsa');
    const sqlBalance = res.body.balance.find((b: any) => b.slug === 'sql');

    expect(dsaBalance.percentage).toBe(50);
    expect(sqlBalance.percentage).toBe(50);
  });

  it('ranks SQL below DSA in weak topics (since SQL attempt was wrong)', async () => {
    const res = await request(app).get('/api/dashboard/summary').set('Cookie', cookie);
    const weakSlugs = res.body.weakTopics.map((t: any) => t.slug);

    expect(weakSlugs[0]).toBe('sql'); // lowest mastery first
  });

  it('shows today in the activity heatmap', async () => {
    const res = await request(app).get('/api/dashboard/summary').set('Cookie', cookie);
    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = res.body.heatmap.find((h: any) => h.date === today);

    expect(todayEntry).toBeDefined();
    expect(todayEntry.count).toBe(2);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(401);
  });
});