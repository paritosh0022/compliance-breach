"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Search, Play, Copy, Download } from "lucide-react";
import type { Device } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface AddComplianceModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  devices: Device[];
}

export default function AddComplianceModal({ isOpen, onOpenChange, devices }: AddComplianceModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const { toast } = useToast();

  const filteredDevices = useMemo(() => 
    devices.filter((device) =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [devices, searchTerm]);

  const handleRunCommand = () => {
    setOutput(`Running command: "${command}" on ${selectedDevices.length} device(s)...\n\n(Mock Output)\nConfiguration updated successfully.\nVerification complete.`);
  };

  const handleCopyOutput = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      toast({ title: "Success", description: "Output copied to clipboard." });
    }
  };

  const handleDownloadCsv = () => {
    if (output) {
      const csvContent = "data:text/csv;charset=utf-8," + `"${output.replace(/"/g, '""')}"`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "compliance_output.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Success", description: "Output downloaded as CSV." });
    }
  };

  const handleDeviceSelection = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-auto max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Compliance Rule</DialogTitle>
          <DialogDescription>
            Configure and run compliance checks against your devices.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
                <Label htmlFor="compliance-name">Compliance Name</Label>
                <Input id="compliance-name" placeholder="e.g., CIS Benchmark Check" />
            </div>
            <div>
                <Label htmlFor="compliance-description">Description</Label>
                <Input id="compliance-description" placeholder="Optional description for this rule" />
            </div>
        </div>

        <Separator className="my-4" />

        <div className="grid flex-1 grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">Devices ({selectedDevices.length}/{devices.length})</CardTitle>
               <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-2">
              <ScrollArea className="h-full">
                <div className="space-y-1 p-2">
                  {filteredDevices.map((device) => (
                    <div key={device.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
                      <Checkbox
                        id={`device-${device.id}`}
                        checked={selectedDevices.includes(device.id)}
                        onCheckedChange={() => handleDeviceSelection(device.id)}
                      />
                      <label
                        htmlFor={`device-${device.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                      >
                        {device.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Command</CardTitle>
              <Button size="sm" onClick={handleRunCommand} disabled={!command || selectedDevices.length === 0}>
                <Play className="mr-2 h-4 w-4" />
                Run
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex">
              <Textarea
                placeholder="Enter command to run on selected devices, e.g., 'show version'"
                className="flex-1 resize-none text-sm"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Output</CardTitle>
              <div className="flex items-center gap-2">
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleCopyOutput} disabled={!output}>
                   <Copy className="h-4 w-4" />
                   <span className="sr-only">Copy Output</span>
                 </Button>
                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDownloadCsv} disabled={!output}>
                   <Download className="h-4 w-4" />
                   <span className="sr-only">Download CSV</span>
                 </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex">
               <Textarea
                readOnly
                value={output}
                placeholder="Command output will be displayed here."
                className="flex-1 resize-none bg-muted/50 font-mono text-xs"
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="pt-4 mt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button>Save</Button>
          <Button>Next</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
