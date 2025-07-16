
"use client";

import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, PlusCircle, Upload, Search, Trash2, Bot, Download, Loader2, FileText, FileDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AddDeviceDrawer from '@/components/add-device-drawer';
import DeviceTable from '@/components/device-table';
import RunComplianceModal from '@/components/run-compliance-modal';
import ReportModal from '@/components/compliance-log-modal';
import { useToast } from '@/hooks/use-toast';
import useLocalStorageState from '@/hooks/use-local-storage-state';
import ImportDevicesModal from '@/components/import-devices-modal';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { useDashboard } from '@/contexts/DashboardContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDataTable } from '@/hooks/use-data-table';
import { DataTablePagination } from '@/components/data-table-pagination';

export default function DevicesPage() {
  const {
    isComplianceModalOpen,
    setIsComplianceModalOpen,
    isComplianceRunning,
    complianceLog,
  } = useDashboard();
    
  const [isClient, setIsClient] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const [devices, setDevices] = useLocalStorageState('devices', []);
  const [jobs, setJobs] = useLocalStorageState('jobs', []);
  const [scheduledJobs, setScheduledJobs] = useLocalStorageState('scheduledJobs', []);
  const [devicePingStatus, setDevicePingStatus] = useState(new Map());

  const [deviceToEdit, setDeviceToEdit] = useState(null);
  const [initialModalSelections, setInitialModalSelections] = useState({});
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deviceSearchTerm, setDeviceSearchTerm] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredDevices = useMemo(() => devices.filter(device => {
    const searchTermLower = deviceSearchTerm.toLowerCase();
    return (
      device.name.toLowerCase().includes(searchTermLower) ||
      device.ipAddress.toLowerCase().includes(searchTermLower) ||
      device.username.toLowerCase().includes(searchTermLower) ||
      device.port.toString().includes(searchTermLower)
    );
  }), [devices, deviceSearchTerm]);

  const { table } = useDataTable({
    data: filteredDevices,
    columns: [], // Columns are defined directly in DeviceTable
    pageCount: Math.ceil(filteredDevices.length / 10),
  });

  const paginatedRows = table.getRowModel().rows;
  const selectedDeviceIds = table.getSelectedRowModel().rows.map(row => row.original.id);
  
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

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'device') {
        setDevices(prev => prev.filter(device => !itemToDelete.ids.includes(device.id)));
        table.resetRowSelection();
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

  const handleExport = (formatType, deviceId) => {
    let devicesToExport;
    let filename;
    let subject;

    if (deviceId) {
        devicesToExport = devices.filter(d => d.id === deviceId);
        subject = devicesToExport[0].name.replace(/ /g, '_');
    } else {
        const selectedDevices = devices.filter(d => selectedDeviceIds.includes(d.id));
        if (selectedDevices.length > 0) {
            devicesToExport = selectedDevices;
            subject = 'selected-devices';
        } else {
            devicesToExport = devices;
            subject = 'all-devices';
        }
    }
    
    if (devicesToExport.length === 0) {
        toast({
            variant: "destructive",
            title: "No Devices",
            description: "There are no devices to export.",
        });
        return;
    }

    const dataForExport = devicesToExport.map(({ id, password, ...rest }) => rest);

    if (formatType === 'csv') {
        downloadCsv(dataForExport, `${subject}.csv`);
    } else if (formatType === 'pdf') {
        // PDF export logic will be added later.
        toast({
            title: "Coming Soon",
            description: "PDF export functionality is not yet available.",
        });
    }
  };

  const handleAddDeviceClick = () => {
    setDeviceToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleScheduleJob = (scheduleDetails, complianceRunConfig) => {
    const newScheduledJob = {
      id: crypto.randomUUID(),
      scanId: 'Scheduled', // Placeholder ID
      ...complianceRunConfig,
      ...scheduleDetails,
    };
    setScheduledJobs(prev => [...prev, newScheduledJob]);
    toast({
      title: "Job Scheduled",
      description: `The compliance check has been scheduled successfully.`,
    });
    setIsComplianceModalOpen(false);
  };

  const handlePingDevice = (deviceId) => {
    setDevicePingStatus(prev => new Map(prev).set(deviceId, { pingState: 'pinging' }));

    setTimeout(() => {
      const isSuccess = Math.random() > 0.3; // Simulate success/failure
      
      setDevicePingStatus(prev => new Map(prev).set(deviceId, { 
        pingState: isSuccess ? 'success' : 'failed',
        reachability: isSuccess ? 'Reachable' : 'Unreachable'
      }));
      
      toast({
        title: isSuccess ? "Ping Successful" : "Ping Failed",
        description: isSuccess ? `Device is reachable.` : `Device could not be reached.`,
        variant: isSuccess ? "default" : "destructive",
      });

    }, 2000);
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
        </div>
      </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                className="pl-9"
                value={deviceSearchTerm}
                onChange={(e) => setDeviceSearchTerm(e.target.value)}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        {selectedDeviceIds.length > 0 ? `Export (${selectedDeviceIds.length})` : 'Export All'}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleExport('pdf')} disabled>Export as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <DeviceTable 
            rows={paginatedRows}
            table={table} 
            onDelete={handleDeleteDevice}
            onEdit={handleEditDeviceClick}
            onRunCompliance={(deviceId) => handleRunCompliance({ devices: [deviceId] })}
            onExport={(format, deviceId) => handleExport(format, deviceId)}
            isComplianceRunning={isComplianceRunning}
            devicePingStatus={devicePingStatus}
            onPingDevice={handlePingDevice}
          />
          <DataTablePagination table={table} />
        </div>
      
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

      <RunComplianceModal
        isOpen={isComplianceModalOpen}
        devices={devices}
        jobs={jobs}
        initialSelectedDeviceIds={initialModalSelections.devices}
        initialSelectedJobIds={initialModalSelections.jobs}
        onScheduleJob={handleScheduleJob}
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
