
"use client";

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, PlusCircle, Upload, Search, Trash2, Bot, FileText, Download, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AddDeviceDrawer from '@/components/add-device-drawer';
import DeviceTable from '@/components/device-table';
import JobTable from '@/components/job-table';
import AddJobModal from '@/components/add-job-modal';
import AddJobDetailsModal from '@/components/add-job-details-modal';
import RunComplianceModal from '@/components/run-compliance-modal';
import ReportModal from '@/components/compliance-log-modal';
import { useToast } from '@/hooks/use-toast';
import useLocalStorageState from '@/hooks/use-local-storage-state';
import ImportDevicesModal from '@/components/import-devices-modal';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { useDashboard } from '@/contexts/DashboardContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function DashboardPage() {
  const {
    isComplianceModalOpen,
    setIsComplianceModalOpen,
    isComplianceRunning,
    complianceLog,
  } = useDashboard();
    
  const [isClient, setIsClient] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isJobDetailsModalOpen, setIsJobDetailsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('device-list');
  
  const [devices, setDevices] = useLocalStorageState('devices', []);
  const [jobs, setJobs] = useLocalStorageState('jobs', []);

  const [deviceToEdit, setDeviceToEdit] = useState(null);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [currentJobDetails, setCurrentJobDetails] = useState();
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [initialModalSelections, setInitialModalSelections] = useState({});
  const [itemToDelete, setItemToDelete] = useState(null);

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleRunCompliance = (selections) => {
    setInitialModalSelections(selections);
    setIsComplianceModalOpen(true);
  };
  
  const handleSaveDevice = (deviceData, id) => {
    if (id) {
      setDevices(prev => prev.map(d => {
        if (d.id === id) {
          const { password, ...rest } = deviceData;
          const updatedDevice = { ...d, ...rest };
          // Only update password if a new one is provided
          if (password) {
            updatedDevice.password = password;
          }
          return updatedDevice;
        }
        return d;
      }));
      toast({ title: "Success", description: "Device updated successfully." });
    } else {
      const newDevice = { ...deviceData, id: crypto.randomUUID() };
      setDevices((prev) => [...prev, newDevice]);
      toast({ title: "Success", description: "Device added successfully." });
    }
    setIsDrawerOpen(false);
  };
  
  const handleEditDeviceClick = (id) => {
    const device = devices.find(d => d.id === id);
    if (device) {
      setDeviceToEdit(device);
      setIsDrawerOpen(true);
    }
  };

  const handleImportDevices = (newDevices) => {
    const devicesToAdd = newDevices.map(device => ({ ...device, id: crypto.randomUUID() }));
    setDevices(prev => [...prev, ...devicesToAdd]);
    setIsImportModalOpen(false);
  };

  const handleDeleteDevice = (id) => {
    setItemToDelete({ ids: [id], type: 'device' });
    setIsConfirmDialogOpen(true);
  };

  const handleDeleteSelectedDevices = () => {
    if (selectedDeviceIds.length === 0) return;
    setItemToDelete({ ids: selectedDeviceIds, type: 'device' });
    setIsConfirmDialogOpen(true);
  }
  
  const handleJobDetailsContinue = (data) => {
    if (jobToEdit) {
      setCurrentJobDetails({
        name: data.name,
        description: data.description,
        command: jobToEdit.command,
        template: jobToEdit.template
      });
    } else {
      setCurrentJobDetails(data);
    }
    setIsJobDetailsModalOpen(false);
    setIsJobModalOpen(true);
  };

  const handleSaveJobDetails = (data, id) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...data } : j));
    setIsJobDetailsModalOpen(false);
    setJobToEdit(null);
    toast({ title: "Success", description: "Job details updated." });
  };
  
  const handleAddJob = (jobData) => {
    if (!currentJobDetails) return;
    
    if (jobToEdit) {
      const updatedJob = {
        ...jobToEdit,
        name: currentJobDetails.name,
        description: currentJobDetails.description,
        command: jobData.command,
        template: jobData.template,
      };
      setJobs(prev => prev.map(j => j.id === jobToEdit.id ? updatedJob : j));
      toast({ title: "Success", description: "Job updated successfully." });
      setJobToEdit(null);
    } else {
      const newJob = { 
          ...currentJobDetails,
          ...jobData,
          id: crypto.randomUUID() 
      };
      setJobs((prev) => [...prev, newJob]);
      toast({ title: "Success", description: "Job added successfully." });
    }

    setIsJobModalOpen(false);
    setCurrentJobDetails(undefined);
  };
  
  const handleEditJobClick = (id) => {
    const job = jobs.find(j => j.id === id);
    if (job) {
      setJobToEdit(job);
      setIsJobDetailsModalOpen(true);
    }
  };

  const handleDeleteJob = (id) => {
    setItemToDelete({ ids: [id], type: 'job' });
    setIsConfirmDialogOpen(true);
  };
  
  const handleDeleteSelectedJobs = () => {
    if (selectedJobIds.length === 0) return;
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
    toast({ title: "Success", description: `The selected ${itemToDelete.type}(s) have been deleted.` });
    setItemToDelete(null);
  };

  const downloadCsv = (data, filename) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSelectedDevices = () => {
    if (selectedDeviceIds.length === 0) return;
    const devicesToExport = devices
      .filter(d => selectedDeviceIds.includes(d.id))
      .map(({ id, password, ...rest }) => rest);
    downloadCsv(devicesToExport, 'selected-devices.csv');
  };

  const handleExportAllDevices = () => {
    if (devices.length === 0) {
        toast({
            variant: "destructive",
            title: "No Devices",
            description: "There are no devices to export.",
        });
        return;
    }
    const devicesToExport = devices
      .map(({ id, password, ...rest }) => rest);
    downloadCsv(devicesToExport, 'all-devices.csv');
  };
  
  const handleExportDevice = (id) => {
    const deviceToExport = devices
      .filter(d => d.id === id)
      .map(({ id, password, ...rest }) => rest);
    if (deviceToExport.length > 0) {
      const deviceName = deviceToExport[0].name.replace(/ /g, '_');
      downloadCsv(deviceToExport, `${deviceName}-device.csv`);
    }
  };

  const handleExportSelectedJobs = () => {
    if (selectedJobIds.length === 0) return;
    const jobsToExport = jobs
      .filter(j => selectedJobIds.includes(j.id))
      .map(j => ({
        name: j.name,
        description: j.description || '',
        command: j.command || '',
        template: j.template || '',
      }));
    downloadCsv(jobsToExport, 'selected-jobs.csv');
  };

  const handleExportAllJobs = () => {
    if (jobs.length === 0) {
        toast({
            variant: "destructive",
            title: "No Jobs",
            description: "There are no jobs to export.",
        });
        return;
    }
    const jobsToExport = jobs
      .map(j => ({
        name: j.name,
        description: j.description || '',
        command: j.command || '',
        template: j.template || '',
      }));
    downloadCsv(jobsToExport, 'all-jobs.csv');
  };

  const handleExportJob = (id) => {
    const jobToExport = jobs
      .filter(j => j.id === id)
      .map(j => ({
        name: j.name,
        description: j.description || '',
        command: j.command || '',
        template: j.template || '',
      }));
    if (jobToExport.length > 0) {
      const jobName = jobToExport[0].name.replace(/ /g, '_');
      downloadCsv(jobToExport, `${jobName}-job.csv`);
    }
  };

  const handleAddDeviceClick = () => {
    setDeviceToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleAddJobClick = () => {
    setJobToEdit(null);
    setIsJobDetailsModalOpen(true);
  }

  const getActiveButton = (activeTab) => {
    switch (activeTab) {
      case 'job-compliance':
        return (
          <Button onClick={handleAddJobClick}>
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
              <DropdownMenuItem onSelect={handleAddDeviceClick}>
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

  if (!isClient) {
    return (
      <div className="flex h-full w-full items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold font-headline">Manage Devices</h1>
        <div className="flex items-center gap-2">
            {getActiveButton(activeTab)}
            <Button variant="outline" onClick={() => setIsReportModalOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Compliance Report
            </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="device-list">Device List</TabsTrigger>
          <TabsTrigger value="job-compliance">Job Compliance</TabsTrigger>
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button onClick={() => handleRunCompliance({ devices: selectedDeviceIds })} disabled={isComplianceRunning}>
                          <Bot className="mr-2" />
                          Run Compliance ({selectedDeviceIds.length})
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {isComplianceRunning && <TooltipContent><p>Compliance is running</p></TooltipContent>}
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button variant="destructive" onClick={handleDeleteSelectedDevices} disabled={isComplianceRunning}>
                          <Trash2 className="mr-2" />
                          Delete ({selectedDeviceIds.length})
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {isComplianceRunning && <TooltipContent><p>Compliance is running</p></TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button variant="outline" onClick={() => selectedDeviceIds.length > 0 ? handleExportSelectedDevices() : handleExportAllDevices()}>
                <Download className="mr-2 h-4 w-4" />
                {selectedDeviceIds.length > 0 ? `Export (${selectedDeviceIds.length})` : 'Export All'}
              </Button>
            </div>
          </div>
          <DeviceTable 
            devices={devices} 
            onDelete={handleDeleteDevice}
            onEdit={handleEditDeviceClick}
            selectedDeviceIds={selectedDeviceIds}
            onSelectedDeviceIdsChange={setSelectedDeviceIds}
            onRunCompliance={(deviceId) => handleRunCompliance({ devices: [deviceId] })}
            onExport={handleExportDevice}
            isComplianceRunning={isComplianceRunning}
          />
        </TabsContent>
        <TabsContent value="job-compliance" className="mt-6">
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button onClick={() => handleRunCompliance({ jobs: selectedJobIds })} disabled={isComplianceRunning}>
                          <Bot className="mr-2" />
                          Run Compliance ({selectedJobIds.length})
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {isComplianceRunning && <TooltipContent><p>Compliance is running</p></TooltipContent>}
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button variant="destructive" onClick={handleDeleteSelectedJobs} disabled={isComplianceRunning}>
                          <Trash2 className="mr-2" />
                          Delete ({selectedJobIds.length})
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {isComplianceRunning && <TooltipContent><p>Compliance is running</p></TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              )}
               <Button variant="outline" onClick={() => selectedJobIds.length > 0 ? handleExportSelectedJobs() : handleExportAllJobs()}>
                <Download className="mr-2 h-4 w-4" />
                {selectedJobIds.length > 0 ? `Export (${selectedJobIds.length})` : 'Export All'}
              </Button>
            </div>
          </div>
           <JobTable 
              jobs={jobs} 
              onDelete={handleDeleteJob} 
              onEdit={handleEditJobClick}
              selectedJobIds={selectedJobIds}
              onSelectedJobIdsChange={setSelectedJobIds}
              onRunCompliance={(jobId) => handleRunCompliance({ jobs: [jobId] })}
              onExport={handleExportJob}
              isComplianceRunning={isComplianceRunning}
            />
        </TabsContent>
      </Tabs>
      
      <AddDeviceDrawer 
        isOpen={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen}
        onSaveDevice={handleSaveDevice}
        deviceToEdit={deviceToEdit}
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
        onSave={handleSaveJobDetails}
        jobToEdit={jobToEdit}
      />
      
      <AddJobModal
        isOpen={isJobModalOpen} 
        onOpenChange={setIsJobModalOpen}
        onAddJob={handleAddJob}
        jobDetails={currentJobDetails}
      />

      <RunComplianceModal
        isOpen={isComplianceModalOpen}
        devices={devices}
        jobs={jobs}
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
        itemCount={itemToDelete?.ids.length}
      />
    </>
  );
}
