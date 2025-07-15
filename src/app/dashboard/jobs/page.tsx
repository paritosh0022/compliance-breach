
"use client";

import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Trash2, Bot, Download, Loader2, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import JobTable from '@/components/job-table';
import AddJobModal from '@/components/add-job-modal';
import AddJobDetailsModal from '@/components/add-job-details-modal';
import RunComplianceModal from '@/components/run-compliance-modal';
import ReportModal from '@/components/compliance-log-modal';
import { useToast } from '@/hooks/use-toast';
import useLocalStorageState from '@/hooks/use-local-storage-state';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { useDashboard } from '@/contexts/DashboardContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDataTable } from '@/hooks/use-data-table';
import { DataTablePagination } from '@/components/data-table-pagination';

export default function JobsPage() {
  const {
    isComplianceModalOpen,
    setIsComplianceModalOpen,
    isComplianceRunning,
    complianceLog,
    getNextScanId,
  } = useDashboard();
    
  const [isClient, setIsClient] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isJobDetailsModalOpen, setIsJobDetailsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const [devices, setDevices] = useLocalStorageState('devices', []);
  const [jobs, setJobs] = useLocalStorageState('jobs', []);
  const [scheduledJobs, setScheduledJobs] = useLocalStorageState('scheduledJobs', []);

  const [jobToEdit, setJobToEdit] = useState(null);
  const [currentJobDetails, setCurrentJobDetails] = useState();
  const [initialModalSelections, setInitialModalSelections] = useState({});
  const [itemToDelete, setItemToDelete] = useState(null);
  const [jobSearchTerm, setJobSearchTerm] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredJobs = useMemo(() => jobs.filter(job => {
    const searchTermLower = jobSearchTerm.toLowerCase();
    return (
      job.name.toLowerCase().includes(searchTermLower) ||
      (job.description && job.description.toLowerCase().includes(searchTermLower))
    );
  }), [jobs, jobSearchTerm]);

  const { table } = useDataTable({
    data: filteredJobs,
    columns: [], // Columns are defined directly in JobTable
    pageCount: Math.ceil(filteredJobs.length / 10),
  });

  const paginatedRows = table.getRowModel().rows;
  const selectedJobIds = table.getSelectedRowModel().rows.map(row => row.original.id);
  
  const handleRunCompliance = (selections) => {
    setInitialModalSelections(selections);
    setIsComplianceModalOpen(true);
  };
  
  const handleJobDetailsContinue = (data) => {
    if (jobToEdit) {
      setCurrentJobDetails({
        name: data.name,
        description: data.description,
        command: jobToEdit.command,
        template: jobToEdit.template
      });
    } else {
      setCurrentJobDetails(data);
    }
    setIsJobDetailsModalOpen(false);
    setIsJobModalOpen(true);
  };

  const handleSaveJobDetails = (data, id) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...data } : j));
    setIsJobDetailsModalOpen(false);
    setJobToEdit(null);
    toast({ title: "Success", description: "Job details updated." });
  };
  
  const handleAddJob = (jobData) => {
    if (!currentJobDetails) return;
    
    if (jobToEdit) {
      const updatedJob = {
        ...jobToEdit,
        name: currentJobDetails.name,
        description: currentJobDetails.description,
        command: jobData.command,
        template: jobData.template,
      };
      setJobs(prev => prev.map(j => j.id === jobToEdit.id ? updatedJob : j));
      toast({ title: "Success", description: "Job updated successfully." });
      setJobToEdit(null);
    } else {
      const newJob = { 
          ...currentJobDetails,
          ...jobData,
          id: crypto.randomUUID() 
      };
      setJobs((prev) => [...prev, newJob]);
      toast({ title: "Success", description: "Job added successfully." });
    }

    setIsJobModalOpen(false);
    setCurrentJobDetails(undefined);
  };
  
  const handleEditJobClick = (id) => {
    const job = jobs.find(j => j.id === id);
    if (job) {
      setJobToEdit(job);
      setIsJobDetailsModalOpen(true);
    }
  };

  const handleDeleteJob = (id) => {
    setItemToDelete({ ids: [id], type: 'job' });
    setIsConfirmDialogOpen(true);
  };
  
  const handleDeleteSelectedJobs = () => {
    if (selectedJobIds.length === 0) return;
    setItemToDelete({ ids: selectedJobIds, type: 'job' });
    setIsConfirmDialogOpen(true);
  }

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'job') {
        setJobs(prev => prev.filter(job => !itemToDelete.ids.includes(job.id)));
        table.resetRowSelection();
    }

    setIsConfirmDialogOpen(false);
    toast({ title: "Success", description: `The selected ${itemToDelete.type}(s) have been deleted.` });
    setItemToDelete(null);
  };

  const downloadCsv = (data, filename) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSelectedJobs = () => {
    if (selectedJobIds.length === 0) return;
    const jobsToExport = jobs
      .filter(j => selectedJobIds.includes(j.id))
      .map(j => ({
        name: j.name,
        description: j.description || '',
        command: j.command || '',
        template: j.template || '',
      }));
    downloadCsv(jobsToExport, 'selected-jobs.csv');
  };

  const handleExportAllJobs = () => {
    if (jobs.length === 0) {
        toast({
            variant: "destructive",
            title: "No Jobs",
            description: "There are no jobs to export.",
        });
        return;
    }
    const jobsToExport = jobs
      .map(j => ({
        name: j.name,
        description: j.description || '',
        command: j.command || '',
        template: j.template || '',
      }));
    downloadCsv(jobsToExport, 'all-jobs.csv');
  };

  const handleExportJob = (id) => {
    const jobToExport = jobs
      .filter(j => j.id === id)
      .map(j => ({
        name: j.name,
        description: j.description || '',
        command: j.command || '',
        template: j.template || '',
      }));
    if (jobToExport.length > 0) {
      const jobName = jobToExport[0].name.replace(/ /g, '_');
      downloadCsv(jobToExport, `${jobName}-job.csv`);
    }
  };

  const handleAddJobClick = () => {
    setJobToEdit(null);
    setIsJobDetailsModalOpen(true);
  }

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

  if (!isClient) {
    return (
      <div className="flex h-full w-full items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold font-headline">Manage Jobs</h1>
        <div className="flex items-center gap-2">
            <Button onClick={handleAddJobClick}>
                <PlusCircle className="mr-2" />
                Add Job
            </Button>
        </div>
      </div>

       <div className="mt-6">
           <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                className="pl-9"
                value={jobSearchTerm}
                onChange={(e) => setJobSearchTerm(e.target.value)}
              />
            </div>
             <div className="flex items-center gap-2">
              {selectedJobIds.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button onClick={() => handleRunCompliance({ jobs: selectedJobIds })} disabled={isComplianceRunning}>
                          <Bot className="mr-2" />
                          Run Compliance ({selectedJobIds.length})
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {isComplianceRunning && <TooltipContent><p>Compliance is running</p></TooltipContent>}
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button variant="destructive" onClick={handleDeleteSelectedJobs} disabled={isComplianceRunning}>
                          <Trash2 className="mr-2" />
                          Delete ({selectedJobIds.length})
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {isComplianceRunning && <TooltipContent><p>Compliance is running</p></TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              )}
               <Button variant="outline" onClick={() => selectedJobIds.length > 0 ? handleExportSelectedJobs() : handleExportAllJobs()}>
                <Download className="mr-2 h-4 w-4" />
                {selectedJobIds.length > 0 ? `Export (${selectedJobIds.length})` : 'Export All'}
              </Button>
            </div>
          </div>
           <JobTable 
              rows={paginatedRows} 
              table={table}
              onDelete={handleDeleteJob} 
              onEdit={handleEditJobClick}
              onRunCompliance={(jobId) => handleRunCompliance({ jobs: [jobId] })}
              onExport={handleExportJob}
              isComplianceRunning={isComplianceRunning}
            />
            <DataTablePagination table={table} />
        </div>
      
      <AddJobDetailsModal
        isOpen={isJobDetailsModalOpen}
        onOpenChange={setIsJobDetailsModalOpen}
        onContinue={handleJobDetailsContinue}
        onSave={handleSaveJobDetails}
        jobToEdit={jobToEdit}
      />
      
      <AddJobModal
        isOpen={isJobModalOpen} 
        onOpenChange={setIsJobModalOpen}
        onAddJob={handleAddJob}
        jobDetails={currentJobDetails}
      />

      <RunComplianceModal
        isOpen={isComplianceModalOpen}
        devices={devices}
        jobs={jobs}
        initialSelectedDeviceIds={initialModalSelections.devices}
        initialSelectedJobIds={initialModalSelections.jobs}
        onScheduleJob={handleScheduleJob}
      />

      <ReportModal 
        isOpen={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        logs={complianceLog}
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
