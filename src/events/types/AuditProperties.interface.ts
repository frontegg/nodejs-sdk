export interface IAuditProperties {
  // Set audit creation time, default value is the time audit accepted.
  createdAt?: Date;

  // Set audit severity, default value is "Info".
  severity?: 'Info' | 'Medium' | 'High' | 'Critical';

  // Additional fields the audit might contain.
  [key: string]: any;
}
