import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Users } from 'lucide-react';
import { apiRequest } from '../lib/api';

interface InterviewSessionSummary {
  id: string;
  type: 'TECHNICAL' | 'HR';
  topicName: string | null;
  technicalAccuracy: number;
  communication: number;
  completeness: number;
  overallFeedback: string;
  createdAt: string;
}

export function InterviewHistoryPage() {
  const { data, isLoading } = useQuery<InterviewSessionSummary[]>({
    queryKey: ['interview', 'history'],
    queryFn: () => apiRequest<InterviewSessionSummary[]>('/interview/me'),
  });

  if (isLoading) return <div className="p-6 text-slate-500 dark:text-slate-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Interview History</h1>
      {data?.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400">No interviews yet — try a Mock Interview!</p>
      )}
      <ul className="space-y-3">
        {data?.map((s) => (
          <li key={s.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {s.type === 'TECHNICAL' ? (
                  <MessageSquare size={16} className="text-brand-600 dark:text-brand-400" />
                ) : (
                  <Users size={16} className="text-amber-600 dark:text-amber-400" />
                )}
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {s.type === 'TECHNICAL' ? `Technical — ${s.topicName}` : 'HR / Behavioral'}
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>{s.type === 'HR' ? 'Depth' : 'Technical'}: {s.technicalAccuracy}</span>
              <span>Communication: {s.communication}</span>
              <span>Completeness: {s.completeness}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{s.overallFeedback}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}