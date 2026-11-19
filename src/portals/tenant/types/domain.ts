export interface Domain {
  id: string;
  name: string;
  image: any;
  slug?: string;
  description?: string | null;
  is_active: boolean;
  categories_count?: number;
  categories?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface DomainPayload {
  name: string;
  image: any;
  description?: string | null;
  is_active?: boolean;
}

export interface PaginatedDomainsResponse {
  data: Domain[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}
