
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

export default function JobTable({ jobs, onDelete, onEdit, selectedJobIds, onSelectedJobIdsChange, onRunCompliance, onExport }) {
  
  const handleSelectAll = (checked) => {
    onSelectedJobIdsChange(checked ? jobs.map(j => j.id) : []);
  };
  
  const handleSelectRow = (id, checked) => {
    if (checked) {
      onSelectedJobIdsChange([...selectedJobIds, id]);
    } else {
      onSelectedJobIdsChange(selectedJobIds.filter(rowId => rowId !== id));
    }
  };

  if (jobs.length === 0) {
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
                checked={selectedJobIds.length === jobs.length && jobs.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Job Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id} data-state={selectedJobIds.includes(job.id) ? "selected" : ""}>
              <TableCell>
                <Checkbox
                  checked={selectedJobIds.includes(job.id)}
                  onCheckedChange={(checked) => handleSelectRow(job.id, !!checked)}
                />
              </TableCell>
              <TableCell className="font-medium">{job.name}</TableCell>
              <TableCell>{job.description || 'N/A'}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onRunCompliance(job.id)}>
                          <Bot className="h-4 w-4" />
                          <span className="sr-only">Run Compliance</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Run Compliance</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onExport(job.id)}>
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Export Job</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Export Job</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(job.id)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Job</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Job</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(job.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Job</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Job</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
