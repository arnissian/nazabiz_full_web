import type { Domain } from '../../tenant/types/domain';

export interface Category {
  id: string;
  domain_id: string;
  name: string;
  slug?: string;
  image?: string | null;
  description?: string | null;
  is_active: boolean;
  domain?: Domain;
  subcategories_count?: number;
  subcategories?: any[];
  products_count?: number;
  products?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface CategoryPayload {
  domain_id: string;
  name: string;
  image?: any;
  description?: string | null;
  is_active?: boolean;
}

export interface CategoryQueryParams {
  search?: string;
  domain_id?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface PaginatedCategoriesResponse {
  current_page: number;
  data: Category[];
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}
