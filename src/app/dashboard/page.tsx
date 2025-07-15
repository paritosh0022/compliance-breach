
"use client";

import { useState, useMemo } from 'react';
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
import { Download, Search, FileText, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReportModal from '@/components/compliance-log-modal';
import React from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ScheduledScansTable from '@/components/scheduled-scans-table';
import ScanResultDetailsModal from '@/components/scan-result-details-modal';

export default function DashboardPage() {
    const { complianceLog, setComplianceLog, scheduledJobs, setScheduledJobs } = useDashboard();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedScanResult, setSelectedScanResult] = useState(null);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [selectedScanIds, setSelectedScanIds] = useState([]);
    const [itemToDelete, setItemToDelete] = useState(null);
    
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
          logId: log.id,
          scanId: log.scanId,
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
        
        if (group.jobName.toLowerCase().includes(lowercasedFilter) || (group.scanId && group.scanId.toLowerCase().includes(lowercasedFilter))) {
          return group;
        }
        
        if (filteredResults.length > 0) {
          return { ...group, results: filteredResults };
        }
        
        return null;
      }).filter((g) => g !== null);
  
      return filtered;
    }, [groupedLogs, searchTerm]);

    const handleSelectAll = (checked) => {
      setSelectedScanIds(checked ? filteredLogs.map(log => log.id) : []);
    };
    
    const handleSelectRow = (id, checked) => {
      if (checked) {
        setSelectedScanIds([...selectedScanIds, id]);
      } else {
        setSelectedScanIds(selectedScanIds.filter(rowId => rowId !== id));
      }
    };

    const handleViewDetails = (result, group) => {
        setSelectedScanResult({
            ...result,
            scanId: group.scanId,
            jobName: group.jobName,
            timestamp: group.timestamp,
        });
        setIsDetailsModalOpen(true);
    };
  
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
          scan_id: group.scanId,
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
        head: [['Scan ID', 'Job Name', 'Device', 'IP Address', 'Last ran at', 'Status']],
        body: filteredLogs.flatMap(group => 
          group.results.map((result, index) => {
            if (index === 0) {
              return [
                { content: group.scanId, rowSpan: group.results.length, styles: { valign: 'top' } },
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
    
    const handleDeleteSelected = () => {
      setItemToDelete({ type: 'log', ids: selectedScanIds });
      setIsConfirmDialogOpen(true);
    };

    const handleConfirmDelete = () => {
      if (!itemToDelete) return;

      if (itemToDelete.type === 'log') {
        const logIdsToDelete = new Set(groupedLogs.filter(g => itemToDelete.ids.includes(g.id)).map(g => g.logId));
        setComplianceLog(prev => prev.filter(log => !logIdsToDelete.has(log.id)));
        setSelectedScanIds([]);
        toast({ title: 'Success', description: 'Selected log entries have been deleted.' });
      } else if (itemToDelete.type === 'schedule') {
        setScheduledJobs(prev => prev.filter(job => job.id !== itemToDelete.ids[0]));
        toast({ title: 'Success', description: 'Scheduled job has been deleted.' });
      }

      setIsConfirmDialogOpen(false);
      setItemToDelete(null);
    };

    const handleDeleteScheduledJob = (id) => {
      setItemToDelete({ type: 'schedule', ids: [id] });
      setIsConfirmDialogOpen(true);
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold font-headline">Manage Job Compliance</h1>
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
            
            <Tabs defaultValue="history">
              <TabsList>
                <TabsTrigger value="history">Scan History</TabsTrigger>
                <TabsTrigger value="scheduled">
                  Scheduled & Running 
                  {scheduledJobs.length > 0 && <Badge className="ml-2">{scheduledJobs.length}</Badge>}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="history">
                <div className="flex items-center justify-between gap-4 mb-4 mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by Scan ID, job, device, or IP..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {selectedScanIds.length > 0 && (
                      <Button
                        variant="destructive"
                        onClick={handleDeleteSelected}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete ({selectedScanIds.length})
                      </Button>
                    )}
                </div>
                <div className="rounded-lg border">
                    <ScrollArea className="h-[60vh]">
                       <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[40px]">
                                <Checkbox
                                  checked={filteredLogs.length > 0 && selectedScanIds.length === filteredLogs.length}
                                  onCheckedChange={handleSelectAll}
                                  disabled={filteredLogs.length === 0}
                                />
                              </TableHead>
                              <TableHead>Scan ID</TableHead>
                              <TableHead>Last ran at</TableHead>
                              <TableHead>Job Name</TableHead>
                              <TableHead>Device</TableHead>
                              <TableHead>IP Address</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredLogs.length > 0 ? (
                              filteredLogs.map((group) => (
                                <React.Fragment key={group.id}>
                                  {group.results.map((result, resultIndex) => (
                                    <TableRow key={`${group.id}-${result.deviceId}`} data-state={selectedScanIds.includes(group.id) ? "selected" : ""}>
                                      {resultIndex === 0 && (
                                          <TableCell rowSpan={group.results.length} className="font-medium align-top border-r">
                                              <Checkbox
                                                checked={selectedScanIds.includes(group.id)}
                                                onCheckedChange={(checked) => handleSelectRow(group.id, !!checked)}
                                              />
                                          </TableCell>
                                      )}
                                      {resultIndex === 0 && (
                                          <TableCell rowSpan={group.results.length} className="font-medium align-top">
                                              {group.scanId}
                                          </TableCell>
                                      )}
                                      {resultIndex === 0 && (
                                          <TableCell rowSpan={group.results.length} className="align-top border-r">
                                              {format(new Date(group.timestamp), "yyyy-MM-dd HH:mm:ss")}
                                          </TableCell>
                                      )}
                                      {resultIndex === 0 && (
                                          <TableCell rowSpan={group.results.length} className="font-medium align-top border-r">
                                              {group.jobName}
                                          </TableCell>
                                      )}
                                      <TableCell className="align-top">{result.deviceName}</TableCell>
                                      <TableCell className="align-top">{result.deviceIpAddress}</TableCell>
                                      <TableCell className="align-top">
                                        <Badge variant={getStatusVariant(result.status)}>{result.status}</Badge>
                                      </TableCell>
                                      <TableCell className="align-top text-right">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                               <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewDetails(result, group)}>
                                                <Eye className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>View Details</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </React.Fragment>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                  No compliance history found.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
              </TabsContent>
              <TabsContent value="scheduled">
                <ScheduledScansTable
                  scheduledJobs={scheduledJobs}
                  onDelete={handleDeleteScheduledJob}
                />
              </TabsContent>
            </Tabs>

            <ReportModal 
              isOpen={isReportModalOpen}
              onOpenChange={setIsReportModalOpen}
              logs={complianceLog}
            />
            <ScanResultDetailsModal 
              isOpen={isDetailsModalOpen}
              onOpenChange={setIsDetailsModalOpen}
              scanResult={selectedScanResult}
            />
            <ConfirmDeleteDialog
                isOpen={isConfirmDialogOpen}
                onOpenChange={setIsConfirmDialogOpen}
                onConfirm={handleConfirmDelete}
                itemType={itemToDelete?.type}
                itemCount={itemToDelete?.ids.length}
            />
        </>
    );
}
