import { Link, Navigate } from 'react-router-dom';
import {
  Rocket,
  Code2,
  Database,
  ListChecks,
  MessageSquare,
  FileText,
  TrendingUp,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';;
import { useCurrentUser } from '../features/auth/useAuth';

const features = [
  { icon: ListChecks, title: 'MCQ Practice', desc: '14+ subjects from DSA to System Design, instantly graded.', color: 'bg-indigo-50 text-indigo-600' },
  { icon: Database, title: 'SQL Practice', desc: 'Write real queries, executed against live sample data.', color: 'bg-blue-50 text-blue-600' },
  { icon: Code2, title: 'DSA Practice', desc: 'Submit real code, run against real test cases.', color: 'bg-emerald-50 text-emerald-600' },
  { icon: MessageSquare, title: 'Mock Interviews', desc: 'AI-driven technical interviews with real feedback.', color: 'bg-amber-50 text-amber-600' },
  { icon: FileText, title: 'Resume Review', desc: 'Honest, structured AI feedback on your resume.', color: 'bg-rose-50 text-rose-600' },
  { icon: TrendingUp, title: 'Smart Dashboard', desc: 'Mastery tracking, readiness score, personalized recommendations.', color: 'bg-violet-50 text-violet-600' },
];

const stats = [
  { value: '3', label: 'Activity Types' },
  { value: '14+', label: 'Subjects Covered' },
  { value: 'AI', label: 'Powered Feedback' },
  { value: '100%', label: 'Real Code Execution' },
];

function DashboardMockup() {
  return (
    <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm rotate-2 hover:rotate-0 transition-transform duration-300">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate-400">DASHBOARD</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-rose-300" />
          <div className="w-2 h-2 rounded-full bg-amber-300" />
          <div className="w-2 h-2 rounded-full bg-emerald-300" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-4 text-white mb-3">
        <p className="text-xs text-brand-100">Readiness Score</p>
        <p className="text-3xl font-bold">78%</p>
      </div>

      <div className="space-y-2 mb-3">
        {[
          { label: 'DSA', value: 85, color: 'bg-indigo-500' },
          { label: 'SQL', value: 60, color: 'bg-blue-400' },
          { label: 'System Design', value: 40, color: 'bg-rose-400' },
        ].map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between text-xs text-slate-500 mb-0.5">
              <span>{bar.label}</span>
              <span>{bar.value}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${bar.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-indigo-50 rounded-lg p-2.5">
        <Sparkles size={14} className="text-brand-600 flex-shrink-0" />
        <p className="text-xs text-brand-900">Recommended: Revisit System Design — low mastery</p>
      </div>
    </div>
  );
}

export function HomePage() {
  const { data: user } = useCurrentUser();
  const { theme, toggleTheme } = useTheme();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors">
      <nav className="bg-gradient-to-r from-brand-900 to-brand-700 text-white relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">
            Prep<span className="text-brand-100">Pilot</span>
          </span>
                   <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <Link
              to="/login"
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Log in / Sign up
            </Link>
          </div>
        </div>
      </nav>

      <header className="relative bg-gradient-to-br from-brand-900 via-brand-700 to-indigo-500 text-white overflow-hidden">
        {/* decorative blurred blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-400 rounded-full opacity-20 blur-3xl" />
        <div className="absolute top-40 -right-10 w-80 h-80 bg-purple-400 rounded-full opacity-20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex bg-white/10 p-3 rounded-xl mb-6">
              <Rocket size={28} />
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Become placement-ready, one real attempt at a time
            </h1>
            <p className="text-brand-50/90 text-lg mb-8">
              PrepPilot tracks your real practice — MCQs, SQL, DSA, mock interviews — and turns it into an
              adaptive mastery profile with AI-backed feedback, not generic advice.
            </p>
            <Link
              to="/login"
              className="inline-block bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          <div className="flex justify-center md:justify-end">
            <DashboardMockup />
          </div>
        </div>
      </header>

            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-brand-700">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

          <main className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-slate-100 mb-10">Everything you need, in one place</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
                        <div
              key={title}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${color}`}>
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <section className="bg-gradient-to-br from-brand-900 to-brand-700 text-white">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to find out where you really stand?</h2>
          <p className="text-brand-50/80 mb-8">No fluff, no generic advice — just real practice and honest feedback.</p>
          <Link
            to="/login"
            className="inline-block bg-white text-brand-700 font-semibold px-8 py-3 rounded-lg hover:bg-brand-50 transition-colors"
          >
            Start Practicing
          </Link>
        </div>
      </section>

                  <footer className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">

        PrepPilot — built for CSE placement preparation
      </footer>
    </div>
  );
}