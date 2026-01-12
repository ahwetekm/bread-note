'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import type { User } from 'next-auth';

interface MainLayoutProps {
  user: User;
  children: React.ReactNode;
}

export function MainLayout({ user, children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header
          user={user}
          onMenuToggle={toggleSidebar}
          isSidebarOpen={sidebarOpen}
        />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
