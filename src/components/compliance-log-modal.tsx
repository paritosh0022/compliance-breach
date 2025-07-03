
"use client";

import React, { useMemo, useState } from 'react';
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
  
  const groupedLogs = useMemo(() => {
    const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return sortedLogs.flatMap(log => {
      const jobsInRun = log.results.reduce((acc, result) => {
        if (!acc[result.jobName]) {
          acc[result.jobName] = [];
        }
        acc[result.jobName].push(result);
        return acc;
      }, {} as Record<string, ComplianceRunResult[]>);

      return Object.entries(jobsInRun).map(([jobName, results]) => ({
        id: `${log.id}-${jobName}`,
        jobName,
        timestamp: log.timestamp,
        results,
      }));
    });
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return groupedLogs;
    const lowercasedFilter = searchTerm.toLowerCase();

    const filtered = groupedLogs.map(group => {
      const filteredResults = group.results.filter(result => 
        result.deviceName.toLowerCase().includes(lowercasedFilter) ||
        result.deviceIpAddress.toLowerCase().includes(lowercasedFilter)
      );
      
      if (group.jobName.toLowerCase().includes(lowercasedFilter)) {
        return group;
      }
      
      if (filteredResults.length > 0) {
        return { ...group, results: filteredResults };
      }
      
      return null;
    }).filter((g): g is NonNullable<typeof g> => g !== null);

    return filtered;
  }, [groupedLogs, searchTerm]);

  const getStatusVariant = (status: ComplianceRunResult['status']): 'default' | 'destructive' | 'secondary' => {
      switch (status) {
          case 'Success':
              return 'default';
          case 'Failed':
              return 'destructive';
          default:
              return 'secondary';
      }
  };
  
  const handleDownloadCsv = () => {
    const csvData = filteredLogs.flatMap(group => 
      group.results.map(result => ({
        job_name: group.jobName,
        device_name: result.deviceName,
        ip_address: result.deviceIpAddress,
        status: result.status,
        message: result.message,
        last_ran_at: format(new Date(group.timestamp), "yyyy-MM-dd HH:mm:ss")
      }))
    );

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
  
  const handleDownloadPdf = async () => {
    if (filteredLogs.length === 0) {
      toast({ variant: 'destructive', title: 'No data to download.' });
      return;
    }

    const { default: jsPDF } = await import('jspdf');
    // jspdf-autotable is a plugin and extends the jsPDF prototype.
    // We need to import it to have access to the `autoTable` method.
    await import('jspdf-autotable');

    // Cast to any to access the autoTable method dynamically added by the plugin.
    const doc = new jsPDF() as any;
    
    doc.text("Compliance Report", 14, 15);

    const head = [['Job Name', 'Device', 'IP Address', 'Last ran at', 'Status']];
    
    const body: any[][] = [];
    filteredLogs.forEach(group => {
      group.results.forEach((result, index) => {
        if (index === 0) {
          body.push([
            { content: group.jobName, rowSpan: group.results.length, styles: { valign: 'top' } },
            result.deviceName,
            result.deviceIpAddress,
            { content: format(new Date(group.timestamp), "yyyy-MM-dd HH:mm:ss"), rowSpan: group.results.length, styles: { valign: 'top' } },
            result.status
          ]);
        } else {
          body.push([
            result.deviceName,
            result.deviceIpAddress,
            result.status
          ]);
        }
      });
    });

    doc.autoTable({
      head: head,
      body: body,
      startY: 22,
    });

    doc.save('compliance_report.pdf');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Compliance Report</DialogTitle>
          <DialogDescription>
            History of all compliance checks, grouped by job.
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
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleDownloadCsv}>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
              </Button>
              <Button variant="outline" onClick={handleDownloadPdf}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
              </Button>
            </div>
        </div>
        <div className="flex-1 min-h-0 border rounded-lg">
          <ScrollArea className="h-full">
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Last ran at</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((group) => (
                      <React.Fragment key={group.id}>
                        {group.results.map((result, resultIndex) => (
                          <TableRow key={`${group.id}-${result.deviceId}`}>
                            {resultIndex === 0 && (
                                <TableCell rowSpan={group.results.length} className="font-medium align-top border-r">
                                    {group.jobName}
                                </TableCell>
                            )}
                            <TableCell className="align-top">{result.deviceName}</TableCell>
                            <TableCell className="align-top">{result.deviceIpAddress}</TableCell>
                             {resultIndex === 0 && (
                                <TableCell rowSpan={group.results.length} className="align-top">
                                    {format(new Date(group.timestamp), "yyyy-MM-dd HH:mm:ss")}
                                </TableCell>
                            )}
                            <TableCell className="align-top">
                              <Badge variant={getStatusVariant(result.status)}>{result.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
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
