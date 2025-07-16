
"use client";

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { Search, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CompareScansModal({ isOpen, onOpenChange, selectedScans, devices }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [devicePingStatus, setDevicePingStatus] = useState(new Map());
  const [hoveredDeviceId, setHoveredDeviceId] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const { toast } = useToast();

  const comparisonData = useMemo(() => {
    if (!selectedScans || selectedScans.length < 2) return null;

    const allDeviceIds = new Set();
    selectedScans.forEach(scan => {
      scan.results.forEach(result => {
        allDeviceIds.add(result.deviceId);
      });
    });

    const devicesMap = devices.reduce((acc, device) => {
      acc[device.id] = device;
      return acc;
    }, {});

    const scanResultsMap = selectedScans.reduce((acc, scan) => {
      acc[scan.id] = scan.results.reduce((scanAcc, result) => {
        scanAcc[result.deviceId] = result.status;
        return scanAcc;
      }, {});
      return acc;
    }, {});

    const tableRows = Array.from(allDeviceIds).map(deviceId => {
      const device = devicesMap[deviceId];
      const row = {
        deviceId,
        deviceName: device?.name || `Device ID: ${deviceId}`,
      };
      selectedScans.forEach(scan => {
        const deviceStatus = scanResultsMap[scan.id]?.[deviceId];
        row[scan.id] = deviceStatus || 'N/A';
      });
      return row;
    });

    const filteredRows = searchTerm
      ? tableRows.filter(row => row.deviceName.toLowerCase().includes(searchTerm.toLowerCase()))
      : tableRows;

    return {
      scans: selectedScans.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
      rows: filteredRows.sort((a, b) => a.deviceName.localeCompare(b.deviceName)),
    };
  }, [selectedScans, devices, searchTerm]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Success':
        return 'bg-green-500 hover:bg-green-600 text-primary-foreground';
      case 'Failed':
        return 'bg-destructive hover:bg-destructive/80 text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };
  
  const handleOpenChangeAndReset = (open) => {
    onOpenChange(open);
    if (!open) {
      setSearchTerm("");
      setDevicePingStatus(new Map());
      setHoveredDeviceId(null);
      setHoveredCell(null);
    }
  }

  const handlePingDevice = (deviceId) => {
    setDevicePingStatus(prev => new Map(prev).set(deviceId, { pingState: 'pinging' }));

    setTimeout(() => {
      const isSuccess = Math.random() > 0.3; // Simulate success/failure
      
      setDevicePingStatus(prev => new Map(prev).set(deviceId, { 
        pingState: isSuccess ? 'success' : 'failed',
        reachability: isSuccess ? 'Reachable' : 'Unreachable'
      }));
      
      toast({
        title: isSuccess ? "Ping Successful" : "Ping Failed",
        description: isSuccess ? `Device is reachable.` : `Device could not be reached.`,
        variant: isSuccess ? "default" : "destructive",
      });

    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeAndReset}>
      <DialogContent className="max-w-7xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Compare Scan Results</DialogTitle>
          <DialogDescription>
            Comparing {selectedScans.length} selected scans. Devices are listed vertically, and scan results horizontally.
          </DialogDescription>
        </DialogHeader>

        <div className="relative max-w-xs my-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search devices..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="flex-1 min-h-0 border rounded-lg">
            {comparisonData ? (
                <ScrollArea className="h-full">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-background z-10 w-[200px]">Device</TableHead>
                                <TableHead className="w-[150px]">Device Status</TableHead>
                                {comparisonData.scans.map(scan => (
                                    <TableHead key={scan.id} className="text-center">{scan.scanId}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {comparisonData.rows.length > 0 ? comparisonData.rows.map(row => {
                                const pingStatus = devicePingStatus.get(row.deviceId) || { pingState: 'idle', reachability: 'Unreachable' };
                                const isHoveringDevice = hoveredDeviceId === row.deviceId;

                                return (
                                <TableRow 
                                  key={row.deviceId}
                                  onMouseEnter={() => setHoveredDeviceId(row.deviceId)}
                                  onMouseLeave={() => setHoveredDeviceId(null)}
                                >
                                    <TableCell className="font-medium sticky left-0 bg-background z-10">{row.deviceName}</TableCell>
                                    <TableCell>
                                      {isHoveringDevice ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7"
                                          onClick={() => handlePingDevice(row.deviceId)}
                                          disabled={pingStatus.pingState === 'pinging'}
                                        >
                                          {pingStatus.pingState === 'pinging' ? 'Pinging...' : 'Ping Device'}
                                        </Button>
                                      ) : (
                                        <Badge variant={pingStatus.reachability === 'Reachable' ? 'default' : 'secondary'} className={cn('transition-opacity', pingStatus.reachability === 'Reachable' && 'bg-green-500 hover:bg-green-600')}>
                                          {pingStatus.pingState === 'pinging' ? (
                                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                          ) : pingStatus.reachability === 'Reachable' ? (
                                            <Wifi className="mr-2 h-3 w-3" />
                                          ) : (
                                            <WifiOff className="mr-2 h-3 w-3" />
                                          )}
                                          {pingStatus.pingState === 'pinging' ? 'Pinging...' : pingStatus.reachability}
                                        </Badge>
                                      )}
                                    </TableCell>
                                    {comparisonData.scans.map(scan => {
                                      const cellId = `${row.deviceId}-${scan.id}`;
                                      const isHoveringCell = hoveredCell === cellId;
                                      const status = row[scan.id];
                                      const canShowView = (status === 'Success' || status === 'Failed');

                                      return (
                                        <TableCell 
                                          key={cellId} 
                                          className="text-center"
                                          onMouseEnter={() => setHoveredCell(cellId)}
                                          onMouseLeave={() => setHoveredCell(null)}
                                        >
                                            {isHoveringCell && canShowView ? (
                                              <Button variant="outline" size="sm" className="h-7">
                                                View
                                              </Button>
                                            ) : (
                                              <Badge className={cn(getStatusBadgeClass(status))}>
                                                  {status}
                                              </Badge>
                                            )}
                                        </TableCell>
                                    )})}
                                </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={comparisonData.scans.length + 2} className="text-center h-24">
                                        No devices found for your search.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Select at least two scans to compare.</p>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
