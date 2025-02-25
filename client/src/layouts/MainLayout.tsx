import { ReactNode, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

export default function MainLayout({ children, title }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-grow min-h-screen">
        <TopNav title={title} onMenuClick={toggleSidebar} />

        <main className="flex-grow px-4 sm:px-6">
          {children}
        </main>

        <footer className="py-4 mt-auto">
          <div className="container">
            <p className="text-sm text-center text-muted-foreground">
              © {new Date().getFullYear()} AI Agent Generator. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
