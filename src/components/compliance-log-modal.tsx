
"use client";

import { useMemo } from 'react';
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from "@/components/ui/badge";
import type { ComplianceLog, ComplianceRunResult } from "@/lib/types";
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  logs: ComplianceLog[];
}

type GroupedReport = {
    [jobName: string]: (ComplianceRunResult & { timestamp: string })[];
}

export default function ReportModal({ isOpen, onOpenChange, logs }: ReportModalProps) {
  const { toast } = useToast();
  
  const reportsByJob = useMemo(() => {
    const allResultsWithTimestamp = logs.flatMap(log => 
      log.results.map(result => ({ ...result, timestamp: log.timestamp }))
    );

    return allResultsWithTimestamp.reduce<GroupedReport>((acc, result) => {
        const { jobName } = result;
        if (!acc[jobName]) {
            acc[jobName] = [];
        }
        acc[jobName].push(result);
        return acc;
    }, {});
  }, [logs]);

  const getStatusVariant = (status: ComplianceRunResult['status']): 'default' | 'destructive' => {
    return status === 'Success' ? 'default' : 'destructive';
  };
  
  const handleDownload = () => {
    const allResultsForCsv = logs.flatMap(log => 
        log.results.map(result => ({ 
            job_name: result.jobName,
            device_name: result.deviceName,
            ip_address: result.deviceIpAddress,
            status: result.status,
            message: result.message,
            timestamp: format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")
        }))
    );

    if (allResultsForCsv.length === 0) {
        toast({ variant: 'destructive', title: 'No data to download.' });
        return;
    }

    const csv = Papa.unparse(allResultsForCsv);
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
            History of all compliance checks, grouped by job.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 border rounded-lg">
          <ScrollArea className="h-full">
            <Accordion type="multiple" className="w-full">
              {Object.keys(reportsByJob).length > 0 ? (
                Object.entries(reportsByJob).map(([jobName, results]) => (
                  <AccordionItem value={jobName} key={jobName}>
                    <AccordionTrigger className="px-4 hover:no-underline bg-muted/50">
                      <div className='flex justify-between w-full pr-4'>
                        <span className="font-semibold">{jobName}</span>
                        <Badge variant="secondary">{results.length} runs</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Device</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Ran At</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {results.map((result, index) => (
                            <TableRow key={`${result.deviceId}-${result.jobId}-${index}`}>
                              <TableCell className="font-medium">{result.deviceName}</TableCell>
                              <TableCell>{result.deviceIpAddress}</TableCell>
                              <TableCell>{format(new Date(result.timestamp), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                              <TableCell>
                                <Badge variant={getStatusVariant(result.status)}>{result.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                ))
              ) : (
                 <div className="text-center text-sm text-muted-foreground p-8">No reports found.</div>
              )}
            </Accordion>
          </ScrollArea>
        </div>
        <DialogFooter className='!justify-between'>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
