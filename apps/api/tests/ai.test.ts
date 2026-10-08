import { explainAttempt } from '../src/modules/ai/explainAttempt';
import { AiProvider } from '../src/modules/ai/aiProvider';
import { reviewResume } from '../src/modules/ai/reviewResume';
import request from 'supertest';
import { createApp } from '../src/server';
import { prisma } from '../src/lib/prisma';

describe('explainAttempt', () => {
  it('builds a prompt and returns the provider response for SQL', async () => {
    const mockProvider: AiProvider = {
      complete: jest.fn().mockResolvedValue('You forgot to filter by salary.'),
    };

    const result = await explainAttempt(mockProvider, {
      type: 'SQL',
      prompt: 'List employees earning more than 80000.',
      submission: 'SELECT name FROM employees',
      errorDetail: null,
    });

    expect(result).toBe('You forgot to filter by salary.');
    expect(mockProvider.complete).toHaveBeenCalledTimes(1);

    const promptSent = (mockProvider.complete as jest.Mock).mock.calls[0][0];
    expect(promptSent).toContain('List employees earning more than 80000.');
    expect(promptSent).toContain('SELECT name FROM employees');
  });

  it('includes execution error detail when present', async () => {
    const mockProvider: AiProvider = {
      complete: jest.fn().mockResolvedValue('Your column name is misspelled.'),
    };

    await explainAttempt(mockProvider, {
      type: 'SQL',
      prompt: 'List employees.',
      submission: 'SELECT nam FROM employees',
      errorDetail: 'column "nam" does not exist',
    });

    const promptSent = (mockProvider.complete as jest.Mock).mock.calls[0][0];
    expect(promptSent).toContain('column "nam" does not exist');
  });

  it('builds a prompt for DSA without an error detail section', async () => {
    const mockProvider: AiProvider = {
      complete: jest.fn().mockResolvedValue('Your loop never updates the accumulator.'),
    };

    const result = await explainAttempt(mockProvider, {
      type: 'DSA',
      prompt: 'Return the sum of all numbers in an array.',
      submission: 'function sumArray(arr) { return 0; }',
    });

    expect(result).toBe('Your loop never updates the accumulator.');
  });

  it('builds a prompt for MCQ including both selected and correct answers', async () => {
    const mockProvider: AiProvider = {
      complete: jest.fn().mockResolvedValue('Arrays give O(1) access via index arithmetic.'),
    };

    const result = await explainAttempt(mockProvider, {
      type: 'MCQ',
      prompt: 'What is the time complexity of array access by index?',
      submission: 'O(n)',
      correctAnswer: 'O(1)',
    });

    expect(result).toBe('Arrays give O(1) access via index arithmetic.');

    const promptSent = (mockProvider.complete as jest.Mock).mock.calls[0][0];
    expect(promptSent).toContain('O(n)');
    expect(promptSent).toContain('O(1)');
  });
});

describe('reviewResume', () => {
  it('builds a prompt including the resume and returns the provider response', async () => {
    const mockProvider: AiProvider = {
      complete: jest.fn().mockResolvedValue('STRENGTHS:\n- Clear project descriptions'),
    };

    const result = await reviewResume(mockProvider, {
      resumeText: 'Experienced in React and Node.js, built three full-stack projects.',
    });

    expect(result).toContain('STRENGTHS');
    const promptSent = (mockProvider.complete as jest.Mock).mock.calls[0][0];
    expect(promptSent).toContain('React and Node.js');
    expect(promptSent).toContain('No specific job description was provided');
  });

  it('includes the job description in the prompt when provided', async () => {
    const mockProvider: AiProvider = {
      complete: jest.fn().mockResolvedValue('STRENGTHS:\n- Relevant experience'),
    };

    await reviewResume(mockProvider, {
      resumeText: 'Backend developer with 2 years of Node.js experience.',
      jobDescription: 'Looking for a senior backend engineer with 5+ years experience.',
    });

    const promptSent = (mockProvider.complete as jest.Mock).mock.calls[0][0];
    expect(promptSent).toContain('senior backend engineer');
  });
});

describe('Resume review persistence', () => {
  const app = createApp();
  const testEmail = `resume_test_${Date.now()}@example.com`;
  let cookie: string;

  beforeAll(async () => {
    const signupRes = await request(app).post('/api/auth/signup').send({
      email: testEmail,
      password: 'password123',
    });
    cookie = signupRes.headers['set-cookie'][0];
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (user) {
      await prisma.resumeReview.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await prisma.$disconnect();
  });

  it('saves a review after a successful AI call and lists it afterward', async () => {
    const reviewRes = await request(app)
      .post('/api/ai/review-resume')
      .set('Cookie', cookie)
      .send({ resumeText: 'Backend developer with 2 years of experience in Node.js and PostgreSQL.' });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.feedback).toBeDefined();

    const listRes = await request(app).get('/api/ai/review-resume/me').set('Cookie', cookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0]).not.toHaveProperty('resumeText');
    expect(listRes.body[0].feedback).toBeDefined();
  }, 15000);
});