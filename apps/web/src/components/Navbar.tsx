import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Database, Code2, History, FileText, MessageSquare, LogOut, Sun, Moon } from 'lucide-react';
import { useLogout, useCurrentUser } from '../features/auth/useAuth';
import { useTheme } from '../hooks/useTheme';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/practice', label: 'MCQ', icon: ListChecks },
  { to: '/practice/sql', label: 'SQL', icon: Database },
  { to: '/practice/dsa', label: 'DSA', icon: Code2 },
  { to: '/mock-interview', label: 'Interview', icon: MessageSquare },
  { to: '/interview-history', label: 'Past Interviews', icon: History },
  { to: '/resume-review', label: 'Resume', icon: FileText },
  { to: '/history', label: 'History', icon: History },
];

export function NavBar() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-gradient-to-r from-brand-900 to-brand-700 dark:from-slate-900 dark:to-slate-800 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="text-lg font-bold tracking-tight">
            Prep<span className="text-brand-100">Pilot</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/15 text-white' : 'text-brand-50/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          {user && <span className="text-sm text-brand-50/80 hidden sm:inline">{user.email}</span>}
          <button
            onClick={() => logout.mutate()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}