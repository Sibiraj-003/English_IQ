import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { DemoBanner } from '../components/DemoBanner';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { NovaFloatingAssistant } from '../components/nova/NovaFloatingAssistant';
import { useAuth } from '../contexts/AuthContext';

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState<boolean>(() => {
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
      setDesktopSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('sidebar_collapsed', next.toString());
        } catch {}
        return next;
      });
    }
  };

  // Strictly remove floating 3D model for Admin and Teacher
  const isExcludedRole =
    user?.role === 'admin' ||
    user?.role === 'teacher' ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/teacher');

  return (
    <div className="h-screen max-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#FDE68A] selection:text-[#0F172A] overflow-hidden">
      {/* Top Demo Banner */}
      <DemoBanner />

      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Responsive Sidebar (Hide & Unhide driven by top three-line menu) */}
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          isCollapsed={desktopSidebarCollapsed}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-2 sm:p-3 md:p-3.5 pb-16 md:pb-3.5 w-full flex flex-col min-w-0 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Android Mobile Navigation Bar */}
      <MobileBottomNav />

      {/* Persistent 3D AI Floating Companion - Excluded for Admin & Teacher */}
      {!isExcludedRole && <NovaFloatingAssistant />}
    </div>
  );
};
