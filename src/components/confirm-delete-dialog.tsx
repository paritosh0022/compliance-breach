
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

export default function ConfirmDeleteDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  itemType = "item",
  itemCount = 1,
  title = "Are you absolutely sure?",
  continueText = "Delete",
  isDestructive = true,
}) {
  let description;
  if (itemType === "application data") {
    description = "This action cannot be undone. This will permanently delete all application data, including devices, jobs, and logs. You will be redirected to the setup page."
  } else if (itemType === 'log') {
    description = `This action cannot be undone. This will permanently delete the selected ${itemCount} log group${itemCount > 1 ? 's' : ''}.`;
  } else if (itemType === 'schedule') {
    description = `This action cannot be undone. This will permanently delete the scheduled job${itemCount > 1 ? 's' : ''}.`;
  } else if (itemType === 'running-scan') {
    description = "The compliance check is still running. Closing this window will allow the scan to continue in the background. Are you sure you want to close it?";
  } else {
    description = `This action cannot be undone. This will permanently delete the selected ${itemCount} ${itemType}${itemCount > 1 ? 's' : ''}.`;
  }


  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className={cn(isDestructive && buttonVariants({ variant: "destructive" }))}
          >
            {continueText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
