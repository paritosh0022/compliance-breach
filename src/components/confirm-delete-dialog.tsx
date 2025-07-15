
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
  const description =
    itemType === 'log'
      ? `This action cannot be undone. This will permanently delete all ${itemCount} compliance log entr${itemCount > 1 ? 'ies' : 'y'}.`
      : `This action cannot be undone. This will permanently delete the selected ${itemCount} ${itemType}${itemCount > 1 ? 's' : ''}.`;
      
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
