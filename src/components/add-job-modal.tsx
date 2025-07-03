"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Copy, Download, Plus, Trash2 } from "lucide-react";
import type { Job } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface AddJobModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddJob: (job: Omit<Job, "id">) => void;
}

export default function AddJobModal({ isOpen, onOpenChange, onAddJob }: AddJobModalProps) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  
  // Job-wide state
  const [jobName, setJobName] = useState("");

  // Step 1 State
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  
  // Step 2 State
  const [template, setTemplate] = useState("");
  const [templateOutput, setTemplateOutput] = useState("");
  const [isTemplateRun, setIsTemplateRun] = useState(false);

  const handleRunCommand = () => {
    setOutput(`Running command: "${command}"...\n\n(Mock Output)\nCommand syntax is valid.\nVerification complete.`);
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
      link.setAttribute("download", "command_output.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Success", description: "Output downloaded as CSV." });
    }
  };
  
  const handleRunTemplate = () => {
    setTemplateOutput(`Running template...\n\n(Mock Output)\nTemplate applied successfully.\nRule engine is now enabled.`);
    setIsTemplateRun(true);
    toast({ title: "Success", description: "Template run successfully." });
  };
  
  const handleOpenChangeAndReset = (isOpen: boolean) => {
    if (!isOpen) {
      setStep(1);
      setCommand("");
      setOutput("");
      setTemplate("");
      setTemplateOutput("");
      setIsTemplateRun(false);
      setJobName("");
    }
    onOpenChange(isOpen);
  };
  
  const handleCreateJob = () => {
    if (!jobName) {
      toast({
        variant: "destructive",
        title: "Job Name Required",
        description: "Please enter a name for the job.",
      });
      return;
    }
    onAddJob({
      name: jobName,
      command: command,
      template: template,
    });
    handleOpenChangeAndReset(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeAndReset}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
           <div className="flex items-center gap-4">
            <DialogTitle className="text-xl whitespace-nowrap">Create Job (Step {step} of 2)</DialogTitle>
             <Input 
                id="job-name" 
                placeholder="Job Name (e.g., CIS Benchmark Check)" 
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                className="h-9"
             />
           </div>
        </DialogHeader>

        {step === 1 && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
            {/* Column 1: Command */}
            <div className="flex flex-col border-r">
              <div className="p-4 border-b flex items-center justify-between h-[60px]">
                <h3 className="font-semibold text-base">Command</h3>
                <Button size="sm" onClick={handleRunCommand} disabled={!command}>
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </Button>
              </div>
              <div className="flex-1">
                <Textarea
                  placeholder="Enter command to run, e.g., 'show version'"
                  className="h-full w-full resize-none border-0 rounded-none p-4 text-sm focus-visible:ring-transparent focus-visible:ring-offset-0"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                />
              </div>
            </div>

            {/* Column 2: Output */}
            <div className="flex flex-col">
              <div className="p-4 border-b flex items-center justify-between h-[60px]">
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
              <div className="p-4 border-b flex items-center justify-between h-[60px]">
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

            {/* Column 2: Template Output */}
            <div className="flex flex-col border-r">
              <div className="p-4 border-b flex items-center justify-between h-[60px]">
                <h3 className="font-semibold text-base">Template Output</h3>
              </div>
              <div className="flex-1">
                 <Textarea
                  readOnly
                  value={templateOutput}
                  placeholder="Template engine output will be displayed here."
                  className="h-full w-full resize-none border-0 rounded-none bg-muted/50 p-4 font-mono text-xs focus-visible:ring-transparent focus-visible:ring-offset-0"
                />
              </div>
            </div>
            
            {/* Column 3: Rule Engine */}
            <div className="flex flex-col">
              <div className="p-4 border-b flex items-center justify-between h-[60px]">
                <h3 className="font-semibold text-base">Rule Engine</h3>
              </div>
              <fieldset disabled={!isTemplateRun} className="flex-1 p-4 space-y-4 overflow-y-auto">
                {!isTemplateRun && (
                    <div className="text-xs text-muted-foreground text-center p-4 border border-dashed rounded-lg">
                        Run a template to enable the rule engine.
                    </div>
                )}
                
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
            
          </div>
        )}


        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChangeAndReset(false)}>Cancel</Button>
          {step === 1 ? (
            <Button onClick={() => setStep(2)}>Next</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>Previous</Button>
              <Button onClick={handleCreateJob}>Create Job</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
