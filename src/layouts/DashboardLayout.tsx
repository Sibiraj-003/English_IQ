import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { DemoBanner } from '../components/DemoBanner';
import { MobileBottomNav } from '../components/MobileBottomNav';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#FDE68A] selection:text-[#0F172A]">
      {/* Top Demo Banner */}
      <DemoBanner />

      <div className="flex flex-1 relative">
        {/* Responsive Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 w-full flex flex-col min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Android Mobile Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
};
