
"use client";

import { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Download, Search, Eye, Trash2, Bot, Columns3 } from 'lucide-react';
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
import useLocalStorageState from '@/hooks/use-local-storage-state';
import { useDataTable } from '@/hooks/use-data-table';
import { DataTablePagination } from '@/components/data-table-pagination';
import RunComplianceModal from '@/components/run-compliance-modal';
import CompareScansModal from '@/components/compare-scans-modal';

export default function DashboardPage() {
    const { complianceLog, setComplianceLog, scheduledJobs, setScheduledJobs, isComplianceModalOpen, setIsComplianceModalOpen, getNextScanId } = useDashboard();
    const [devices] = useLocalStorageState('devices', []);
    const [jobs] = useLocalStorageState('jobs', []);
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("history");
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [selectedScanGroup, setSelectedScanGroup] = useState(null);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    
    const aggregatedLogs = useMemo(() => {
      if (!complianceLog) return [];
      
      const groupedByScan = complianceLog.reduce((acc, log) => {
        if (!acc[log.scanId]) {
          acc[log.scanId] = { ...log, originalResults: log.results };
        }
        return acc;
      }, {});

      return Object.values(groupedByScan)
        .map(scan => {
            const deviceResults = {};
            scan.originalResults.forEach(result => {
                if (!deviceResults[result.deviceId]) {
                    deviceResults[result.deviceId] = { isSuccess: true };
                }
                if (result.status === 'Failed') {
                    deviceResults[result.deviceId].isSuccess = false;
                }
            });

            const devicesRun = Object.keys(deviceResults).length;
            const devicesPassed = Object.values(deviceResults).filter(d => d.isSuccess).length;
            const devicesFailed = devicesRun - devicesPassed;
            
            return {
                ...scan,
                results: scan.originalResults, // Keep original for details modal
                stats: {
                    run: devicesRun,
                    passed: devicesPassed,
                    failed: devicesFailed
                }
            };
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    }, [complianceLog]);
  
    const filteredLogs = useMemo(() => {
      if (!searchTerm) return aggregatedLogs;
      const lowercasedFilter = searchTerm.toLowerCase();
  
      return aggregatedLogs.filter(log => 
        log.scanId.toLowerCase().includes(lowercasedFilter)
      );
  
    }, [aggregatedLogs, searchTerm]);

    const { table } = useDataTable({
      data: filteredLogs,
      columns: [], // Columns are defined directly in JSX
      pageCount: Math.ceil(filteredLogs.length / 10),
    });

    const paginatedRows = table.getRowModel().rows;
    const selectedScanIds = table.getSelectedRowModel().rows.map(row => row.original.id);
    const selectedScans = table.getSelectedRowModel().rows.map(row => row.original);

    const handleViewDetails = (group) => {
        if (!group.results || group.results.length === 0) return;
        setSelectedScanGroup(group);
        setIsDetailsModalOpen(true);
    };
  
    const handleDeleteSelected = () => {
      setItemToDelete({ type: 'log', ids: selectedScanIds });
      setIsConfirmDialogOpen(true);
    };

    const handleConfirmDelete = () => {
      if (!itemToDelete) return;

      if (itemToDelete.type === 'log') {
        setComplianceLog(prev => prev.filter(log => !itemToDelete.ids.includes(log.id)));
        table.resetRowSelection();
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

    const handleScheduleJob = (scheduleDetails, complianceRunConfig) => {
      const scanId = getNextScanId();
      const newScheduledJob = {
        id: crypto.randomUUID(),
        scanId,
        ...complianceRunConfig,
        ...scheduleDetails,
      };
      setScheduledJobs(prev => [...prev, newScheduledJob]);
      toast({
        title: "Job Scheduled",
        description: `The compliance check has been scheduled successfully with ${scanId}.`,
      });
      setIsComplianceModalOpen(false);
    };

    const handleExport = () => {
        const rowsToExport = table.getFilteredSelectedRowModel().rows;
        const dataToExport = (rowsToExport.length > 0 ? rowsToExport.map(r => r.original) : aggregatedLogs);

        if (dataToExport.length === 0) {
            toast({
            variant: "destructive",
            title: "No Data",
            description: "There is no scan history to export.",
            });
            return;
        }

        const csvData = dataToExport.map(log => ({
            'Scan ID': log.scanId,
            'Last Run at': format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
            'Devices Run Total': log.stats.run,
            'Devices Passed Total': log.stats.passed,
            'Devices Failed Total': log.stats.failed,
        }));
    
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'scan_history_summary.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold font-headline">Manage Job Compliance</h1>
                 <div className="flex items-center gap-2">
                    {activeTab === 'history' && (
                        <Button
                            variant="outline"
                            onClick={() => setIsCompareModalOpen(true)}
                            disabled={selectedScans.length < 2}
                        >
                            <Columns3 className="mr-2 h-4 w-4" />
                            Compare Scans {selectedScans.length > 0 ? `(${selectedScans.length})` : ''}
                        </Button>
                    )}
                    <Button onClick={() => setIsComplianceModalOpen(true)}>
                        <Bot className="mr-2 h-4 w-4" />
                        Run Compliance
                    </Button>
                </div>
            </div>
            
            <Tabs defaultValue="history" onValueChange={setActiveTab}>
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
                            placeholder="Search by Scan ID..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedScanIds.length > 0 && (
                          <Button
                            variant="destructive"
                            onClick={handleDeleteSelected}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedScanIds.length})
                          </Button>
                        )}
                        <Button variant="outline" onClick={handleExport}>
                          <Download className="mr-2 h-4 w-4" />
                           {selectedScanIds.length > 0 ? `Export (${selectedScanIds.length})` : 'Export All'}
                        </Button>
                    </div>
                </div>
                <div className="rounded-lg border">
                    <ScrollArea className="h-[60vh]">
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
                              <TableHead>Scan ID</TableHead>
                              <TableHead>Last ran at</TableHead>
                              <TableHead>Devices Run</TableHead>
                              <TableHead>Devices Passed</TableHead>
                              <TableHead>Devices Failed</TableHead>
                              <TableHead className="text-right">View</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedRows.length > 0 ? (
                              paginatedRows.map((row) => {
                                const group = row.original;
                                return (
                                  <TableRow key={group.id} data-state={row.getIsSelected() ? "selected" : ""}>
                                    <TableCell>
                                      <Checkbox
                                        checked={row.getIsSelected()}
                                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                                        aria-label="Select row"
                                      />
                                    </TableCell>
                                    <TableCell className="font-medium">{group.scanId}</TableCell>
                                    <TableCell>{format(new Date(group.timestamp), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                                    <TableCell><Badge variant="secondary">{group.stats.run}</Badge></TableCell>
                                    <TableCell><Badge className="bg-green-500 hover:bg-green-600">{group.stats.passed}</Badge></TableCell>
                                    <TableCell><Badge variant="destructive">{group.stats.failed}</Badge></TableCell>
                                    <TableCell className="text-right">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewDetails(group)}>
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
                                )
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                  No compliance history found.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
                <DataTablePagination table={table} />
              </TabsContent>
              <TabsContent value="scheduled">
                <ScheduledScansTable
                  scheduledJobs={scheduledJobs}
                  onDelete={handleDeleteScheduledJob}
                />
              </TabsContent>
            </Tabs>

            <RunComplianceModal
                isOpen={isComplianceModalOpen}
                devices={devices}
                jobs={jobs}
                initialSelectedDeviceIds={[]}
                initialSelectedJobIds={[]}
                onScheduleJob={handleScheduleJob}
            />
            <ScanResultDetailsModal 
              isOpen={isDetailsModalOpen}
              onOpenChange={setIsDetailsModalOpen}
              scanGroup={selectedScanGroup}
              jobs={jobs}
              devices={devices}
            />
            <CompareScansModal
                isOpen={isCompareModalOpen}
                onOpenChange={setIsCompareModalOpen}
                selectedScans={selectedScans}
                devices={devices}
                jobs={jobs}
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

    