import { useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import { appTheme, themeCssVariables } from './appTheme';

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  useLayoutEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const previousValues: Record<string, string> = {};

    Object.entries(themeCssVariables).forEach(([name, value]) => {
      previousValues[name] = root.style.getPropertyValue(name);
      root.style.setProperty(name, value);
    });

    root.style.setProperty('color-scheme', 'light');
    root.style.setProperty('font-family', appTheme.typography.fontFamily);

    return () => {
      Object.entries(previousValues).forEach(([name, value]) => {
        if (value) {
          root.style.setProperty(name, value);
        } else {
          root.style.removeProperty(name);
        }
      });
    };
  }, []);

  return <>{children}</>;
};

export { appTheme };
