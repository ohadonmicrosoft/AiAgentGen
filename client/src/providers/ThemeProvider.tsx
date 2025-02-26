import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Define the available theme options
type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light"; // Always resolves to actual applied theme
}

// Set initial state
const initialState: ThemeProviderState = {
  theme: "system",
  resolvedTheme: "light", // Default to light if system preference can't be determined
  setTheme: () => null,
};

// Create context
const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * Theme provider component that handles theme switching and persistence
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  // Get initial theme from localStorage or use default
  const [theme, setThemeState] = useState<Theme>(() => {
    // Try to get stored theme
    if (typeof window !== "undefined") {
      try {
        const storedTheme = window.localStorage.getItem(storageKey);
        if (storedTheme && (storedTheme === "dark" || storedTheme === "light" || storedTheme === "system")) {
          return storedTheme;
        }
      } catch (err) {
        console.warn("Error reading theme from localStorage:", err);
      }
    }
    return defaultTheme;
  });

  // Track the resolved theme (either "light" or "dark", not "system")
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("light");

  // Update the theme
  const setTheme = (newTheme: Theme) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, newTheme);
      }
    } catch (err) {
      console.warn("Error saving theme to localStorage:", err);
    }
    setThemeState(newTheme);
  };

  // Effect to apply theme to document and handle system preference changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;
    
    // Function to apply theme
    const applyTheme = (themeToApply: "dark" | "light") => {
      root.classList.remove("light", "dark");
      root.classList.add(themeToApply);
      setResolvedTheme(themeToApply);
    };

    // Apply initial theme
    if (theme === "system") {
      // Check system preference
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      applyTheme(systemTheme);

      // Listen for system preference changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleMediaChange = () => {
        const newSystemTheme = mediaQuery.matches ? "dark" : "light";
        applyTheme(newSystemTheme);
      };

      // Add listener with proper fallback for older browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleMediaChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleMediaChange);
      }

      // Cleanup
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", handleMediaChange);
        } else {
          // Fallback for older browsers
          mediaQuery.removeListener(handleMediaChange);
        }
      };
    } else {
      // Apply explicit theme choice
      applyTheme(theme);
    }
  }, [theme]);

  const value = {
    theme,
    resolvedTheme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

/**
 * Hook to access the theme context
 * @returns ThemeProviderState with theme value and setTheme function
 */
export const useTheme = (): ThemeProviderState => {
  const context = useContext(ThemeProviderContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
};
