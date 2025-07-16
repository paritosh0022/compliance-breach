
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
import { Trash2, Edit, Bot, Download, FileDown, Wifi, WifiOff, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

function ActionButton({ isRunning, onAction, children, tooltipText, disabledTooltipText, disabled = false }) {
  if (isRunning || disabled) {
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

export default function DeviceTable({ 
  rows, 
  table, 
  onDelete, 
  onEdit, 
  onRunCompliance, 
  onExport, 
  isComplianceRunning,
  devicePingStatus,
  onPingDevice
}) {
  if (rows.length === 0) {
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
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Device Status</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Port</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const device = row.original;
            const pingStatus = devicePingStatus.get(device.id) || { pingState: 'idle', reachability: 'Unreachable' };

            return (
              <TableRow key={device.id} data-state={row.getIsSelected() ? "selected" : ""} className="group">
                <TableCell>
                  <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                  />
                </TableCell>
                <TableCell className="font-medium">{device.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={pingStatus.reachability === 'Reachable' ? 'default' : 'secondary'} className={cn(pingStatus.reachability === 'Reachable' && 'bg-green-500 hover:bg-green-600')}>
                      {pingStatus.pingState === 'pinging' ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : pingStatus.reachability === 'Reachable' ? (
                        <Wifi className="mr-2 h-3 w-3" />
                      ) : (
                        <WifiOff className="mr-2 h-3 w-3" />
                      )}
                      {pingStatus.pingState === 'pinging' ? 'Pinging...' : pingStatus.reachability}
                    </Badge>
                    <TooltipProvider>
                      <ActionButton
                        onAction={() => onPingDevice(device.id)}
                        tooltipText="Ping Device"
                        disabledTooltipText="Pinging..."
                        disabled={pingStatus.pingState === 'pinging'}
                      >
                         {pingStatus.pingState === 'pinging' ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 5H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="M12 9v1"/><path d="m12 14.5 4.5-4.5"/><path d="m12 14.5-4.5-4.5"/></svg>
                         )}
                      </ActionButton>
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell>{device.ipAddress}</TableCell>
                <TableCell>{device.username}</TableCell>
                <TableCell>{device.port}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TooltipProvider>
                      <ActionButton
                        isRunning={isComplianceRunning}
                        onAction={() => onRunCompliance(device.id)}
                        tooltipText="Run Compliance"
                        disabledTooltipText="Compliance is running"
                      >
                        <Bot className="h-4 w-4" />
                      </ActionButton>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <FileDown className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                              <DropdownMenuItem onSelect={() => onExport('csv', device.id)}>Export as CSV</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => onExport('pdf', device.id)} disabled>Export as PDF</DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                      <ActionButton
                        isRunning={isComplianceRunning}
                        onAction={() => onEdit(device.id)}
                        tooltipText="Edit Device"
                        disabledTooltipText="Compliance is running"
                      >
                        <Edit className="h-4 w-4" />
                      </ActionButton>
                      <ActionButton
                        isRunning={isComplianceRunning}
                        onAction={() => onDelete(device.id)}
                        tooltipText="Delete Device"
                        disabledTooltipText="Compliance is running"
                      >
                        <Trash2 className="h-4 w-4 text-destructive hover:text-destructive" />
                      </ActionButton>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
