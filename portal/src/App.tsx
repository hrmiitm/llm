import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { HomePage } from './features/home/HomePage';
import { ExamPage } from './features/exam/ExamPage';
import { PracticePage } from './features/practice/PracticePage';
import { ResultsPage } from './features/results/ResultsPage';
import { HistoryPage } from './features/history/HistoryPage';
import './styles/index.css';

function AppShell() {
  const location = useLocation();
  // Don't show site header in exam mode (it has its own header)
  const isExamPage = location.pathname.startsWith('/exam/');

  return (
    <>
      {!isExamPage && (
        <header className="site-header">
          <NavLink to="/" className="logo" aria-label="LLM Exam Portal Home">
            <div className="logo-icon" aria-hidden="true">LLM</div>
            <div className="logo-text">
              <h1>LLM Exam Portal</h1>
              <p>NPTEL · IIT Madras</p>
            </div>
          </NavLink>

          <nav aria-label="Site navigation">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
              Home
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''}>
              History
            </NavLink>
          </nav>
        </header>
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/exam/:gaId" element={<ExamPage />} />
        <Route path="/practice/:gaId" element={<PracticePage />} />
        <Route path="/results/:attemptId" element={<ResultsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={
          <div className="loading-center" style={{ flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '4rem' }}>🔍</div>
            <h2>Page not found</h2>
            <NavLink to="/" className="btn btn-primary">Go Home</NavLink>
          </div>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
