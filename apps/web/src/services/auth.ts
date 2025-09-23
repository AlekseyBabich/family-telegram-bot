import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
        };
        colorScheme?: 'light' | 'dark';
        themeParams?: Record<string, string>;
        ready: () => void;
        expand?: () => void;
      };
    };
    __FIREBASE_CONFIG__?: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      appId: string;
    };
  }
}

export interface BasicUser {
  id: number;
  name: string;
  username?: string;
}

let cachedUser: BasicUser | null = null;

const parseTelegramUser = (): BasicUser | null => {
  const webAppUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (!webAppUser) {
    return null;
  }

  const fullName = [webAppUser.first_name, webAppUser.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    id: webAppUser.id,
    name: fullName || webAppUser.username || 'Без имени',
    username: webAppUser.username ?? undefined
  };
};

export const initTelegramTheme = () => {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) {
    return;
  }

  webApp.ready();
  webApp.expand?.();
  cachedUser = parseTelegramUser();

  const root = document.body;
  const colorScheme = webApp.colorScheme || 'light';
  root.classList.add(`tg-theme-${colorScheme}`);

  // TODO: проверить initData на сервере и валидировать подпись Telegram.
};

export const getTelegramUser = (): BasicUser | null => {
  if (!cachedUser) {
    cachedUser = parseTelegramUser();
  }

  return cachedUser;
};

export const useTelegramUser = () => {
  const [user, setUser] = useState<BasicUser | null>(() => getTelegramUser());

  useEffect(() => {
    setUser(getTelegramUser());
  }, []);

  return user;
};
