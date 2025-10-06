import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import { AppThemeProvider } from './theme/AppThemeProvider';
import { ensureDevShoppingData } from './shared/seedDevShopping';

if (import.meta.env.DEV) {
  void ensureDevShoppingData();
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppThemeProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </AppThemeProvider>
  </React.StrictMode>
);
