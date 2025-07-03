"use client";

import { useState, useMemo, useEffect } from "react";
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
import type { Device, Job, ComplianceRun, ComplianceLog } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";

interface RunComplianceModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  devices: Device[];
  jobs: Job[];
  complianceRun?: Omit<ComplianceRun, 'id'>;
  onRunComplete: (logEntry: Omit<ComplianceLog, 'id'>) => void;
  initialSelectedDeviceIds?: string[];
  initialSelectedJobIds?: string[];
}

export default function RunComplianceModal({ isOpen, onOpenChange, devices, jobs, complianceRun, onRunComplete, initialSelectedDeviceIds, initialSelectedJobIds }: RunComplianceModalProps) {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [deviceSearchTerm, setDeviceSearchTerm] = useState("");
  const [jobSearchTerm, setJobSearchTerm] = useState("");
  const [output, setOutput] = useState("");
  const [viewedJob, setViewedJob] = useState<Job | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (initialSelectedDeviceIds) {
        setSelectedDevices(initialSelectedDeviceIds);
      }
      if (initialSelectedJobIds) {
        setSelectedJobIds(initialSelectedJobIds);
      }
    }
  }, [isOpen, initialSelectedDeviceIds, initialSelectedJobIds]);

  const filteredDevices = useMemo(() =>
    devices.filter((device) =>
      device.name.toLowerCase().includes(deviceSearchTerm.toLowerCase())
    ), [devices, deviceSearchTerm]);
    
  const filteredJobs = useMemo(() =>
    jobs.filter((job) =>
      job.name.toLowerCase().includes(jobSearchTerm.toLowerCase())
    ), [jobs, jobSearchTerm]);

  const handleDeviceSelection = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };
  
  const handleSelectAllDevices = (checked: boolean) => {
    setSelectedDevices(checked ? filteredDevices.map(d => d.id) : []);
  }

  const handleJobSelection = (jobId: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };
  
  const handleSelectAllJobs = (checked: boolean) => {
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

  const handleRunCompliance = () => {
    const selectedJobs = jobs.filter(j => selectedJobIds.includes(j.id));
    if (selectedJobs.length === 0 || selectedDevices.length === 0) {
      toast({
        variant: "destructive",
        title: "Selection Required",
        description: "Please select at least one device and one job.",
      });
      return;
    }

    let mockOutput = `Running ${selectedJobs.length} job(s) on ${selectedDevices.length} device(s)...\n\n`;
    let failureCount = 0;
    
    selectedDevices.forEach(deviceId => {
      const device = devices.find(d => d.id === deviceId);
      if(device) {
        mockOutput += `--- Device: ${device.name} ---\n`;
        selectedJobs.forEach(job => {
            const isSuccess = Math.random() > 0.3; // Simulate success/failure
            if (isSuccess) {
              mockOutput += `  [Job: ${job.name}] - SUCCESS: Compliance check passed.\n`;
            } else {
              failureCount++;
              mockOutput += `  [Job: ${job.name}] - FAILED: Device did not meet compliance standard 'XYZ-1.2'.\n`;
            }
        });
        mockOutput += `\n`;
      }
    });

    setOutput(mockOutput);
    
    let status: ComplianceLog['status'] = 'Success';
    if (failureCount > 0) {
      status = failureCount === (selectedDevices.length * selectedJobs.length) ? 'Failed' : 'Partial Success';
    }

    onRunComplete({
      complianceName: complianceRun?.name || 'Ad-hoc Run',
      timestamp: new Date().toISOString(),
      status,
      details: mockOutput,
      devicesCount: selectedDevices.length,
      jobsCount: selectedJobs.length,
    });
  };
  
  const handleOpenChangeAndReset = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedDevices([]);
      setSelectedJobIds([]);
      setDeviceSearchTerm("");
      setJobSearchTerm("");
      setOutput("");
      setViewedJob(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeAndReset}>
      <DialogContent className="max-w-screen-xl w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-xl">Run Compliance Check</DialogTitle>
          <DialogDescription>
            Select devices and jobs to run a compliance check.
          </DialogDescription>
        </DialogHeader>

        {complianceRun && (
          <div className="p-4 border-b bg-muted/50">
            <p className="text-sm">
              <span className="font-semibold text-foreground">{complianceRun.name}:</span>
              <span className="text-muted-foreground ml-2">{complianceRun.description}</span>
            </p>
          </div>
        )}

        <div className={cn("flex-1 grid grid-cols-1 gap-0 overflow-hidden", viewedJob ? 'md:grid-cols-[1fr,1fr,1fr,1.5fr]' : 'md:grid-cols-3')}>
          {/* Column 1: Devices */}
          <div className="flex flex-col border-r">
            <div className="p-4 border-b flex items-center justify-between gap-4 h-[73px]">
              <div className="flex items-center space-x-3">
                 <Checkbox
                    id="select-all-devices"
                    onCheckedChange={(checked) => handleSelectAllDevices(!!checked)}
                    checked={
                      selectedDevices.length === filteredDevices.length && filteredDevices.length > 0
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
                  <div key={device.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                    <Checkbox id={`comp-device-${device.id}`} checked={selectedDevices.includes(device.id)} onCheckedChange={() => handleDeviceSelection(device.id)} />
                    <label htmlFor={`comp-device-${device.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer">
                      {device.name}
                    </label>
                  </div>
                ))}
                {devices.length === 0 && ( <div className="text-center text-sm text-muted-foreground p-4">No devices available.</div> )}
              </div>
            </ScrollArea>
          </div>

          {/* Column 2: Jobs */}
          <div className="flex flex-col border-r">
             <div className="p-4 border-b flex items-center justify-between gap-4 h-[73px]">
              <div className="flex items-center space-x-3">
                 <Checkbox
                    id="select-all-jobs"
                    onCheckedChange={(checked) => handleSelectAllJobs(!!checked)}
                    checked={
                      selectedJobIds.length === filteredJobs.length && filteredJobs.length > 0
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
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => setViewedJob(job)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {jobs.length === 0 && ( <div className="text-center text-sm text-muted-foreground p-4">No jobs available.</div> )}
              </div>
            </ScrollArea>
          </div>

          {/* Column 3: Job Details (Conditional) */}
          {viewedJob && (
            <div className="flex flex-col border-r bg-muted/30">
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
          <div className="flex flex-col">
            <div className="p-4 border-b flex items-center justify-between h-[73px]">
              <h3 className="font-semibold text-base">Output</h3>
               <div className="flex items-center gap-2">
                 <Button size="sm" onClick={handleRunCompliance} disabled={selectedJobIds.length === 0 || selectedDevices.length === 0}>
                    <Play className="mr-2 h-4 w-4" />
                    Run
                  </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleCopyOutput} disabled={!output}>
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy Output</span>
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDownloadCsv} disabled={!output}>
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download CSV</span>
                </Button>
              </div>
            </div>
            <div className="flex-1">
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
          <Button variant="outline" onClick={() => handleOpenChangeAndReset(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
