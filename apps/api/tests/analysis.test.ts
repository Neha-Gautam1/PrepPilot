import request from 'supertest';
import { createApp } from '../src/server';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const testEmail = `analysis_test_${Date.now()}@example.com`;
const testPassword = 'password123';

describe('Analysis engine', () => {
  let cookie: string;
  let arraysTopicId: string;
  let dsaTopicId: string;
  let questionId: string;
  let correctOptionId: string;

  beforeAll(async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword });
    cookie = signupRes.headers['set-cookie'][0];

    const question = await prisma.question.findFirstOrThrow({
      where: { topic: { slug: 'dsa-arrays' } },
      include: { topic: true },
    });
    questionId = question.id;
    correctOptionId = question.correctOptionId;
    arraysTopicId = question.topicId;
    dsaTopicId = question.topic.parentId!;
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

  it('returns empty profile list before any attempts', async () => {
    const res = await request(app).get('/api/analysis/me').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

   it('submits one correct MCQ attempt', async () => {
    const res = await request(app)
      .post('/api/activities/mcq')
      .set('Cookie', cookie)
      .send({ questionId, selectedOptionId: correctOptionId, timeTakenMs: 3000 });
    expect(res.status).toBe(201);
  });

  it('auto-recomputes mastery after submission without an explicit recompute call', async () => {
    // Give the fire-and-forget recompute a moment to finish, since the
    // submit response returns before it necessarily completes.
    await new Promise((resolve) => setTimeout(resolve, 300));

    const res = await request(app).get('/api/analysis/me').set('Cookie', cookie);
    const arraysProfile = res.body.find((p: any) => p.topicId === arraysTopicId);

    expect(arraysProfile).toBeDefined();
    expect(arraysProfile.masteryScore).toBeGreaterThan(0);
  });

  it('recomputes skill profiles', async () => {
    const res = await request(app).post('/api/analysis/recompute').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.topicsUpdated).toBeGreaterThanOrEqual(2); // leaf topic + parent rollup
  });

  it('reflects mastery for the leaf topic (Arrays)', async () => {
    const res = await request(app).get('/api/analysis/me').set('Cookie', cookie);
    const arraysProfile = res.body.find((p: any) => p.topicId === arraysTopicId);

    expect(arraysProfile).toBeDefined();
    expect(arraysProfile.masteryScore).toBeGreaterThan(0);
  });

  it('rolls up mastery to the parent topic (DSA)', async () => {
    const res = await request(app).get('/api/analysis/me').set('Cookie', cookie);
    const dsaProfile = res.body.find((p: any) => p.topicId === dsaTopicId);

    expect(dsaProfile).toBeDefined();
    expect(dsaProfile.masteryScore).toBeGreaterThan(0);
  });

  it('rejects recompute without auth', async () => {
    const res = await request(app).post('/api/analysis/recompute');
    expect(res.status).toBe(401);
  });
});