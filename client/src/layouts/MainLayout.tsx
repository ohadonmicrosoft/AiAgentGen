import { ReactNode, useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Backdrop } from "@/components/ui/backdrop";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

export default function MainLayout({ children, title }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

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
    setSidebarOpen(!sidebarOpen);
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
      {/* Improved backdrop with blur effect for mobile */}
      <Backdrop 
        show={isMobile && sidebarOpen}
        onClick={() => setSidebarOpen(false)}
        className="z-30 backdrop-blur-md bg-background/70"
      />
      
      {/* Enhanced Sidebar with smooth transitions */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main content area with responsive adjustments */}
      <div className={cn(
        "flex flex-col flex-grow min-h-screen transition-all duration-300 ease-in-out",
        isMobile ? "w-full" : "lg:ml-64"
      )}>
        {/* Top navigation with improved styling */}
        <TopNav title={title} onMenuClick={toggleSidebar} />

        {/* Main content with enhanced spacing and transitions */}
        <main className={cn(
          "flex-grow transition-all duration-300 ease-in-out",
          isMobile ? "px-4 py-5" : "px-6 md:px-8 py-6"
        )}>
          {/* Page container with max width and auto centering */}
          <div className="mx-auto w-full max-w-7xl">
            {/* Animated page entry */}
            <div className="animate-in fade-in duration-500">
              {children}
            </div>
          </div>
        </main>

        {/* Enhanced footer with better responsive styling */}
        <footer className={cn(
          "py-4 md:py-5 mt-auto border-t shadow-soft",
          isMobile ? "px-4" : "px-6",
          "bg-glass"
        )}>
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex items-center">
                <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} AI Agent Generator
                </p>
              </div>
              
              <div className="flex gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors hover:underline">Terms</a>
                <a href="#" className="hover:text-primary transition-colors hover:underline">Privacy</a>
                <a href="#" className="hover:text-primary transition-colors hover:underline">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
