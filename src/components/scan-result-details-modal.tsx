
"use client";

import { useMemo, useState, useLayoutEffect, useRef, useEffect } from "react";
import Papa from "papaparse";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { Search, Eye, ArrowLeft, Maximize2, Copy, FileDown, Wifi, WifiOff, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Checkbox } from "./ui/checkbox";
import { useDataTable } from "@/hooks/use-data-table";
import { DataTablePagination } from "./data-table-pagination";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export default function ScanResultDetailsModal({ isOpen, onOpenChange, scanGroup, initialSelectedDevice, jobs = [], devices = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeviceForDetails, setSelectedDeviceForDetails] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [overflowingRows, setOverflowingRows] = useState(new Set());
  const [devicePingStatus, setDevicePingStatus] = useState(new Map());
  const [hoveredPingWidgetId, setHoveredPingWidgetId] = useState(null);
  const outputRefs = useRef({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && initialSelectedDevice) {
      setSelectedDeviceForDetails(initialSelectedDevice);
    }
  }, [isOpen, initialSelectedDevice]);

  const handleCloseModal = () => {
    onOpenChange(false);
    // Reset internal state when modal closes
    setTimeout(() => {
      setSelectedDeviceForDetails(null);
      setSearchTerm("");
      setExpandedRows(new Set());
      setOverflowingRows(new Set());
      setDevicePingStatus(new Map());
      setHoveredPingWidgetId(null);
      outputRefs.current = {};
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
      id: `${result.deviceId}-${result.jobId}`, // Create a unique ID for the result
      deviceName: devicesMap[result.deviceId]?.name || result.deviceName,
      deviceIpAddress: devicesMap[result.deviceId]?.ipAddress || result.deviceIpAddress,
      jobName: jobsMap[result.jobId]?.name || result.jobName,
    }));

    const resultsByDevice = updatedResults.reduce((acc, result) => {
      const deviceName = devicesMap[result.deviceId]?.name || result.deviceName;
      if (!acc[deviceName]) {
        acc[deviceName] = {
          id: result.deviceId,
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
    
    const finalDeviceData = Object.values(resultsByDevice).map(device => {
        const passedCount = device.results.filter(r => r.status === 'Success').length;
        const failedCount = device.results.length - passedCount;
        return {
            ...device,
            passedCount,
            failedCount,
        };
    });


    return { 
      devices: finalDeviceData,
      stats: scanGroup.stats,
      scanId: scanGroup.scanId,
      timestamp: scanGroup.timestamp,
    };
  }, [scanGroup, jobs, devices]);

  const filteredDevices = useMemo(() => {
    if (!processedData) return [];
    if (!searchTerm) return processedData.devices;
    
    return processedData.devices.filter(device =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedData, searchTerm]);

  useLayoutEffect(() => {
    if (selectedDeviceForDetails) {
      const newOverflowingRows = new Set();
      for (const id in outputRefs.current) {
        const element = outputRefs.current[id];
        if (element && element.scrollWidth > element.clientWidth) {
          newOverflowingRows.add(id);
        }
      }
      if (newOverflowingRows.size !== overflowingRows.size || ![...newOverflowingRows].every(id => overflowingRows.has(id))) {
          setOverflowingRows(newOverflowingRows);
      }
    }
  }, [selectedDeviceForDetails, processedData, expandedRows, overflowingRows.size]);


  const { table } = useDataTable({
    data: filteredDevices,
    columns: [], // Columns defined in JSX
    pageCount: Math.ceil(filteredDevices.length / 10),
  });

  const paginatedRows = table.getRowModel().rows;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  
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
  
  const toggleRowExpansion = (rowId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const handleCopyOutput = (output) => {
    navigator.clipboard.writeText(output);
    toast({
      title: "Copied!",
      description: "Job output has been copied to your clipboard.",
    });
  };

  const handleExport = (formatType) => {
    const devicesToExport = selectedRows.length > 0
      ? selectedRows.map(row => row.original)
      : filteredDevices;
  
    if (devicesToExport.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "There is no data to export.",
      });
      return;
    }
  
    const csvData = devicesToExport.map(device => ({
        'scan_id': scanGroup?.scanId || 'N/A',
        'last_run_at': scanGroup?.timestamp ? format(new Date(scanGroup.timestamp), "yyyy-MM-dd HH:mm:ss") : 'N/A',
        'device_name': device.name,
        'compliance_status': device.overallStatus,
        'jobs_passed': device.passedCount,
        'jobs_failed': device.failedCount,
    }));
  
    const sortedData = csvData.sort((a, b) => {
      return a.device_name.localeCompare(b.device_name);
    });
    
    if (formatType === 'csv') {
      const csv = Papa.unparse(sortedData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `scan-summary-${scanGroup?.scanId}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (formatType === 'pdf') {
      // PDF export logic will be added later.
      toast({
        title: "Coming Soon",
        description: "PDF export functionality is not yet available.",
      });
    }
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

  const renderDeviceListView = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg p-4 border-b">Scan Result Details</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4">
          <Card className="bg-transparent shadow-none border">
            <CardContent className="p-3">
              <div className="flex items-center justify-around text-center flex-wrap gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Scan ID</p>
                  <p className="font-semibold">{processedData?.scanId}</p>
                </div>
                {processedData?.timestamp && (
                   <div>
                      <p className="text-sm text-muted-foreground">Last run at</p>
                      <p className="font-semibold">{format(new Date(processedData.timestamp), "PPp")}</p>
                    </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Devices Run</p>
                  <Badge variant="secondary">{processedData?.stats?.run || 0}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Devices Passed</p>
                  <Badge className="bg-green-500 hover:bg-green-600">{processedData?.stats?.passed || 0}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Devices Failed</p>
                  <Badge variant="destructive">{processedData?.stats?.failed || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="px-4 pb-2 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                {selectedRows.length > 0 ? `Export (${selectedRows.length})` : 'Export All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport('pdf')} disabled>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                        <TableHead>Device Status</TableHead>
                        <TableHead>Compliance Status</TableHead>
                        <TableHead className="text-right">View</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRows.length > 0 ? (
                        paginatedRows.map((row) => {
                          const device = row.original;
                          const pingStatus = devicePingStatus.get(device.id) || { pingState: 'idle', reachability: 'Unreachable' };
                          
                          return (
                            <TableRow 
                              key={device.id} 
                              data-state={row.getIsSelected() && "selected"} 
                              className="group"
                            >
                              <TableCell>
                                  <Checkbox
                                    checked={row.getIsSelected()}
                                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                                    aria-label={`Select ${device.name}`}
                                  />
                              </TableCell>
                              <TableCell className="font-medium">
                                  {device.name}
                              </TableCell>
                              <TableCell
                                onMouseEnter={() => setHoveredPingWidgetId(device.id)}
                                onMouseLeave={() => setHoveredPingWidgetId(null)}
                              >
                                {hoveredPingWidgetId === device.id ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7"
                                      onClick={() => handlePingDevice(device.id)}
                                      disabled={pingStatus.pingState === 'pinging'}
                                    >
                                      {pingStatus.pingState === 'pinging' ? 'Pinging...' : 'Ping Device'}
                                    </Button>
                                  ) : (
                                    <Badge variant={pingStatus.reachability === 'Reachable' ? 'default' : 'secondary'} className={cn('transition-opacity', pingStatus.reachability === 'Reachable' && 'bg-green-500 hover:bg-green-600')}>
                                      {pingStatus.pingState === 'pinging' ? (
                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                      ) : pingStatus.reachability === 'Reachable' ? (
                                        <Wifi className="mr-2 h-3 w-3" />
                                      ) : (
                                        <WifiOff className="mr-2 h-3 w-3" />
                                      )}
                                      {pingStatus.pingState === 'pinging' ? 'Pinging...' : pingStatus.reachability}
                                    </Badge>
                                  )}
                              </TableCell>
                              <TableCell>
                                <Badge className={cn(getStatusBadgeClass(device.overallStatus))}>
                                  {device.overallStatus}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedDeviceForDetails(device)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
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
      </div>
    </>
  );
  
  const renderDeviceDetailView = () => {
    if (!selectedDeviceForDetails) return null;
    
    const pingStatus = devicePingStatus.get(selectedDeviceForDetails.id) || { pingState: 'idle', reachability: 'Unreachable' };

    return (
      <>
        <DialogHeader className="p-4 border-b flex flex-row items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedDeviceForDetails(null); setExpandedRows(new Set()); }}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-lg">Compliance Details</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-full overflow-hidden">
            <div className="px-4 py-3 border-b">
                 <Card className="bg-transparent shadow-none border">
                    <CardContent className="p-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Scan ID</p>
                                <p className="font-semibold">{processedData?.scanId}</p>
                            </div>
                            {processedData?.timestamp && (
                              <div>
                                  <p className="text-sm text-muted-foreground">Last run at</p>
                                  <p className="font-semibold">{format(new Date(processedData.timestamp), "PPp")}</p>
                              </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">Device Name</p>
                                <p className="font-semibold">{selectedDeviceForDetails.name}</p>
                            </div>
                            <div
                              onMouseEnter={() => setHoveredPingWidgetId(selectedDeviceForDetails.id)}
                              onMouseLeave={() => setHoveredPingWidgetId(null)}
                            >
                                <p className="text-sm text-muted-foreground">Device Status</p>
                                <div className="mt-1">
                                {hoveredPingWidgetId === selectedDeviceForDetails.id ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7"
                                    onClick={() => handlePingDevice(selectedDeviceForDetails.id)}
                                    disabled={pingStatus.pingState === 'pinging'}
                                  >
                                    {pingStatus.pingState === 'pinging' ? 'Pinging...' : 'Ping Device'}
                                  </Button>
                                ) : (
                                  <Badge variant={pingStatus.reachability === 'Reachable' ? 'default' : 'secondary'} className={cn('transition-opacity', pingStatus.reachability === 'Reachable' && 'bg-green-500 hover:bg-green-600')}>
                                    {pingStatus.pingState === 'pinging' ? (
                                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    ) : pingStatus.reachability === 'Reachable' ? (
                                      <Wifi className="mr-2 h-3 w-3" />
                                    ) : (
                                      <WifiOff className="mr-2 h-3 w-3" />
                                    )}
                                    {pingStatus.pingState === 'pinging' ? 'Pinging...' : pingStatus.reachability}
                                  </Badge>
                                )}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Compliance</p>
                                <Badge className={getStatusBadgeClass(selectedDeviceForDetails.overallStatus)}>
                                    {selectedDeviceForDetails.overallStatus}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Jobs Passed</p>
                                <Badge className="bg-green-500 hover:bg-green-600">{selectedDeviceForDetails.passedCount}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Jobs Failed</p>
                                <Badge variant="destructive">{selectedDeviceForDetails.failedCount}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0 px-4 py-4">
              <div className="flex-grow border rounded-lg overflow-hidden flex flex-col">
                <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Output</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDeviceForDetails.results.map(result => (
                        <TableRow 
                            key={result.id}
                            className={cn(
                                "align-top transition-all",
                                expandedRows.has(result.id) ? "h-64" : "h-16"
                            )}
                        >
                          <TableCell className="font-medium align-top pt-3">{result.jobName}</TableCell>
                          <TableCell className="align-top pt-3">
                            <Badge className={cn(getStatusBadgeClass(result.status))}>
                              {result.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="relative align-top p-4 pr-12">
                            <p
                                ref={el => outputRefs.current[result.id] = el}
                                className={cn(
                                  "overflow-hidden text-ellipsis",
                                  !expandedRows.has(result.id) && "whitespace-nowrap"
                                )}
                              >
                                {result.message}
                            </p>
                              <div className="absolute top-2 right-2 flex items-center gap-1">
                                {overflowingRows.has(result.id) && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6"
                                            onClick={() => toggleRowExpansion(result.id)}
                                          >
                                              <Maximize2 className="h-4 w-4" />
                                              <span className="sr-only">Expand Row</span>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Toggle Expansion</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                )}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6"
                                          onClick={() => handleCopyOutput(result.message)}
                                      >
                                          <Copy className="h-4 w-4" />
                                          <span className="sr-only">Copy Output</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Copy Output</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
        </div>
      </>
    );
  };
  
  if (!scanGroup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
       <DialogContent className={cn(
          "h-[80vh] flex flex-col p-0 transition-all duration-300",
          selectedDeviceForDetails ? "max-w-7xl w-[80vw]" : "max-w-6xl w-[75vw]"
        )}>
        {selectedDeviceForDetails ? renderDeviceDetailView() : renderDeviceListView()}
      </DialogContent>
    </Dialog>
  );
}
