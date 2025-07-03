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
import { ChevronDown, PlusCircle, Upload, Search, Trash2, Bot, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AddDeviceDrawer from '@/components/add-device-drawer';
import DeviceTable from '@/components/device-table';
import JobTable from '@/components/job-table';
import AddJobModal from '@/components/add-job-modal';
import RunComplianceModal from '@/components/run-compliance-modal';
import AddComplianceModal from '@/components/add-compliance-modal';
import ComplianceLogModal from '@/components/compliance-log-modal';
import type { Device, Job, ComplianceRun, ComplianceLog } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import useLocalStorageState from '@/hooks/use-local-storage-state';

export default function DashboardPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [isAddComplianceModalOpen, setIsAddComplianceModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('device-list');
  
  const [devices, setDevices] = useLocalStorageState<Device[]>('devices', []);
  const [jobs, setJobs] = useLocalStorageState<Job[]>('jobs', []);
  const [complianceRuns, setComplianceRuns] = useLocalStorageState<ComplianceRun[]>('complianceRuns', []);
  const [complianceLog, setComplianceLog] = useLocalStorageState<ComplianceLog[]>('complianceLog', []);

  const [currentComplianceRun, setCurrentComplianceRun] = useState<Omit<ComplianceRun, 'id'>>();
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  
  const { toast } = useToast();

  const handleAddDevice = (device: Omit<Device, 'id'>) => {
    const newDevice = { ...device, id: crypto.randomUUID() };
    setDevices((prev) => [...prev, newDevice]);
    setIsDrawerOpen(false);
  };
  
  const handleDeleteDevice = (id: string) => {
    setDevices((prev) => prev.filter(device => device.id !== id));
  };

  const handleDeleteSelectedDevices = () => {
    setDevices(prev => prev.filter(device => !selectedDeviceIds.includes(device.id)));
    setSelectedDeviceIds([]);
  }
  
  const handleAddJob = (job: Omit<Job, 'id'>) => {
    const newJob = { ...job, id: crypto.randomUUID() };
    setJobs((prev) => [...prev, newJob]);
    setIsJobModalOpen(false);
  };

  const handleDeleteJob = (id: string) => {
    setJobs((prev) => prev.filter(job => job.id !== id));
  };
  
  const handleSaveCompliance = (data: Omit<ComplianceRun, 'id'>) => {
    const newComplianceRun = { ...data, id: crypto.randomUUID() };
    setComplianceRuns(prev => [...prev, newComplianceRun]);
    setIsAddComplianceModalOpen(false);
    toast({
      title: "Compliance Saved",
      description: `"${data.name}" has been saved.`,
    });
  };

  const handleSaveAndRunCompliance = (data: Omit<ComplianceRun, 'id'>) => {
    setComplianceRuns(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
    setCurrentComplianceRun(data);
    setIsAddComplianceModalOpen(false);
    setIsComplianceModalOpen(true);
  };

  const handleRunComplianceComplete = (logEntry: Omit<ComplianceLog, 'id'>) => {
    const newLogEntry = { ...logEntry, id: crypto.randomUUID() };
    setComplianceLog(prev => [newLogEntry, ...prev]);
    toast({
      title: "Compliance Run Finished",
      description: `Status: ${logEntry.status}`,
    });
  };

  const getActiveButton = (activeTab: string) => {
    switch (activeTab) {
      case 'manage-jobs':
        return (
          <Button onClick={() => setIsJobModalOpen(true)}>
            <PlusCircle className="mr-2" />
            Add Job
          </Button>
        );
      case 'manage-compliance':
        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsLogModalOpen(true)}>
              <BookOpen className="mr-2" />
              Log
            </Button>
            <Button onClick={() => setIsAddComplianceModalOpen(true)}>
              <PlusCircle className="mr-2" />
              Add Compliance
            </Button>
          </div>
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
        );
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold font-headline">Manage Devices</h1>
        {getActiveButton(activeTab)}
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
            <div className="flex items-center gap-2">
              {selectedDeviceIds.length > 0 && (
                <>
                  <Button variant="outline" onClick={() => {
                    // This would open the run compliance modal with selected devices
                    // For now, let's just show a toast
                     toast({ title: `Running compliance for ${selectedDeviceIds.length} devices.`});
                  }}>
                    <Bot className="mr-2" />
                    Run Compliance
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteSelectedDevices}>
                    <Trash2 className="mr-2" />
                    Delete ({selectedDeviceIds.length})
                  </Button>
                </>
              )}
               <Button variant="outline">Export</Button>
            </div>
          </div>
          <DeviceTable 
            devices={devices} 
            onDelete={handleDeleteDevice}
            selectedDeviceIds={selectedDeviceIds}
            onSelectedDeviceIdsChange={setSelectedDeviceIds}
          />
        </TabsContent>
        <TabsContent value="manage-jobs" className="mt-6">
           <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                className="pl-9"
              />
            </div>
            <Button variant="outline">Export</Button>
          </div>
           <JobTable jobs={jobs} onDelete={handleDeleteJob} />
        </TabsContent>
        <TabsContent value="manage-compliance" className="mt-6">
           {jobs.length > 0 && devices.length > 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 py-20 text-center">
              <h3 className="text-lg font-semibold text-muted-foreground">Ready to Run Compliance</h3>
              <p className="text-sm text-muted-foreground">Click the "Add Compliance" button to begin.</p>
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
        onAddJob={handleAddJob}
      />

      <AddComplianceModal 
        isOpen={isAddComplianceModalOpen}
        onOpenChange={setIsAddComplianceModalOpen}
        onSave={handleSaveCompliance}
        onSaveAndRun={handleSaveAndRunCompliance}
      />

      <RunComplianceModal
        isOpen={isComplianceModalOpen}
        onOpenChange={setIsComplianceModalOpen}
        devices={devices}
        jobs={jobs}
        complianceRun={currentComplianceRun}
        onRunComplete={handleRunComplianceComplete}
      />

      <ComplianceLogModal 
        isOpen={isLogModalOpen}
        onOpenChange={setIsLogModalOpen}
        logs={complianceLog}
      />
    </>
  );
}
