import { startInterview, submitAnswer } from '../src/modules/interview/interview.service';
import { AiProvider } from '../src/modules/ai/aiProvider';
import { prisma } from '../src/lib/prisma';

describe('Mock interview flow', () => {
  let topicId: string;
  let userId: string;

  beforeAll(async () => {
    const topic = await prisma.topic.findFirstOrThrow({ where: { slug: 'dsa-arrays' } });
    topicId = topic.id;

    const user = await prisma.user.create({
      data: { email: `interview_test_${Date.now()}@example.com`, passwordHash: 'x' },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.mockInterviewSession.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('runs a full 3-question session and saves it at the end', async () => {
    let callCount = 0;
    const mockProvider: AiProvider = {
      complete: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 3) return Promise.resolve(`Mock question ${callCount}?`);
        return Promise.resolve(
          'TECHNICAL_ACCURACY: 75\nCOMMUNICATION: 80\nCOMPLETENESS: 70\nFEEDBACK: Solid understanding overall, could elaborate more on edge cases.'
        );
      }),
    };

    const started = await startInterview(mockProvider, userId, 'TECHNICAL', topicId);
    expect(started.question).toBe('Mock question 1?');
    expect(started.questionNumber).toBe(1);

    const r2 = await submitAnswer(mockProvider, started.sessionToken, 'My answer to Q1');
    expect(r2.done).toBe(false);
    if (!r2.done) {
      expect(r2.question).toBe('Mock question 2?');
      expect(r2.questionNumber).toBe(2);
    }

    const r3 = await submitAnswer(mockProvider, started.sessionToken, 'My answer to Q2');
    expect(r3.done).toBe(false);

    const final = await submitAnswer(mockProvider, started.sessionToken, 'My answer to Q3');
    expect(final.done).toBe(true);
    if (final.done) {
      expect(final.technicalAccuracy).toBe(75);
      expect(final.communication).toBe(80);
      expect(final.completeness).toBe(70);
      expect(final.overallFeedback).toContain('edge cases');
    }

    const saved = await prisma.mockInterviewSession.findFirst({ where: { userId } });
    expect(saved).toBeDefined();
    expect((saved!.transcript as any[]).length).toBe(3);
  });

  it('rejects answering with an unknown session token', async () => {
    const mockProvider: AiProvider = { complete: jest.fn() };

    await expect(
      submitAnswer(mockProvider, '00000000-0000-0000-0000-000000000000', 'anything')
    ).rejects.toThrow('Interview session not found or expired');
  });

  it('runs an HR interview session with no topic', async () => {
    let callCount = 0;
    const mockProvider: AiProvider = {
      complete: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 3) return Promise.resolve(`Mock HR question ${callCount}?`);
        return Promise.resolve(
          'TECHNICAL_ACCURACY: 60\nCOMMUNICATION: 85\nCOMPLETENESS: 75\nFEEDBACK: Good communication, examples could be more specific.'
        );
      }),
    };

    const started = await startInterview(mockProvider, userId, 'HR');
    expect(started.question).toBe('Mock HR question 1?');

    await submitAnswer(mockProvider, started.sessionToken, 'Answer 1');
    await submitAnswer(mockProvider, started.sessionToken, 'Answer 2');
    const final = await submitAnswer(mockProvider, started.sessionToken, 'Answer 3');

    expect(final.done).toBe(true);
    if (final.done) {
      expect(final.communication).toBe(85);
    }

    const saved = await prisma.mockInterviewSession.findFirst({ where: { userId, type: 'HR' } as any });
    expect(saved).toBeDefined();
    expect(saved!.topicId).toBeNull();
  });

    it('lists past interview sessions, newest first', async () => {
    const res = await prisma.mockInterviewSession.findMany({ where: { userId } });
    expect(res.length).toBeGreaterThanOrEqual(2); // the TECHNICAL and HR sessions from earlier tests

    const { getSessionsForUser } = await import('../src/modules/interview/interview.service');
    const sessions = await getSessionsForUser(userId);

    expect(sessions.length).toBeGreaterThanOrEqual(2);
    expect(sessions[0].createdAt >= sessions[sessions.length - 1].createdAt).toBe(true);
    const hrSession = sessions.find((s) => s.type === 'HR');
    expect(hrSession?.topicName).toBeNull();
  });
});