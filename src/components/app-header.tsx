
"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import AiAssistant from './ai-assistant';

export default function AppHeader({ activeCategory }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <h1 className="flex-1 text-xl font-semibold tracking-tight font-headline">
        {activeCategory}
      </h1>
      <AiAssistant />
    </header>
  );
}
