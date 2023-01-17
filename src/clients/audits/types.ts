import { SortDirection } from '../../types';

export interface Audit {
  severity: AuditSeverity;
  ip?: string;
  email?: string;
  action?: string;
  description?: string;
  userAgent?: string;
  vendorId: string;
  tenantId: string;
  frontegg_id: string;
  createdAt: string;
  updatedAt: string;
}

export type AuditSeverity = 'Info' | 'Medium' | 'High' | 'Critical' | 'Error';

export type SendAuditParams = Pick<Audit, 'tenantId' | 'severity'> & Record<string, unknown>;

export type AuditSortField = keyof Audit;

export interface AuditRequestParams {
  tenantId: string;
  filter?: string;
  sortBy?: AuditSortField;
  sortDirection?: SortDirection;
  offset: number;
  count: number;
  filters?: any;
}

export interface GetAuditStatsParams {
  tenantId: string;
  filters?: any;
}
