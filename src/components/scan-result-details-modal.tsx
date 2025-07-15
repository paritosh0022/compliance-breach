
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
import { Search, X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Checkbox } from "./ui/checkbox";

export default function ScanResultDetailsModal({ isOpen, onOpenChange, scanGroup }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeviceNames, setSelectedDeviceNames] = useState([]);
  const [selectedResultForOutput, setSelectedResultForOutput] = useState(null);

  const processedData = useMemo(() => {
    if (!scanGroup || !scanGroup.results) return null;

    const uniqueJobs = [...new Set(scanGroup.results.map(r => r.jobName))];
    const uniqueDevices = [...new Set(scanGroup.results.map(r => r.deviceName))];

    const resultsMap = scanGroup.results.reduce((acc, result) => {
      const key = `${result.deviceName}-${result.jobName}`;
      acc[key] = { status: result.status, message: result.message };
      return acc;
    }, {});

    return { uniqueJobs, uniqueDevices, resultsMap };
  }, [scanGroup]);

  const filteredDevices = useMemo(() => {
    if (!processedData) return [];
    if (!searchTerm) return processedData.uniqueDevices;
    
    return processedData.uniqueDevices.filter(deviceName =>
      deviceName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedData, searchTerm]);

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
    setSelectedDeviceNames(checked ? filteredDevices : []);
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
      setSelectedResultForOutput({
        deviceName,
        jobName,
        ...result,
      });
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
          "flex-1 grid min-h-0 transition-all duration-300 ease-in-out",
          selectedResultForOutput ? "grid-cols-[2fr_1fr]" : "grid-cols-1"
        )}>
          <div className="flex-1 min-h-0 px-4 pb-4">
            <ScrollArea className="h-full border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[200px] border-r"></TableHead>
                    <TableHead colSpan={uniqueJobs.length} className="text-center border-b">Job Name</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="w-[200px] border-r">Device Name</TableHead>
                    {uniqueJobs.map(jobName => (
                      <TableHead key={jobName}>{jobName}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.length > 0 ? (
                    filteredDevices.map(deviceName => (
                      <TableRow key={deviceName} data-state={selectedResultForOutput?.deviceName === deviceName ? "selected" : ""}>
                        <TableCell className="font-medium border-r">
                           <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedDeviceNames.includes(deviceName)}
                              onCheckedChange={(checked) => handleSelectRow(deviceName, !!checked)}
                            />
                            <span>{deviceName}</span>
                          </div>
                        </TableCell>
                        {uniqueJobs.map(jobName => {
                          const result = resultsMap[`${deviceName}-${jobName}`];
                          const status = result?.status;
                          const isSelected = selectedResultForOutput?.deviceName === deviceName && selectedResultForOutput?.jobName === jobName;
                          return (
                            <TableCell key={jobName}>
                              {status ? (
                                <Badge
                                  variant={getStatusVariant(status)}
                                  className={cn("cursor-pointer", isSelected && "ring-2 ring-offset-2 ring-primary ring-offset-background")}
                                  onClick={() => handleBadgeClick(deviceName, jobName)}
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
          {selectedResultForOutput && (
            <div className="flex flex-col border-l bg-muted/30 min-h-0 pr-4 pb-4">
              <div className="p-4 border-b flex items-center justify-between">
                 <h3 className="font-semibold text-base truncate">Output</h3>
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedResultForOutput(null)}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close Output</span>
                 </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                 <pre className="whitespace-pre-wrap text-sm font-mono">
                  {selectedResultForOutput.message}
                 </pre>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
