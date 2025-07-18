
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, Edit, Bot, Download } from "lucide-react";

function ActionButton({ isRunning, onAction, children, tooltipText, disabledTooltipText }) {
  if (isRunning) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button variant="ghost" size="icon" disabled>
              {children}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{disabledTooltipText}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={onAction}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function JobTable({ rows, table, onDelete, onEdit, onRunCompliance, onExport, isComplianceRunning }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 py-20 text-center">
        <h3 className="text-lg font-semibold text-muted-foreground">No Jobs Created</h3>
        <p className="text-sm text-muted-foreground">Get started by creating a new job.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
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
            <TableHead>Job Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const job = row.original;
            return (
              <TableRow key={job.id} data-state={row.getIsSelected() ? "selected" : ""}>
                <TableCell>
                  <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                  />
                </TableCell>
                <TableCell className="font-medium">{job.name}</TableCell>
                <TableCell>{job.description || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TooltipProvider>
                      <ActionButton
                        isRunning={isComplianceRunning}
                        onAction={() => onRunCompliance(job.id)}
                        tooltipText="Run Compliance"
                        disabledTooltipText="Compliance is running"
                      >
                        <Bot className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton
                        onAction={() => onExport(job.id)}
                        tooltipText="Export Job"
                        disabledTooltipText="Compliance is running"
                      >
                        <Download className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton
                        isRunning={isComplianceRunning}
                        onAction={() => onEdit(job.id)}
                        tooltipText="Edit Job"
                        disabledTooltipText="Compliance is running"
                      >
                        <Edit className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton
                        isRunning={isComplianceRunning}
                        onAction={() => onDelete(job.id)}
                        tooltipText="Delete Job"
                        disabledTooltipText="Compliance is running"
                      >
                        <Trash2 className="h-4 w-4 text-destructive hover:text-destructive" />
                      </ActionButton>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
}
