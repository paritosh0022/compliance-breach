
"use client";

import { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Download, Search, Eye, Trash2, Bot, Columns3, Edit, FileDown } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function DashboardPage() {
    const { complianceLog, setComplianceLog, scheduledJobs, setScheduledJobs, isComplianceModalOpen, setIsComplianceModalOpen } = useDashboard();
    const [devices] = useLocalStorageState('devices', []);
    const [jobs] = useLocalStorageState('jobs', []);
    const { toast } = useToast();
    const [historySearchTerm, setHistorySearchTerm] = useState("");
    const [scheduledSearchTerm, setScheduledSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("history");
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [selectedScanGroup, setSelectedScanGroup] = useState(null);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [jobToEdit, setJobToEdit] = useState(null);
    const [initialSelectedDevice, setInitialSelectedDevice] = useState(null);
    
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
      if (!historySearchTerm) return aggregatedLogs;
      const lowercasedFilter = historySearchTerm.toLowerCase();
  
      return aggregatedLogs.filter(log => 
        log.scanId.toLowerCase().includes(lowercasedFilter)
      );
  
    }, [aggregatedLogs, historySearchTerm]);

    const filteredScheduledJobs = useMemo(() => {
      if (!scheduledSearchTerm) return scheduledJobs;
      const lowercasedFilter = scheduledSearchTerm.toLowerCase();
      return scheduledJobs.filter(job => job.scanId.toLowerCase().includes(lowercasedFilter));
    }, [scheduledJobs, scheduledSearchTerm]);

    const historyTable = useDataTable({
      data: filteredLogs,
      columns: [], // Columns are defined directly in JSX
      pageCount: Math.ceil(filteredLogs.length / 10),
    });

    const scheduledTable = useDataTable({
      data: filteredScheduledJobs,
      columns: [], // Columns are defined in component
      pageCount: Math.ceil(filteredScheduledJobs.length / 10),
    });

    const paginatedHistoryRows = historyTable.table.getRowModel().rows;
    const selectedHistoryScanIds = historyTable.table.getSelectedRowModel().rows.map(row => row.original.id);
    const selectedHistoryScans = historyTable.table.getSelectedRowModel().rows.map(row => row.original);
    
    const selectedScheduledJobIds = scheduledTable.table.getSelectedRowModel().rows.map(row => row.original.id);

    const handleViewDetails = (group) => {
        if (!group.results || group.results.length === 0) return;
        setInitialSelectedDevice(null);
        setSelectedScanGroup(group);
        setIsDetailsModalOpen(true);
    };

    const handleViewScanDetails = (scan, device) => {
        setInitialSelectedDevice(device);
        setSelectedScanGroup(scan);
        setIsCompareModalOpen(false);
        setIsDetailsModalOpen(true);
    };
  
    const handleDeleteSelected = () => {
      if (activeTab === 'history') {
        setItemToDelete({ type: 'log', ids: selectedHistoryScanIds, onConfirm: () => {
          setComplianceLog(prev => prev.filter(log => !selectedHistoryScanIds.includes(log.id)));
          historyTable.table.resetRowSelection();
        }});
      } else {
        setItemToDelete({ type: 'schedule', ids: selectedScheduledJobIds, onConfirm: () => {
          setScheduledJobs(prev => prev.filter(job => !selectedScheduledJobIds.includes(job.id)));
          scheduledTable.table.resetRowSelection();
        }});
      }
      setIsConfirmDialogOpen(true);
    };

    const handleConfirmDelete = () => {
      if (!itemToDelete || !itemToDelete.onConfirm) return;
      itemToDelete.onConfirm();
      toast({ title: 'Success', description: `Selected ${itemToDelete.type}(s) have been deleted.` });
      setIsConfirmDialogOpen(false);
      setItemToDelete(null);
    };

    const handleDeleteScheduledJob = (id) => {
      setItemToDelete({ type: 'schedule', ids: [id], onConfirm: () => {
        setScheduledJobs(prev => prev.filter(job => job.id !== id));
      }});
      setIsConfirmDialogOpen(true);
    };

    const handleEditScheduledJob = (job) => {
        setJobToEdit(job);
        setIsComplianceModalOpen(true);
    };

    const handleScheduleJob = (scheduleDetails, complianceRunConfig, editingId) => {
      if (editingId) {
        setScheduledJobs(prev => prev.map(job =>
            job.id === editingId
                ? { ...job, ...complianceRunConfig, ...scheduleDetails }
                : job
        ));
        toast({ title: "Job Updated", description: "The scheduled job has been updated successfully."});
      } else {
        const newScheduledJob = {
          id: crypto.randomUUID(),
          scanId: 'Scheduled', // Placeholder ID
          ...complianceRunConfig,
          ...scheduleDetails,
        };
        setScheduledJobs(prev => [...prev, newScheduledJob]);
        toast({
          title: "Job Scheduled",
          description: `The compliance check has been scheduled successfully.`,
        });
      }
      setIsComplianceModalOpen(false);
      setJobToEdit(null);
    };

    const handleExport = async (formatType) => {
        const rowsToExport = historyTable.table.getFilteredSelectedRowModel().rows;
        const dataToExport = (rowsToExport.length > 0 ? rowsToExport.map(r => r.original) : aggregatedLogs);

        if (dataToExport.length === 0) {
            toast({
            variant: "destructive",
            title: "No Data",
            description: "There is no scan history to export.",
            });
            return;
        }

        if (formatType === 'csv') {
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
        } else if (formatType === 'pdf') {
            const { default: jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF();
            
            doc.text("Scan History Report", 14, 15);
        
            autoTable(doc, {
              head: [['Scan ID', 'Last Run at', 'Run', 'Passed', 'Failed']],
              body: dataToExport.map(log => [
                    log.scanId,
                    format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
                    log.stats.run,
                    log.stats.passed,
                    log.stats.failed
                ]),
              startY: 22,
            });
        
            doc.save('scan_history_summary.pdf');
        }
    };
    
    const handleOpenComplianceModal = () => {
        setJobToEdit(null);
        setIsComplianceModalOpen(true);
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold font-headline">Compliance Report</h1>
                 <div className="flex items-center gap-2">
                    {activeTab === 'history' && (
                        <Button
                            variant="outline"
                            onClick={() => setIsCompareModalOpen(true)}
                            disabled={selectedHistoryScans.length < 2}
                        >
                            <Columns3 className="mr-2 h-4 w-4" />
                            Compare Scans ({selectedHistoryScans.length})
                        </Button>
                    )}
                    <Button onClick={handleOpenComplianceModal}>
                        <Bot className="mr-2 h-4 w-4" />
                        Run Compliance
                    </Button>
                </div>
            </div>
            
            <Tabs defaultValue="history" onValueChange={(value) => { setActiveTab(value); historyTable.table.resetRowSelection(); scheduledTable.table.resetRowSelection(); }}>
              <TabsList>
                <TabsTrigger value="history">Scan History</TabsTrigger>
                <TabsTrigger value="scheduled">
                  Scheduled Scans
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
                            value={historySearchTerm}
                            onChange={(e) => setHistorySearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedHistoryScanIds.length > 0 && (
                          <Button
                            variant="destructive"
                            onClick={handleDeleteSelected}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedHistoryScanIds.length})
                          </Button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <FileDown className="mr-2 h-4 w-4" />
                                    {selectedHistoryScanIds.length > 0 ? `Export (${selectedHistoryScanIds.length})` : 'Export All'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleExport('pdf')}>Export as PDF</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <div className="rounded-lg border">
                    <ScrollArea className="h-[60vh]">
                       <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[40px]">
                                <Checkbox
                                  checked={historyTable.table.getIsAllPageRowsSelected()}
                                  onCheckedChange={(value) => historyTable.table.toggleAllPageRowsSelected(!!value)}
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
                            {paginatedHistoryRows.length > 0 ? (
                              paginatedHistoryRows.map((row) => {
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
                <DataTablePagination table={historyTable.table} />
              </TabsContent>
              <TabsContent value="scheduled">
                 <div className="flex items-center justify-between gap-4 mb-4 mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by Scan ID..."
                            className="pl-9"
                            value={scheduledSearchTerm}
                            onChange={(e) => setScheduledSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedScheduledJobIds.length > 0 && (
                          <Button
                            variant="destructive"
                            onClick={handleDeleteSelected}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete ({selectedScheduledJobIds.length})
                          </Button>
                        )}
                    </div>
                </div>
                <ScheduledScansTable
                  table={scheduledTable.table}
                  onDelete={handleDeleteScheduledJob}
                  onEdit={handleEditScheduledJob}
                />
                <DataTablePagination table={scheduledTable.table} />
              </TabsContent>
            </Tabs>

            <RunComplianceModal
                isOpen={isComplianceModalOpen}
                devices={devices}
                jobs={jobs}
                onScheduleJob={handleScheduleJob}
                jobToEdit={jobToEdit}
            />
            <ScanResultDetailsModal 
              isOpen={isDetailsModalOpen}
              onOpenChange={setIsDetailsModalOpen}
              scanGroup={selectedScanGroup}
              initialSelectedDevice={initialSelectedDevice}
              jobs={jobs}
              devices={devices}
            />
            <CompareScansModal
                isOpen={isCompareModalOpen}
                onOpenChange={setIsCompareModalOpen}
                selectedScans={selectedHistoryScans}
                devices={devices}
                jobs={jobs}
                onViewDetails={handleViewScanDetails}
            />
            <ConfirmDeleteDialog
                isOpen={isConfirmDialogOpen}
                onOpenChange={setIsConfirmDialogOpen}
                onConfirm={handleConfirmDelete}
                itemType={itemToDelete?.type}
                itemCount={itemToDelete?.ids?.length}
            />
        </>
    );
}

    