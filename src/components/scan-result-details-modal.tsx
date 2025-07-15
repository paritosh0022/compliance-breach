
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
      <DialogContent className="max-w-6xl w-[80vw] h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Scan Result Details</DialogTitle>
          <DialogDescription>
            Detailed information for the compliance check on {scanResult.deviceName}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
          {/* Column 1: Metadata */}
          <div className="flex flex-col border-r min-h-0">
             <div className="p-4 border-b h-[60px] flex items-center">
                <h3 className="font-semibold text-base">Scan Details</h3>
             </div>
             <ScrollArea className="flex-1">
                <div className="p-4 space-y-4 text-sm">
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
             </ScrollArea>
          </div>
          {/* Column 2: Output */}
          <div className="flex flex-col min-h-0">
            <div className="p-4 border-b h-[60px] flex items-center">
                <h3 className="font-semibold text-base">Output</h3>
            </div>
            <ScrollArea className="flex-1 bg-muted/50">
                <pre className="text-sm whitespace-pre-wrap font-mono p-4">
                    {getOutputMessage()}
                </pre>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
