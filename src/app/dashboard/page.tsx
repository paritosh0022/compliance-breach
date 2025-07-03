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
import { ChevronDown, PlusCircle, Upload, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AddDeviceDrawer from '@/components/add-device-drawer';
import DeviceTable from '@/components/device-table';
import JobTable from '@/components/job-table';
import AddJobModal from '@/components/add-compliance-modal';
import RunComplianceModal from '@/components/run-compliance-modal';
import type { Device, Job } from '@/lib/types';

const getActiveButton = (
  activeTab: string,
  openAddDevice: () => void,
  openAddJob: () => void,
  openRunCompliance: () => void
) => {
  switch (activeTab) {
    case 'manage-jobs':
      return (
        <Button onClick={openAddJob}>
          <PlusCircle className="mr-2" />
          Add Job
        </Button>
      );
    case 'manage-compliance':
      return (
        <Button onClick={openRunCompliance}>
          <PlusCircle className="mr-2" />
          Run Compliance
        </Button>
      );
    case 'device-list':
    default:
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Add Device
              <ChevronDown className="ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={openAddDevice}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Single Device
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Upload className="mr-2 h-4 w-4" />
              Import from CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
  }
};

export default function DashboardPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('device-list');
  const [devices, setDevices] = useState<Device[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const handleAddDevice = (device: Omit<Device, 'id'>) => {
    const newDevice = { ...device, id: crypto.randomUUID() };
    setDevices((prev) => [...prev, newDevice]);
    setIsDrawerOpen(false);
  };
  
  const handleDeleteDevice = (id: string) => {
    setDevices((prev) => prev.filter(device => device.id !== id));
  };
  
  const handleAddJob = (job: Omit<Job, 'id'>) => {
    const newJob = { ...job, id: crypto.randomUUID() };
    setJobs((prev) => [...prev, newJob]);
    setIsJobModalOpen(false);
  };

  const handleDeleteJob = (id: string) => {
    setJobs((prev) => prev.filter(job => job.id !== id));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold font-headline">Manage Devices</h1>
        {getActiveButton(
          activeTab,
          () => setIsDrawerOpen(true),
          () => setIsJobModalOpen(true),
          () => setIsComplianceModalOpen(true)
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="device-list">Device List</TabsTrigger>
          <TabsTrigger value="manage-jobs">Manage Jobs</TabsTrigger>
          <TabsTrigger value="manage-compliance">Manage Compliance</TabsTrigger>
        </TabsList>
        <TabsContent value="device-list" className="mt-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                className="pl-9"
              />
            </div>
            <Button variant="outline">Export</Button>
          </div>
          <DeviceTable devices={devices} onDelete={handleDeleteDevice} />
        </TabsContent>
        <TabsContent value="manage-jobs" className="mt-6">
           <JobTable jobs={jobs} onDelete={handleDeleteJob} />
        </TabsContent>
        <TabsContent value="manage-compliance" className="mt-6">
           {jobs.length > 0 && devices.length > 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 py-20 text-center">
              <h3 className="text-lg font-semibold text-muted-foreground">Ready to Run Compliance</h3>
              <p className="text-sm text-muted-foreground">Click the "Run Compliance" button in the header to begin.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 py-20 text-center">
              <h3 className="text-lg font-semibold text-muted-foreground">Prerequisites Missing</h3>
              <p className="text-sm text-muted-foreground">
                {devices.length === 0 && "Please add at least one device first."}
                {devices.length > 0 && jobs.length === 0 && "Please create at least one job first."}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <AddDeviceDrawer 
        isOpen={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen}
        onAddDevice={handleAddDevice}
      />
      
      <AddJobModal
        isOpen={isJobModalOpen} 
        onOpenChange={setIsJobModalOpen}
        devices={devices}
        onAddJob={handleAddJob}
      />

      <RunComplianceModal
        isOpen={isComplianceModalOpen}
        onOpenChange={setIsComplianceModalOpen}
        devices={devices}
        jobs={jobs}
      />
    </>
  );
}
