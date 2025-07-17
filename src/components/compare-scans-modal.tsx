
"use client";

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import { useDataTable } from '@/hooks/use-data-table';
import { DataTablePagination } from './data-table-pagination';
import { Card, CardContent } from './ui/card';

export default function CompareScansModal({ isOpen, onOpenChange, selectedScans, devices, jobs, onViewDetails }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredCell, setHoveredCell] = useState(null);

  const comparisonData = useMemo(() => {
    if (!selectedScans || selectedScans.length < 1) return null;

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

    let passedCount = 0;
    let failedCount = 0;

    const tableRows = Array.from(allDeviceIds).map(deviceId => {
      const device = devicesMap[deviceId];
      const row = {
        deviceId,
        deviceName: device?.name || `Device ID: ${deviceId}`,
      };
      let deviceFailed = false;
      selectedScans.forEach(scan => {
        const deviceStatus = scanResultsMap[scan.id]?.[deviceId];
        row[scan.id] = deviceStatus || 'N/A';
        if (deviceStatus === 'Failed') {
            deviceFailed = true;
        }
      });

      if (deviceFailed) {
        failedCount++;
      } else {
        passedCount++;
      }

      return row;
    });
    
    return {
      scans: selectedScans.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
      rows: tableRows.sort((a, b) => a.deviceName.localeCompare(b.deviceName)),
      stats: {
        scans: selectedScans.length,
        devices: allDeviceIds.size,
        passed: passedCount,
        failed: failedCount,
      }
    };
  }, [selectedScans, devices]);

  const filteredRows = useMemo(() => {
    if (!comparisonData) return [];
    if (!searchTerm) return comparisonData.rows;
    return comparisonData.rows.filter(row => row.deviceName.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [comparisonData, searchTerm]);
  
  const { table } = useDataTable({
    data: filteredRows,
    columns: [], // Columns are defined directly in JSX
    pageCount: Math.ceil(filteredRows.length / 10),
  });

  const paginatedRows = table.getRowModel().rows;
  
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
      setHoveredCell(null);
      table.setPageIndex(0);
    }
  }
  
  const handleViewDetailsClick = (scan, deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    if (scan && device && onViewDetails) {
      onViewDetails(scan, device);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleOpenChangeAndReset}>
      <DialogContent className="max-w-7xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Compare Scans</DialogTitle>
        </DialogHeader>

        {comparisonData && (
          <div className="p-4">
            <Card className="bg-transparent shadow-none border">
              <CardContent className="p-3">
                <div className="flex items-center justify-around text-center flex-wrap gap-4">
                   <div>
                    <p className="text-sm text-muted-foreground">Number of Scans</p>
                    <p className="font-semibold">{comparisonData.stats.scans}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Number of Devices</p>
                    <p className="font-semibold">{comparisonData.stats.devices}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Devices Passed</p>
                    <Badge className="bg-green-500 hover:bg-green-600">{comparisonData.stats.passed}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Devices Failed</p>
                    <Badge variant="destructive">{comparisonData.stats.failed}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="relative w-full px-4 mb-4">
            <Search className="absolute left-6 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search devices..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => table.setPageIndex(0) & setSearchTerm(e.target.value)}
            />
        </div>

        <div className="flex-1 min-h-0 flex flex-col px-4 pb-4">
            {comparisonData ? (
              <>
                <div className="flex-grow border rounded-lg overflow-hidden">
                    <ScrollArea className="h-full">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-background z-10 w-[200px]">Device</TableHead>
                                    {comparisonData.scans.map(scan => (
                                        <TableHead key={scan.id} className="text-center">{scan.scanId}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedRows.length > 0 ? paginatedRows.map(row => {
                                    const deviceRow = row.original;
                                    return (
                                    <TableRow 
                                      key={deviceRow.deviceId}
                                      className="group"
                                    >
                                        <TableCell className="font-medium sticky left-0 bg-background z-10">{deviceRow.deviceName}</TableCell>
                                        {comparisonData.scans.map(scan => {
                                          const cellId = `${deviceRow.deviceId}-${scan.id}`;
                                          const status = deviceRow[scan.id];
                                          const canShowView = (status === 'Success' || status === 'Failed');
                                          const isHovering = hoveredCell === cellId;

                                          return (
                                            <TableCell 
                                              key={cellId} 
                                              className="text-center"
                                              onMouseEnter={() => setHoveredCell(cellId)}
                                              onMouseLeave={() => setHoveredCell(null)}
                                            >
                                                {isHovering && canShowView ? (
                                                  <Button variant="outline" size="sm" className="h-7" onClick={() => handleViewDetailsClick(scan, deviceRow.deviceId)}>
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
                                        <TableCell colSpan={comparisonData.scans.length + 1} className="text-center h-24">
                                            No devices found for your search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
                <DataTablePagination table={table} />
              </>
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Select at least two scans to compare.</p>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
