import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import type { Topic } from '../types';

interface StartResult {
  sessionToken: string;
  question: string;
  questionNumber: number;
  totalQuestions: number;
}

interface AnswerResultInProgress {
  done: false;
  question: string;
  questionNumber: number;
  totalQuestions: number;
}

interface AnswerResultFinal {
  done: true;
  sessionId: string;
  technicalAccuracy: number;
  communication: number;
  completeness: number;
  overallFeedback: string;
}

type AnswerResult = AnswerResultInProgress | AnswerResultFinal;
type InterviewType = 'TECHNICAL' | 'HR';

export function MockInterviewPage() {
  const [interviewType, setInterviewType] = useState<InterviewType>('TECHNICAL');
  const [topicId, setTopicId] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [questionInfo, setQuestionInfo] = useState<{ num: number; total: number } | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [finalResult, setFinalResult] = useState<AnswerResultFinal | null>(null);

  const { data: topics } = useQuery<Topic[]>({
    queryKey: ['topics'],
    queryFn: () => apiRequest<Topic[]>('/topics'),
  });

  const leafTopics = topics?.filter((t) => t.parentId !== null) ?? [];

  const start = useMutation({
    mutationFn: (input: { type: InterviewType; topicId?: string }) =>
      apiRequest<StartResult>('/interview/start', { method: 'POST', body: input }),
    onSuccess: (data) => {
      setSessionToken(data.sessionToken);
      setCurrentQuestion(data.question);
      setQuestionInfo({ num: data.questionNumber, total: data.totalQuestions });
      setFinalResult(null);
      setAnswerText('');
    },
  });

  const answer = useMutation({
    mutationFn: () =>
      apiRequest<AnswerResult>('/interview/answer', {
        method: 'POST',
        body: { sessionToken, answer: answerText },
      }),
    onSuccess: (data) => {
      if (data.done) {
        setFinalResult(data);
        setCurrentQuestion(null);
      } else {
        setCurrentQuestion(data.question);
        setQuestionInfo({ num: data.questionNumber, total: data.totalQuestions });
      }
      setAnswerText('');
    },
  });

  function handleTypeChange(type: InterviewType) {
    setInterviewType(type);
    setTopicId('');
    setSessionToken(null);
    setCurrentQuestion(null);
    setFinalResult(null);
    if (type === 'HR') start.mutate({ type: 'HR' });
  }

  function handleTopicChange(id: string) {
    setTopicId(id);
    setSessionToken(null);
    setCurrentQuestion(null);
    setFinalResult(null);
    if (id) start.mutate({ type: 'TECHNICAL', topicId: id });
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mock Interview</h1>

      {!sessionToken && !finalResult && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => handleTypeChange('TECHNICAL')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                interviewType === 'TECHNICAL'
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Technical
            </button>
            <button
              onClick={() => handleTypeChange('HR')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                interviewType === 'HR'
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              HR / Behavioral
            </button>
          </div>

          {interviewType === 'TECHNICAL' && (
            <select
              value={topicId}
              onChange={(e) => handleTopicChange(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select a topic to start</option>
              {leafTopics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {start.isPending && <p className="text-slate-500 dark:text-slate-400 text-sm">Preparing your first question...</p>}

      {currentQuestion && questionInfo && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 space-y-3">
          <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">
            Question {questionInfo.num} of {questionInfo.total}
          </p>
          <p className="font-medium text-slate-900 dark:text-slate-100">{currentQuestion}</p>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={6}
            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Type your answer..."
          />
          <button
            onClick={() => answer.mutate()}
            disabled={!answerText.trim() || answer.isPending}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {answer.isPending ? 'Submitting...' : questionInfo.num === questionInfo.total ? 'Finish Interview' : 'Next Question'}
          </button>
        </div>
      )}

      {finalResult && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <p className="font-semibold text-slate-900 dark:text-slate-100">Interview Complete</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-brand-50 dark:bg-brand-900/30 rounded-lg py-3">
              <p className="text-2xl font-bold text-brand-700 dark:text-brand-300">{finalResult.technicalAccuracy}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {interviewType === 'HR' ? 'Depth' : 'Technical Accuracy'}
              </p>
            </div>
            <div className="bg-brand-50 dark:bg-brand-900/30 rounded-lg py-3">
              <p className="text-2xl font-bold text-brand-700 dark:text-brand-300">{finalResult.communication}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Communication</p>
            </div>
            <div className="bg-brand-50 dark:bg-brand-900/30 rounded-lg py-3">
              <p className="text-2xl font-bold text-brand-700 dark:text-brand-300">{finalResult.completeness}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Completeness</p>
            </div>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200">{finalResult.overallFeedback}</p>
          <button
            onClick={() => {
              setTopicId('');
              setFinalResult(null);
            }}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
          >
            Start Another Interview
          </button>
        </div>
      )}
    </div>
  );
}