"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { ComplianceRun } from "@/lib/types";

const complianceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
});

type ComplianceFormValues = z.infer<typeof complianceSchema>;

interface AddComplianceModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (data: Omit<ComplianceRun, 'id'>) => void;
  onSaveAndRun: (data: Omit<ComplianceRun, 'id'>) => void;
}

export default function AddComplianceModal({ isOpen, onOpenChange, onSave, onSaveAndRun }: AddComplianceModalProps) {
  const form = useForm<ComplianceFormValues>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleSave = (data: ComplianceFormValues) => {
    onSave(data);
    form.reset();
  };
  
  const handleSaveAndRun = (data: ComplianceFormValues) => {
    onSaveAndRun(data);
    form.reset();
  };
  
  const handleOpenChangeAndReset = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeAndReset}>
      <DialogContent className="sm:max-w-lg">
        <Form {...form}>
          <form>
            <DialogHeader>
              <DialogTitle>Add Compliance</DialogTitle>
              <DialogDescription>
                Create a new compliance check. You can save it for later or run it immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compliance Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., PCI DSS Check Q1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the purpose of this compliance check..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="button" onClick={form.handleSubmit(handleSave)}>Save</Button>
              <Button type="submit" onClick={form.handleSubmit(handleSaveAndRun)}>Save & Run</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
