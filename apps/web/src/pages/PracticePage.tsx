import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import type { Topic, Question, McqSubmitResult, ExplainResult } from '../types';

export function PracticePage() {
  const [topicId, setTopicId] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [result, setResult] = useState<McqSubmitResult | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [explanation, setExplanation] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: topics } = useQuery<Topic[]>({
    queryKey: ['topics'],
    queryFn: () => apiRequest<Topic[]>('/topics'),
  });

  const leafTopics = topics?.filter((t) => t.parentId !== null) ?? [];

  const submit = useMutation({
    mutationFn: (input: { questionId: string; selectedOptionId: string; timeTakenMs: number }) =>
      apiRequest<McqSubmitResult>('/activities/mcq', { method: 'POST', body: input }),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['activities', 'history'] });
    },
  });

  const explain = useMutation({
    mutationFn: (activityId: string) =>
      apiRequest<ExplainResult>('/ai/explain', { method: 'POST', body: { activityId } }),
    onSuccess: (data) => setExplanation(data.explanation),
  });

  async function loadTopic(id: string) {
    setTopicId(id);
    setResult(null);
    setSelectedOption('');
    setExplanation(null);
    if (!id) {
      setCurrentQuestion(null);
      return;
    }
    const res = await apiRequest<Question[]>(`/topics/${id}/questions`);
    setCurrentQuestion(res[Math.floor(Math.random() * res.length)] ?? null);
    setStartTime(Date.now());
  }

  function handleSubmit() {
    if (!currentQuestion || !selectedOption) return;
    submit.mutate({
      questionId: currentQuestion.id,
      selectedOptionId: selectedOption,
      timeTakenMs: Date.now() - startTime,
    });
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">MCQ Practice</h1>

      <select
        value={topicId}
        onChange={(e) => loadTopic(e.target.value)}
        className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 mb-6 w-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">Select a topic</option>
        {leafTopics.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      {currentQuestion && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 space-y-3">
          <p className="font-medium text-slate-900 dark:text-slate-100">{currentQuestion.prompt}</p>

          {currentQuestion.options.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                selectedOption === opt.id
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <input
                type="radio"
                name="option"
                checked={selectedOption === opt.id}
                onChange={() => setSelectedOption(opt.id)}
                disabled={!!result}
                className="accent-brand-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-200">{opt.text}</span>
            </label>
          ))}

          {!result ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOption || submit.isPending}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Submit
            </button>
          ) : (
            <div className="space-y-2">
              <p className={result.isCorrect ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
                {result.isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
              {result.explanation && <p className="text-sm text-slate-600 dark:text-slate-300">{result.explanation}</p>}

              {!result.isCorrect && !explanation && (
                <button
                  onClick={() => explain.mutate(result.activityId)}
                  disabled={explain.isPending}
                  className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium disabled:opacity-50"
                >
                  {explain.isPending ? 'Thinking...' : 'Explain further'}
                </button>
              )}
              {explanation && (
                <p className="text-sm bg-brand-50 dark:bg-brand-900/30 text-brand-900 dark:text-brand-200 p-3 rounded-lg">{explanation}</p>
              )}

              <button
                onClick={() => {
                  setExplanation(null);
                  loadTopic(topicId);
                }}
                className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                Next question
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}