
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
import { Server, Combine, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", icon: <Server />, label: "Compliance Dashboard" },
    { href: "/dashboard/devices", icon: <Combine />, label: "Manage Devices" },
    { href: "/dashboard/jobs", icon: <Briefcase />, label: "Manage Jobs" },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1184.37 200.65" className="h-10 w-auto">
          <defs>
            <style>
              {`
                .cls-1-logo { fill: #b38a2f; stroke-width: 0px; }
                .cls-2-logo { fill: #c4223d; stroke-width: 0px; }
              `}
            </style>
          </defs>
          <g>
            <path className="cls-2-logo" d="m444.11,195.64L297.45,31.45v163.64h-14.75V0l10.57,5.28,145.83,163.64V5.28h14.75v195.37l-9.74-5.01Z"/>
            <path className="cls-2-logo" d="m497.27,195.09V7.24l14.75-5.57v193.42h-14.75Z"/>
            <path className="cls-2-logo" d="m617.77,199.54l-5.85-4.73L534.27,6.95l13.36-5.57,68.75,164.48L684.83,1.39l13.08,5.57-80.14,192.58Z"/>
            <path className="cls-2-logo" d="m721.02,195.09V5.28h103.53l-5.3,12.25h-83.49v75.97h80.16v12.25h-80.16v77.09h86.83l4.18,12.25h-105.75Z"/>
            <path className="cls-2-logo" d="m989.58,17.53h-69.02v177.55h-14.74V17.53h-73.48l4.45-12.25h157.24l-4.45,12.25Z"/>
            <path className="cls-2-logo" d="m1145.98,17.53h-69.03v177.55h-14.74V17.53h-73.48l4.45-12.25h157.25l-4.45,12.25Z"/>
            <path className="cls-2-logo" d="m1169.63,195.09V7.24l14.74-5.57v193.42h-14.74Z"/>
          </g>
          <g>
            <polygon className="cls-1-logo" points="217.74 194.55 0 73.76 0 2.11 217.74 123.77 217.74 194.55"/>
            <polygon className="cls-2-logo" points="0 193.49 0 119.32 74.18 159.16 0 193.49"/>
            <polygon className="cls-2-logo" points="217.74 76.29 217.74 2.11 143.56 41.95 217.74 76.29"/>
          </g>
        </svg>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
             <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
