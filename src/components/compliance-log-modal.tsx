
"use client";

import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ComplianceLog, ComplianceRunResult } from "@/lib/types";
import { format } from 'date-fns';
import { Download, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  logs: ComplianceLog[];
}

export default function ReportModal({ isOpen, onOpenChange, logs }: ReportModalProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  const flattenedLogs = useMemo(() => {
    return logs.flatMap(log => 
      log.results.map(result => ({ ...result, timestamp: log.timestamp }))
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return flattenedLogs;
    const lowercasedFilter = searchTerm.toLowerCase();
    return flattenedLogs.filter(log =>
      log.jobName.toLowerCase().includes(lowercasedFilter) ||
      log.deviceName.toLowerCase().includes(lowercasedFilter) ||
      log.deviceIpAddress.toLowerCase().includes(lowercasedFilter)
    );
  }, [flattenedLogs, searchTerm]);

  const getStatusVariant = (status: ComplianceRunResult['status']): 'default' | 'destructive' => {
    return status === 'Success' ? 'default' : 'destructive';
  };
  
  const handleDownload = () => {
    const csvData = filteredLogs.map(result => ({
      job_name: result.jobName,
      device_name: result.deviceName,
      ip_address: result.deviceIpAddress,
      status: result.status,
      message: result.message,
      timestamp: format(new Date(result.timestamp), "yyyy-MM-dd HH:mm:ss")
    }));

    if (csvData.length === 0) {
        toast({ variant: 'destructive', title: 'No data to download.' });
        return;
    }

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'compliance_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Compliance Reports</DialogTitle>
          <DialogDescription>
            History of all compliance checks.
          </DialogDescription>
        </DialogHeader>
         <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by job, device, or IP..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Report
            </Button>
        </div>
        <div className="flex-1 min-h-0 border rounded-lg">
          <ScrollArea className="h-full">
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Ran At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((result, index) => (
                      <TableRow key={`${result.deviceId}-${result.jobId}-${result.timestamp}-${index}`}>
                        <TableCell className="font-medium">{result.jobName}</TableCell>
                        <TableCell>{result.deviceName}</TableCell>
                        <TableCell>{result.deviceIpAddress}</TableCell>
                        <TableCell>{format(new Date(result.timestamp), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(result.status)}>{result.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No results found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
