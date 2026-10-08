import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { ActivityHistoryItem } from '../types';

export function HistoryPage() {
  const { data, isLoading } = useQuery<ActivityHistoryItem[]>({
    queryKey: ['activities', 'history'],
    queryFn: () => apiRequest<ActivityHistoryItem[]>('/activities/me'),
  });

  if (isLoading) return <div className="p-6 text-slate-500 dark:text-slate-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Activity History</h1>
      {data?.length === 0 && <p className="text-slate-500 dark:text-slate-400">No activity yet — go practice something!</p>}
      <ul className="space-y-2">
        {data?.map((item) => (
          <li
            key={item.id}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{item.questionPrompt ?? item.type}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {item.topicName} · {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
            {item.isCorrect ? (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                <CheckCircle2 size={16} /> Correct
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm font-medium">
                <XCircle size={16} /> Incorrect
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}