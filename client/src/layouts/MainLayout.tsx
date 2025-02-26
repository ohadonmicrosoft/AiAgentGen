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
      {/* Improved backdrop with blur effect */}
      <Backdrop 
        show={isMobile && sidebarOpen}
        onClick={() => setSidebarOpen(false)}
        className="z-20 backdrop-blur-sm bg-background/60"
      />
      
      {/* Sidebar with smooth transitions */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <div className={cn(
        "flex flex-col flex-grow min-h-screen transition-all duration-300",
        isMobile ? "w-full" : "lg:ml-64"
      )}>
        <TopNav title={title} onMenuClick={toggleSidebar} />

        <main className={cn(
          "flex-grow transition-all duration-300",
          isMobile ? "px-3 py-4" : "px-6 md:px-8 py-6"
        )}>
          {children}
        </main>

        <footer className={cn(
          "py-3 md:py-4 mt-auto border-t bg-muted/30",
          isMobile ? "px-3" : "px-6"
        )}>
          <div className="flex justify-between items-center">
            <p className="text-xs md:text-sm text-muted-foreground">
              © {new Date().getFullYear()} AI Agent Generator
            </p>
            <div className="flex gap-3 text-xs md:text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
