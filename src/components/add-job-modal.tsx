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
import { Plus, Trash2 } from "lucide-react";
import type { Job } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface AddJobModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddJob: (jobData: Pick<Job, 'command' | 'template'>) => void;
  jobDetails?: Omit<Job, 'id' | 'command' | 'template'>;
}

export default function AddJobModal({ isOpen, onOpenChange, onAddJob, jobDetails }: AddJobModalProps) {
  const { toast } = useToast();
  
  const [command, setCommand] = useState("");
  const [template, setTemplate] = useState("");
  const [isTemplateRun, setIsTemplateRun] = useState(false);

  const handleTemplateChange = (newTemplate: string) => {
    setTemplate(newTemplate);
    if (newTemplate.trim() !== "") {
      if (!isTemplateRun) {
        setIsTemplateRun(true);
        toast({ title: "Template Detected", description: "Rule engine has been enabled." });
      }
    } else {
      setIsTemplateRun(false);
    }
  };

  const handleOpenChangeAndReset = (isOpen: boolean) => {
    if (!isOpen) {
      setCommand("");
      setTemplate("");
      setIsTemplateRun(false);
    }
    onOpenChange(isOpen);
  };
  
  const handleCreateJob = () => {
    onAddJob({
      command: command,
      template: template,
    });
    handleOpenChangeAndReset(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeAndReset}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
           <DialogTitle className="text-xl">Create Job</DialogTitle>
        </DialogHeader>

        {jobDetails && (
          <div className="p-4 border-b bg-muted/50">
            <p className="text-sm">
              <span className="font-semibold text-foreground">{jobDetails.name}:</span>
              <span className="text-muted-foreground ml-2">{jobDetails.description}</span>
            </p>
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0 overflow-hidden">
            {/* Column 1: Command */}
            <div className="flex flex-col border-r">
              <div className="p-4 border-b flex items-center justify-between h-[60px]">
                <h3 className="font-semibold text-base">Command</h3>
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

            {/* Column 2: Template */}
            <div className="flex flex-col border-r">
               <div className="p-4 border-b flex items-center justify-between h-[60px]">
                <h3 className="font-semibold text-base">Template</h3>
              </div>
              <div className="flex-1">
                <Textarea
                  placeholder="Paste your template here. The rule engine will be enabled automatically."
                  className="h-full w-full resize-none border-0 rounded-none p-4 text-sm focus-visible:ring-transparent focus-visible:ring-offset-0"
                  value={template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
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
                    <div className="text-center text-sm text-muted-foreground p-4 border border-dashed rounded-lg h-full flex items-center justify-center">
                        <p>Paste a template to enable the rule engine.</p>
                    </div>
                )}
                
                {isTemplateRun && (
                  <>
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
                  </>
                )}
              </fieldset>
            </div>
        </div>


        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChangeAndReset(false)}>Cancel</Button>
          <Button onClick={handleCreateJob}>Create Job</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
