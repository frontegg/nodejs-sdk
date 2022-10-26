export type SortDirection = 'ASC' | 'DESC';

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface SortParams<T> {
  sortBy: T;
  sortDirection: SortDirection;
}

export interface QueryParams {
  pagination: PaginationParams;
  sort: SortParams<unknown>;
}
