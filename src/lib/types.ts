
export type Device = {
  id: string;
  name: string;
  ipAddress: string;
  username: string;
  password?: string;
  port: string;
};

export type Job = {
  id: string;
  name: string;
  description?: string;
  command?: string;
  template?: string;
};

export type ComplianceRun = {
  id: string;
  name: string;
  description: string;
};

export type ComplianceRunResult = {
  deviceId: string;
  deviceName: string;
  deviceIpAddress: string;
  jobId: string;
  jobName: string;
  status: 'Success' | 'Failed';
  message: string;
};

export type ComplianceLog = {
  id: string;
  timestamp: string;
  results: ComplianceRunResult[];
};
