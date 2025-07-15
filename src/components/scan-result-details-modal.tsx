
"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export default function ScanResultDetailsModal({ isOpen, onOpenChange, scanGroup }) {
  const { toast } = useToast();

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

  if (!processedData) return null;

  const { uniqueJobs, uniqueDevices, statusMap } = processedData;

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

  const handleDownload = () => {
    const tableData = [];
    const headers = ['Device Name', ...uniqueJobs];
    tableData.push(headers);

    uniqueDevices.forEach(deviceName => {
      const row = [deviceName];
      uniqueJobs.forEach(jobName => {
        const key = `${deviceName}-${jobName}`;
        row.push(statusMap[key] || 'N/A');
      });
      tableData.push(row);
    });

    const csv = Papa.unparse(tableData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `scan_details_${scanGroup.scanId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Success", description: "Scan details downloaded as CSV." });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[90vw] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex justify-between items-center w-full pr-8">
            <div>
              <DialogTitle>Scan Result Details: {scanGroup.scanId}</DialogTitle>
              <DialogDescription>
                Matrix view of job statuses across all devices for this scan.
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Report
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Device Name</TableHead>
                  {uniqueJobs.map(jobName => (
                    <TableHead key={jobName}>{jobName}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniqueDevices.map(deviceName => (
                  <TableRow key={deviceName}>
                    <TableCell className="font-medium">{deviceName}</TableCell>
                    {uniqueJobs.map(jobName => {
                      const key = `${deviceName}-${jobName}`;
                      const status = statusMap[key] || 'N/A';
                      return (
                        <TableCell key={`${deviceName}-${jobName}`}>
                          <Badge variant={getStatusVariant(status)}>{status}</Badge>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
