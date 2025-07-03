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
  command?: string;
  template?: string;
};

export type ComplianceRun = {
  id: string;
  name: string;
  description: string;
};
