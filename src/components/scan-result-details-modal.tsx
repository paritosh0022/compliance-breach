
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
import { Search, X, Copy, Download, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Checkbox } from "./ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTablePagination } from "./data-table-pagination";

export default function ScanResultDetailsModal({ isOpen, onOpenChange, scanGroup, jobs = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResultForOutput, setSelectedResultForOutput] = useState(null);
  const [viewedDevice, setViewedDevice] = useState(null);
  const [viewedJob, setViewedJob] = useState(null);
  const { toast } = useToast();

  const processedData = useMemo(() => {
    if (!scanGroup || !scanGroup.results) return null;

    const uniqueJobs = [...new Set(scanGroup.results.map(r => r.jobName))];
    
    const deviceMap = scanGroup.results.reduce((acc, result) => {
        if (!acc[result.deviceName]) {
            acc[result.deviceName] = {
                name: result.deviceName,
                ipAddress: result.deviceIpAddress,
                username: result.deviceUsername || 'N/A', 
                port: result.devicePort || 'N/A'
            };
        }
        return acc;
    }, {});
    const uniqueDevices = Object.values(deviceMap);

    const resultsMap = scanGroup.results.reduce((acc, result) => {
      const key = `${result.deviceName}-${result.jobName}`;
      acc[key] = { status: result.status, message: result.message, timestamp: scanGroup.timestamp, scanId: scanGroup.scanId };
      return acc;
    }, {});

    return { uniqueJobs, uniqueDevices, resultsMap, stats: scanGroup.stats, allResults: scanGroup.results };
  }, [scanGroup]);

  const filteredDevices = useMemo(() => {
    if (!processedData) return [];
    if (!searchTerm) return processedData.uniqueDevices;
    
    return processedData.uniqueDevices.filter(device =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedData, searchTerm]);

  const { table } = useDataTable({
    data: filteredDevices,
    columns: [], // Columns are defined in JSX
    pageCount: Math.ceil(filteredDevices.length / 10),
  });

  const paginatedRows = table.getRowModel().rows;
  const selectedDeviceNames = table.getSelectedRowModel().rows.map(row => row.original.name);
  
  const handlePanelOpen = (panelType, data) => {
    if (panelType === 'output') {
      setViewedDevice(null);
      setViewedJob(null);
      setSelectedResultForOutput(data);
    } else if (panelType === 'device') {
      setSelectedResultForOutput(null);
      setViewedJob(null);
      setViewedDevice(data);
    } else if (panelType === 'job') {
      setSelectedResultForOutput(null);
      setViewedDevice(null);
      setViewedJob(data);
    }
  };

  const handlePanelClose = () => {
    setSelectedResultForOutput(null);
    setViewedDevice(null);
    setViewedJob(null);
  }

  if (!processedData || !scanGroup) return null;

  const { uniqueJobs, resultsMap, stats, allResults } = processedData;

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

  const handleBadgeClick = (deviceName, jobName) => {
    const result = resultsMap[`${deviceName}-${jobName}`];
    if (result) {
      handlePanelOpen('output', {
        deviceName,
        jobName,
        ...result,
      });
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
      scan_id: scanGroup.scanId,
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
    const filename = `scan_results_${scanGroup.scanId}_${isExportingSelected ? 'selected' : 'all'}.csv`;
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
      handlePanelOpen('job', job);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[90vw] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Scan Result Details</DialogTitle>
          <DialogDescription>
            Matrix view of job statuses across all devices for this scan. Click a status badge to see the output.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 py-3 border-b">
            <Card className="bg-transparent shadow-none">
                <CardContent className="p-3">
                    <div className="flex items-center justify-around text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Scan ID</p>
                            <p className="font-semibold">{scanGroup.scanId}</p>
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

        <div className={cn(
          "flex-1 grid min-h-0 transition-all duration-300 ease-in-out pb-4",
          (selectedResultForOutput || viewedDevice || viewedJob) ? "grid-cols-[2fr_1fr]" : "grid-cols-1"
        )}>
          <div className="flex-1 min-h-0 px-4 overflow-hidden flex flex-col">
             <div className="flex-grow border rounded-lg overflow-hidden">
                <ScrollArea className="h-full">
                  <Table className="min-w-[1200px]">
                    <TableHeader className="sticky top-0 bg-background z-10">
                       <TableRow>
                        <TableHead colSpan={uniqueJobs.length + 1} className="text-center border-b font-bold">Job Status Matrix</TableHead>
                      </TableRow>
                      <TableRow>
                        <TableHead className="w-[250px] min-w-[250px] sticky left-0 bg-background z-10 border-r">
                           <div className="flex items-center gap-2">
                             <Checkbox
                               id="select-all-devices-modal"
                               checked={table.getIsAllPageRowsSelected()}
                               onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                               aria-label="Select all"
                             />
                             Device Name
                           </div>
                        </TableHead>
                        {uniqueJobs.map(jobName => (
                          <TableHead key={jobName} className="min-w-[150px]">
                            <div className="group flex items-center gap-2">
                              <span>{jobName}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleJobDetailsClick(jobName)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRows.length > 0 ? (
                        paginatedRows.map((row) => {
                          const device = row.original;
                          return (
                            <TableRow 
                              key={device.name} 
                              data-state={row.getIsSelected() || (selectedResultForOutput?.deviceName === device.name || viewedDevice?.name === device.name) ? "selected" : ""}
                              className="group"
                            >
                              <TableCell className="font-medium border-r truncate sticky left-0 bg-background group-hover:bg-muted/50 group-data-[state=selected]:bg-muted">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={row.getIsSelected()}
                                      onCheckedChange={(value) => row.toggleSelected(!!value)}
                                      aria-label={`Select ${device.name}`}
                                    />
                                    <span className="flex-1">{device.name}</span>
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handlePanelOpen('device', device)}>
                                      <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                              {uniqueJobs.map(jobName => {
                                const result = resultsMap[`${device.name}-${jobName}`];
                                const status = result?.status;
                                const isSelected = selectedResultForOutput?.deviceName === device.name && selectedResultForOutput?.jobName === jobName;
                                return (
                                  <TableCell key={jobName}>
                                    {status ? (
                                      <Badge
                                        className={cn("cursor-pointer", getStatusBadgeClass(status), isSelected && "ring-2 ring-offset-2 ring-primary ring-offset-background")}
                                        onClick={() => handleBadgeClick(device.name, jobName)}
                                      >
                                        {status}
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary">N/A</Badge>
                                    )}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={uniqueJobs.length + 1} className="h-24 text-center">
                            No devices found for this search term.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
             </div>
             <div className="pt-2">
                <DataTablePagination table={table} />
             </div>
          </div>
          {(selectedResultForOutput || viewedDevice || viewedJob) && (
            <div className="flex flex-col border-l bg-muted/30 min-h-0 pr-4">
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
               {viewedDevice && (
                    <>
                         <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-semibold text-base truncate">Details: {viewedDevice.name}</h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePanelClose}>
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close Panel</span>
                            </Button>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <div className="p-4 border rounded-lg bg-background/50 space-y-2 text-sm">
                                <h4 className="font-semibold">Device Details</h4>
                                <p className="break-words"><strong className="text-muted-foreground">IP Address:</strong> <code>{viewedDevice.ipAddress}</code></p>
                                <p className="break-words"><strong className="text-muted-foreground">Username:</strong> <code>{viewedDevice.username}</code></p>
                                <p className="break-words"><strong className="text-muted-foreground">Port:</strong> <code>{viewedDevice.port}</code></p>
                            </div>
                        </ScrollArea>
                    </>
               )}
               {viewedJob && (
                    <>
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-semibold text-base truncate">Details: {viewedJob.name}</h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePanelClose}>
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close Panel</span>
                            </Button>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                           <div className="p-4 border rounded-lg bg-background/50 space-y-2 text-sm">
                              <h4 className="font-semibold">Job Details</h4>
                              <p className="break-words"><strong className="text-muted-foreground">Command:</strong> <code>{viewedJob.command || 'N/A'}</code></p>
                              <p className="break-words"><strong className="text-muted-foreground">Template:</strong> <code>{viewedJob.template || 'N/A'}</code></p>
                          </div>
                        </ScrollArea>
                    </>
               )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

    