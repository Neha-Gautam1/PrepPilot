import request from 'supertest';
import { createApp } from '../src/server';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const testEmail = `reco_test_${Date.now()}@example.com`;
const testPassword = 'password123';

describe('Recommendations', () => {
  let cookie: string;

  beforeAll(async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword });
    cookie = signupRes.headers['set-cookie'][0];
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

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/recommendations/me');
    expect(res.status).toBe(401);
  });

  it('returns up to 3 recommendations with human-readable reasons', async () => {
    const res = await request(app).get('/api/recommendations/me').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeLessThanOrEqual(3);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty('reason');
      expect(typeof res.body[0].reason).toBe('string');
      expect(res.body[0].reason.length).toBeGreaterThan(0);
    }
  });

  it('recommends a weak topic with an explanation citing the actual mastery percentage', async () => {
    const question = await prisma.question.findFirstOrThrow({ where: { topic: { slug: 'dsa-arrays' } } });
    const wrongOption = question.correctOptionId === 'a' ? 'b' : 'a';

    await request(app)
      .post('/api/activities/mcq')
      .set('Cookie', cookie)
      .send({ questionId: question.id, selectedOptionId: wrongOption, timeTakenMs: 2000 });

    await new Promise((resolve) => setTimeout(resolve, 300));

    const res = await request(app).get('/api/recommendations/me').set('Cookie', cookie);
    const arraysReco = res.body.find((r: any) => r.topicSlug === 'dsa-arrays');

    expect(arraysReco).toBeDefined();
    expect(arraysReco.reason).toContain('mastery here is');
  });
});