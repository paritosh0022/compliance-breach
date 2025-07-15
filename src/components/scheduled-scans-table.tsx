
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { format } from "date-fns";

export default function ScheduledScansTable({ scheduledJobs, onDelete }) {
  const getOrdinalSuffix = (day) => {
    if (!day) return '';
    const dayNum = parseInt(day, 10);
    if (dayNum > 3 && dayNum < 21) return 'th';
    switch (dayNum % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  };

  const getFormattedSchedule = (schedule) => {
    const formatTime = (s) => `${String(s.hour).padStart(2, '0')}:${String(s.minute).padStart(2, '0')} ${s.ampm}`;
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    
    switch(schedule.mode) {
      case 'once':
        if (!schedule.once.date) return "Not scheduled";
        return `Once on ${format(new Date(schedule.once.date), "dd MMM yyyy")}, ${formatTime(schedule.once)}`;
      case 'every':
        const unit = schedule.every.interval === '1' ? schedule.every.unit.slice(0, -1) : schedule.every.unit;
        return `Every ${schedule.every.interval} ${unit}`;
      case 'daily': {
        if (schedule.daily.length === 0) return "Daily (No times set)";
        const dailyTimes = schedule.daily.map(formatTime).join(', ');
        return `Daily at ${dailyTimes}`;
      }
      case 'weekly': {
        if (schedule.weekly.length === 0) return "Weekly (No schedules set)";
        const weeklyDetails = schedule.weekly.map(s => {
          const days = s.days.map(d => capitalize(d.substring(0, 3))).join(', ');
          return `${days} at ${formatTime(s)}`;
        }).join(' & ');
        return `Weekly on ${weeklyDetails}`;
      }
      case 'monthly': {
        if (schedule.monthly.length === 0) return "Monthly (No schedules set)";
        const monthlyDetails = schedule.monthly.map(s => {
            const dayWithSuffix = `${s.day}${getOrdinalSuffix(s.day)}`;
            return `${dayWithSuffix} at ${formatTime(s)}`;
        }).join(' & ');
        return `Monthly on the ${monthlyDetails}`;
      }
      default:
        return "Not scheduled";
    }
  };


  if (scheduledJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 py-20 text-center mt-4">
        <h3 className="text-lg font-semibold text-muted-foreground">No Scheduled Scans</h3>
        <p className="text-sm text-muted-foreground">You have no upcoming or recurring compliance scans.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border mt-4">
      <ScrollArea className="h-[60vh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scan ID</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Targets</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduledJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.scanId}</TableCell>
                <TableCell>{getFormattedSchedule(job)}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant="secondary">Jobs: {job.jobIds.length}</Badge>
                    <Badge variant="secondary">Devices: {job.deviceIds.length}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(job.id)}>
                          <Trash2 className="h-4 w-4 text-destructive hover:text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Scheduled Job</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
