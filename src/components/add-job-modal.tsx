
"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Plus, Trash2, Expand, Minimize2 } from "lucide-react";
import type { Job } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AddJobModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddJob: (jobData: Pick<Job, 'command' | 'template'>) => void;
  jobDetails?: Partial<Job>;
}

type Rule = {
  id: string;
  variable: string;
  operator: 'contains' | 'not-contains' | 'equals';
  value: string;
};

type RuleGroup = {
  id: string;
  rules: Rule[];
};

export default function AddJobModal({ isOpen, onOpenChange, onAddJob, jobDetails }: AddJobModalProps) {
  const { toast } = useToast();
  
  const [command, setCommand] = useState("");
  const [template, setTemplate] = useState("");
  const [isTemplateRun, setIsTemplateRun] = useState(false);
  const [condition, setCondition] = useState<'and' | 'or'>('and');
  const [groups, setGroups] = useState<RuleGroup[]>([]);
  const [expandedPanel, setExpandedPanel] = useState<'command' | 'template' | 'rule' | null>(null);
  
  const isEditing = jobDetails && jobDetails.command !== undefined;

  const handleTemplateChange = useCallback((newTemplate: string) => {
    setTemplate(newTemplate);
    if (newTemplate.trim() !== "") {
      setIsTemplateRun((currentValue) => {
        if (!currentValue) {
          toast({
            title: "Template Detected",
            description: "Rule engine has been enabled.",
          });
        }
        return true;
      });
      setGroups((g) => {
        if (g.length === 0) {
          return [
            {
              id: crypto.randomUUID(),
              rules: [
                {
                  id: crypto.randomUUID(),
                  variable: "",
                  operator: "contains",
                  value: "",
                },
              ],
            },
          ];
        }
        return g;
      });
    } else {
      setIsTemplateRun(false);
      setGroups([]);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen && jobDetails) {
      setCommand(jobDetails.command || "");
      handleTemplateChange(jobDetails.template || "");
    }
  }, [isOpen, jobDetails, handleTemplateChange]);


  const handleAddGroup = () => {
    setGroups(prev => [...prev, { id: crypto.randomUUID(), rules: [{ id: crypto.randomUUID(), variable: '', operator: 'contains', value: '' }] }]);
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const handleAddRule = (groupId: string) => {
    setGroups(prev => prev.map(g => 
        g.id === groupId 
        ? { ...g, rules: [...g.rules, { id: crypto.randomUUID(), variable: '', operator: 'contains', value: '' }] }
        : g
    ));
  };
  
  const handleDeleteRule = (groupId: string, ruleId: string) => {
    setGroups(prev => prev.map(g => 
        g.id === groupId
        ? { ...g, rules: g.rules.filter(r => r.id !== ruleId) }
        : g
    ).filter(g => g.rules.length > 0)); // Also remove group if it becomes empty
  };
  
  const handleRuleChange = (groupId: string, ruleId: string, field: 'variable' | 'operator' | 'value', value: string) => {
    const newOperator = value as Rule['operator'];
    setGroups(prev => prev.map(g => 
        g.id === groupId
        ? { ...g, rules: g.rules.map(r => r.id === ruleId ? { ...r, [field]: field === 'operator' ? newOperator : value } : r) }
        : g
    ));
  };

  const handleOpenChangeAndReset = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setCommand("");
      setTemplate("");
      setIsTemplateRun(false);
      setGroups([]);
      setCondition('and');
      setExpandedPanel(null);
    }
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
           <DialogTitle className="text-xl">{isEditing ? 'Edit Job' : 'Create Job'}</DialogTitle>
        </DialogHeader>

        {jobDetails && !expandedPanel && (
          <div className="p-4 border-b bg-muted/50">
            <p className="text-sm">
              <span className="font-semibold text-foreground">{jobDetails.name}:</span>
              <span className="text-muted-foreground ml-2">{jobDetails.description}</span>
            </p>
          </div>
        )}

        <div className={cn(
            "flex-1 grid grid-cols-1 gap-0 overflow-hidden",
            expandedPanel === 'command' ? 'md:grid-cols-[1fr_0fr_0fr]' :
            expandedPanel === 'template' ? 'md:grid-cols-[0fr_1fr_0fr]' :
            expandedPanel === 'rule' ? 'md:grid-cols-[0fr_0fr_1fr]' :
            'md:grid-cols-3'
          )}
        >
            {/* Column 1: Command */}
            <div className="flex flex-col border-r overflow-hidden transition-all duration-500 ease-in-out">
              <div className="p-4 border-b flex items-center justify-between h-[60px]">
                <h3 className="font-semibold text-base">Command</h3>
                <Button variant="ghost" size="icon" onClick={() => setExpandedPanel(expandedPanel === 'command' ? null : 'command')} className="h-8 w-8">
                  {expandedPanel === 'command' ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                  <span className="sr-only">{expandedPanel === 'command' ? 'Minimize Command' : 'Expand Command'}</span>
                </Button>
              </div>
              <div className="flex-1 min-h-0">
                <Textarea
                  placeholder="Enter command to run, e.g., 'show version'"
                  className="h-full w-full resize-none border-0 rounded-none p-4 text-sm focus-visible:ring-transparent focus-visible:ring-offset-0"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                />
              </div>
            </div>

            {/* Column 2: Template */}
            <div className="flex flex-col border-r overflow-hidden transition-all duration-500 ease-in-out">
               <div className="p-4 border-b flex items-center justify-between h-[60px]">
                <h3 className="font-semibold text-base">Template</h3>
                <Button variant="ghost" size="icon" onClick={() => setExpandedPanel(expandedPanel === 'template' ? null : 'template')} className="h-8 w-8">
                  {expandedPanel === 'template' ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                  <span className="sr-only">{expandedPanel === 'template' ? 'Minimize Template' : 'Expand Template'}</span>
                </Button>
              </div>
              <div className="flex-1 min-h-0">
                <Textarea
                  placeholder="Paste your template here. The rule engine will be enabled automatically."
                  className="h-full w-full resize-none border-0 rounded-none p-4 text-sm focus-visible:ring-transparent focus-visible:ring-offset-0"
                  value={template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                />
              </div>
            </div>
            
            {/* Column 3: Rule Engine */}
            <div className="flex flex-col min-h-0">
              <div className="p-4 border-b flex items-center justify-between h-[60px]">
                <h3 className="font-semibold text-base">Rule Engine</h3>
                 <Button variant="ghost" size="icon" onClick={() => setExpandedPanel(expandedPanel === 'rule' ? null : 'rule')} className="h-8 w-8">
                  {expandedPanel === 'rule' ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                  <span className="sr-only">{expandedPanel === 'rule' ? 'Minimize Rule Engine' : 'Expand Rule Engine'}</span>
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <fieldset disabled={!isTemplateRun} className="p-4 space-y-4">
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
                          <Select value={condition} onValueChange={(v: 'and' | 'or') => setCondition(v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="and">AND</SelectItem>
                              <SelectItem value="or">OR</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" onClick={handleAddGroup}><Plus className="mr-2 h-4 w-4" /> Add Group</Button>
                        </div>
                      </div>
                      {groups.map((group, groupIndex) => (
                        <div key={group.id}>
                          <div className="p-4 border rounded-lg space-y-4 bg-muted/20 relative">
                            {groups.length > 1 && (
                                <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleDeleteGroup(group.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                  <span className="sr-only">Delete Group</span>
                                </Button>
                              )}
                            {group.rules.map((rule) => (
                              <div key={rule.id} className="flex items-center gap-2">
                                  <Input 
                                    placeholder="Variable (e.g., 'version')" 
                                    value={rule.variable}
                                    onChange={(e) => handleRuleChange(group.id, rule.id, 'variable', e.target.value)}
                                  />
                                  <Select 
                                    value={rule.operator}
                                    onValueChange={(v) => handleRuleChange(group.id, rule.id, 'operator', v)}
                                  >
                                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="contains">Contains</SelectItem>
                                      <SelectItem value="not-contains">Does not contain</SelectItem>
                                      <SelectItem value="equals">Equals</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input 
                                    placeholder="Value (e.g., '12.4')" 
                                    value={rule.value}
                                    onChange={(e) => handleRuleChange(group.id, rule.id, 'value', e.target.value)}
                                  />
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(group.id, rule.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Delete Rule</span>
                                  </Button>
                                </div>
                            ))}
                            <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handleAddRule(group.id)}><Plus className="mr-2 h-4 w-4" /> Add Rule</Button>
                          </div>
                          {groupIndex < groups.length - 1 && (
                            <div className="flex justify-center my-2">
                              <Badge variant="secondary" className="uppercase">{condition}</Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </fieldset>
              </ScrollArea>
            </div>
        </div>


        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChangeAndReset(false)}>Cancel</Button>
          <Button onClick={handleCreateJob}>{isEditing ? 'Save Changes' : 'Create Job'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    