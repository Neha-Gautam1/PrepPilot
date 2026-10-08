import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Sparkles, Target, PieChart as PieIcon, Flame } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { DashboardSummary, Recommendation } from '../types';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { useTheme } from '../hooks/useTheme';

const PIE_COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className="text-brand-600 dark:text-brand-400" />
        <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      </div>
      {children}
    </div>
  );
}

export function DashboardPage() {
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#cbd5e1' : '#475569';
  const tooltipStyle =
    theme === 'dark'
      ? { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }
      : { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a' };

  const { data, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => apiRequest<DashboardSummary>('/dashboard/summary'),
  });

  const { data: recommendations } = useQuery<Recommendation[]>({
    queryKey: ['recommendations', 'me'],
    queryFn: () => apiRequest<Recommendation[]>('/recommendations/me'),
  });

  if (isLoading) return <div className="p-6 text-slate-500 dark:text-slate-400">Loading...</div>;
  if (!data) return null;

  const weakTopicsChartData = data.weakTopics.map((t) => ({
    name: t.name,
    masteryPercent: Math.round(t.masteryScore * 100),
  }));

  const balanceChartData = data.balance
    .filter((b) => b.activityCount > 0)
    .map((b) => ({ name: b.name, value: b.activityCount }));

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>

      <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl shadow-sm p-6 text-white">
        <p className="text-brand-100 text-sm">Readiness Score</p>
        <p className="text-4xl font-bold mt-1">{data.readiness.score}%</p>
        <p className="text-brand-100 text-sm mt-1">{data.readiness.subjectsCovered} subject(s) with data</p>
      </div>

      {recommendations && recommendations.length > 0 && (
        <Card title="Recommended for You" icon={Sparkles}>
          <ul className="space-y-3">
            {recommendations.map((r) => (
              <li key={r.topicId} className="border-l-4 border-brand-500 pl-3">
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{r.topicName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{r.reason}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Weak Topics" icon={Target}>
        {weakTopicsChartData.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(120, weakTopicsChartData.length * 50)}>
            <BarChart data={weakTopicsChartData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: tickColor, fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fill: tickColor, fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Mastery']} contentStyle={tooltipStyle} />
              <Bar dataKey="masteryPercent" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Preparation Balance" icon={PieIcon}>
        {balanceChartData.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={balanceChartData} dataKey="value" nameKey="name" outerRadius={80} label>
                {balanceChartData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: tickColor, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title={`Recent Activity (${data.heatmap.length} active day(s) in last 90)`} icon={Flame}>
        <ActivityHeatmap data={data.heatmap} />
      </Card>
    </div>
  );
}