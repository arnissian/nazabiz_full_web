import axiosInstance from '../../shared/services/api/axiosInterceptor';
import type { Domain, DomainPayload, PaginatedDomainsResponse, ApiResponse } from '../types/domain';

export const domainService = {
  // Liste paginée & filtrée des domaines
  getDomains: async (params?: { search?: string; is_active?: boolean; page?: number; per_page?: number }) => {
    const response = await axiosInstance.get<ApiResponse<PaginatedDomainsResponse>>('/domains', { params });
    return response.data;
  },

  // Recherche de domaines
  searchDomains: async (searchQuery: string) => {
    const response = await axiosInstance.get<ApiResponse<PaginatedDomainsResponse>>('/domains', {
      params: { search: searchQuery }
    });
    return response.data;
  },

  // Détail d'un domaine par ID
  getDomainById: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse<Domain>>(`/domains/${id}`);
    return response.data;
  },

  // Créer un domaine
  createDomain: async (payload: DomainPayload) => {
    const response = await axiosInstance.post<ApiResponse<Domain>>('/domains', payload);
    return response.data;
  },

  // Modifier un domaine
  updateDomain: async (id: string, payload: DomainPayload) => {
    const response = await axiosInstance.put<ApiResponse<Domain>>(`/domains/${id}`, payload);
    return response.data;
  },

  // Supprimer un domaine
  deleteDomain: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(`/domains/${id}`);
    return response.data;
  }
};
