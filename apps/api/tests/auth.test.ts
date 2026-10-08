import request from 'supertest';
import { createApp } from '../src/server';
import { prisma } from '../src/lib/prisma';

const app = createApp();
const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'password123';

describe('Auth flow', () => {
  let cookie: string;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it('signs up a new user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(testEmail);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects duplicate signup', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(409);
  });

  it('logs in and returns a session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    cookie = res.headers['set-cookie'][0];
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('accesses /me with a valid session cookie', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testEmail);
  });

  it('rejects /me with no cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('logs out and invalidates the session', async () => {
    const logoutRes = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(logoutRes.status).toBe(200);

    const meRes = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(meRes.status).toBe(401);
  });
});