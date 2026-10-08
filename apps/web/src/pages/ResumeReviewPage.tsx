import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { apiRequest } from '../lib/api';

interface ReviewResult {
  feedback: string;
}

interface PastReview {
  id: string;
  feedback: string;
  jobDescription: string | null;
  createdAt: string;
}

export function ResumeReviewPage() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const qc = useQueryClient();

  const review = useMutation({
    mutationFn: () =>
      apiRequest<ReviewResult>('/ai/review-resume', {
        method: 'POST',
        body: { resumeText, jobDescription: jobDescription || undefined },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resume-reviews'] }),
  });

  const { data: pastReviews } = useQuery<PastReview[]>({
    queryKey: ['resume-reviews'],
    queryFn: () => apiRequest<PastReview[]>('/ai/review-resume/me'),
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Resume Review</h1>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Paste your resume text</label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={10}
          className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Paste your resume content here..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target job description (optional)</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={5}
          className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Paste a job description to get targeted feedback..."
        />
      </div>

      <button
        onClick={() => review.mutate()}
        disabled={resumeText.trim().length < 50 || review.isPending}
        className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {review.isPending ? 'Reviewing...' : 'Get Feedback'}
      </button>

      {review.isError && (
        <p className="text-red-600 dark:text-red-300 text-sm bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">{(review.error as Error).message}</p>
      )}

      {review.data && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
          {review.data.feedback}
        </div>
      )}

      {pastReviews && pastReviews.length > 0 && (
        <div className="pt-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">Past Reviews</h2>
          <ul className="space-y-3">
            {pastReviews.map((r) => (
              <li key={r.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-2">
                  <Clock size={12} />
                  {new Date(r.createdAt).toLocaleString()}
                  {r.jobDescription && <span className="text-brand-600 dark:text-brand-400">· targeted review</span>}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{r.feedback}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}