
"use client";

import React from 'react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { groupedComponents } from '@/lib/component-data';
import { ChevronsUpDown, LayoutGrid, Layout, FormInput, SquareArrowOutUpRight, Navigation, GalleryVertical, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryIcons = {
  Layout: Layout,
  Forms: FormInput,
  Overlays: SquareArrowOutUpRight,
  Navigation: Navigation,
  Display: GalleryVertical,
};

export default function AppSidebar({ activeCategory, setActiveCategory }) {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-2xl font-headline font-semibold">Switchboard</h2>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton asChild tooltip="Dashboard">
               <Link href="/dashboard">
                 <Server />
                 <span>Dashboard</span>
               </Link>
             </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveCategory('All Components')}
              isActive={activeCategory === 'All Components'}
              tooltip="All Components"
            >
              <LayoutGrid />
              <span>All Components</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Separator className="my-4" />
        {groupedComponents.map(group => {
          const Icon = categoryIcons[group.name] || LayoutGrid;
          return (
            <Collapsible key={group.name} defaultOpen>
              <SidebarMenu>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <div
                      className={cn(
                        "flex w-full items-center justify-between rounded-md p-2 text-sm font-medium",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{group.name}</span>
                      </div>
                      <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                    </div>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
              </SidebarMenu>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {group.components.map(component => (
                    <SidebarMenuSubItem key={component.name}>
                      <SidebarMenuSubButton
                        onClick={() => setActiveCategory(component.category)}
                        isActive={activeCategory === component.category && filteredByComponent(component.name)}
                        className="w-full justify-start"
                      >
                        {component.name}
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}

// A helper function to manage active state more granularly if needed in future
function filteredByComponent(name) {
    // This could be enhanced to filter by individual component
    return true;
}
