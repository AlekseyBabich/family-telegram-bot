import { NavLink } from 'react-router-dom';
import { useTelegramUser } from '../services/auth';
import { TEXT } from '../constants/ru';

const tabs = [
  { path: '/shopping', label: TEXT.header.tabs.shopping },
  { path: '/calendar', label: TEXT.header.tabs.calendar },
  { path: '/budget', label: TEXT.header.tabs.budget }
];

const Header = () => {
  const user = useTelegramUser();

  return (
    <header className="app-header">
      <div className="header-title">{TEXT.header.title}</div>
      <nav className="header-nav">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end
            className={({ isActive }) =>
              `header-tab ${isActive ? 'header-tab-active' : ''}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      {user ? (
        <div className="header-user">{user.name}</div>
      ) : (
        <div className="header-user header-user-anon">{TEXT.header.guest}</div>
      )}
    </header>
  );
};

export default Header;
