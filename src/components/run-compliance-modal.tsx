
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
import { Search, Play, Copy, Download, Eye, X, Calendar as CalendarIcon, ArrowLeft, Trash2, Plus } from "lucide-react";
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

const initialDailySchedule = () => ({ id: crypto.randomUUID(), hour: '11', minute: '30', ampm: 'AM', error: null });
const initialWeeklySchedule = () => ({ id: crypto.randomUUID(), days: ['mon'], hour: '11', minute: '30', ampm: 'AM', error: null });
const initialMonthlySchedule = () => ({ id: crypto.randomUUID(), day: '1', hour: '11', minute: '30', ampm: 'AM', error: null });

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
  
  const [onceSchedule, setOnceSchedule] = useState({ hour: "11", minute: "30", ampm: "AM" });
  
  const [everyInterval, setEveryInterval] = useState("15");
  const [everyUnit, setEveryUnit] = useState("minutes");
  
  const [dailySchedules, setDailySchedules] = useState([initialDailySchedule()]);
  const [weeklySchedules, setWeeklySchedules] = useState([initialWeeklySchedule()]);
  const [monthlySchedules, setMonthlySchedules] = useState([initialMonthlySchedule()]);
  
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
            setScheduleMode('once');
            setDailySchedules([initialDailySchedule()]);
            setWeeklySchedules([initialWeeklySchedule()]);
            setMonthlySchedules([initialMonthlySchedule()]);
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
    const scheduleDetails = {
      mode: scheduleMode,
      once: { date: scheduleDate, ...onceSchedule },
      every: { interval: everyInterval, unit: everyUnit },
      daily: dailySchedules.map(({id, error, ...rest}) => rest),
      weekly: weeklySchedules.map(({id, error, ...rest}) => rest),
      monthly: monthlySchedules.map(({id, error, ...rest}) => rest),
    };
    
    // Validate before saving
    if (
      dailySchedules.some(s => s.error) ||
      weeklySchedules.some(s => s.error) ||
      monthlySchedules.some(s => s.error)
    ) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Schedules',
        description: 'Please fix the duplicate schedule entries before saving.',
      });
      return;
    }
    
    onScheduleJob(scheduleDetails, {
      deviceIds: selectedDevices,
      jobIds: selectedJobIds,
    });
  };
  
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  };

  const getFormattedSchedule = () => {
    const formatTime = (s) => `${s.hour.padStart(2, '0')}:${s.minute.padStart(2, '0')} ${s.ampm}`;
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    
    switch(scheduleMode) {
      case 'once':
        if (!scheduleDate) return "Not scheduled";
        return `Scheduled on ${format(scheduleDate, "dd MMMM yyyy")}, ${formatTime(onceSchedule)}`;
      case 'every':
        const unit = everyUnit.endsWith('s') && everyInterval === '1' ? everyUnit.slice(0, -1) : everyUnit;
        return `Scheduled for every ${everyInterval} ${capitalize(unit)}`;
      case 'daily':
        if (dailySchedules.length === 0) return "No daily schedules set";
        const dailyTimes = dailySchedules.map(formatTime).join(', ');
        return `Scheduled for everyday at ${dailyTimes}`;
      case 'weekly':
        if (weeklySchedules.length === 0) return "No weekly schedules set";
        return weeklySchedules.map(s => {
          const days = s.days.map(capitalize).join(', ');
          return `Scheduled for every week ${days} at ${formatTime(s)}`;
        }).join('; ');
      case 'monthly':
        if (monthlySchedules.length === 0) return "No monthly schedules set";
        return monthlySchedules.map(s => {
            const dayWithSuffix = `${s.day}${getOrdinalSuffix(parseInt(s.day))}`;
            return `Scheduled for every month ${dayWithSuffix} at ${formatTime(s)}`;
        }).join('; ');
      default:
        return "Not scheduled";
    }
  };
  
  const handleRunInBackground = () => {
    setIsComplianceModalOpen(false);
    toast({ title: "Running in background", description: "Check status in the header." });
  };
  
  const finalGridClass = useMemo(() => {
    let baseCols = 'grid-cols-1 md:grid-cols-[1fr_1fr]';
    if(viewMode === 'schedule') {
        baseCols = 'grid-cols-1 md:grid-cols-[1fr_1fr_1.5fr]';
    } else {
        baseCols = 'grid-cols-1 md:grid-cols-[minmax(200px,_1fr)_minmax(200px,_1fr)_2fr]';
    }
    
    if (viewedDevice || viewedJob) {
        if(viewedDevice && viewedJob) {
          baseCols = 'grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1.5fr_1fr]';
        } else if (viewMode === 'schedule') {
            baseCols = 'grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1.5fr]';
        } else {
            baseCols = 'grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_2fr]';
        }
    }
    
    return cn(baseCols);
  }, [viewedDevice, viewedJob, viewMode]);

  const validateSchedules = useCallback((schedules, setSchedules) => {
    let hasChanged = false;
    const seen = new Set();
    const newSchedules = schedules.map(currentSchedule => {
      const scheduleToCheck = { ...currentSchedule };
      delete scheduleToCheck.id;
      delete scheduleToCheck.error;
      const key = JSON.stringify(scheduleToCheck);

      const isDuplicate = seen.has(key);
      seen.add(key);

      const newError = isDuplicate ? "Duplicate entry not allowed." : null;
      if (currentSchedule.error !== newError) {
        hasChanged = true;
      }
      return { ...currentSchedule, error: newError };
    });
    
    if (hasChanged) {
        setSchedules(newSchedules);
    }
  }, []);
  
  useEffect(() => validateSchedules(dailySchedules, setDailySchedules), [dailySchedules, validateSchedules]);
  useEffect(() => validateSchedules(weeklySchedules, setWeeklySchedules), [weeklySchedules, validateSchedules]);
  useEffect(() => validateSchedules(monthlySchedules, setMonthlySchedules), [monthlySchedules, validateSchedules]);


  const renderScheduleControls = () => {
    const handleUpdateSchedule = (id, field, value, schedules, setSchedules) => {
      const newSchedules = schedules.map(s => s.id === id ? { ...s, [field]: value } : s);
      setSchedules(newSchedules);
    };

    const handleAddSchedule = (setSchedules, initializer) => {
        setSchedules(prev => [...prev, initializer()]);
    };
    
    const handleDeleteSchedule = (id, schedules, setSchedules) => {
        setSchedules(schedules.filter(s => s.id !== id));
    };

    const renderTimeInputs = (schedule, updateFn) => (
       <div className="flex items-center gap-2">
            <Input id="hour" type="number" className="w-16" value={schedule.hour} onChange={(e) => updateFn('hour', e.target.value)} min="1" max="12"/>
            <span>:</span>
            <Input id="minute" type="number" className="w-16" value={schedule.minute} onChange={(e) => updateFn('minute', e.target.value)} min="0" max="59"/>
            <Tabs value={schedule.ampm} onValueChange={(v) => updateFn('ampm', v)} className="w-[100px]">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="AM">AM</TabsTrigger>
                    <TabsTrigger value="PM">PM</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
    
    const renderAddButton = (onClick) => (
        <Button variant="outline" size="sm" onClick={onClick} className="mt-2">
            <Plus className="mr-2 h-4 w-4" /> Add Schedule
        </Button>
    );

    switch (scheduleMode) {
      case 'once':
        return (
            <div className="space-y-2">
                <Label>at *</Label>
                <div className="flex flex-wrap items-center gap-2">
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
                    {renderTimeInputs(onceSchedule, (field, value) => setOnceSchedule(prev => ({...prev, [field]: value})))}
                </div>
            </div>
        );
      case 'every':
        return (
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
        );
      case 'daily':
        return (
            <>
                {dailySchedules.map((schedule, index) => (
                    <div key={schedule.id} className="space-y-2">
                        {index === 0 && <Label>at *</Label>}
                        <div className="flex items-center gap-2">
                           {renderTimeInputs(schedule, (field, value) => handleUpdateSchedule(schedule.id, field, value, dailySchedules, setDailySchedules))}
                           {index > 0 && (
                               <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteSchedule(schedule.id, dailySchedules, setDailySchedules)}>
                                   <Trash2 className="h-4 w-4"/>
                               </Button>
                           )}
                        </div>
                        {schedule.error && index > 0 && <p className="text-sm text-destructive">{schedule.error}</p>}
                    </div>
                ))}
                {renderAddButton(() => handleAddSchedule(setDailySchedules, initialDailySchedule))}
            </>
        );
      case 'weekly':
        return (
            <>
                {weeklySchedules.map((schedule, index) => (
                    <div key={schedule.id} className="space-y-4 p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                             <div className="space-y-2">
                                <Label>Run on these days *</Label>
                                <ToggleGroup type="multiple" variant="outline" value={schedule.days} onValueChange={(value) => handleUpdateSchedule(schedule.id, 'days', value.length > 0 ? value : schedule.days, weeklySchedules, setWeeklySchedules)} className="justify-start flex-wrap">
                                    {daysOfWeek.map(day => (<ToggleGroupItem key={day.value} value={day.value}>{day.label}</ToggleGroupItem>))}
                                </ToggleGroup>
                            </div>
                            {index > 0 && (
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteSchedule(schedule.id, weeklySchedules, setWeeklySchedules)}>
                                   <Trash2 className="h-4 w-4"/>
                                </Button>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>at *</Label>
                            {renderTimeInputs(schedule, (field, value) => handleUpdateSchedule(schedule.id, field, value, weeklySchedules, setWeeklySchedules))}
                        </div>
                        {schedule.error && index > 0 && <p className="text-sm text-destructive">{schedule.error}</p>}
                    </div>
                ))}
                {renderAddButton(() => handleAddSchedule(setWeeklySchedules, initialWeeklySchedule))}
            </>
        );
      case 'monthly':
        return (
            <>
                {monthlySchedules.map((schedule, index) => (
                     <div key={schedule.id} className="space-y-2">
                        {index === 0 && <Label>at *</Label>}
                         <div className="flex items-center gap-2">
                            <Button variant="outline" className="font-normal" disabled>Day of the month</Button>
                            <Select value={schedule.day} onValueChange={(v) => handleUpdateSchedule(schedule.id, 'day', v, monthlySchedules, setMonthlySchedules)}>
                                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                                <SelectContent>{Array.from({ length: 31 }, (_, i) => i + 1).map(d => (<SelectItem key={d} value={String(d)}>{d}</SelectItem>))}</SelectContent>
                            </Select>
                            {renderTimeInputs(schedule, (field, value) => handleUpdateSchedule(schedule.id, field, value, monthlySchedules, setMonthlySchedules))}
                            {index > 0 && (
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteSchedule(schedule.id, monthlySchedules, setMonthlySchedules)}>
                                   <Trash2 className="h-4 w-4"/>
                                </Button>
                            )}
                         </div>
                         {schedule.error && index > 0 && <p className="text-sm text-destructive">{schedule.error}</p>}
                     </div>
                ))}
                {renderAddButton(() => handleAddSchedule(setMonthlySchedules, initialMonthlySchedule))}
            </>
        );
      default:
        return null;
    }
  }


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
          <fieldset className="flex flex-col border-r min-h-0">
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
          <fieldset className="flex flex-col border-r min-h-0">
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
                        
                        {renderScheduleControls()}

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
