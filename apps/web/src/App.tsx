import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { PracticePage } from './pages/PracticePage';
import { SqlPracticePage } from './pages/SqlPracticePage';
import { DsaPracticePage } from './pages/DsaPracticePage';
import { HistoryPage } from './pages/HistoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResumeReviewPage } from './pages/ResumeReviewPage';
import { MockInterviewPage } from './pages/MockInterviewPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NavBar } from './components/NavBar';
import { InterviewHistoryPage } from './pages/InterviewHistory';

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <NavBar />
      <Outlet />
    </div>
  );
}
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/practice/sql" element={<SqlPracticePage />} />
            <Route path="/practice/dsa" element={<DsaPracticePage />} />
            <Route path="/mock-interview" element={<MockInterviewPage />} />
                        <Route path="/interview-history" element={<InterviewHistoryPage />} />
            <Route path="/resume-review" element={<ResumeReviewPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}