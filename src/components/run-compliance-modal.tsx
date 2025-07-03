"use client";

import { useState, useMemo } from "react";
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
import { Search, Play, Copy, Download } from "lucide-react";
import type { Device, Job } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "./ui/textarea";

interface RunComplianceModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  devices: Device[];
  jobs: Job[];
}

export default function RunComplianceModal({ isOpen, onOpenChange, devices, jobs }: RunComplianceModalProps) {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [output, setOutput] = useState("");
  const { toast } = useToast();

  const filteredDevices = useMemo(() =>
    devices.filter((device) =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [devices, searchTerm]);

  const handleDeviceSelection = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };
  
  const handleSelectAllDevices = (checked: boolean) => {
    if (checked) {
      setSelectedDevices(devices.map(d => d.id));
    } else {
      setSelectedDevices([]);
    }
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
    const job = jobs.find(j => j.id === selectedJobId);
    if (!job) {
      setOutput("Error: Selected job not found.");
      return;
    }

    let mockOutput = `Running job "${job.name}" on ${selectedDevices.length} device(s)...\n\n`;
    
    selectedDevices.forEach(deviceId => {
      const device = devices.find(d => d.id === deviceId);
      if (device) {
        const isSuccess = Math.random() > 0.3; // Simulate success/failure
        if (isSuccess) {
          mockOutput += `[${device.name}] - SUCCESS: Compliance check passed.\n`;
        } else {
          mockOutput += `[${device.name}] - FAILED: Device did not meet compliance standard 'XYZ-1.2'.\n`;
        }
      }
    });

    setOutput(mockOutput);
  };
  
  const handleOpenChangeAndReset = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedDevices([]);
      setSelectedJobId(undefined);
      setSearchTerm("");
      setOutput("");
    }
    onOpenChange(isOpen);
  };
  
  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeAndReset}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-xl">Run Compliance Check</DialogTitle>
          <DialogDescription>
            Select devices and a job to run a compliance check.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 overflow-hidden">
          {/* Column 1: Devices */}
          <div className="flex flex-col border-r">
            <div className="p-4 border-b flex items-center justify-between gap-4 h-[73px]">
              <div className="flex items-center space-x-3">
                 <Checkbox
                    id="select-all-devices"
                    onCheckedChange={(checked) => handleSelectAllDevices(!!checked)}
                    checked={
                      selectedDevices.length === devices.length && devices.length > 0
                        ? true
                        : selectedDevices.length > 0
                        ? 'indeterminate'
                        : false
                    }
                 />
                 <label
                    htmlFor="select-all-devices"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer whitespace-nowrap"
                 >
                    Devices ({selectedDevices.length}/{devices.length})
                 </label>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-1 p-2">
                {filteredDevices.map((device) => (
                  <div key={device.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                    <Checkbox
                      id={`comp-device-${device.id}`}
                      checked={selectedDevices.includes(device.id)}
                      onCheckedChange={() => handleDeviceSelection(device.id)}
                    />
                    <label
                      htmlFor={`comp-device-${device.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                    >
                      {device.name}
                    </label>
                  </div>
                ))}
                {devices.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground p-4">No devices available.</div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Column 2: Jobs */}
          <div className="flex flex-col border-r">
            <div className="p-4 border-b flex items-center justify-between h-[73px]">
              <h3 className="font-semibold text-base">Select Job</h3>
              <Button size="sm" onClick={handleRunCompliance} disabled={!selectedJobId || selectedDevices.length === 0}>
                <Play className="mr-2 h-4 w-4" />
                Run
              </Button>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {jobs.length > 0 ? (
                <>
                  <Select onValueChange={setSelectedJobId} value={selectedJobId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a job" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedJob && (
                    <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                        <h4 className="font-semibold">Job Details</h4>
                        <p className="text-sm break-words"><strong className="text-muted-foreground">Command:</strong> <code>{selectedJob.command || 'N/A'}</code></p>
                        <p className="text-sm break-words"><strong className="text-muted-foreground">Template:</strong> <code>{selectedJob.template || 'N/A'}</code></p>
                    </div>
                  )}
                </>
              ) : (
                 <div className="text-center text-sm text-muted-foreground pt-10">No jobs available.</div>
              )}
            </div>
          </div>

          {/* Column 3: Output */}
          <div className="flex flex-col">
            <div className="p-4 border-b flex items-center justify-between h-[73px]">
              <h3 className="font-semibold text-base">Output</h3>
              <div className="flex items-center gap-2">
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
