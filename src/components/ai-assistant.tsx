
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { suggestComponentAction } from '@/app/actions';
import { Sparkles, Bot, ThumbsUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from './ui/card';

const FormSchema = z.object({
  description: z.string().min(10, {
    message: 'Please describe the component in at least 10 characters.',
  }),
});

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: '',
    },
  });

  const {
    handleSubmit,
    register,
    formState: { isSubmitting, errors },
    reset,
  } = form;

  const onSubmit = async (data) => {
    setSuggestion(null);
    try {
      const result = await suggestComponentAction({ description: data.description });
      if (result) {
        setSuggestion(result);
      } else {
        throw new Error('No suggestion was returned.');
      }
    } catch (error) {
      console.error('Error fetching suggestion:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a suggestion. Please try again.",
      });
    }
  };
  
  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
      setSuggestion(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Sparkles className="h-5 w-5" />
          <span className="sr-only">AI Assistant</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Sparkles className="text-primary" />
            AI Component Assistant
          </DialogTitle>
          <DialogDescription>
            Describe the functionality you need, and we'll suggest a component for you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="description">Component Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., 'I need a way to show a list of items that can be expanded and collapsed.'"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
           <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Thinking...' : 'Get Suggestion'}
          </Button>
        </form>

        {isSubmitting && (
          <div className="space-y-4 pt-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        )}

        {suggestion && (
          <div className="pt-4">
             <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-4">
                    <h3 className="text-lg font-semibold font-headline flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        Suggestion
                    </h3>
                    <p className="text-2xl font-bold text-primary">{suggestion.componentSuggestion}</p>
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                            <ThumbsUp className="h-4 w-4" />
                            Reasoning
                        </h4>
                        <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                    </div>
                </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
