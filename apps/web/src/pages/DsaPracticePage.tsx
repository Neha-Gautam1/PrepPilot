import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import type { Topic, DsaProblem, DsaSubmitResult, ExplainResult } from '../types';

type Language = 'javascript' | 'python' | 'cpp' | 'java';

const LANGUAGE_LABELS: Record<Language, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  cpp: 'C++',
  java: 'Java',
};

function stubFor(functionName: string, lang: Language): string {
  switch (lang) {
    case 'python':
      return `def ${functionName}(arr):\n    # your code here\n    pass`;
    case 'cpp':
      return `int ${functionName}(vector<int> arr) {\n    // your code here\n    return 0;\n}`;
    case 'java':
      return `public static int ${functionName}(int[] arr) {\n    // your code here\n    return 0;\n}`;
    default:
      return '';
  }
}

export function DsaPracticePage() {
  const [topicId, setTopicId] = useState('');
  const [language, setLanguage] = useState<Language>('javascript');
  const [currentProblem, setCurrentProblem] = useState<DsaProblem | null>(null);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<DsaSubmitResult | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [explanation, setExplanation] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: topics } = useQuery<Topic[]>({
    queryKey: ['topics'],
    queryFn: () => apiRequest<Topic[]>('/topics'),
  });

  const dsaSubject = topics?.find((t) => t.slug === 'dsa');
  const leafTopics = topics?.filter((t) => t.parentId === dsaSubject?.id) ?? [];

  const submit = useMutation({
    mutationFn: (input: { dsaProblemId: string; code: string; timeTakenMs: number; language: Language }) =>
      apiRequest<DsaSubmitResult>('/activities/dsa', { method: 'POST', body: input }),
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

  function setStarterCodeFor(problem: DsaProblem | null, lang: Language) {
    if (!problem) {
      setCode('');
      return;
    }
    setCode(lang === 'javascript' ? problem.starterCode : stubFor(problem.functionName, lang));
  }

  async function loadTopic(id: string) {
    setTopicId(id);
    setResult(null);
    setExplanation(null);
    if (!id) {
      setCurrentProblem(null);
      setCode('');
      return;
    }
    const res = await apiRequest<DsaProblem[]>(`/topics/${id}/dsa-problems`);
    const problem = res[Math.floor(Math.random() * res.length)] ?? null;
    setCurrentProblem(problem);
    setStarterCodeFor(problem, language);
    setStartTime(Date.now());
  }

  function handleLanguageChange(lang: Language) {
    setLanguage(lang);
    setResult(null);
    setExplanation(null);
    setStarterCodeFor(currentProblem, lang);
  }

  function handleSubmit() {
    if (!currentProblem || !code.trim()) return;
    submit.mutate({
      dsaProblemId: currentProblem.id,
      code,
      timeTakenMs: Date.now() - startTime,
      language,
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">DSA Practice</h1>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
              language === lang
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>

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

      {topicId && !currentProblem && (
        <p className="text-slate-500 dark:text-slate-400 text-sm">No DSA problems for this topic yet.</p>
      )}

      {currentProblem && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 space-y-3">
          <p className="font-medium text-slate-900 dark:text-slate-100">{currentProblem.prompt}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Function name: {currentProblem.functionName}</p>
          {language !== 'javascript' && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Runs via a hosted execution service and may take a moment longer.
            </p>
          )}

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={!!result}
            rows={8}
            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 dark:disabled:bg-slate-800"
          />

          {!result ? (
            <button
              onClick={handleSubmit}
              disabled={!code.trim() || submit.isPending}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {submit.isPending ? 'Running...' : 'Run & Submit'}
            </button>
          ) : (
            <div className="space-y-2">
              <p className={result.isCorrect ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
                {result.isCorrect ? 'All tests passed!' : 'Some tests failed'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {result.testsPassed} / {result.testsTotal} tests passed
              </p>
              <ul className="text-sm space-y-1">
                {result.results.map((r, i) => (
                  <li key={i} className={r.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    Test {i + 1}: {r.passed ? 'Passed' : r.error ? `Error — ${r.error}` : 'Failed'}
                  </li>
                ))}
              </ul>

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
                Next problem
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}