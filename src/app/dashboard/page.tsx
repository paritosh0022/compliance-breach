
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
import { ChevronDown, PlusCircle, Upload, Search, Trash2, Bot, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AddDeviceDrawer from '@/components/add-device-drawer';
import DeviceTable from '@/components/device-table';
import JobTable from '@/components/job-table';
import AddJobModal from '@/components/add-job-modal';
import AddJobDetailsModal from '@/components/add-job-details-modal';
import RunComplianceModal from '@/components/run-compliance-modal';
import ReportModal from '@/components/compliance-log-modal';
import type { Device, Job, ComplianceLog } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import useLocalStorageState from '@/hooks/use-local-storage-state';
import ImportDevicesModal from '@/components/import-devices-modal';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';

export default function DashboardPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isJobDetailsModalOpen, setIsJobDetailsModalOpen] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('device-list');
  
  const [devices, setDevices] = useLocalStorageState<Device[]>('devices', []);
  const [jobs, setJobs] = useLocalStorageState<Job[]>('jobs', []);
  const [complianceLog, setComplianceLog] = useLocalStorageState<ComplianceLog[]>('complianceLog', []);

  const [currentJobDetails, setCurrentJobDetails] = useState<Omit<Job, 'id' | 'command' | 'template'>>();
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [initialModalSelections, setInitialModalSelections] = useState<{
    devices?: string[];
    jobs?: string[];
  }>({});
  const [itemToDelete, setItemToDelete] = useState<{ ids: string[]; type: 'device' | 'job' } | null>(null);


  const { toast } = useToast();
  
  const handleRunCompliance = (selections: { devices?: string[]; jobs?: string[] }) => {
    setInitialModalSelections(selections);
    setIsComplianceModalOpen(true);
  };
  
  const handleComplianceModalOpenChange = (open: boolean) => {
    setIsComplianceModalOpen(open);
    if (!open) {
        setInitialModalSelections({});
    }
  }

  const handleAddDevice = (device: Omit<Device, 'id'>) => {
    const newDevice = { ...device, id: crypto.randomUUID() };
    setDevices((prev) => [...prev, newDevice]);
    setIsDrawerOpen(false);
  };
  
  const handleImportDevices = (newDevices: Omit<Device, 'id'>[]) => {
    const devicesToAdd = newDevices.map(device => ({ ...device, id: crypto.randomUUID() }));
    setDevices(prev => [...prev, ...devicesToAdd]);
    setIsImportModalOpen(false);
  };

  const handleDeleteDevice = (id: string) => {
    setItemToDelete({ ids: [id], type: 'device' });
    setIsConfirmDialogOpen(true);
  };

  const handleDeleteSelectedDevices = () => {
    setItemToDelete({ ids: selectedDeviceIds, type: 'device' });
    setIsConfirmDialogOpen(true);
  }
  
  const handleJobDetailsContinue = (data: Omit<Job, 'id' | 'command' | 'template'>) => {
    setCurrentJobDetails(data);
    setIsJobDetailsModalOpen(false);
    setIsJobModalOpen(true);
  };
  
  const handleAddJob = (jobData: Pick<Job, 'command' | 'template'>) => {
    if (!currentJobDetails) return;
    const newJob: Job = { 
        ...currentJobDetails,
        ...jobData,
        id: crypto.randomUUID() 
    };
    setJobs((prev) => [...prev, newJob]);
    setIsJobModalOpen(false);
    setCurrentJobDetails(undefined);
  };

  const handleDeleteJob = (id: string) => {
    setItemToDelete({ ids: [id], type: 'job' });
    setIsConfirmDialogOpen(true);
  };
  
  const handleDeleteSelectedJobs = () => {
    setItemToDelete({ ids: selectedJobIds, type: 'job' });
    setIsConfirmDialogOpen(true);
  }

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'device') {
        setDevices(prev => prev.filter(device => !itemToDelete.ids.includes(device.id)));
        setSelectedDeviceIds([]);
    } else if (itemToDelete.type === 'job') {
        setJobs(prev => prev.filter(job => !itemToDelete.ids.includes(job.id)));
        setSelectedJobIds([]);
    }

    setIsConfirmDialogOpen(false);
    setItemToDelete(null);
    toast({ title: "Success", description: "The selected item(s) have been deleted." });
  };


  const handleRunComplianceComplete = (logEntry: Omit<ComplianceLog, 'id' | 'timestamp'>) => {
    const newLogEntry = { ...logEntry, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    setComplianceLog(prev => [newLogEntry, ...prev]);
    toast({
      title: "Compliance Run Finished",
      description: `Check the reports for details.`,
    });
  };

  const getActiveButton = (activeTab: string) => {
    switch (activeTab) {
      case 'manage-jobs':
        return (
          <Button onClick={() => setIsJobDetailsModalOpen(true)}>
            <PlusCircle className="mr-2" />
            Add Job
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
              <DropdownMenuItem onSelect={() => setIsDrawerOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Single Device
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsImportModalOpen(true)}>
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
        <div className="flex items-center gap-2">
            {getActiveButton(activeTab)}
            <Button variant="outline" onClick={() => setIsReportModalOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Reports
            </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="device-list">Device List</TabsTrigger>
          <TabsTrigger value="manage-jobs">Manage Jobs</TabsTrigger>
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
                  <Button variant="outline" onClick={() => handleRunCompliance({ devices: selectedDeviceIds })}>
                    <Bot className="mr-2" />
                    Run Compliance ({selectedDeviceIds.length})
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
            onRunCompliance={(deviceId) => handleRunCompliance({ devices: [deviceId] })}
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
             <div className="flex items-center gap-2">
              {selectedJobIds.length > 0 && (
                <>
                  <Button variant="outline" onClick={() => handleRunCompliance({ jobs: selectedJobIds })}>
                    <Bot className="mr-2" />
                    Run Compliance ({selectedJobIds.length})
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteSelectedJobs}>
                    <Trash2 className="mr-2" />
                    Delete ({selectedJobIds.length})
                  </Button>
                </>
              )}
               <Button variant="outline">Export</Button>
            </div>
          </div>
           <JobTable 
              jobs={jobs} 
              onDelete={handleDeleteJob} 
              selectedJobIds={selectedJobIds}
              onSelectedJobIdsChange={setSelectedJobIds}
              onRunCompliance={(jobId) => handleRunCompliance({ jobs: [jobId] })}
            />
        </TabsContent>
      </Tabs>
      
      <AddDeviceDrawer 
        isOpen={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen}
        onAddDevice={handleAddDevice}
      />

      <ImportDevicesModal
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImport={handleImportDevices}
      />
      
      <AddJobDetailsModal
        isOpen={isJobDetailsModalOpen}
        onOpenChange={setIsJobDetailsModalOpen}
        onContinue={handleJobDetailsContinue}
      />
      
      <AddJobModal
        isOpen={isJobModalOpen} 
        onOpenChange={setIsJobModalOpen}
        onAddJob={handleAddJob}
        jobDetails={currentJobDetails}
      />

      <RunComplianceModal
        isOpen={isComplianceModalOpen}
        onOpenChange={handleComplianceModalOpenChange}
        devices={devices}
        jobs={jobs}
        onRunComplete={handleRunComplianceComplete}
        initialSelectedDeviceIds={initialModalSelections.devices}
        initialSelectedJobIds={initialModalSelections.jobs}
      />

      <ReportModal 
        isOpen={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        logs={complianceLog}
      />

      <ConfirmDeleteDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={handleConfirmDelete}
        itemType={itemToDelete?.type}
      />
    </>
  );
}
