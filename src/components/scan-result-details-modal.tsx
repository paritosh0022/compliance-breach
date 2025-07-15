
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
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

export default function ScanResultDetailsModal({ isOpen, onOpenChange, scanResult }) {
  const { toast } = useToast();

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

  const outputMessage = getOutputMessage();

  const handleCopy = () => {
    navigator.clipboard.writeText(outputMessage);
    toast({ title: "Success", description: "Output copied to clipboard." });
  };
  
  const handleDownload = () => {
    const scanDetailsData = [{
        'Scan ID': scanResult.scanId,
        'Job Name': scanResult.jobName,
        'Device Name': scanResult.deviceName,
        'IP Address': scanResult.deviceIpAddress,
        'Timestamp': format(new Date(scanResult.timestamp), "yyyy-MM-dd HH:mm:ss"),
        'Status': scanResult.status,
        'Output': outputMessage
    }];

    const csv = Papa.unparse(scanDetailsData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `scan_details_${scanResult.scanId}_${scanResult.deviceName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Success", description: "Scan details downloaded as CSV." });
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
            <div className="p-4 border-b h-[60px] flex items-center justify-between">
                <h3 className="font-semibold text-base">Output</h3>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDownload}>
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <ScrollArea className="flex-1 bg-muted/50">
                <pre className="text-sm whitespace-pre-wrap font-mono p-4">
                    {outputMessage}
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

