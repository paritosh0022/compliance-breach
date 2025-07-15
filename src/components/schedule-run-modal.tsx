
"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScheduleRunModal({ isOpen, onOpenChange, onSchedule }) {
  const [mode, setMode] = useState("once");
  const [date, setDate] = useState(new Date());
  const [hour, setHour] = useState("11");
  const [minute, setMinute] = useState("30");
  const [ampm, setAmPm] = useState("AM");

  const handleSchedule = () => {
    // Basic validation
    if (!date) {
        alert("Please select a date.");
        return;
    }
    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);
    if (isNaN(hourNum) || hourNum < 1 || hourNum > 12) {
        alert("Please enter a valid hour (1-12).");
        return;
    }
    if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) {
        alert("Please enter a valid minute (0-59).");
        return;
    }

    const scheduleDetails = {
      mode,
      date: date.toISOString(),
      time: `${hour.padStart(2, "0")}:${minute.padStart(2, "0")} ${ampm}`,
    };
    onSchedule(scheduleDetails);
  };
  
  const getFormattedSchedule = () => {
      if (!date) return "Not scheduled";
      const displayDate = format(date, "PPP");
      const displayTime = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")} ${ampm}`;
      return `Scheduled on ${displayDate}, ${displayTime}`;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Schedule Compliance Run</DialogTitle>
          <DialogDescription>
            Configure when you want this compliance check to run.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <Label>Schedule Mode</Label>
            <Tabs value={mode} onValueChange={setMode}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="once">Once</TabsTrigger>
                <TabsTrigger value="every">Every</TabsTrigger>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-date">at *</Label>
            <div className="flex flex-wrap items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>

                <div className="flex items-center gap-2 flex-1">
                    <Input 
                        id="hour" 
                        type="number" 
                        className="w-16" 
                        value={hour}
                        onChange={(e) => setHour(e.target.value)}
                        min="1"
                        max="12"
                    />
                    <span>:</span>
                    <Input 
                        id="minute" 
                        type="number" 
                        className="w-16" 
                        value={minute}
                        onChange={(e) => setMinute(e.target.value)}
                        min="0"
                        max="59"
                    />
                    <Tabs value={ampm} onValueChange={setAmPm} className="w-[100px]">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="AM">AM</TabsTrigger>
                            <TabsTrigger value="PM">PM</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>
          </div>
          <Alert>
            <AlertDescription>
                {getFormattedSchedule()}
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSchedule}>Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
