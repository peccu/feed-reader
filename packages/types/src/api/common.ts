export interface ListResponse<T> {
  items: T[];
  total: number;
}

export interface ErrorResponse {
  error: string;
  code?: string;
}
