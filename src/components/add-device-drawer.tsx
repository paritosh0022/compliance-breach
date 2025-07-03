
"use client";

import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
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
import type { Device } from "@/lib/types";

const baseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ipAddress: z.string().ip({ message: "Invalid IP address" }),
  username: z.string().min(1, "Username is required"),
  port: z.string().refine(val => {
    const portNum = parseInt(val, 10);
    return !isNaN(portNum) && portNum > 0 && portNum < 65536;
  }, "Invalid port number"),
});

const addDeviceSchema = baseSchema.extend({
  password: z.string().min(1, "Password is required"),
});

const editDeviceSchema = baseSchema.extend({
  password: z.string().optional(),
});

type DeviceFormValues = z.infer<typeof addDeviceSchema>;

interface AddDeviceDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaveDevice: (device: Omit<Device, 'id' | 'password'> & { password?: string }, id?: string) => void;
  deviceToEdit?: Device | null;
}

export default function AddDeviceDrawer({ isOpen, onOpenChange, onSaveDevice, deviceToEdit }: AddDeviceDrawerProps) {
  const isEditing = !!deviceToEdit;
  
  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(isEditing ? editDeviceSchema : addDeviceSchema),
    defaultValues: {
      name: "",
      ipAddress: "",
      username: "",
      password: "",
      port: "22",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        form.reset({
          name: deviceToEdit.name,
          ipAddress: deviceToEdit.ipAddress,
          username: deviceToEdit.username,
          port: deviceToEdit.port,
          password: "",
        });
      } else {
        form.reset({
          name: "",
          ipAddress: "",
          username: "",
          password: "",
          port: "22",
        });
      }
    }
  }, [isOpen, isEditing, deviceToEdit, form]);

  const onSubmit = (data: DeviceFormValues) => {
    const dataToSave = { ...data };
    // If editing and password is blank, don't send the password field so it isn't updated
    if (isEditing && !data.password) {
      delete (dataToSave as Partial<typeof dataToSave>).password;
    }
    onSaveDevice(dataToSave, deviceToEdit?.id);
  };
  
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      form.reset();
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <SheetHeader>
              <SheetTitle>{isEditing ? 'Edit Device' : 'Add a New Device'}</SheetTitle>
              <SheetDescription>
                {isEditing ? 'Update the details of the device.' : 'Enter the details of the device you want to add.'}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 py-6 space-y-4 overflow-y-auto">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., core-router-01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ipAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 192.168.1.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={isEditing ? 'Leave blank to keep current password' : ''} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 22" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </SheetClose>
              <Button type="submit">{isEditing ? 'Save Changes' : 'Add Device'}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
