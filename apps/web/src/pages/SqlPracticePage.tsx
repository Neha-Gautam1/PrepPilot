import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import type { Topic, SqlExercise, SqlSubmitResult, ExplainResult } from '../types';

export function SqlPracticePage() {
  const [topicId, setTopicId] = useState('');
  const [currentExercise, setCurrentExercise] = useState<SqlExercise | null>(null);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SqlSubmitResult | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [explanation, setExplanation] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: topics } = useQuery<Topic[]>({
    queryKey: ['topics'],
    queryFn: () => apiRequest<Topic[]>('/topics'),
  });

  const sqlSubject = topics?.find((t) => t.slug === 'sql');
  const leafTopics = topics?.filter((t) => t.parentId === sqlSubject?.id) ?? [];

  const submit = useMutation({
    mutationFn: (input: { sqlExerciseId: string; query: string; timeTakenMs: number }) =>
      apiRequest<SqlSubmitResult>('/activities/sql', { method: 'POST', body: input }),
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
    setQuery('');
    setExplanation(null);
    if (!id) {
      setCurrentExercise(null);
      return;
    }
    const res = await apiRequest<SqlExercise[]>(`/topics/${id}/sql-exercises`);
    setCurrentExercise(res[Math.floor(Math.random() * res.length)] ?? null);
    setStartTime(Date.now());
  }

  function handleSubmit() {
    if (!currentExercise || !query.trim()) return;
    submit.mutate({
      sqlExerciseId: currentExercise.id,
      query,
      timeTakenMs: Date.now() - startTime,
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">SQL Practice</h1>

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

      {topicId && !currentExercise && (
        <p className="text-slate-500 dark:text-slate-400 text-sm">No SQL exercises for this topic yet.</p>
      )}

      {currentExercise && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 space-y-3">
          <p className="font-medium text-slate-900 dark:text-slate-100">{currentExercise.prompt}</p>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={!!result}
            rows={4}
            placeholder="SELECT ..."
            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />

          {!result ? (
            <button
              onClick={handleSubmit}
              disabled={!query.trim() || submit.isPending}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {submit.isPending ? 'Running...' : 'Run & Submit'}
            </button>
          ) : (
            <div className="space-y-2">
              <p className={result.isCorrect ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
                {result.isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
              {result.executionError && (
                <p className="text-sm text-red-600 dark:text-red-300 font-mono bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
                  {result.executionError}
                </p>
              )}
              {!result.executionError && (
                <p className="text-sm text-slate-600 dark:text-slate-300">Rows returned: {result.rowCount}</p>
              )}

              {!result.isCorrect && !explanation && (
                <button
                  onClick={() => explain.mutate(result.activityId)}
                  disabled={explain.isPending}
                  className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium disabled:opacity-50"
                >
                  {explain.isPending ? 'Thinking...' : 'Explain why this is wrong'}
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
                Next exercise
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}