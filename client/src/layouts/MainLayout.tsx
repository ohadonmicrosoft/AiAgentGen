import { ReactNode, useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Backdrop } from "@/components/ui/backdrop";
import { SidebarProvider, useSidebarState } from "@/hooks/use-sidebar-state";
import { motion } from "framer-motion";
import { SkipLink } from "@/components/SkipLink";
import { useAnnouncer, useFocusTrap } from "@/lib/accessibility";
import { useAuth } from "@/hooks/use-auth";
import { usePreferences } from "@/context/preferences-context";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { Icons } from "@/components/ui/icons";
import { PERMISSIONS } from "@/constants";
import { NavItem } from "@/types";
import { Bot, Home, Users, MessagesSquare, Compass, Settings, Sparkles, Database } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

// Define navigation items
const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: "Agents",
    path: "/agents",
    icon: <Bot className="w-5 h-5" />,
  },
  {
    label: "Conversations",
    path: "/conversations",
    icon: <MessagesSquare className="w-5 h-5" />,
  },
  {
    label: "Explore",
    path: "/explore",
    icon: <Compass className="w-5 h-5" />,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

// Define demo items
const demoItems: NavItem[] = [
  {
    label: "UI Components",
    path: "/demo/components",
    icon: <Sparkles className="w-5 h-5" />,
  },
];

// Define admin items
const adminItems: NavItem[] = [
  {
    label: "User Management",
    path: "/admin/users",
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: "System Status",
    path: "/admin/system",
    icon: <Database className="w-5 h-5" />,
  },
];

// Inner layout component that uses the sidebar state
function MainLayoutInner({ children, title }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { isCollapsed, isHovering } = useSidebarState();
  
  // Set up announcer for dynamic content changes
  const { announce } = useAnnouncer();
  
  // Focus trap for mobile sidebar
  const sidebarFocusTrapRef = useFocusTrap(
    isMobile && sidebarOpen,
    () => setSidebarOpen(false)
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
      announce("Navigation sidebar opened");
    } else {
      announce("Navigation sidebar closed");
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
    <div className="flex min-h-screen bg-background">
      {/* Skip links for keyboard navigation */}
      <SkipLink targetId="main-content">Skip to main content</SkipLink>
      <SkipLink targetId="main-navigation">Skip to navigation</SkipLink>
      
      {/* Improved backdrop with blur effect for mobile */}
      <Backdrop 
        show={isMobile && sidebarOpen}
        onClick={() => setSidebarOpen(false)}
        className="z-30 backdrop-blur-md bg-background/70"
      />
      
      {/* Enhanced Sidebar with accessibility improvements */}
      <div ref={sidebarFocusTrapRef}>
        <Sidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          navItems={navItems}
          demoItems={demoItems}
          adminItems={adminItems}
        />
      </div>

      {/* Main content area with responsive adjustments */}
      <motion.div 
        className={cn(
          "flex flex-col flex-grow min-h-screen transition-all duration-300 ease-in-out",
          isMobile 
            ? "w-full" 
            : isCollapsed && !isHovering 
              ? "lg:ml-[4.5rem]" 
              : "lg:ml-64"
        )}
        animate={{
          marginLeft: isMobile
            ? 0
            : isCollapsed && !isHovering
              ? "4.5rem"
              : "16rem",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Top navigation with improved styling */}
        <TopNav title={title} onMenuClick={toggleSidebar} />

        {/* Main content with enhanced spacing and transitions */}
        <main 
          id="main-content"
          className={cn(
            "flex-grow transition-all duration-300 ease-in-out",
            isMobile ? "px-4 py-5" : "px-6 md:px-8 py-6"
          )}
          tabIndex={-1} // Makes it focusable for skip link without affecting tab order
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
        </main>

        {/* Enhanced footer with better responsive styling */}
        <footer
          className={cn(
            "py-4 md:py-5 mt-auto border-t shadow-soft",
            isMobile ? "px-4" : "px-6",
            "bg-glass"
          )}
          role="contentinfo"
          aria-label="Footer"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex items-center">
                <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} AI Agent Generator
                </p>
              </div>
              
              <nav aria-label="Footer navigation">
                <ul className="flex gap-6 text-sm text-muted-foreground">
                  <li>
                    <a href="#" className="hover:text-primary transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm">Terms</a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm">Privacy</a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm">Support</a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}

// Wrapper component that provides the sidebar state
export default function MainLayout(props: MainLayoutProps) {
  return (
    <SidebarProvider>
      <MainLayoutInner {...props} />
    </SidebarProvider>
  );
}
