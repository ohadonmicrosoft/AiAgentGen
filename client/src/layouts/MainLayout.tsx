import Sidebar from '@/components/Sidebar';
import { SkipLink } from '@/components/SkipLink';
import TopNav from '@/components/TopNav';
import { Backdrop } from '@/components/ui/backdrop';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Icons } from '@/components/ui/icons';
import { PERMISSIONS } from '@/constants';
import { usePreferences } from '@/context/preferences-context';
import { useAuth } from '@/hooks/use-auth';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarProvider, useSidebarState } from '@/hooks/use-sidebar-state';
import { useAnnouncer, useFocusTrap } from '@/lib/accessibility';
import { cn } from '@/lib/utils';
import { NavItem } from '@/types';
import { FocusTrap } from '@radix-ui/react-focus-trap';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bot,
  Compass,
  Database,
  Home,
  Menu,
  MessagesSquare,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

// Define navigation items
const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: 'Agents',
    path: '/agents',
    icon: <Bot className="w-5 h-5" />,
  },
  {
    label: 'Conversations',
    path: '/conversations',
    icon: <MessagesSquare className="w-5 h-5" />,
  },
  {
    label: 'Explore',
    path: '/explore',
    icon: <Compass className="w-5 h-5" />,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: <Settings className="w-5 h-5" />,
  },
];

// Define demo items
const demoItems: NavItem[] = [
  {
    label: 'UI Components',
    path: '/demo/components',
    icon: <Sparkles className="w-5 h-5" />,
  },
];

// Define admin items
const adminItems: NavItem[] = [
  {
    label: 'User Management',
    path: '/admin/users',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'System Status',
    path: '/admin/system',
    icon: <Database className="w-5 h-5" />,
  },
];

// Create context for sidebar state
export const SidebarContext = createContext<{
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
});

// Hook to consume sidebar context
export const useSidebar = () => useContext(SidebarContext);

// Main layout inner component
function MainLayoutInner({ children, title }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { isCollapsed, isHovering } = useSidebarState();

  // Set up announcer for dynamic content changes
  const { announce } = useAnnouncer();

  // Focus trap for mobile sidebar
  const sidebarFocusTrapRef = useFocusTrap(isMobile && sidebarOpen, () =>
    setSidebarOpen(false),
  );

  // Close sidebar when transitioning from mobile to desktop
  useEffect(() => {
    if (!isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Close sidebar when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);

    // Announce sidebar state change to screen readers
    if (newState) {
      announce('Navigation sidebar opened');
    } else {
      announce('Navigation sidebar closed');
    }
  };

  // Prevent scrolling on body when mobile sidebar is open
  useEffect(() => {
    if (isMobile) {
      if (sidebarOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, isMobile]);

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div className="min-h-screen flex flex-col bg-background text-foreground antialiased transition-colors duration-300">
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground"
        >
          Skip to content
        </a>

        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <FocusTrap active={isMobile && sidebarOpen}>
          <aside
            className={`
              fixed inset-y-0 left-0 z-40 
              w-64 transform transition-transform duration-300 ease-in-out
              lg:translate-x-0 lg:static lg:w-auto lg:flex-shrink-0
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              flex-shrink-0
            `}
          >
            <Sidebar
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              navItems={navItems}
              demoItems={demoItems}
              adminItems={adminItems}
            />
          </aside>
        </FocusTrap>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen lg:pl-64">
          {/* Top navigation */}
          <TopNav title={title} onMenuClick={toggleSidebar} />

          {/* Main content */}
          <main
            id="main-content"
            className="flex-1 transition-all duration-300 pt-16 pb-8 px-4 md:px-6"
          >
            <ErrorBoundary
              fallback={
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">
                    Something went wrong
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    An error occurred while loading this page content.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                  >
                    Try again
                  </button>
                </div>
              }
            >
              {/* Page container with max width and auto centering */}
              <div className="mx-auto w-full max-w-7xl">
                {/* Page title for screen readers if needed */}
                {title && <h1 className="sr-only">{title}</h1>}

                {/* Animated page entry */}
                <div className="animate-in fade-in duration-500">
                  {children}
                </div>
              </div>
            </ErrorBoundary>
          </main>

          {/* Footer */}
          <footer className="py-4 px-6 border-t border-border/50 text-center text-sm text-muted-foreground">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <p>© {new Date().getFullYear()} AI Agent Generator</p>
              <div className="flex items-center space-x-4">
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Help
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

// Export MainLayout with error boundary
export default function MainLayout(props: MainLayoutProps) {
  return (
    <ErrorBoundary>
      <MainLayoutInner {...props} />
    </ErrorBoundary>
  );
}
