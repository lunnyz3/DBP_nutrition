// src/App.jsx
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import FoodSearchPage from './pages/FoodSearchPage.jsx';
import RecordMealPage from './pages/RecordMealPage.jsx';
import SummaryPage from './pages/SummaryPage.jsx';
import BadgesPage from './pages/BadgesPage.jsx';
import TrendsPage from './pages/TrendsPage.jsx';
import GoalsPage from './pages/GoalsPage.jsx';
import './App.css';

const TEST_USER_ID = 1; // 나중에 로그인 만들면 바꿀 부분

export default function App() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '음식 검색', icon: '🔍' },
    { path: '/record', label: '식단 기록', icon: '📝' },
    { path: '/summary', label: '하루 요약', icon: '📊' },
    { path: '/trends', label: '트렌드', icon: '📈' },
    { path: '/badges', label: '뱃지', icon: '🏅' },
    { path: '/goals', label: '목표 설정', icon: '🎯' },
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          <span>🍽</span>
          <span>식단 관리 서비스</span>
        </h1>

        <nav className="app-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </header>

      <main className="page-container">
        <Routes>
          <Route path="/" element={<FoodSearchPage />} />
          <Route path="/record" element={<RecordMealPage userId={TEST_USER_ID} />} />
          <Route path="/summary" element={<SummaryPage userId={TEST_USER_ID} />} />
          <Route path="/trends" element={<TrendsPage userId={TEST_USER_ID} />} />
          <Route path="/badges" element={<BadgesPage userId={TEST_USER_ID} />} />
          <Route path="/goals" element={<GoalsPage userId={TEST_USER_ID} />} />
        </Routes>
      </main>
    </div>
  );
}
