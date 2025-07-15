
"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
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
import { Search, Play, Copy, Download, Eye, X, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Alert, AlertDescription } from "./ui/alert";

const daysOfWeek = [
    { value: "sun", label: "S" },
    { value: "mon", label: "M" },
    { value: "tue", label: "T" },
    { value: "wed", label: "W" },
    { value: "thu", label: "T" },
    { value: "fri", label: "F" },
    { value: "sat", label: "S" },
];

export default function RunComplianceModal({ devices, jobs, initialSelectedDeviceIds, initialSelectedJobIds, onScheduleJob }) {
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
  const [viewMode, setViewMode] = useState('output'); // 'output' or 'schedule'
  
  // State for scheduling
  const [scheduleMode, setScheduleMode] = useState("once");
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [scheduleHour, setScheduleHour] = useState("11");
  const [scheduleMinute, setScheduleMinute] = useState("30");
  const [scheduleAmPm, setScheduleAmPm] = useState("AM");
  const [everyInterval, setEveryInterval] = useState("15");
  const [everyUnit, setEveryUnit] = useState("minutes");
  const [weeklyDays, setWeeklyDays] = useState(["mon"]);
  const [monthlyDay, setMonthlyDay] = useState("1");
  
  const { toast } = useToast();

  useEffect(() => {
    if (isComplianceModalOpen) {
      if (!isComplianceRunning) {
        setSelectedDevices(initialSelectedDeviceIds || []);
        setSelectedJobIds(initialSelectedJobIds || []);
        setViewMode('output');
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

  const handleOpenChangeAndReset = (isOpen) => {
    if (!isOpen && isComplianceRunning) {
      handleRunInBackground();
      return;
    }
    
    if (!isOpen) {
        if (!isComplianceRunning) {
            setSelectedDevices(initialSelectedDeviceIds || []);
            setSelectedJobIds(initialSelectedJobIds || []);
            setDeviceSearchTerm("");
            setJobSearchTerm("");
            setOutput("");
            setViewedJob(null);
            setViewedDevice(null);
            setViewMode('output');
        }
    }
    setIsComplianceModalOpen(isOpen);
  };

  const handleRunNow = () => {
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

    }, 3000);

    setComplianceRunProcess(process);
  };

  const handleScheduleRunClick = () => {
    if (selectedJobIds.length === 0 || selectedDevices.length === 0) {
      toast({
        variant: "destructive",
        title: "Selection Required",
        description: "Please select at least one device and one job to schedule.",
      });
      return;
    }
    setViewMode('schedule');
  };

  const handleSaveSchedule = () => {
    if (!scheduleDate && scheduleMode === 'once') {
        toast({variant: 'destructive', title: "Please select a date."});
        return;
    }
    const hourNum = parseInt(scheduleHour);
    const minuteNum = parseInt(scheduleMinute);
    if (isNaN(hourNum) || hourNum < 1 || hourNum > 12) {
        toast({variant: 'destructive', title: "Please enter a valid hour (1-12)."});
        return;
    }
    if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) {
        toast({variant: 'destructive', title: "Please enter a valid minute (0-59)."});
        return;
    }

    const scheduleDetails = {
      mode: scheduleMode,
      date: scheduleDate ? scheduleDate.toISOString() : undefined,
      time: `${scheduleHour.padStart(2, "0")}:${scheduleMinute.padStart(2, "0")} ${scheduleAmPm}`,
      everyInterval,
      everyUnit,
      weeklyDays,
      monthlyDay,
    };
    
    onScheduleJob(scheduleDetails, {
      deviceIds: selectedDevices,
      jobIds: selectedJobIds,
    });
  };
  
  const getFormattedSchedule = () => {
      const displayTime = `${scheduleHour.padStart(2, "0")}:${scheduleMinute.padStart(2, "0")} ${scheduleAmPm}`;
      switch(scheduleMode) {
        case 'once':
          if (!scheduleDate) return "Not scheduled";
          return `Scheduled for once on ${format(scheduleDate, "PPP")} at ${displayTime}`;
        case 'every':
          return `Scheduled to run every ${everyInterval} ${everyUnit}`;
        case 'daily':
          return `Scheduled to run every day at ${displayTime}`;
        case 'weekly':
          if (weeklyDays.length === 0) return `Select days to run weekly at ${displayTime}`;
          return `Scheduled to run on ${weeklyDays.join(', ')} at ${displayTime}`;
        case 'monthly':
          return `Scheduled to run on day ${monthlyDay} of the month at ${displayTime}`;
        default:
          return "Not scheduled";
      }
  }
  
  const handleRunInBackground = () => {
    setIsComplianceModalOpen(false);
    toast({ title: "Running in background", description: "Check status in the header." });
  };
  
  const finalGridClass = useMemo(() => {
    let baseCols = 'grid-cols-1 md:grid-cols-3';
    if(viewMode === 'schedule') {
        baseCols = 'grid-cols-1 md:grid-cols-[1fr_1fr_1.5fr]'
    } else if (viewedDevice || viewedJob) {
        baseCols = 'grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1fr]';
    }
    if (viewedDevice && viewedJob) {
        baseCols = 'grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1.5fr_1fr]';
    }
    return cn(baseCols);
  }, [viewedDevice, viewedJob, viewMode]);


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
          <fieldset className="flex flex-col border-r min-h-0 transition-opacity">
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
          {viewedDevice && viewMode === 'output' && (
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
          <fieldset className="flex flex-col border-r min-h-0 transition-opacity">
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
          {viewedJob && viewMode === 'output' && (
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
          
          {/* Last Column: Output or Schedule */}
          {viewMode === 'output' ? (
            <div className="flex flex-col min-h-0">
                <div className="p-4 border-b flex items-center justify-between h-[73px]">
                <h3 className="font-semibold text-base">Output</h3>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleScheduleRunClick} disabled={isComplianceRunning || selectedJobIds.length === 0 || selectedDevices.length === 0}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Schedule Run
                    </Button>
                    <Button size="sm" onClick={handleRunNow} disabled={isComplianceRunning || selectedJobIds.length === 0 || selectedDevices.length === 0}>
                    <Play className="mr-2 h-4 w-4" />
                    {isComplianceRunning ? 'Running...' : 'Run Now'}
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleCopyOutput} disabled={!output || isComplianceRunning}>
                    <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDownloadCsv} disabled={!output || isComplianceRunning}>
                    <Download className="h-4 w-4" />
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
          ) : (
            <div className="flex flex-col min-h-0">
                 <div className="p-4 border-b flex items-center justify-between h-[73px]">
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" size="icon" onClick={() => setViewMode('output')} className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                         </Button>
                         <h3 className="font-semibold text-base">Schedule Run</h3>
                    </div>
                    <Button size="sm" onClick={handleSaveSchedule}>Save Schedule</Button>
                 </div>
                 <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        <div className="space-y-2">
                            <Label>Schedule Mode</Label>
                            <Tabs value={scheduleMode} onValueChange={setScheduleMode}>
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="once">Once</TabsTrigger>
                                <TabsTrigger value="every">Every</TabsTrigger>
                                <TabsTrigger value="daily">Daily</TabsTrigger>
                                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                            </TabsList>
                            </Tabs>
                        </div>

                        {scheduleMode === 'every' && (
                            <div className="space-y-2">
                                <Label htmlFor="every-interval">Run every</Label>
                                <div className="flex items-center gap-2">
                                <Input id="every-interval" type="number" className="w-24" value={everyInterval} onChange={(e) => setEveryInterval(e.target.value)} min="1"/>
                                <Select value={everyUnit} onValueChange={setEveryUnit}>
                                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select unit" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="minutes">Minutes</SelectItem>
                                        <SelectItem value="hours">Hours</SelectItem>
                                        <SelectItem value="days">Days</SelectItem>
                                    </SelectContent>
                                </Select>
                                </div>
                            </div>
                        )}

                        {scheduleMode === 'weekly' && (
                            <div className="space-y-2">
                                <Label>Run on these days</Label>
                                <ToggleGroup type="multiple" variant="outline" value={weeklyDays} onValueChange={(value) => { if (value) setWeeklyDays(value);}} className="justify-start">
                                    {daysOfWeek.map(day => (<ToggleGroupItem key={day.value} value={day.value}>{day.label}</ToggleGroupItem>))}
                                </ToggleGroup>
                            </div>
                        )}

                        {scheduleMode === 'monthly' && (
                           <div className="space-y-2">
                                <Label>at *</Label>
                                <div className="flex flex-wrap items-center gap-2">
                                   <Button variant="outline" className="font-normal" disabled>Day of the month</Button>
                                    <Select value={monthlyDay} onValueChange={setMonthlyDay}>
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                <SelectItem key={day} value={String(day)}>{day}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex items-center gap-2 flex-1">
                                        <Input id="hour" type="number" className="w-16" value={scheduleHour} onChange={(e) => setScheduleHour(e.target.value)} min="1" max="12"/>
                                        <span>:</span>
                                        <Input id="minute" type="number" className="w-16" value={scheduleMinute} onChange={(e) => setScheduleMinute(e.target.value)} min="0" max="59"/>
                                        <Tabs value={scheduleAmPm} onValueChange={setScheduleAmPm} className="w-[100px]">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="AM">AM</TabsTrigger>
                                                <TabsTrigger value="PM">PM</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(scheduleMode === 'once' || scheduleMode === 'daily') && (
                            <div className="space-y-2">
                            <Label>at *</Label>
                            <div className="flex flex-wrap items-center gap-2">
                                {scheduleMode === 'once' && (
                                     <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal",!scheduleDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {scheduleDate ? format(scheduleDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={scheduleDate} onSelect={(newDate) => setScheduleDate(newDate || new Date())} initialFocus/>
                                        </PopoverContent>
                                    </Popover>
                                )}
                                <div className="flex items-center gap-2 flex-1">
                                    <Input id="hour" type="number" className="w-16" value={scheduleHour} onChange={(e) => setScheduleHour(e.target.value)} min="1" max="12"/>
                                    <span>:</span>
                                    <Input id="minute" type="number" className="w-16" value={scheduleMinute} onChange={(e) => setScheduleMinute(e.target.value)} min="0" max="59"/>
                                    <Tabs value={scheduleAmPm} onValueChange={setScheduleAmPm} className="w-[100px]">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="AM">AM</TabsTrigger>
                                            <TabsTrigger value="PM">PM</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </div>
                            </div>
                        )}
                        
                        {scheduleMode === 'weekly' && (
                            <div className="space-y-2">
                                <Label>at *</Label>
                                <div className="flex items-center gap-2 flex-1">
                                    <Input id="hour" type="number" className="w-16" value={scheduleHour} onChange={(e) => setScheduleHour(e.target.value)} min="1" max="12"/>
                                    <span>:</span>
                                    <Input id="minute" type="number" className="w-16" value={scheduleMinute} onChange={(e) => setScheduleMinute(e.target.value)} min="0" max="59"/>
                                    <Tabs value={scheduleAmPm} onValueChange={setScheduleAmPm} className="w-[100px]">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="AM">AM</TabsTrigger>
                                            <TabsTrigger value="PM">PM</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </div>
                        )}

                        <Alert>
                            <AlertDescription>{getFormattedSchedule()}</AlertDescription>
                        </Alert>
                    </div>
                 </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t">
          {isComplianceRunning ? (
            <div className="flex justify-end gap-2 w-full">
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
