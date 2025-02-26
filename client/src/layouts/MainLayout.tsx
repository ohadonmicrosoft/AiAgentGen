import { ReactNode, useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
    <div className="flex min-h-screen">
      {/* Backdrop overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar with improved transitions */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <div className={cn(
        "flex flex-col flex-grow min-h-screen transition-all duration-300",
        isMobile && sidebarOpen ? "lg:ml-0" : "lg:ml-0"
      )}>
        <TopNav title={title} onMenuClick={toggleSidebar} />

        <main className="flex-grow px-4 sm:px-6 md:px-8 py-6">
          {children}
        </main>

        <footer className="py-4 mt-auto border-t">
          <div className="container mx-auto px-4">
            <p className="text-sm text-center text-muted-foreground">
              © {new Date().getFullYear()} AI Agent Generator. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
