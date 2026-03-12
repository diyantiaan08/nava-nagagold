import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Theme, ThemeColors } from '../types/chat';

export type DarkMode = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
  darkMode: DarkMode;
  setDarkMode: (mode: DarkMode) => void;
}

const lightThemeConfig: Record<Theme, ThemeColors> = {
  blue: {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-50',
    gradient: 'from-blue-600 to-blue-700',
    hover: 'hover:bg-blue-700',
  },
  orange: {
    primary: 'bg-orange-600',
    secondary: 'bg-orange-50',
    gradient: 'from-orange-600 to-orange-700',
    hover: 'hover:bg-orange-700',
  },
  green: {
    primary: 'bg-green-600',
    secondary: 'bg-green-50',
    gradient: 'from-green-600 to-green-700',
    hover: 'hover:bg-green-700',
  },
  purple: {
    primary: 'bg-purple-600',
    secondary: 'bg-purple-50',
    gradient: 'from-purple-600 to-purple-700',
    hover: 'hover:bg-purple-700',
  },
};

const darkThemeConfig: Record<Theme, ThemeColors> = {
  blue: {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-900',
    gradient: 'from-blue-600 to-blue-700',
    hover: 'hover:bg-blue-700',
  },
  orange: {
    primary: 'bg-orange-600',
    secondary: 'bg-orange-900',
    gradient: 'from-orange-600 to-orange-700',
    hover: 'hover:bg-orange-700',
  },
  green: {
    primary: 'bg-green-600',
    secondary: 'bg-green-900',
    gradient: 'from-green-600 to-green-700',
    hover: 'hover:bg-green-700',
  },
  purple: {
    primary: 'bg-purple-600',
    secondary: 'bg-purple-900',
    gradient: 'from-purple-600 to-purple-700',
    hover: 'hover:bg-purple-700',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('blue');
  const [darkMode, setDarkMode] = useState<DarkMode>('light');

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') as DarkMode | null;
    if (saved) {
      setDarkMode(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const themeConfig = darkMode === 'dark' ? darkThemeConfig : lightThemeConfig;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        colors: themeConfig[theme],
        darkMode,
        setDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
