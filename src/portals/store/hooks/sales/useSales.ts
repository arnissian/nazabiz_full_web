import{useCallback,useEffect,useState}from'react';import axios from'axios';import axiosInstance from'../../../shared/services/api/axiosInterceptor';import type{PaginationMeta}from'../../../shared/components/common/Pagination';import type{Sale}from'./useSale';

type QueryParams={
  page?:number;
  per_page?:number;
  search?:string;
  date_from?:string;
  date_to?:string;
  status?:'completed'|'cancelled'|'draft';
  payment_status?:'unpaid'|'partially_paid'|'paid';
  returnable?:boolean;
  [key:string]:unknown;
};

const normalizeParams=(params:QueryParams={})=>({
  ...params,
  page: Math.max(1, Number(params.page ?? 1) || 1),
  per_page: Math.max(1, Number(params.per_page ?? 5) || 5),
});

export const useSales=(initialParams:QueryParams={page:1,per_page:5})=>{const[sales,setSales]=useState<Sale[]>([]);const[pagination,setPagination]=useState<PaginationMeta|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState<string|null>(null);const[params,setParams]=useState<QueryParams>(()=>normalizeParams(initialParams));const fetchData=useCallback(async()=>{const safeParams=normalizeParams(params);try{setLoading(true);setError(null);const hasFilters=Boolean(safeParams.search||safeParams.date_from||safeParams.date_to||safeParams.status||safeParams.payment_status);const endpoint=safeParams.returnable?'/sales/returnable':hasFilters?'/sales/search':'/sales';const r=await axiosInstance.get(endpoint,{params:safeParams});const p=r.data?.data;setSales(Array.isArray(p)?p:p?.data||[]);setPagination(Array.isArray(p)||!p?null:p as PaginationMeta);}catch(e:unknown){const message=axios.isAxiosError(e)&&typeof e.response?.data?.message==='string'?e.response.data.message:'Erreur lors de la récupération des données';setError(message);}finally{setLoading(false)}},[params]);
// eslint-disable-next-line react-hooks/set-state-in-effect
useEffect(()=>{fetchData()},[fetchData]);
return{sales,pagination,loading,error,params,setParams,reFetch:fetchData}};