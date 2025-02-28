import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useLocalStorage } from './use-local-storage';
import { useIsMobile } from './use-mobile';

interface SidebarState {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
  isHovering: boolean;
  setIsHovering: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarState | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>(
    'sidebar-collapsed',
    false,
  );
  const [isHovering, setIsHovering] = useState(false);

  // Always expand sidebar on mobile
  useEffect(() => {
    if (isMobile && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [isMobile, isCollapsed, setIsCollapsed]);

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  const setCollapsed = (value: boolean) => {
    setIsCollapsed(value);
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleCollapsed,
        setCollapsed,
        isHovering,
        setIsHovering,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarState() {
  const context = useContext(SidebarContext);

  if (context === undefined) {
    throw new Error('useSidebarState must be used within a SidebarProvider');
  }

  return context;
}
