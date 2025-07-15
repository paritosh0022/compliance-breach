
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
  const [scanCounter, setScanCounter] = useLocalStorageState('scanCounter', 1);

  const getNextScanId = () => {
    const id = `Scan ${scanCounter}`;
    setScanCounter(prev => prev + 1);
    return id;
  };

  const onRunComplete = useCallback((logEntry) => {
    const scanId = getNextScanId();
    const newLogEntry = { ...logEntry, id: crypto.randomUUID(), scanId, timestamp: new Date().toISOString() };
    setComplianceLog(prev => [newLogEntry, ...prev]);
  }, [setComplianceLog, getNextScanId]);

  const value = {
    isComplianceModalOpen,
    setIsComplianceModalOpen,
    isComplianceRunning,
    setIsComplianceRunning,
    complianceStatus,
    setComplianceStatus,
    complianceLog,
    onRunComplete,
    complianceRunProcess,
    setComplianceRunProcess,
    getNextScanId,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
