
"use client";

import React, { useState, useMemo } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import ComponentGrid from '@/components/component-grid';

export default function AppLayout({ components }) {
  const [activeCategory, setActiveCategory] = useState(null);

  const filteredComponents = useMemo(() => {
    if (!activeCategory || activeCategory === 'All Components') {
      return components;
    }
    return components.filter(c => c.category === activeCategory);
  }, [components, activeCategory]);

  return (
    <SidebarProvider>
      <AppSidebar
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />
      <SidebarInset>
        <AppHeader activeCategory={activeCategory || "All Components"} />
        <main className="p-4 sm:p-6 lg:p-8">
          <ComponentGrid components={filteredComponents} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
