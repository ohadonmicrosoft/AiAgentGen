import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system' | 'custom';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  customColors?: Record<string, string>;
  setCustomColors?: (colors: Record<string, string>) => void;
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );
  const [customColors, setCustomColors] = useState<Record<string, string>>({});

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove previous theme classes
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    if (theme === 'custom') {
      // For custom theme, we still need a base (light/dark)
      // to ensure proper color contrasts
      const baseTheme = customColors?.background
        ? // Check if background is light or dark
          isLightColor(customColors.background)
          ? 'light'
          : 'dark'
        : 'light';

      root.classList.add(baseTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme, customColors]);

  useEffect(() => {
    // Persist theme to localStorage
    if (theme !== defaultTheme) {
      localStorage.setItem(storageKey, theme);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [theme, defaultTheme, storageKey]);

  // For custom theme support, we need to know if a color is light or dark
  const isLightColor = (color: string): boolean => {
    // Simple implementation - more advanced would use relative luminance
    // Remove any leading #
    color = color.replace(/^#/, '');

    // Convert hex to RGB
    let r, g, b;
    if (color.length === 3) {
      r = parseInt(color[0] + color[0], 16);
      g = parseInt(color[1] + color[1], 16);
      b = parseInt(color[2] + color[2], 16);
    } else {
      r = parseInt(color.substring(0, 2), 16);
      g = parseInt(color.substring(2, 4), 16);
      b = parseInt(color.substring(4, 6), 16);
    }

    // Calculate relative luminance (simplified)
    // Using formula: (0.299*R + 0.587*G + 0.114*B)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return true if luminance is high (light color)
    return luminance > 0.5;
  };

  const value = {
    theme,
    setTheme,
    customColors,
    setCustomColors: (colors: Record<string, string>) => {
      setCustomColors(colors);

      // Apply these colors to CSS variables
      const root = window.document.documentElement;
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });
    },
  };

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
