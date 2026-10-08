import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { useLogin, useSignup } from '../features/auth/useAuth';

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const login = useLogin();
  const signup = useSignup();
  const mutation = mode === 'login' ? login : signup;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate({ email, password }, { onSuccess: () => navigate('/dashboard') });
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-indigo-500 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950 px-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm space-y-5">
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="bg-brand-600 text-white p-3 rounded-xl">
            <Rocket size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">PrepPilot</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{mode === 'login' ? 'Welcome back' : 'Create your account'}</p>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          required
          minLength={8}
        />

        {mutation.isError && (
          <p className="text-red-600 dark:text-red-300 text-sm bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">{(mutation.error as Error).message}</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="w-full text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  );
}