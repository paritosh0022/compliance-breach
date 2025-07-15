
"use client";

import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Download, Search, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useLocalStorageState from '@/hooks/use-local-storage-state';
import ReportModal from '@/components/compliance-log-modal';
import React from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

export default function DashboardPage() {
    const { complianceLog } = useDashboard();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    
    const groupedLogs = useMemo(() => {
      if (!complianceLog) return [];
      const sortedLogs = [...complianceLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
      return sortedLogs.flatMap(log => {
        if (!log || !log.results) {
          return [];
        }
  
        const jobsInRun = log.results.reduce((acc, result) => {
          if (!acc[result.jobName]) {
            acc[result.jobName] = [];
          }
          acc[result.jobName].push(result);
          return acc;
        }, {});
  
        return Object.entries(jobsInRun).map(([jobName, results]) => ({
          id: `${log.id}-${jobName}`,
          jobName,
          timestamp: log.timestamp,
          results,
        }));
      });
    }, [complianceLog]);
  
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
      }).filter((g) => g !== null);
  
      return filtered;
    }, [groupedLogs, searchTerm]);
  
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
      const { default: autoTable } = await import('jspdf-autotable');
  
      const doc = new jsPDF();
      
      doc.text("Compliance Report", 14, 15);
  
      autoTable(doc, {
        head: [['Job Name', 'Device', 'IP Address', 'Last ran at', 'Status']],
        body: filteredLogs.flatMap(group => 
          group.results.map((result, index) => {
            if (index === 0) {
              return [
                { content: group.jobName, rowSpan: group.results.length, styles: { valign: 'top' } },
                result.deviceName,
                result.deviceIpAddress,
                { content: format(new Date(group.timestamp), "yyyy-MM-dd HH:mm:ss"), rowSpan: group.results.length, styles: { valign: 'top' } },
                result.status
              ];
            }
            return [
              result.deviceName,
              result.deviceIpAddress,
              result.status
            ];
          })
        ),
        startY: 22,
      });
  
      doc.save('compliance_report.pdf');
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold font-headline">Manage Job Compliance</h1>
            </div>
            <div className="flex items-center justify-between gap-4 mb-4">
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={handleDownloadCsv}>
                          Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={handleDownloadPdf}>
                          Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
            </div>
            <div className="rounded-lg border">
                <ScrollArea className="h-[60vh]">
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
                              No compliance history found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                </ScrollArea>
            </div>
            <ReportModal 
              isOpen={isReportModalOpen}
              onOpenChange={setIsReportModalOpen}
              logs={complianceLog}
            />
        </>
    );
}
