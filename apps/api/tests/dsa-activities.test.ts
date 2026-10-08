import request from 'supertest';
import { createApp } from '../src/server';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const testEmail = `dsa_test_${Date.now()}@example.com`;
const testPassword = 'password123';

describe('Activity ingestion: DSA', () => {
  let cookie: string;
  let problemId: string;

  beforeAll(async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword });
    cookie = signupRes.headers['set-cookie'][0];

    const problem = await prisma.dsaProblem.findFirstOrThrow({
      where: { functionName: 'sumArray' },
    });
    problemId = problem.id;
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

  it('lists DSA problems for a topic without exposing test cases', async () => {
    const topic = await prisma.topic.findUniqueOrThrow({ where: { slug: 'dsa-arrays' } });
    const res = await request(app).get(`/api/topics/${topic.id}/dsa-problems`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).not.toHaveProperty('testCases');
    expect(res.body[0]).toHaveProperty('starterCode');
  });

  it('rejects submission with no auth cookie', async () => {
    const res = await request(app)
      .post('/api/activities/dsa')
      .send({ dsaProblemId: problemId, code: 'function sumArray(arr) { return 0; }', timeTakenMs: 1000 });

    expect(res.status).toBe(401);
  });

  it('grades a fully correct solution', async () => {
    const res = await request(app)
      .post('/api/activities/dsa')
      .set('Cookie', cookie)
      .send({
        dsaProblemId: problemId,
        code: 'function sumArray(arr) { return arr.reduce((a, b) => a + b, 0); }',
        timeTakenMs: 5000,
      });

    expect(res.status).toBe(201);
    expect(res.body.isCorrect).toBe(true);
    expect(res.body.testsPassed).toBe(res.body.testsTotal);
  });

  it('grades a partially correct solution', async () => {
    const res = await request(app)
      .post('/api/activities/dsa')
      .set('Cookie', cookie)
      .send({
        dsaProblemId: problemId,
        code: 'function sumArray(arr) { return arr.length; }', // wrong logic
        timeTakenMs: 4000,
      });

    expect(res.status).toBe(201);
    expect(res.body.isCorrect).toBe(false);
    expect(res.body.testsPassed).toBeLessThan(res.body.testsTotal);
  });

  it('contributes partial credit to mastery score, not binary 0/1', async () => {
    // Passes exactly 1 of 3 test cases for sumArray (EASY): correct only on the empty-array case.
    const res = await request(app)
      .post('/api/activities/dsa')
      .set('Cookie', cookie)
      .send({
        dsaProblemId: problemId,
        code: 'function sumArray(arr) { return arr.length === 0 ? 0 : -1; }',
        timeTakenMs: 3000,
      });

    expect(res.status).toBe(201);
    expect(res.body.testsPassed).toBe(1);
    expect(res.body.testsTotal).toBe(3);

    await new Promise((resolve) => setTimeout(resolve, 300));

    const arraysTopic = await prisma.topic.findUniqueOrThrow({ where: { slug: 'dsa-arrays' } });
    const profileRes = await request(app).get('/api/analysis/me').set('Cookie', cookie);
    const arraysProfile = profileRes.body.find((p: any) => p.topicId === arraysTopic.id);

    expect(arraysProfile).toBeDefined();
    // Mastery should NOT be a clean 0 or 1 — it should reflect blended partial credit
    // across all this user's DSA attempts on Arrays so far, including this 1/3 one.
    expect(arraysProfile.masteryScore).toBeGreaterThan(0);
    expect(arraysProfile.masteryScore).toBeLessThan(1);
  });

  it('handles a syntax error without crashing the server', async () => {
    const res = await request(app)
      .post('/api/activities/dsa')
      .set('Cookie', cookie)
      .send({
        dsaProblemId: problemId,
        code: 'function sumArray(arr) { return arr.reduce(( ',
        timeTakenMs: 2000,
      });

    expect(res.status).toBe(201);
    expect(res.body.isCorrect).toBe(false);
    expect(res.body.testsPassed).toBe(0);
  });

  it('handles an infinite loop via timeout without hanging the request', async () => {
    const res = await request(app)
      .post('/api/activities/dsa')
      .set('Cookie', cookie)
      .send({
        dsaProblemId: problemId,
        code: 'function sumArray(arr) { while (true) {} }',
        timeTakenMs: 3000,
      });

    expect(res.status).toBe(201);
    expect(res.body.isCorrect).toBe(false);
  }, 10000);

  it('rejects a non-existent problem', async () => {
    const res = await request(app)
      .post('/api/activities/dsa')
      .set('Cookie', cookie)
      .send({
        dsaProblemId: '00000000-0000-0000-0000-000000000000',
        code: 'function sumArray(arr) { return 0; }',
        timeTakenMs: 1000,
      });

    expect(res.status).toBe(404);
  });

  it('grades a correct Python solution via Judge0', async () => {
    const res = await request(app)
      .post('/api/activities/dsa')
      .set('Cookie', cookie)
      .send({
        dsaProblemId: problemId,
        code: 'def sumArray(arr):\n    return sum(arr)',
        timeTakenMs: 5000,
        language: 'python',
      });

    expect(res.status).toBe(201);
    expect(res.body.isCorrect).toBe(true);
    expect(res.body.testsPassed).toBe(res.body.testsTotal);
  }, 20000);

  it('grades a correct C++ solution via Judge0', async () => {
    const res = await request(app)
      .post('/api/activities/dsa')
      .set('Cookie', cookie)
      .send({
        dsaProblemId: problemId,
        code: 'int sumArray(vector<int> arr) {\n    int total = 0;\n    for (int x : arr) total += x;\n    return total;\n}',
        timeTakenMs: 5000,
        language: 'cpp',
      });

    expect(res.status).toBe(201);
    expect(res.body.isCorrect).toBe(true);
  }, 20000);

  it('rolls DSA attempts into mastery via recompute', async () => {
    const topic = await prisma.topic.findUniqueOrThrow({ where: { slug: 'dsa-arrays' } });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const res = await request(app).get('/api/analysis/me').set('Cookie', cookie);
    const profile = res.body.find((p: any) => p.topicId === topic.id);

    expect(profile).toBeDefined();
  });
});