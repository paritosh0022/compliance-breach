
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ScrollArea } from "./ui/scroll-area";

export default function ScanResultDetailsModal({ isOpen, onOpenChange, scanResult }) {
  if (!scanResult) return null;

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Success':
        return 'default';
      case 'Failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getOutputMessage = () => {
    if (scanResult.status === 'Success') {
      return "Scanned successfully.";
    }
    return scanResult.message || "No specific reason provided.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Scan Result Details</DialogTitle>
          <DialogDescription>
            Detailed information for the compliance check on {scanResult.deviceName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Column 1: Metadata */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Details</h3>
            <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Device Name:</span>
                    <span className="font-medium">{scanResult.deviceName}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Scan ID:</span>
                    <span className="font-medium">{scanResult.scanId}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Job Name:</span>
                    <span className="font-medium">{scanResult.jobName}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Last ran at:</span>
                    <span className="font-medium">{format(new Date(scanResult.timestamp), "yyyy-MM-dd HH:mm:ss")}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Run Status:</span>
                    <Badge variant={getStatusVariant(scanResult.status)}>{scanResult.status}</Badge>
                </div>
            </div>
          </div>
          {/* Column 2: Output */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Output</h3>
            <ScrollArea className="h-48 rounded-md border bg-muted/50 p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {getOutputMessage()}
              </pre>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
