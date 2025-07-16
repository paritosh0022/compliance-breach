
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import useLocalStorageState from '@/hooks/use-local-storage-state';

const DashboardContext = createContext(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

export function DashboardProvider({ children }) {
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [isComplianceRunning, setIsComplianceRunning] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState('idle'); // idle, running, completed, failed
  const [complianceLog, setComplianceLog] = useLocalStorageState('complianceLog', []);
  const [complianceRunProcess, setComplianceRunProcess] = useState(null); // To hold the timeout ID
  const [scheduledJobs, setScheduledJobs] = useLocalStorageState('scheduledJobs', []);

  const onRunComplete = useCallback((logEntry) => {
    setComplianceLog(prev => {
      // Add new log entry and sort by timestamp to ensure the newest is first
      const updatedLogs = [...prev, { ...logEntry, id: crypto.randomUUID(), timestamp: new Date().toISOString() }]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Keep only the last 10 scans
      const cappedLogs = updatedLogs.slice(0, 10);
      
      // Re-number the scan IDs from "Scan 01" to "Scan 10"
      const renumberedLogs = cappedLogs.map((log, index) => ({
        ...log,
        scanId: `Scan ${String(cappedLogs.length - index).padStart(2, '0')}`
      })).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return renumberedLogs;
    });
  }, [setComplianceLog]);

  const value = {
    isComplianceModalOpen,
    setIsComplianceModalOpen,
    isComplianceRunning,
    setIsComplianceRunning,
    complianceStatus,
    setComplianceStatus,
    complianceLog,
    setComplianceLog,
    onRunComplete,
    complianceRunProcess,
    setComplianceRunProcess,
    scheduledJobs,
    setScheduledJobs,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
