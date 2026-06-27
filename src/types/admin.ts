export interface AuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  date: string;
  time: string;
  details?: string;
}

export interface SystemSettings {
  general: {
    siteName: string;
    contactEmail: string;
    rowsPerPage: number;
  };
  user: {
    allowRegistration: boolean;
    requireEmailVerification: boolean;
  };
  security: {
    passwordMinLength: number;
    sessionTimeoutMinutes: number;
    mfaRequired: boolean;
  };
}
