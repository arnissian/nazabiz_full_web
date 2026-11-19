import{useCallback,useEffect,useState}from'react';import axios from'axios';import axiosInstance from'../../../shared/services/api/axiosInterceptor';import type{PaginationMeta}from'../../../shared/components/common/Pagination';

type QueryParams={
  page?:number;
  per_page?:number;
  search?:string;
  is_active?:boolean;
  [key:string]:unknown;
};

type PurchasePayment=Record<string,unknown>;
const normalizeParams=(params:QueryParams={})=>({
  ...params,
  page: Math.max(1, Number(params.page ?? 1) || 1),
  per_page: Math.max(1, Number(params.per_page ?? 5) || 5),
});

export const usePurchasePayments=(initialParams:QueryParams={page:1,per_page:5})=>{const[purchasepayments,setPurchasePayments]=useState<PurchasePayment[]>([]);const[pagination,setPagination]=useState<PaginationMeta|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState<string|null>(null);const[params,setParams]=useState<QueryParams>(()=>normalizeParams(initialParams));const fetchData=useCallback(async()=>{const safeParams=normalizeParams(params);try{setLoading(true);setError(null);const endpoint=safeParams.search?'/purchase-payments/search':'/purchase-payments';const r=await axiosInstance.get(endpoint,{params:safeParams});const p=r.data?.data;setPurchasePayments(Array.isArray(p)?p:p?.data||[]);setPagination(Array.isArray(p)||!p?null:p as PaginationMeta);}catch(e:unknown){const message=axios.isAxiosError(e)&&typeof e.response?.data?.message==='string'?e.response.data.message:'Erreur lors de la récupération des données';setError(message);}finally{setLoading(false)}},[params]);
// eslint-disable-next-line react-hooks/set-state-in-effect
useEffect(()=>{fetchData()},[fetchData]);
return{purchasepayments,pagination,loading,error,params,setParams,reFetch:fetchData}};