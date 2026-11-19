export interface Devise {
  id: string;
  tenant_id?: string;
  store_id?: string;
  name: string;
  symbol: string;
  code: string;
  rate: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type DeviseScope = 'tenant' | 'store' | 'platform';

export interface DevisePayload {
  name: string;
  symbol: string;
  code: string;
  rate: number;
  is_active?: boolean;
}

export interface DeviseQueryParams {
  search?: string;
  is_active?: boolean;
  store_id?: string;
  page?: number;
  per_page?: number;
}

export interface PaginatedDevisesResponse {
  current_page: number;
  data: Devise[];
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}
