
"use client";

import { useEffect } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const accountSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email(),
  currentPassword: z.string(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
})
.refine(data => {
    // if new password is provided, current password is required
    if (data.newPassword) return !!data.currentPassword;
    return true;
}, {
    message: "Current password is required to set a new one.",
    path: ["currentPassword"],
})
.refine(data => {
    // if new password is provided, it must be at least 8 chars
    if (data.newPassword) return data.newPassword.length >= 8;
    return true;
}, {
    message: "New password must be at least 8 characters long.",
    path: ["newPassword"],
})
.refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ["confirmPassword"],
});


export default function MyAccountModal({ isOpen, onOpenChange, onUserUpdate }) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      fullName: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    if (isOpen) {
      const storedUser = localStorage.getItem('userAccount');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        form.reset({
          fullName: user.fullName,
          email: user.email,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
    }
  }, [isOpen, form]);

  const onSubmit = (data) => {
    const storedUser = localStorage.getItem('userAccount');
    if (!storedUser) {
        toast({ variant: "destructive", title: "Error", description: "Could not find user account." });
        return;
    }
    const user = JSON.parse(storedUser);

    // If only name is being updated
    if (!data.newPassword && data.fullName !== user.fullName) {
        if (!data.currentPassword) {
            form.setError("currentPassword", { type: "manual", message: "Current password is required to update your name." });
            return;
        }
    }
    
    // Verify current password if any changes are being made
    if (data.currentPassword && data.currentPassword !== user.password) {
      form.setError("currentPassword", { type: "manual", message: "Incorrect current password." });
      return;
    }
    
    const updatedUser = { ...user };
    let changesMade = false;

    if (data.fullName !== user.fullName) {
        updatedUser.fullName = data.fullName;
        changesMade = true;
    }

    if (data.newPassword) {
        updatedUser.password = data.newPassword;
        changesMade = true;
    }

    if (!changesMade) {
        toast({ title: "No Changes", description: "You haven't made any changes." });
        onOpenChange(false);
        return;
    }
    
    localStorage.setItem('userAccount', JSON.stringify(updatedUser));
    onUserUpdate(updatedUser); // Update parent component state
    toast({ title: "Success", description: "Your account details have been updated." });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>My Account</DialogTitle>
          <DialogDescription>
            Update your account details here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter current password to make changes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Leave blank to keep current password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
