"use client";

import React from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Server } from 'lucide-react';
import Link from 'next/link';

export default function DashboardSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-2xl font-headline font-semibold">Device Hub</h2>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={true}
                tooltip="Manage Devices"
            >
              <Link href="/dashboard">
                <Server />
                <span>Manage Devices</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
