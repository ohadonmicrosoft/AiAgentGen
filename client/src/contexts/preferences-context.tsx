import React, { createContext, useContext, useState, useEffect } from "react";

interface PreferencesContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  theme: string;
  setTheme: (theme: string) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined,
);

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}

interface PreferencesProviderProps {
  children: React.ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    localStorage.getItem("sidebarCollapsed") === "true",
  );
  const [theme, setTheme] = useState<string>(
    localStorage.getItem("theme") || "system",
  );

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const value = {
    sidebarCollapsed,
    setSidebarCollapsed,
    theme,
    setTheme,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
