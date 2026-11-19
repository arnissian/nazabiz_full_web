export interface UserRole {
  id: string;
  name: string;
}

export interface UserStore {
  id: string;
  name: string;
  code?: string;
  is_active: boolean;
}

export interface AppUser {
  id: string;
  tenant_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  status: 'Active' | 'Inactive' | string;
  avatar?: string | null;
  roles: UserRole[];
  role_names: string[];
  stores: UserStore[];
  active_store?: {
    id: string;
    name: string;
    code?: string;
  } | null;
  created_at?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  status?: string;
  role_ids?: string[];
  store_ids?: string[];
  active_store_id?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  status?: string;
  role_ids?: string[];
  store_ids?: string[];
  active_store_id?: string;
}
