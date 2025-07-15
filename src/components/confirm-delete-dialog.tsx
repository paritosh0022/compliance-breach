
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

export default function ConfirmDeleteDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  itemType = "item",
  itemCount = 1,
}) {
  let description = `This action cannot be undone. This will permanently delete the selected ${itemCount} ${itemType}${itemCount > 1 ? 's' : ''}.`;
      
  if (itemType === 'log') {
    description = `This action cannot be undone. This will permanently delete the selected ${itemCount} log group${itemCount > 1 ? 's' : ''}.`;
  } else if (itemType === 'schedule') {
    description = 'This action cannot be undone. This will permanently delete the scheduled job.';
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className={buttonVariants({ variant: "destructive" })}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
