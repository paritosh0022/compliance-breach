
"use client";

import { useMemo } from "react";
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
import { Trash2, Edit } from "lucide-react";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { format } from "date-fns";
import { Checkbox } from "./ui/checkbox";

export default function ScheduledScansTable({ table, onDelete, onEdit }) {
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
        if (!schedule.once || !schedule.once.date) return "Not scheduled";
        return `Once on ${format(new Date(schedule.once.date), "dd MMM yyyy")}, ${formatTime(schedule.once)}`;
      case 'every':
        const unit = schedule.every.interval === '1' ? schedule.every.unit.slice(0, -1) : schedule.every.unit;
        return `Every ${schedule.every.interval} ${unit}`;
      case 'daily': {
        if (!schedule.daily || schedule.daily.length === 0) return "Daily (No times set)";
        const dailyTimes = schedule.daily.map(formatTime).join(', ');
        return `Daily at ${dailyTimes}`;
      }
      case 'weekly': {
        if (!schedule.weekly || schedule.weekly.length === 0) return "Weekly (No schedules set)";
        const weeklyDetails = schedule.weekly.map(s => {
          const days = s.days.map(d => capitalize(d.substring(0, 3))).join(', ');
          return `${days} at ${formatTime(s)}`;
        }).join(' & ');
        return `Weekly on ${weeklyDetails}`;
      }
      case 'monthly': {
        if (!schedule.monthly || schedule.monthly.length === 0) return "Monthly (No schedules set)";
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

  const paginatedRows = table.getRowModel().rows;
  
  if (paginatedRows.length === 0 && table.options.data.length > 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 py-20 text-center mt-4">
            <h3 className="text-lg font-semibold text-muted-foreground">No Results Found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search term.</p>
        </div>
      );
  }

  if (table.options.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 py-20 text-center mt-4">
        <h3 className="text-lg font-semibold text-muted-foreground">No Scheduled Scans</h3>
        <p className="text-sm text-muted-foreground">You have no upcoming or recurring compliance scans.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <ScrollArea className="h-[60vh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={table.getIsAllPageRowsSelected()}
                  onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Scan ID</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Jobs Count</TableHead>
              <TableHead>Devices Count</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row) => {
              const job = row.original;
              return (
                <TableRow key={job.id} data-state={row.getIsSelected() && "selected"}>
                  <TableCell>
                    <Checkbox
                      checked={row.getIsSelected()}
                      onCheckedChange={(value) => row.toggleSelected(!!value)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{job.scanId}</TableCell>
                  <TableCell>{getFormattedSchedule(job)}</TableCell>
                  <TableCell>
                     <Badge variant="secondary">{job.jobIds.length}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{job.deviceIds.length}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => onEdit(job)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Schedule</p>
                        </TooltipContent>
                      </Tooltip>
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
              )
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
