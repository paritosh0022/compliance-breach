
"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { Search, X, Copy, Download, Eye, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Checkbox } from "./ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTablePagination } from "./data-table-pagination";

export default function ScanResultDetailsModal({ isOpen, onOpenChange, scanGroup, jobs = [], devices = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResultForOutput, setSelectedResultForOutput] = useState(null);
  const [viewedJob, setViewedJob] = useState(null);
  const [selectedDeviceForDetails, setSelectedDeviceForDetails] = useState(null);
  const { toast } = useToast();

  const handleCloseModal = () => {
    onOpenChange(false);
    // Reset internal state when modal closes
    setTimeout(() => {
      setSelectedDeviceForDetails(null);
      setSelectedResultForOutput(null);
      setSearchTerm("");
    }, 300);
  };
  
  const processedData = useMemo(() => {
    if (!scanGroup || !scanGroup.results) return null;

    const devicesMap = devices.reduce((acc, device) => {
        acc[device.id] = device;
        return acc;
    }, {});

    const jobsMap = jobs.reduce((acc, job) => {
        acc[job.id] = job;
        return acc;
    }, {});

    const updatedResults = scanGroup.results.map(result => ({
      ...result,
      deviceName: devicesMap[result.deviceId]?.name || result.deviceName,
      deviceIpAddress: devicesMap[result.deviceId]?.ipAddress || result.deviceIpAddress,
      jobName: jobsMap[result.jobId]?.name || result.jobName,
    }));

    const resultsByDevice = updatedResults.reduce((acc, result) => {
      const deviceName = devicesMap[result.deviceId]?.name || result.deviceName;
      if (!acc[deviceName]) {
        acc[deviceName] = {
          name: deviceName,
          ipAddress: devicesMap[result.deviceId]?.ipAddress || result.deviceIpAddress,
          port: devicesMap[result.deviceId]?.port || 'N/A',
          username: devicesMap[result.deviceId]?.username || 'N/A',
          results: [],
          overallStatus: 'Success'
        };
      }
      acc[deviceName].results.push(result);
      if (result.status === 'Failed') {
        acc[deviceName].overallStatus = 'Failed';
      }
      return acc;
    }, {});

    return { 
      devices: Object.values(resultsByDevice),
      stats: scanGroup.stats,
      scanId: scanGroup.scanId,
      allResults: updatedResults 
    };
  }, [scanGroup, jobs, devices]);

  const filteredDevices = useMemo(() => {
    if (!processedData) return [];
    if (!searchTerm) return processedData.devices;
    
    return processedData.devices.filter(device =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedData, searchTerm]);

  const { table } = useDataTable({
    data: filteredDevices,
    columns: [], // Columns defined in JSX
    pageCount: Math.ceil(filteredDevices.length / 10),
  });

  const paginatedRows = table.getRowModel().rows;
  const selectedDeviceNames = table.getSelectedRowModel().rows.map(row => row.original.name);
  
  const handlePanelClose = () => {
    setSelectedResultForOutput(null);
    setViewedJob(null);
  }

  if (!processedData || !scanGroup) return null;

  const { stats, scanId, allResults } = processedData;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Success':
        return 'bg-green-500 hover:bg-green-600 text-primary-foreground';
      case 'Failed':
        return 'bg-destructive hover:bg-destructive/80 text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };
  
  const handleCopy = () => {
    if (selectedResultForOutput?.message) {
      navigator.clipboard.writeText(selectedResultForOutput.message);
      toast({ title: "Success", description: "Output copied to clipboard." });
    }
  };

  const handleExport = () => {
    const isExportingSelected = selectedDeviceNames.length > 0;
    
    let resultsToExport;
    if (isExportingSelected) {
      resultsToExport = allResults.filter(result => selectedDeviceNames.includes(result.deviceName));
    } else {
      resultsToExport = allResults;
    }
    
    if (resultsToExport.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Data to Export',
        description: 'There are no results to export for the current selection.',
      });
      return;
    }

    const dataForCsv = resultsToExport.map(r => ({
      scan_id: scanId,
      device_name: r.deviceName,
      ip_address: r.deviceIpAddress,
      job_name: r.jobName,
      status: r.status,
      message: r.message,
    }));

    const csv = Papa.unparse(dataForCsv);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const filename = `scan_results_${scanId}_${isExportingSelected ? 'selected' : 'all'}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleJobDetailsClick = (jobName) => {
    const job = jobs.find(j => j.name === jobName);
    if (job) {
      setViewedJob(job);
      setSelectedResultForOutput(null);
    }
  };
  
  const renderDeviceListView = () => (
    <>
      <div className="px-4 py-3 border-b">
          <Card className="bg-transparent shadow-none border">
              <CardContent className="p-3">
                  <div className="flex items-center justify-around text-center">
                      <div>
                          <p className="text-sm text-muted-foreground">Scan ID</p>
                          <p className="font-semibold">{scanId}</p>
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Devices Run</p>
                          <Badge variant="secondary">{stats?.run || 0}</Badge>
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Devices Passed</p>
                          <Badge className="bg-green-500 hover:bg-green-600">{stats?.passed || 0}</Badge>
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Devices Failed</p>
                          <Badge variant="destructive">{stats?.failed || 0}</Badge>
                      </div>
                  </div>
              </CardContent>
          </Card>
      </div>

      <div className="px-4 py-2 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          {selectedDeviceNames.length > 0 ? `Export (${selectedDeviceNames.length})` : 'Export All'}
        </Button>
      </div>
       <div className="flex-1 min-h-0 px-4 pb-4 flex flex-col">
           <div className="flex-grow border rounded-lg overflow-hidden">
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={table.getIsAllPageRowsSelected()}
                          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Device Name</TableHead>
                      <TableHead>Compliance Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRows.length > 0 ? (
                      paginatedRows.map((row) => {
                        const device = row.original;
                        return (
                          <TableRow key={device.name} data-state={row.getIsSelected() && "selected"}>
                            <TableCell>
                                <Checkbox
                                  checked={row.getIsSelected()}
                                  onCheckedChange={(value) => row.toggleSelected(!!value)}
                                  aria-label={`Select ${device.name}`}
                                />
                            </TableCell>
                            <TableCell className="font-medium">
                                <div className="group flex items-center justify-between">
                                    <span>{device.name}</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => setSelectedDeviceForDetails(device)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn("cursor-pointer", getStatusBadgeClass(device.overallStatus))}
                                onClick={() => setSelectedDeviceForDetails(device)}
                              >
                                {device.overallStatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          No devices found for this search term.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
           </div>
           <DataTablePagination table={table} />
      </div>
    </>
  );
  
  const renderDeviceDetailView = () => {
    if (!selectedDeviceForDetails) return null;
    
    return (
      <div className="flex flex-col h-full">
         <div className="p-4 border-b flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDeviceForDetails(null)}>
                  <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                  <h3 className="font-semibold text-lg leading-none">Compliance Details</h3>
                  <p className="text-sm text-muted-foreground">{selectedDeviceForDetails.name}</p>
              </div>
           </div>
        </div>

        <div className="px-4 py-3 border-b">
             <Card className="bg-transparent shadow-none border">
                <CardContent className="p-3">
                    <div className="flex items-center justify-around text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Scan ID</p>
                            <p className="font-semibold">{scanId}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Device Name</p>
                            <p className="font-semibold">{selectedDeviceForDetails.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Compliance Result</p>
                            <Badge className={getStatusBadgeClass(selectedDeviceForDetails.overallStatus)}>
                                {selectedDeviceForDetails.overallStatus}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className={cn(
          "flex-1 grid min-h-0 transition-all duration-300 ease-in-out",
          (selectedResultForOutput || viewedJob) ? "grid-cols-[2fr_1fr]" : "grid-cols-1"
        )}>
           <div className="flex-1 min-h-0 px-4 py-4 flex flex-col">
             <div className="flex-grow border rounded-lg overflow-hidden">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          Jobs
                          <p className="text-xs font-normal text-muted-foreground mt-1">
                            Click a status badge to see the output.
                          </p>
                        </TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDeviceForDetails.results.map(result => (
                        <TableRow key={`${result.deviceId}-${result.jobId}`}>
                          <TableCell className="font-medium">{result.jobName}</TableCell>
                          <TableCell>
                            <Badge
                              className={cn("cursor-pointer", getStatusBadgeClass(result.status))}
                              onClick={() => setSelectedResultForOutput(result)}
                            >
                              {result.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
             </div>
           </div>

           {(selectedResultForOutput || viewedJob) && (
            <div className="flex flex-col border-l bg-muted/30 min-h-0">
               {selectedResultForOutput && (
                    <>
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-semibold text-base truncate">Output</h3>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleCopy}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePanelClose}>
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Close Panel</span>
                                </Button>
                            </div>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <pre className="whitespace-pre-wrap text-sm font-mono">
                            {selectedResultForOutput.message}
                            </pre>
                        </ScrollArea>
                    </>
               )}
            </div>
          )}
        </div>
      </div>
    );
  };
  

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-7xl w-[90vw] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Scan Result Details</DialogTitle>
          <DialogDescription>
            {selectedDeviceForDetails 
                ? `Showing job statuses for ${selectedDeviceForDetails.name}. Click a status badge to see output.`
                : 'Aggregated compliance status for all devices in this scan. Click a status to see details.'
            }
          </DialogDescription>
        </DialogHeader>
        {selectedDeviceForDetails ? renderDeviceDetailView() : renderDeviceListView()}
      </DialogContent>
    </Dialog>
  );
}
