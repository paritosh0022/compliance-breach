
"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

export default function ScanResultDetailsModal({ isOpen, onOpenChange, scanGroup, jobs = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeviceNames, setSelectedDeviceNames] = useState([]);
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

    return { uniqueJobs, uniqueDevices, resultsMap };
  }, [scanGroup]);

  const filteredDevices = useMemo(() => {
    if (!processedData) return [];
    if (!searchTerm) return processedData.uniqueDevices;
    
    return processedData.uniqueDevices.filter(device =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedData, searchTerm]);
  
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

  const { uniqueJobs, resultsMap } = processedData;

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Success':
        return 'default';
      case 'Failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  
  const handleSelectAll = (checked) => {
    setSelectedDeviceNames(checked ? filteredDevices.map(d => d.name) : []);
  };
  
  const handleSelectRow = (deviceName, checked) => {
    if (checked) {
      setSelectedDeviceNames([...selectedDeviceNames, deviceName]);
    } else {
      setSelectedDeviceNames(selectedDeviceNames.filter(name => name !== deviceName));
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

  const handleDownload = () => {
    if (!selectedResultForOutput) return;

    const { deviceName, jobName, status, message, timestamp, scanId } = selectedResultForOutput;
    
    const dataToExport = {
      "Scan ID": scanId,
      "Timestamp": timestamp,
      "Device Name": deviceName,
      "Job Name": jobName,
      "Status": status,
      "Output": message
    };
    
    const csv = Papa.unparse([dataToExport]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const filename = `scan_output_${scanId}_${deviceName}_${jobName}.csv`.replace(/\s+/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Success", description: "Output downloaded as CSV." });
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
          <DialogTitle>Scan Result Details: {scanGroup.scanId}</DialogTitle>
          <DialogDescription>
            Matrix view of job statuses across all devices for this scan. Click a status badge to see the output.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className={cn(
          "flex-1 grid min-h-0 transition-all duration-300 ease-in-out pb-4",
          (selectedResultForOutput || viewedDevice || viewedJob) ? "grid-cols-[2fr_1fr]" : "grid-cols-1"
        )}>
          <div className="flex-1 min-h-0 px-4 overflow-hidden">
             <ScrollArea className="h-full border rounded-lg">
               <Table className="min-w-[1200px]">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[250px] border-r"></TableHead>
                    <TableHead colSpan={uniqueJobs.length} className="text-center border-b">Job Name</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="w-[250px] border-r">Device Name</TableHead>
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
                  {filteredDevices.length > 0 ? (
                    filteredDevices.map(device => (
                      <TableRow 
                        key={device.name} 
                        data-state={(selectedResultForOutput?.deviceName === device.name || viewedDevice?.name === device.name) ? "selected" : ""}
                        className="group"
                      >
                        <TableCell className="font-medium border-r truncate">
                           <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedDeviceNames.includes(device.name)}
                              onCheckedChange={(checked) => handleSelectRow(device.name, !!checked)}
                            />
                            <span>{device.name}</span>
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
                                  variant={getStatusVariant(status)}
                                  className={cn("cursor-pointer", isSelected && "ring-2 ring-offset-2 ring-primary ring-offset-background")}
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
                    ))
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
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDownload}>
                                    <Download className="h-4 w-4" />
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
