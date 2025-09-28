import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import Budget from './pages/Budget';
import Calendar from './pages/Calendar';
import Shopping from './pages/Shopping';

const tabs = [
  { path: '/shopping', label: 'Покупки' },
  { path: '/calendar', label: 'Календарь' },
  { path: '/budget', label: 'Бюджет' }
];

const App = () => {
  return (
    <div className="app">
      <nav className="top-tabs" aria-label="Основные разделы">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `top-tab${isActive ? ' top-tab-active' : ''}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <main className="page-container">
        <Routes>
          <Route path="/" element={<Navigate to="/shopping" replace />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="*" element={<Navigate to="/shopping" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
