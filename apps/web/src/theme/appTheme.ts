export type ThemePalette = {
  primary: {
    main: string;
    hover: string;
    contrastText: string;
  };
  secondary: {
    main: string;
    contrastText: string;
  };
  background: {
    app: string;
    surface: string;
    subtle: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  divider: string;
  danger: {
    main: string;
    hover: string;
    contrastText: string;
  };
};

export type ThemeShape = {
  borderRadius: number;
};

export type ThemeShadows = {
  low: string;
  medium: string;
};

export type ThemeTypography = {
  fontFamily: string;
  heading: string;
  body: string;
  small: string;
};

export type AppTheme = {
  palette: ThemePalette;
  shape: ThemeShape;
  shadows: ThemeShadows;
  typography: ThemeTypography;
};

export const appTheme: AppTheme = {
  palette: {
    primary: {
      main: '#22C55E',
      hover: '#1FB155',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#EEF3ED',
      contrastText: '#0F172A'
    },
    background: {
      app: '#F7F9F6',
      surface: '#FFFFFF',
      subtle: '#EDF3EC'
    },
    text: {
      primary: '#0F172A',
      secondary: '#334155',
      muted: 'rgba(15, 23, 42, 0.56)'
    },
    divider: 'rgba(15, 23, 42, 0.12)',
    danger: {
      main: '#DC2626',
      hover: '#C71F1F',
      contrastText: '#FFFFFF'
    }
  },
  shape: {
    borderRadius: 12
  },
  shadows: {
    low: '0 8px 20px rgba(15, 23, 42, 0.08)',
    medium: '0 12px 32px rgba(15, 23, 42, 0.12)'
  },
  typography: {
    fontFamily:
      "'Inter', 'Roboto', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    heading: '600 clamp(20px, 4vw, 28px)/1.2',
    body: '400 clamp(15px, 3.4vw, 17px)/1.45',
    small: '400 clamp(13px, 3vw, 15px)/1.4'
  }
};

export const themeCssVariables: Record<string, string> = {
  '--app-color-primary': appTheme.palette.primary.main,
  '--app-color-primary-hover': appTheme.palette.primary.hover,
  '--app-color-primary-contrast': appTheme.palette.primary.contrastText,
  '--app-color-secondary': appTheme.palette.secondary.main,
  '--app-color-secondary-contrast': appTheme.palette.secondary.contrastText,
  '--app-color-danger': appTheme.palette.danger.main,
  '--app-color-danger-hover': appTheme.palette.danger.hover,
  '--app-color-danger-contrast': appTheme.palette.danger.contrastText,
  '--app-color-background': appTheme.palette.background.app,
  '--app-color-surface': appTheme.palette.background.surface,
  '--app-color-surface-subtle': appTheme.palette.background.subtle,
  '--app-color-text-primary': appTheme.palette.text.primary,
  '--app-color-text-secondary': appTheme.palette.text.secondary,
  '--app-color-text-muted': appTheme.palette.text.muted,
  '--app-color-divider': appTheme.palette.divider,
  '--app-radius': `${appTheme.shape.borderRadius}px`,
  '--app-shadow-low': appTheme.shadows.low,
  '--app-shadow-medium': appTheme.shadows.medium,
  '--app-typography-font-family': appTheme.typography.fontFamily,
  '--app-typography-heading': appTheme.typography.heading,
  '--app-typography-body': appTheme.typography.body,
  '--app-typography-small': appTheme.typography.small
};
