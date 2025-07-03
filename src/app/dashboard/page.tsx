"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, PlusCircle, Upload } from 'lucide-react';
import AddDeviceDrawer from '@/components/add-device-drawer';
import DeviceTable from '@/components/device-table';
import type { Device } from '@/lib/types';

export default function DashboardPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);

  const handleAddDevice = (device: Omit<Device, 'id'>) => {
    const newDevice = { ...device, id: crypto.randomUUID() };
    setDevices((prev) => [...prev, newDevice]);
    setIsDrawerOpen(false); // Close drawer after adding
  };
  
  const handleDeleteDevice = (id: string) => {
    setDevices((prev) => prev.filter(device => device.id !== id));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold font-headline">Manage Devices</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Add Device
              <ChevronDown className="ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setIsDrawerOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Single Device
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Upload className="mr-2 h-4 w-4" />
              Import from CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="add-device">
        <TabsList>
          <TabsTrigger value="add-device">Device List</TabsTrigger>
          <TabsTrigger value="manage-compliance">Manage Compliance</TabsTrigger>
        </TabsList>
        <TabsContent value="add-device" className="mt-6">
          <DeviceTable devices={devices} onDelete={handleDeleteDevice} />
        </TabsContent>
        <TabsContent value="manage-compliance" className="mt-6">
           <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 py-20 text-center">
            <h3 className="text-lg font-semibold text-muted-foreground">Compliance Management</h3>
            <p className="text-sm text-muted-foreground">Compliance features will be available here.</p>
          </div>
        </TabsContent>
      </Tabs>
      
      <AddDeviceDrawer 
        isOpen={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen}
        onAddDevice={handleAddDevice}
      />
    </>
  );
}
