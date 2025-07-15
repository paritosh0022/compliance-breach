
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
import { Search } from "lucide-react";

export default function ScanResultDetailsModal({ isOpen, onOpenChange, scanGroup }) {
  const [searchTerm, setSearchTerm] = useState("");

  const processedData = useMemo(() => {
    if (!scanGroup || !scanGroup.results) return null;

    const uniqueJobs = [...new Set(scanGroup.results.map(r => r.jobName))];
    const uniqueDevices = [...new Set(scanGroup.results.map(r => r.deviceName))];

    const statusMap = scanGroup.results.reduce((acc, result) => {
      const key = `${result.deviceName}-${result.jobName}`;
      acc[key] = result.status;
      return acc;
    }, {});

    return { uniqueJobs, uniqueDevices, statusMap };
  }, [scanGroup]);

  const filteredDevices = useMemo(() => {
    if (!processedData) return [];
    if (!searchTerm) return processedData.uniqueDevices;
    
    return processedData.uniqueDevices.filter(deviceName =>
      deviceName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedData, searchTerm]);

  if (!processedData || !scanGroup) return null;

  const { uniqueJobs, statusMap } = processedData;

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[90vw] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Scan Result Details: {scanGroup.scanId}</DialogTitle>
          <DialogDescription>
            Matrix view of job statuses across all devices for this scan.
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
                    <TableRow key={deviceName}>
                      <TableCell className="font-medium border-r">{deviceName}</TableCell>
                      {uniqueJobs.map(jobName => {
                        const status = statusMap[`${deviceName}-${jobName}`];
                        return (
                          <TableCell key={jobName}>
                            {status ? (
                              <Badge variant={getStatusVariant(status)}>{status}</Badge>
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
      </DialogContent>
    </Dialog>
  );
}
