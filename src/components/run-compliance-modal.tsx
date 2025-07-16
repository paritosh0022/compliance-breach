
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Play, Copy, Download, Eye, X, Calendar as CalendarIcon, ArrowLeft, Trash2, Plus, FileDown, Wifi, WifiOff, Loader2 } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import Papa from "papaparse";
import ConfirmDeleteDialog from "./confirm-delete-dialog";
import { Badge } from "./ui/badge";

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

export default function RunComplianceModal({ devices, jobs, onScheduleJob, jobToEdit }) {
  const {
    isComplianceModalOpen,
    setIsComplianceModalOpen,
    isComplianceRunning,
    setIsComplianceRunning,
    setComplianceStatus,
    onRunComplete,
  } = useDashboard();

  const isEditing = !!jobToEdit;

  const [selectedDevices, setSelectedDevices] = useState([]);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [deviceSearchTerm, setDeviceSearchTerm] = useState("");
  const [jobSearchTerm, setJobSearchTerm] = useState("");
  const [output, setOutput] = useState("");
  const [viewedJob, setViewedJob] = useState(null);
  const [viewedDevice, setViewedDevice] = useState(null);
  const [viewMode, setViewMode] = useState('output'); // 'output' or 'schedule'
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [devicePingStatus, setDevicePingStatus] = useState(new Map());
  const [hoveredDeviceId, setHoveredDeviceId] = useState(null);
  
  // State for scheduling
  const [scheduleMode, setScheduleMode] = useState("once");
  const [scheduleDate, setScheduleDate] = useState(new Date());
  
  const [onceSchedule, setOnceSchedule] = useState({ hour: "11", minute: "30", ampm: "AM" });
  
  const [everyInterval, setEveryInterval] = useState("1");
  const [everyUnit, setEveryUnit] = useState("days");
  
  const [dailySchedules, setDailySchedules] = useState([initialDailySchedule()]);
  const [weeklySchedules, setWeeklySchedules] = useState([initialWeeklySchedule()]);
  const [monthlySchedules, setMonthlySchedules] = useState([initialMonthlySchedule()]);
  
  const { toast } = useToast();

  useEffect(() => {
    if (isComplianceModalOpen) {
      if (isEditing) {
        setSelectedDevices(jobToEdit.deviceIds || []);
        setSelectedJobIds(jobToEdit.jobIds || []);
        setScheduleMode(jobToEdit.mode || 'once');
        setScheduleDate(jobToEdit.once?.date ? new Date(jobToEdit.once.date) : new Date());
        setOnceSchedule(jobToEdit.once || { hour: "11", minute: "30", ampm: "AM" });
        setEveryInterval(jobToEdit.every?.interval || "1");
        setEveryUnit(jobToEdit.every?.unit || "days");
        setDailySchedules(jobToEdit.daily?.length > 0 ? jobToEdit.daily.map(s => ({...s, id: crypto.randomUUID()})) : [initialDailySchedule()]);
        setWeeklySchedules(jobToEdit.weekly?.length > 0 ? jobToEdit.weekly.map(s => ({...s, id: crypto.randomUUID()})) : [initialWeeklySchedule()]);
        setMonthlySchedules(jobToEdit.monthly?.length > 0 ? jobToEdit.monthly.map(s => ({...s, id: crypto.randomUUID()})) : [initialMonthlySchedule()]);
        setViewMode('schedule');
      } else {
        setSelectedDevices([]);
        setSelectedJobIds([]);
        setViewMode('output');
        setDevicePingStatus(new Map());
      }
    }
  }, [isComplianceModalOpen, jobToEdit, isEditing]);

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

  const handleDownloadOutput = async (format) => {
     if (!output) {
      toast({ variant: 'destructive', title: 'No output to download.' });
      return;
    }
    
    if (format === 'csv') {
      const csvContent = "data:text/csv;charset=utf-8," + `"${output.replace(/"/g, '""')}"`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "compliance_output.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'pdf') {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.setFont('courier');
      doc.setFontSize(10);
      doc.text(output, 10, 10);
      doc.save('compliance_output.pdf');
    }
  };

  const handleModalCloseAttempt = (isOpen) => {
    if (!isOpen && isComplianceRunning) {
      setIsConfirmCloseOpen(true);
      return; // Prevent closing immediately
    }
    resetAndCloseModal();
  };

  const resetAndCloseModal = () => {
    setIsComplianceModalOpen(false);
    setSelectedDevices([]);
    setSelectedJobIds([]);
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
  };
  
  const handleConfirmClose = () => {
    setIsConfirmCloseOpen(false);
    resetAndCloseModal();
  }


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

    setTimeout(() => {
      let rawOutput = ``;
      const runResults = [];
      let overallSuccess = true;
      let failedOutputs = [];
      
      selectedDevices.forEach(deviceId => {
        const device = devices.find(d => d.id === deviceId);
        if(device) {
          selectedJobsList.forEach(job => {
              const isSuccess = Math.random() > 0.3;
              if (!isSuccess) {
                overallSuccess = false;
                const failureDetails = {
                  device: device.name,
                  job: job.name,
                  rule: job.name === 'SNMP Check' ? 'SNMP_VERSION' : 'SNMP_ENABLE',
                  expected: job.name === 'SNMP Check' ? 'snmp-version-2c' : 'yes',
                  actual: job.name === 'SNMP Check' ? 'snmp-version-3' : 'no'
                };
                failedOutputs.push(failureDetails);
              }
              const message = isSuccess ? `Compliance check passed.` : `One or more rules failed!`;

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
        }
      });

      if(failedOutputs.length > 0) {
        failedOutputs.forEach(fail => {
          rawOutput += `\n[FAILED] on ${fail.device} for job "${fail.job}"\n`;
          rawOutput += `   MESSAGE: One or more rules failed!\n`;
          rawOutput += `RULE    : '${fail.rule}'\n`;
          rawOutput += `EXPECTED: '${fail.expected}'\n`;
          rawOutput += `ACTUAL  : '${fail.actual}'\n`;
        });
      }
      
      rawOutput += `\n--- COMPLIANCE RUN COMPLETE ---`;
      setOutput(prev => prev + rawOutput);
      onRunComplete({ results: runResults, });
      setComplianceStatus(overallSuccess ? 'completed' : 'failed');
      setIsComplianceRunning(false);

    }, 3000);
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
  
  const handlePingDevice = (deviceId) => {
    setDevicePingStatus(prev => new Map(prev).set(deviceId, { pingState: 'pinging' }));

    setTimeout(() => {
      const isSuccess = Math.random() > 0.3; // Simulate success/failure
      
      setDevicePingStatus(prev => new Map(prev).set(deviceId, { 
        pingState: isSuccess ? 'success' : 'failed',
        reachability: isSuccess ? 'Reachable' : 'Unreachable'
      }));
      
      toast({
        title: isSuccess ? "Ping Successful" : "Ping Failed",
        description: isSuccess ? `Device is reachable.` : `Device could not be reached.`,
        variant: isSuccess ? "default" : "destructive",
      });

    }, 2000);
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
    }, jobToEdit?.id);
  };
  
  const getOrdinalSuffix = (day) => {
    const dayNum = parseInt(day, 10);
    if (dayNum > 3 && dayNum < 21) return 'th';
    switch (dayNum % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  };

  const getFormattedSchedule = () => {
    const formatTime = (s) => `${String(s.hour).padStart(2, '0')}:${String(s.minute).padStart(2, '0')} ${s.ampm}`;
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    
    switch(scheduleMode) {
      case 'once':
        if (!scheduleDate) return "Not scheduled";
        return `Scheduled on ${format(scheduleDate, "dd MMMM yyyy")}, ${formatTime(onceSchedule)}`;
      case 'every':
        const unit = everyInterval === '1' ? everyUnit.slice(0, -1) : everyUnit;
        return `Scheduled for every ${everyInterval} ${unit}`;
      case 'daily': {
        if (dailySchedules.length === 0) return "No daily schedules set";
        const dailyTimes = dailySchedules.map(formatTime).join(' and ');
        return `Scheduled for everyday at ${dailyTimes}`;
      }
      case 'weekly': {
        if (weeklySchedules.length === 0) return "No weekly schedules set";
        const weeklyDetails = weeklySchedules.map(s => {
          const days = s.days.map(d => capitalize(d)).join(', ');
          return `${days} at ${formatTime(s)}`;
        }).join(' and ');
        return `Scheduled for every week on ${weeklyDetails}`;
      }
      case 'monthly': {
        if (monthlySchedules.length === 0) return "No monthly schedules set";
        const monthlyDetails = monthlySchedules.map(s => {
            const dayWithSuffix = `${s.day}${getOrdinalSuffix(s.day)}`;
            return `${dayWithSuffix} at ${formatTime(s)}`;
        }).join(' and ');
        return `Scheduled for every month on the ${monthlyDetails}`;
      }
      default:
        return "Not scheduled";
    }
  };
  
  const finalGridClass = useMemo(() => {
    let baseCols = 'grid-cols-1 md:grid-cols-[1fr_1fr]';
    if(viewMode === 'schedule') {
        baseCols = 'grid-cols-1 md:grid-cols-[minmax(200px,_1fr)_minmax(200px,_1fr)_1.5fr]';
    } else {
        baseCols = 'grid-cols-1 md:grid-cols-[minmax(200px,_1fr)_minmax(200px,_1fr)_minmax(74px,2fr)]';
    }
    
    if (viewedDevice || viewedJob) {
        if(viewedDevice && viewedJob) {
          baseCols = 'grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1.5fr_1fr]';
        } else if (viewMode === 'schedule') {
            baseCols = 'grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1.5fr]';
        } else {
            baseCols = 'grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_minmax(74px,2fr)]';
        }
    }
    
    return cn(baseCols);
  }, [viewedDevice, viewedJob, viewMode]);

  const validateSchedules = useCallback((schedules, setSchedules, mode) => {
    let hasChanged = false;

    if (mode === 'weekly') {
      const seenDayTime = new Set();
      const newSchedules = schedules.map(currentSchedule => {
        let isDuplicate = false;
        const timeKey = `${currentSchedule.hour}:${currentSchedule.minute}:${currentSchedule.ampm}`;
        for (const day of currentSchedule.days) {
            const dayTimeKey = `${day}-${timeKey}`;
            if (seenDayTime.has(dayTimeKey)) {
                isDuplicate = true;
            }
            seenDayTime.add(dayTimeKey);
        }

        const newError = isDuplicate ? "Duplicate entry not allowed." : null;
        if (currentSchedule.error !== newError) {
          hasChanged = true;
        }
        return { ...currentSchedule, error: newError };
      });

      if (hasChanged) {
        setSchedules(newSchedules);
      }
      return;
    }

    const seen = new Set();
    const newSchedules = schedules.map(currentSchedule => {
      const scheduleToCheck = { ...currentSchedule };
      delete scheduleToCheck.id;
      delete scheduleToCheck.error;
      
      const key = JSON.stringify(scheduleToCheck);

      const isDuplicate = seen.has(key);
      if (!isDuplicate) {
        seen.add(key);
      }

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
  
  useEffect(() => validateSchedules(dailySchedules, setDailySchedules, 'daily'), [dailySchedules, validateSchedules]);
  useEffect(() => validateSchedules(weeklySchedules, setWeeklySchedules, 'weekly'), [weeklySchedules, validateSchedules]);
  useEffect(() => validateSchedules(monthlySchedules, setMonthlySchedules, 'monthly'), [monthlySchedules, validateSchedules]);

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
                        <PopoverContent className="w-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
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
  };

  return (
    <>
      <Dialog open={isComplianceModalOpen} onOpenChange={handleModalCloseAttempt}>
        <DialogContent className="max-w-screen-2xl w-[95vw] h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-xl">{isEditing ? 'Edit Scheduled Job' : 'Run Compliance Check'}</DialogTitle>
             <DialogDescription>
              {isEditing ? 'Update the details for this scheduled job.' : 'Select devices and jobs to run a compliance check.'}
            </DialogDescription>
          </DialogHeader>

          <div className={cn("flex-1 grid gap-0 overflow-hidden", finalGridClass)}>
            {/* Column 1: Devices */}
            <div className="flex flex-col border-r min-h-0">
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
                  {filteredDevices.map((device) => {
                    const pingStatus = devicePingStatus.get(device.id) || { pingState: 'idle', reachability: 'Unreachable' };
                    const isHovered = hoveredDeviceId === device.id;
                    return (
                    <div 
                        key={device.id} 
                        className="group flex items-center justify-between space-x-3 p-2 rounded-md hover:bg-muted"
                        onMouseEnter={() => setHoveredDeviceId(device.id)}
                        onMouseLeave={() => setHoveredDeviceId(null)}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox id={`comp-device-${device.id}`} checked={selectedDevices.includes(device.id)} onCheckedChange={() => handleDeviceSelection(device.id)} />
                        <label htmlFor={`comp-device-${device.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer">
                          {device.name}
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                         {isHovered ? (
                           <Button
                              variant="outline"
                              size="sm"
                              className="h-7"
                              onClick={() => handlePingDevice(device.id)}
                              disabled={pingStatus.pingState === 'pinging'}
                           >
                            {pingStatus.pingState === 'pinging' ? 'Pinging...' : 'Ping Device'}
                           </Button>
                         ) : (
                            <Badge variant={pingStatus.reachability === 'Reachable' ? 'default' : 'secondary'} className={cn('transition-opacity', pingStatus.reachability === 'Reachable' && 'bg-green-500 hover:bg-green-600')}>
                                {pingStatus.pingState === 'pinging' ? (
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                ) : pingStatus.reachability === 'Reachable' ? (
                                    <Wifi className="mr-2 h-3 w-3" />
                                ) : (
                                    <WifiOff className="mr-2 h-3 w-3" />
                                )}
                                {pingStatus.pingState === 'pinging' ? 'Pinging...' : pingStatus.reachability}
                           </Badge>
                         )}

                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => { setViewedDevice(device); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )})}
                  {devices.length === 0 && ( <div className="text-center text-sm text-muted-foreground p-4">No devices available.</div> )}
                </div>
              </ScrollArea>
            </div>

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
            <div className="flex flex-col border-r min-h-0">
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
            </div>

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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8" disabled={!output || isComplianceRunning}>
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => handleDownloadOutput('pdf')}>Export as PDF</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDownloadOutput('csv')}>Export as CSV</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                           <h3 className="font-semibold text-base">{isEditing ? 'Edit Schedule' : 'Schedule Run'}</h3>
                      </div>
                      <Button size="sm" onClick={handleSaveSchedule}>{isEditing ? 'Save Changes' : 'Save Schedule'}</Button>
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
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        isOpen={isConfirmCloseOpen}
        onOpenChange={setIsConfirmCloseOpen}
        onConfirm={handleConfirmClose}
        itemType="running-scan"
        title="Close Window?"
        yesText="Yes"
        noText="No"
        isDestructive={false}
      />
    </>
  );
}
