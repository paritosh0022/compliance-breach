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

export type ComplianceLog = {
  id: string;
  complianceName: string;
  timestamp: string;
  status: 'Success' | 'Failed' | 'Partial Success';
  details: string;
  devicesCount: number;
  jobsCount: number;
};
