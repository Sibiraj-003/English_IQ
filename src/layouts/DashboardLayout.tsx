import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { DemoBanner } from '../components/DemoBanner';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { ChevronRight } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('sidebar_collapsed', next.toString());
        } catch {}
        return next;
      });
    }
  };

  const toggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', next.toString());
      } catch {}
      return next;
    });
  };

  return (
    <div className="h-screen max-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#FDE68A] selection:text-[#0F172A] overflow-hidden">
      {/* Top Demo Banner */}
      <DemoBanner />

      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Responsive Sidebar with desktop slide collapse/expand */}
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        {/* Floating Expand Tab when sidebar is slid to left */}
        {sidebarCollapsed && (
          <button
            onClick={() => {
              setSidebarCollapsed(false);
              try {
                localStorage.setItem('sidebar_collapsed', 'false');
              } catch {}
            }}
            className="hidden md:flex items-center gap-1.5 fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-[#FDE68A] text-[#0F172A] border-2 border-l-0 border-[#0F172A] px-1.5 py-4 shadow-[4px_4px_0px_#0F172A] hover:bg-[#A7F3D0] active:scale-95 transition-all group font-mono text-[10px] font-extrabold [writing-mode:vertical-lr] cursor-pointer"
            title="Slide menu right to access navigation options"
          >
            <ChevronRight className="w-4 h-4 mb-1 group-hover:translate-x-1 transition-transform animate-pulse" />
            <span>OPTIONS</span>
          </button>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-2 sm:p-3 md:p-3.5 pb-16 md:pb-3.5 w-full flex flex-col min-w-0 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Android Mobile Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
};
