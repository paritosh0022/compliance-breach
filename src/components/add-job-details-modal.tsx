
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
import type { Job } from "@/lib/types";
import { useEffect } from "react";

const jobDetailsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type JobDetailsFormValues = z.infer<typeof jobDetailsSchema>;

interface AddJobDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onContinue: (data: Omit<Job, 'id' | 'command' | 'template'>) => void;
  onSave?: (data: Omit<Job, 'id' | 'command' | 'template'>, id: string) => void;
  jobToEdit?: Job | null;
}

export default function AddJobDetailsModal({ isOpen, onOpenChange, onContinue, onSave, jobToEdit }: AddJobDetailsModalProps) {
  const form = useForm<JobDetailsFormValues>({
    resolver: zodResolver(jobDetailsSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  const isEditing = !!jobToEdit;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        form.reset({
          name: jobToEdit.name,
          description: jobToEdit.description || "",
        });
      } else {
        form.reset({ name: "", description: "" });
      }
    }
  }, [isOpen, isEditing, jobToEdit, form]);

  const handleSubmit = (data: JobDetailsFormValues) => {
    onContinue(data);
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
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Job' : 'Create New Job'}</DialogTitle>
              <DialogDescription>
                {isEditing 
                    ? 'Edit the job name and description below.'
                    : 'First, give your new job a name and an optional description.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CIS Benchmark Check" {...field} />
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the purpose of this job..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              {isEditing ? (
                <>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                  <Button type="button" onClick={form.handleSubmit(data => onSave!(data, jobToEdit.id))}>Save</Button>
                  <Button type="submit">Continue Edit</Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit">Continue</Button>
                </>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
