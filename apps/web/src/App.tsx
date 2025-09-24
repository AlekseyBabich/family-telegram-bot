import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Shopping from './pages/Shopping';
import Calendar from './pages/Calendar';
import Budget from './pages/Budget';
import { useTelegramUser } from './services/auth';

const App = () => {
  const user = useTelegramUser();

  return (
    <div className="app-container">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/shopping" replace />} />
          <Route path="/shopping" element={<Shopping user={user} />} />
          <Route path="/calendar" element={<Calendar user={user} />} />
          <Route path="/budget" element={<Budget user={user} />} />
          <Route path="*" element={<Navigate to="/shopping" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
