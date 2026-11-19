import type { Category } from '../../shared/types/category';

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug?: string;
  image?: string | null;
  description?: string | null;
  is_active: boolean;
  category?: Category;
  products_count?: number;
  products?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface SubcategoryPayload {
  category_id: string;
  name: string;
  image?: any;
  description?: string | null;
  is_active?: boolean;
}

export interface SubcategoryQueryParams {
  search?: string;
  category_id?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface PaginatedSubcategoriesResponse {
  current_page: number;
  data: Subcategory[];
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}
