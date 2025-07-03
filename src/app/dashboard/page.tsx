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
import AddComplianceModal from '@/components/add-compliance-modal';

export default function DashboardPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('add-device');
  const [devices, setDevices] = useState<Device[]>([]);

  const handleAddDevice = (device: Omit<Device, 'id'>) => {
    const newDevice = { ...device, id: crypto.randomUUID() };
    setDevices((prev) => [...prev, newDevice]);
    setIsDrawerOpen(false);
  };
  
  const handleDeleteDevice = (id: string) => {
    setDevices((prev) => prev.filter(device => device.id !== id));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold font-headline">Manage Devices</h1>
        
        {activeTab === 'add-device' ? (
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
        ) : (
          <Button onClick={() => setIsComplianceModalOpen(true)}>
            <PlusCircle className="mr-2" />
            Add Compliance
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
            <p className="text-sm text-muted-foreground">No compliance rules created yet. Click "Add Compliance" to get started.</p>
          </div>
        </TabsContent>
      </Tabs>
      
      <AddDeviceDrawer 
        isOpen={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen}
        onAddDevice={handleAddDevice}
      />
      
      <AddComplianceModal 
        isOpen={isComplianceModalOpen} 
        onOpenChange={setIsComplianceModalOpen}
        devices={devices}
      />
    </>
  );
}
