import request from 'supertest';
import { createApp } from '../src/server';
import { prisma } from '../src/lib/prisma';

const app = createApp();

describe('Topics API', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('lists all topics', async () => {
    const res = await request(app).get('/api/topics');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('lists questions for a topic without exposing correct answers', async () => {
    const topics = await prisma.topic.findMany({ where: { slug: 'dsa-arrays' } });
    const topicId = topics[0].id;

    const res = await request(app).get(`/api/topics/${topicId}/questions`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).not.toHaveProperty('correctOptionId');
    expect(res.body[0]).not.toHaveProperty('explanation');
  });
});