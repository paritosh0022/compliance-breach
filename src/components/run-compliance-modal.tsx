
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Play, Copy, Download, Eye, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";

export default function RunComplianceModal({ devices, jobs, initialSelectedDeviceIds, initialSelectedJobIds }) {
  const {
    isComplianceModalOpen,
    setIsComplianceModalOpen,
    isComplianceRunning,
    setIsComplianceRunning,
    setComplianceStatus,
    onRunComplete,
    complianceRunProcess,
    setComplianceRunProcess
  } = useDashboard();

  const [selectedDevices, setSelectedDevices] = useState([]);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [deviceSearchTerm, setDeviceSearchTerm] = useState("");
  const [jobSearchTerm, setJobSearchTerm] = useState("");
  const [output, setOutput] = useState("");
  const [viewedJob, setViewedJob] = useState(null);
  const [viewedDevice, setViewedDevice] = useState(null);
  
  const { toast } = useToast();
  
  // Use a ref to track if an abort was requested to prevent closing toast
  const abortRequested = useRef(false);

  useEffect(() => {
    if (isComplianceModalOpen) {
      abortRequested.current = false;
      if (initialSelectedDeviceIds && !isComplianceRunning) {
        setSelectedDevices(initialSelectedDeviceIds);
      }
      if (initialSelectedJobIds && !isComplianceRunning) {
        setSelectedJobIds(initialSelectedJobIds);
      }
    }
  }, [isComplianceModalOpen, initialSelectedDeviceIds, initialSelectedJobIds, isComplianceRunning]);

  const filteredDevices = useMemo(() =>
    devices.filter((device) =>
      device.name.toLowerCase().includes(deviceSearchTerm.toLowerCase())
    ), [devices, deviceSearchTerm]);
    
  const filteredJobs = useMemo(() =>
    jobs.filter((job) =>
      job.name.toLowerCase().includes(jobSearchTerm.toLowerCase())
    ), [jobs, jobSearchTerm]);

  const handleDeviceSelection = (deviceId) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };
  
  const handleSelectAllDevices = (checked) => {
    setSelectedDevices(checked ? filteredDevices.map(d => d.id) : []);
  }

  const handleJobSelection = (jobId) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };
  
  const handleSelectAllJobs = (checked) => {
    setSelectedJobIds(checked ? filteredJobs.map(j => j.id) : []);
  }
  
  const handleCopyOutput = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      toast({ title: "Success", description: "Output copied to clipboard." });
    }
  };

  const handleDownloadCsv = () => {
    if (output) {
      const csvContent = "data:text/csv;charset=utf-8," + `"${output.replace(/"/g, '""')}"`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "compliance_output.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Success", description: "Output downloaded as CSV." });
    }
  };

  const handleAbort = () => {
    abortRequested.current = true;
    if (complianceRunProcess) {
        clearTimeout(complianceRunProcess);
        setComplianceRunProcess(null);
    }
    setIsComplianceRunning(false);
    setComplianceStatus('idle');
    setOutput((prev) => prev + "\n\n--- COMPLIANCE CHECK ABORTED BY USER ---");
    toast({ variant: "destructive", title: "Aborted", description: "Compliance check was cancelled." });
  };
  
  const handleOpenChangeAndReset = (isOpen) => {
    if (!isOpen) {
        if (isComplianceRunning && !abortRequested.current) {
            // This case means the user closed the modal with Esc or by clicking outside
            // We treat it as an abort.
            handleAbort();
        }
        // Reset local state for next time
        setSelectedDevices([]);
        setSelectedJobIds([]);
        setDeviceSearchTerm("");
        setJobSearchTerm("");
        setOutput("");
        setViewedJob(null);
        setViewedDevice(null);
    }
    setIsComplianceModalOpen(isOpen);
  };

  const handleRunCompliance = () => {
    const selectedJobsList = jobs.filter(j => selectedJobIds.includes(j.id));
    if (selectedJobsList.length === 0 || selectedDevices.length === 0) {
      toast({
        variant: "destructive",
        title: "Selection Required",
        description: "Please select at least one device and one job.",
      });
      return;
    }

    setIsComplianceRunning(true);
    setComplianceStatus('running');
    setOutput(`Running ${selectedJobsList.length} job(s) on ${selectedDevices.length} device(s)...\n`);

    const process = setTimeout(() => {
      let rawOutput = `\n`;
      const runResults = [];
      let overallSuccess = true;
      
      selectedDevices.forEach(deviceId => {
        const device = devices.find(d => d.id === deviceId);
        if(device) {
          rawOutput += `--- Device: ${device.name} ---\n`;
          selectedJobsList.forEach(job => {
              const isSuccess = Math.random() > 0.3;
              if (!isSuccess) overallSuccess = false;
              const message = isSuccess ? `Compliance check passed.` : `Device did not meet compliance standard 'XYZ-1.2'.`;
              rawOutput += `  [Job: ${job.name}] - ${isSuccess ? 'SUCCESS' : 'FAILED'}: ${message}\n`;

              runResults.push({
                deviceId: device.id,
                deviceName: device.name,
                deviceIpAddress: device.ipAddress,
                jobId: job.id,
                jobName: job.name,
                status: isSuccess ? 'Success' : 'Failed',
                message,
              });
          });
          rawOutput += `\n`;
        }
      });
      
      rawOutput += `--- COMPLIANCE CHECK COMPLETE ---`;
      setOutput(prev => prev + rawOutput);
      onRunComplete({ results: runResults, });
      setComplianceStatus(overallSuccess ? 'completed' : 'failed');
      setIsComplianceRunning(false);
      setComplianceRunProcess(null);

    }, 30000); // 30 seconds

    setComplianceRunProcess(process);
  };
  
  const handleRunInBackground = () => {
    setIsComplianceModalOpen(false);
    toast({ title: "Running in background", description: "Check status in the header." });
  };
  
  const finalGridClass = useMemo(() => {
    let classParts = ['md:grid-cols-3'];
    if (viewedDevice || viewedJob) {
      classParts = ['md:grid-cols-[1fr_1.5fr_1fr_1fr]'];
    }
    if (viewedDevice && viewedJob) {
      classParts = ['md:grid-cols-[1fr_1.5fr_1fr_1.5fr_1fr]'];
    }
    return cn('grid-cols-1', ...classParts);
  }, [viewedDevice, viewedJob]);


  return (
    <Dialog open={isComplianceModalOpen} onOpenChange={handleOpenChangeAndReset}>
      <DialogContent className="max-w-screen-2xl w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-xl">Run Compliance Check</DialogTitle>
          <DialogDescription>
            Select devices and jobs to run a compliance check.
          </DialogDescription>
        </DialogHeader>

        <div className={cn("flex-1 grid gap-0 overflow-hidden", finalGridClass)}>
          {/* Column 1: Devices */}
          <fieldset disabled={isComplianceRunning} className="flex flex-col border-r min-h-0 disabled:opacity-50 transition-opacity">
            <div className="p-4 border-b flex items-center justify-between gap-4 h-[73px]">
              <div className="flex items-center space-x-3">
                 <Checkbox
                    id="select-all-devices"
                    onCheckedChange={(checked) => handleSelectAllDevices(!!checked)}
                    checked={
                      filteredDevices.length > 0 && selectedDevices.length === filteredDevices.length
                        ? true
                        : selectedDevices.length > 0 && selectedDevices.length < filteredDevices.length
                        ? 'indeterminate'
                        : false
                    }
                 />
                 <label htmlFor="select-all-devices" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer whitespace-nowrap">
                    Devices ({selectedDevices.length})
                 </label>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search devices..." className="pl-9 h-9" value={deviceSearchTerm} onChange={(e) => setDeviceSearchTerm(e.target.value)} />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {filteredDevices.map((device) => (
                  <div key={device.id} className="group flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                    <Checkbox id={`comp-device-${device.id}`} checked={selectedDevices.includes(device.id)} onCheckedChange={() => handleDeviceSelection(device.id)} />
                    <label htmlFor={`comp-device-${device.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer">
                      {device.name}
                    </label>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => { setViewedDevice(device); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {devices.length === 0 && ( <div className="text-center text-sm text-muted-foreground p-4">No devices available.</div> )}
              </div>
            </ScrollArea>
          </fieldset>

          {/* Column 1.5: Device Details (Conditional) */}
          {viewedDevice && (
            <div className="flex flex-col border-r bg-muted/30 min-h-0">
              <div className="p-4 border-b flex items-center justify-between h-[73px]">
                <h3 className="font-semibold text-base truncate">Details: {viewedDevice.name}</h3>
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewedDevice(null)}>
                    <X className="h-4 w-4" />
                 </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                 <div className="p-4 border rounded-lg bg-background/50 space-y-2 text-sm">
                    <h4 className="font-semibold">Device Details</h4>
                    <p className="break-words"><strong className="text-muted-foreground">IP Address:</strong> <code>{viewedDevice.ipAddress}</code></p>
                    <p className="break-words"><strong className="text-muted-foreground">Username:</strong> <code>{viewedDevice.username}</code></p>
                    <p className="break-words"><strong className="text-muted-foreground">Port:</strong> <code>{viewedDevice.port}</code></p>
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Column 2: Jobs */}
          <fieldset disabled={isComplianceRunning} className="flex flex-col border-r min-h-0 disabled:opacity-50 transition-opacity">
             <div className="p-4 border-b flex items-center justify-between gap-4 h-[73px]">
              <div className="flex items-center space-x-3">
                 <Checkbox
                    id="select-all-jobs"
                    onCheckedChange={(checked) => handleSelectAllJobs(!!checked)}
                    checked={
                      filteredJobs.length > 0 && selectedJobIds.length === filteredJobs.length
                        ? true
                        : selectedJobIds.length > 0  && selectedJobIds.length < filteredJobs.length
                        ? 'indeterminate'
                        : false
                    }
                 />
                 <label htmlFor="select-all-jobs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer whitespace-nowrap">
                    Jobs ({selectedJobIds.length})
                 </label>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search jobs..." className="pl-9 h-9" value={jobSearchTerm} onChange={(e) => setJobSearchTerm(e.target.value)} />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {filteredJobs.map((job) => (
                  <div key={job.id} className="group flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                    <Checkbox id={`comp-job-${job.id}`} checked={selectedJobIds.includes(job.id)} onCheckedChange={() => handleJobSelection(job.id)} />
                    <label htmlFor={`comp-job-${job.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer">
                      {job.name}
                    </label>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => { setViewedJob(job); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {jobs.length === 0 && ( <div className="text-center text-sm text-muted-foreground p-4">No jobs available.</div> )}
              </div>
            </ScrollArea>
          </fieldset>

          {/* Column 2.5: Job Details (Conditional) */}
          {viewedJob && (
            <div className="flex flex-col border-r bg-muted/30 min-h-0">
              <div className="p-4 border-b flex items-center justify-between h-[73px]">
                <h3 className="font-semibold text-base truncate">Details: {viewedJob.name}</h3>
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewedJob(null)}>
                    <X className="h-4 w-4" />
                 </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                 <div className="p-4 border rounded-lg bg-background/50 space-y-2 text-sm">
                    <h4 className="font-semibold">Job Details</h4>
                    <p className="break-words"><strong className="text-muted-foreground">Command:</strong> <code>{viewedJob.command || 'N/A'}</code></p>
                    <p className="break-words"><strong className="text-muted-foreground">Template:</strong> <code>{viewedJob.template || 'N/A'}</code></p>
                </div>
              </ScrollArea>
            </div>
          )}
          
          {/* Last Column: Output */}
          <div className="flex flex-col min-h-0">
            <div className="p-4 border-b flex items-center justify-between h-[73px]">
              <h3 className="font-semibold text-base">Output</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleRunCompliance} disabled={isComplianceRunning || selectedJobIds.length === 0 || selectedDevices.length === 0}>
                  <Play className="mr-2 h-4 w-4" />Run
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleCopyOutput} disabled={!output || isComplianceRunning}>
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy Output</span>
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDownloadCsv} disabled={!output || isComplianceRunning}>
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download CSV</span>
                </Button>
              </div>
            </div>
            {isComplianceRunning && (
              <div className="relative h-1 w-full overflow-hidden bg-primary/20">
                  <div className="h-full w-full animate-progress-indeterminate bg-primary" />
              </div>
            )}
            <div className="flex-1 min-h-0">
              <Textarea
                readOnly
                value={output}
                placeholder="Compliance check output will be displayed here."
                className="h-full w-full resize-none border-0 rounded-none bg-muted/50 p-4 font-mono text-xs focus-visible:ring-transparent focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t">
          {isComplianceRunning ? (
            <div className="flex justify-end gap-2 w-full">
               <Button variant="destructive" onClick={handleAbort}>Abort Compliance Check</Button>
               <Button variant="outline" onClick={handleRunInBackground}>Run in Background</Button>
            </div>
          ) : (
             <Button variant="outline" onClick={() => handleOpenChangeAndReset(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
