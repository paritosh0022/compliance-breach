"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ComplianceLog } from "@/lib/types";
import { format } from 'date-fns';

interface ComplianceLogModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  logs: ComplianceLog[];
}

export default function ComplianceLogModal({ isOpen, onOpenChange, logs }: ComplianceLogModalProps) {
  const getStatusVariant = (status: ComplianceLog['status']): 'default' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'Success':
        return 'default';
      case 'Failed':
        return 'destructive';
      case 'Partial Success':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Compliance Run Log</DialogTitle>
          <DialogDescription>
            History of all compliance checks that have been run.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 border rounded-lg">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader className="sticky top-0 bg-muted">
                <TableRow>
                  <TableHead>Compliance Name</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Devices</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.complianceName}</TableCell>
                      <TableCell>{format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(log.status)}>{log.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{log.devicesCount}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
