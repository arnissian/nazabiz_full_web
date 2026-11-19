export interface Brand {
  id: string;
  name: string;
  slug?: string;
  image?: string | null;
  description?: string | null;
  is_active: boolean;
  products_count?: number;
  products?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface BrandPayload {
  name: string;
  image?: any;
  description?: string | null;
  is_active?: boolean;
}

export interface BrandQueryParams {
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface PaginatedBrandsResponse {
  current_page: number;
  data: Brand[];
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}
