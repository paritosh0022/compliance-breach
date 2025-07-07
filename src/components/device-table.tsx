
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

export default function DeviceTable({ devices, onDelete, onEdit, selectedDeviceIds, onSelectedDeviceIdsChange, onRunCompliance, onExport }) {

  const handleSelectAll = (checked) => {
    onSelectedDeviceIdsChange(checked ? devices.map(d => d.id) : []);
  };
  
  const handleSelectRow = (id, checked) => {
    if (checked) {
      onSelectedDeviceIdsChange([...selectedDeviceIds, id]);
    } else {
      onSelectedDeviceIdsChange(selectedDeviceIds.filter(rowId => rowId !== id));
    }
  };

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20 py-20 text-center">
        <h3 className="text-lg font-semibold text-muted-foreground">No Devices Added</h3>
        <p className="text-sm text-muted-foreground">Get started by adding a new device.</p>
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
                checked={selectedDeviceIds.length === devices.length && devices.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Port</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id} data-state={selectedDeviceIds.includes(device.id) ? "selected" : ""}>
              <TableCell>
                <Checkbox
                  checked={selectedDeviceIds.includes(device.id)}
                  onCheckedChange={(checked) => handleSelectRow(device.id, !!checked)}
                />
              </TableCell>
              <TableCell className="font-medium">{device.name}</TableCell>
              <TableCell>{device.ipAddress}</TableCell>
              <TableCell>{device.username}</TableCell>
              <TableCell>{device.port}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onRunCompliance(device.id)}>
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
                        <Button variant="ghost" size="icon" onClick={() => onExport(device.id)}>
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Export Device</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Export Device</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(device.id)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Device</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Device</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(device.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Device</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Device</p>
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
