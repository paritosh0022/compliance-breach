
'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/dashboard-sidebar';
import DashboardHeader from '@/components/dashboard-header';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { DashboardProvider } from '@/contexts/DashboardContext';

export default function DashboardLayout({
  children,
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      setIsAuthenticated(true);
    } else {
      router.replace('/login');
    }
  }, [router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardProvider>
  );
}
