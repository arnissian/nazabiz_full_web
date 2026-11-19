export interface Language {
  id: string;
  name: string;
  flag: string;
  code: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LanguagePayload {
  name: string;
  flag: string;
  code: string;
  is_active?: boolean;
}

export interface LanguageQueryParams {
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface PaginatedLanguagesResponse {
  current_page: number;
  data: Language[];
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}
