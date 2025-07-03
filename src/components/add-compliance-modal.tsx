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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Play, Copy, Download, Plus, Trash2 } from "lucide-react";
import type { Device } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddComplianceModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  devices: Device[];
}

export default function AddComplianceModal({ isOpen, onOpenChange, devices }: AddComplianceModalProps) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  
  // Step 1 State
  const [searchTerm, setSearchTerm] = useState("");
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  
  // Step 2 State
  const [template, setTemplate] = useState("");
  const [ruleOutput, setRuleOutput] = useState("");
  const [isTemplateRun, setIsTemplateRun] = useState(false);

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
  
  const handleRunTemplate = () => {
    setRuleOutput(`Running template...\n\n(Mock Output)\nTemplate applied successfully.\nRule engine is now enabled.`);
    setIsTemplateRun(true);
    toast({ title: "Success", description: "Template run successfully." });
  };
  
  // Reset state when modal is closed or opened
  const handleOpenChangeAndReset = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset all state to initial values
      setStep(1);
      setSearchTerm("");
      setCommand("");
      setOutput("");
      setSelectedDevices([]);
      setTemplate("");
      setRuleOutput("");
      setIsTemplateRun(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeAndReset}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b space-y-4">
          <div>
            <DialogTitle className="text-xl">Create Compliance Rule (Step {step} of 2)</DialogTitle>
            <DialogDescription>
              {step === 1
                ? "Configure and run compliance checks against your devices."
                : "Define template and rules for compliance validation."}
            </DialogDescription>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="compliance-name" placeholder="Compliance Name (e.g., CIS Benchmark Check)" />
            <Input id="compliance-description" placeholder="Optional description for this rule" />
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 overflow-hidden">
            {/* Column 1: Devices */}
            <div className="flex flex-col border-r">
              <div className="p-4 border-b flex items-center justify-between gap-4 h-[73px]">
                <h3 className="font-semibold text-base whitespace-nowrap">Devices ({selectedDevices.length}/{devices.length})</h3>
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search devices..."
                    className="pl-9 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
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
            </div>

            {/* Column 2: Command */}
            <div className="flex flex-col border-r">
              <div className="p-4 border-b flex items-center justify-between h-[73px]">
                <h3 className="font-semibold text-base">Command</h3>
                <Button size="sm" onClick={handleRunCommand} disabled={!command || selectedDevices.length === 0}>
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </Button>
              </div>
              <div className="flex-1">
                <Textarea
                  placeholder="Enter command to run on selected devices, e.g., 'show version'"
                  className="h-full w-full resize-none border-0 rounded-none p-4 text-sm focus-visible:ring-transparent focus-visible:ring-offset-0"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                />
              </div>
            </div>

            {/* Column 3: Output */}
            <div className="flex flex-col">
              <div className="p-4 border-b flex items-center justify-between h-[73px]">
                <h3 className="font-semibold text-base">Output</h3>
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
              </div>
              <div className="flex-1">
                <Textarea
                  readOnly
                  value={output}
                  placeholder="Command output will be displayed here."
                  className="h-full w-full resize-none border-0 rounded-none bg-muted/50 p-4 font-mono text-xs focus-visible:ring-transparent focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 overflow-hidden">
            {/* Column 1: Template */}
            <div className="flex flex-col border-r">
              <div className="p-4 border-b flex items-center justify-between h-[73px]">
                <h3 className="font-semibold text-base">Template</h3>
                <Button size="sm" onClick={handleRunTemplate} disabled={!template}>
                  <Play className="mr-2 h-4 w-4" />
                  Run Template
                </Button>
              </div>
              <div className="flex-1">
                <Textarea
                  placeholder="Enter template text here..."
                  className="h-full w-full resize-none border-0 rounded-none p-4 text-sm focus-visible:ring-transparent focus-visible:ring-offset-0"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                />
              </div>
            </div>

            {/* Column 2: Rule Engine */}
            <div className="flex flex-col border-r">
              <div className="p-4 border-b flex items-center justify-between h-[73px]">
                <h3 className="font-semibold text-base">Rule Engine</h3>
              </div>
              <fieldset disabled={!isTemplateRun} className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div className="text-xs text-muted-foreground text-center p-4 border border-dashed rounded-lg">
                  {isTemplateRun 
                    ? "Build your rules below."
                    : "Run a template to enable the rule engine."}
                </div>
                
                {/* Mock Rule UI */}
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="and">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="and">AND</SelectItem>
                        <SelectItem value="or">OR</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Add Group</Button>
                  </div>
                </div>
                <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Input placeholder="Variable (e.g., 'version')" />
                      <Select defaultValue="contains">
                        <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="not-contains">Does not contain</SelectItem>
                          <SelectItem value="equals">Equals</SelectItem>
                        </SelectContent>
                      </Select>
                       <Input placeholder="Value (e.g., '12.4')" />
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                     <Button variant="link" size="sm" className="p-0 h-auto"><Plus className="mr-2 h-4 w-4" /> Add Rule</Button>
                </div>

              </fieldset>
            </div>
            
            {/* Column 3: Rule Output */}
            <div className="flex flex-col">
              <div className="p-4 border-b flex items-center justify-between h-[73px]">
                <h3 className="font-semibold text-base">Rule Output</h3>
              </div>
              <div className="flex-1">
                 <Textarea
                  readOnly
                  value={ruleOutput}
                  placeholder="Rule engine output will be displayed here."
                  className="h-full w-full resize-none border-0 rounded-none bg-muted/50 p-4 font-mono text-xs focus-visible:ring-transparent focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>
        )}


        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChangeAndReset(false)}>Cancel</Button>
          {step === 1 ? (
            <>
              <Button>Save</Button>
              <Button onClick={() => setStep(2)}>Next</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>Previous</Button>
              <Button>Submit</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
