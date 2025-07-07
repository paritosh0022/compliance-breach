
"use client";

import { useState } from 'react';
import Papa from 'papaparse';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const deviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  ipAddress: z.string().ip({ message: "Invalid IP address" }),
  username: z.string().min(1, "Username is required"),
  password: z.string().optional(),
  port: z.string().refine(val => {
    const portNum = parseInt(val, 10);
    return !isNaN(portNum) && portNum > 0 && portNum < 65536;
  }, "Invalid port number"),
});

const CSV_HEADERS = ['name', 'ipAddress', 'username', 'password', 'port'];

export default function ImportDevicesModal({ isOpen, onOpenChange, onImport }) {
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  
  const handleFileChange = (event) => {
    setError(null);
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    } else {
        setFile(null);
    }
  };

  const handleImport = () => {
    if (!file) {
      setError("Please select a file to import.");
      return;
    }
    
    setIsParsing(true);
    setError(null);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsParsing(false);
        const headers = results.meta.fields || [];
        if(!CSV_HEADERS.every(h => headers.includes(h))) {
            setError(`Invalid CSV headers. Expected headers are: ${CSV_HEADERS.join(', ')}.`);
            return;
        }

        const newDevices = [];
        const validationErrors = [];

        results.data.forEach((row, index) => {
          const parsed = deviceSchema.safeParse(row);
          if (parsed.success) {
            newDevices.push(parsed.data);
          } else {
            validationErrors.push(`Row ${index + 2}: ${parsed.error.issues.map(i => `${i.path[0]} - ${i.message}`).join(', ')}`);
          }
        });

        if (validationErrors.length > 0) {
          setError(`Validation failed for some rows:\n${validationErrors.slice(0, 5).join('\n')}${validationErrors.length > 5 ? '\n...' : ''}`);
          return;
        }

        if (newDevices.length === 0) {
          setError("No valid devices found in the CSV file.");
          return;
        }

        onImport(newDevices);
        toast({
            title: "Import Successful",
            description: `${newDevices.length} devices have been imported.`
        })
        handleClose();
      },
      error: (err) => {
        setIsParsing(false);
        setError(err.message);
      }
    });
  };

  const handleDownloadSample = () => {
    const sampleCsv = `${CSV_HEADERS.join(',')}\ncore-router-01,192.168.1.1,admin,password123,22\ndc-switch-02,10.0.0.5,cisco,secretpass,22`;
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample-devices.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleClose = () => {
    setFile(null);
    setError(null);
    setIsParsing(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Devices from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with device information to add them in bulk.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="csv-file">CSV File</Label>
                <div className="flex items-center gap-2">
                    <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
                </div>
            </div>
            
            <Button variant="link" className="p-0 h-auto" onClick={handleDownloadSample}>
                <Download className="mr-2 h-4 w-4" />
                Download Sample CSV
            </Button>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Import Error</AlertTitle>
                    <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
                </Alert>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={!file || isParsing}>
            {isParsing ? 'Importing...' : 'Import Devices'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
