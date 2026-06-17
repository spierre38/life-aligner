'use client';

/**
 * ThemeProvider.tsx — Tim 2026 Light/Dark Mode
 *
 * Applies `data-theme="dark"` (default) or `data-theme="light"` to the
 * <html> element. CSS variables in globals.css switch all surfaces/colors.
 *
 * Usage:
 *   import { useTheme } from '@/app/components/ThemeProvider';
 *   const { theme, toggleTheme } = useTheme();
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  isDark: true,
});

const STORAGE_KEY = 'tc-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const resolved: Theme = stored === 'light' ? 'light' : 'dark';
    setTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  // During SSR/hydration, render children without any theme attribute
  // to avoid hydration mismatch. The effect above sets it immediately
  // on the client after mount.
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'dark', toggleTheme, isDark: true }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
