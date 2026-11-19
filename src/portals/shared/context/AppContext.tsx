// AppContext.tsx - Version mise à jour
import React, { createContext, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import axios from 'axios';
import { toast } from 'react-toastify';
import axiosInstance from '../services/api/axiosInterceptor';
import { uploads } from '../config/env';
import type { AppSettings } from '../types/appsettings';
import type { StoreSettings } from '../../store/types/storeSettings';
import type { TenantSettingsData } from '../../tenant/types/tenantSettings';
import {
  AUTH_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LEGACY_AUTH_STORAGE_KEY,
  LEGACY_LANGUAGE_STORAGE_KEY,
  LEGACY_TOKEN_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
} from '../config/authStorage';
/* =========================================================
   TYPES - MIS À JOUR
========================================================= */



interface RolePermission {
  name?: string;
}

interface UserRole {
  name?: string;
  permissions?: Array<string | RolePermission>;
}

interface User {
  id: string;
  tenant_id?: string;
  name: string;
  email: string;
  phone?: string;
  image?: string;
  status?: string;
  roles?: UserRole[];
  stores?: any[];
  active_store?: any | null;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
}

interface AuthData {
  user: User | null;
  token?: string;
  permissions?: string[];
  active_store?: any | null;
}

const tenantSettingsReadPermissions = [
  'settings.manage',
  'users.manage',
  'roles.manage',
  'pos.access',
  'pos.session_manage',
  'pos.discount',
  'stocks.adjust',
];

const tenantSettingsReadPrefixes = [
  'sales.',
  'customers.',
  'quotations.',
  'products.',
  'purchases.',
  'suppliers.',
  'expenses.',
  'reports.',
];

function canReadTenantSettings(authData: AuthData | null): boolean {
  const permissions = [
    ...(authData?.permissions ?? []),
    ...(authData?.user?.roles?.flatMap(role => role.permissions?.map(
      rolePermission => typeof rolePermission === 'string' ? rolePermission : rolePermission.name || ''
    ) || []) ?? []),
  ];
  const isSuperAdmin = authData?.user?.roles?.some(role => role.name === 'super_admin') ?? false;

  return isSuperAdmin || permissions.some(permission =>
    tenantSettingsReadPermissions.includes(permission)
    || tenantSettingsReadPrefixes.some(prefix => permission.startsWith(prefix)),
  );
}

interface LoginResult {
  authenticated: boolean;
  challengeToken?: string;
  permissions?: string[];
  roles?: UserRole[];
  activeStoreId?: string;
}

interface TranslationWord {
  id: string;
  key: string;
  value: string;
  locale: string;
}

function getStoredAuth(): AuthData | null {
  try {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY)
      || localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);

    return savedAuth ? JSON.parse(savedAuth) as AuthData : null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'auth:', error);
    return null;
  }
}

/* =========================================================
   CONTEXT TYPE
========================================================= */

type AppContextType = {
  // ÉTATS
  appSettings: AppSettings | null;
  storeSettings: StoreSettings | null;
  tenantSettings: TenantSettingsData | null;
  lang: string;
  access_token: string | null;
  auth: AuthData | null;
  activeStore: any | null;
  transBaseWords: TranslationWord[];
  loading: boolean;

  // MÉTHODES
  saveLang: (lang: string) => void;
  saveAuth: (authData: AuthData) => void;
  saveToken: (token: string) => void;

  login: (email: string, password: string) => Promise<LoginResult>;
  verifyLoginOtp: (challengeToken: string, otp: string) => Promise<LoginResult | null>;
  switchStore: (storeId: string) => Promise<boolean>;
  logout: () => void;

  getTraductions: () => Promise<void>;
  getAppSettings: () => Promise<void>;
  getStoreSettings: () => Promise<void>;
  getTenantSettings: () => Promise<TenantSettingsData | null>;
  updateTenantSettings: (settings: TenantSettingsData | null) => void;

  // UTILITAIRES
  translate: (key: string) => string;
  hasPermission: (permission: string) => boolean;

  // NOUVEAUX UTILITAIRES
  getTheme: () => {
    colorScheme: string;
    contentWidth: string;
    layoutMode: string;
    topbarColor: string;
    menuColor: string;
    menuIconTone: string;
    sidebarSize: string;
    sidebarUserInfo: boolean;
  };
  isModuleEnabled: (moduleKey: string) => boolean;
  getColor: (type: 'primary' | 'secondary') => string;
};

/* =========================================================
   DEFAULT VALUES
========================================================= */

const defaultContext: AppContextType = {
  appSettings: null,
  storeSettings: null,
  tenantSettings: null,
  lang: 'fr',
  access_token: null,
  auth: null,
  activeStore: null,
  transBaseWords: [],
  loading: false,

  saveLang: () => {},
  saveAuth: () => {},
  saveToken: () => {},

  login: async () => ({ authenticated: false }),
  verifyLoginOtp: async () => null,
  switchStore: async () => false,
  logout: () => {},

  getTraductions: async () => {},
  getAppSettings: async () => {},
  getStoreSettings: async () => {},
  getTenantSettings: async () => null,
  updateTenantSettings: () => {},

  translate: () => '',
  hasPermission: () => false,

  getTheme: () => ({
    colorScheme: 'light',
    contentWidth: 'fluid',
    layoutMode: 'default',
    topbarColor: 'white',
    menuColor: 'light',
    menuIconTone: 'default',
    sidebarSize: 'default',
    sidebarUserInfo: false,
  }),
  isModuleEnabled: () => true,
  getColor: () => '#176b59',
};

/* =========================================================
   CONTEXT
========================================================= */

export const AppContext = createContext<AppContextType>(defaultContext);

/* =========================================================
   PROVIDER
========================================================= */

const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ÉTATS
  const [lang, setLang] = useState<string>('fr');
  const [auth, setAuth] = useState<AuthData | null>(getStoredAuth);
  const [transBaseWords, setTransBaseWords] = useState<TranslationWord[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [storeSettings, setStoreSettings] = useState<any | null>(null);
  const [tenantSettings, setTenantSettings] = useState<TenantSettingsData | null>(null);
  const tenantSettingsRequest = useRef<Promise<TenantSettingsData | null> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const favicon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!favicon) {
      console.error('Impossible de trouver le lien du favicon dans le document.');
      return;
    }

    if (tenantSettings?.logo_path) {
      favicon.href = `${uploads.replace(/\/+$/, '')}/${tenantSettings.logo_path.replace(/^\/+/, '')}`;
      favicon.removeAttribute('type');
    } else {
      favicon.href = '/rcm-favicon.svg';
      favicon.type = 'image/svg+xml';
    }
  }, [tenantSettings?.logo_path]);
  
  const [access_token, setToken] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
        || localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  /* =========================================================
     INITIALISATION
  ========================================================= */

  useEffect(() => {
    initializeApp();
  }, []);

  // Charger les settings du magasin quand le magasin actif change
  useEffect(() => {
    const activeStoreId = auth?.active_store?.id || auth?.user?.active_store?.id;
    if (activeStoreId) {
      getStoreSettings();
      getAppSettings();
    }
  }, [auth?.active_store?.id, auth?.user?.active_store?.id]);

  const initializeApp = async () => {
    setLoading(true);
    try {
      await Promise.all([
        initializeLang(),
        initializeAuth(),
        getAppSettings(),
        getTraductions(),
      ]);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LANGUE
  ========================================================= */

  const initializeLang = () => {
    try {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY)
        || localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
      setLang(savedLang || 'fr');
    } catch {
      setLang('fr');
    }
  };

  const saveLang = (newLang: string) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      localStorage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
      setLang(newLang);
      getTraductions();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la langue:', error);
      toast.error('Erreur lors du changement de langue');
    }
  };

  /* =========================================================
     AUTHENTIFICATION
  ========================================================= */

  const initializeAuth = () => {
    try {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY)
        || localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
      if (savedAuth) {
        const parsedAuth = JSON.parse(savedAuth) as AuthData;
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsedAuth));
        if (parsedAuth.token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(parsedAuth.token));
        }
        localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
        localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
        localStorage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
        setAuth(parsedAuth);
      } else {
        setAuth(null);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'auth:', error);
      setAuth(null);
    }
  };

  const saveAuth = (authData: AuthData) => {
    try {
      if (
        auth?.user?.id !== authData.user?.id
        || auth?.user?.tenant_id !== authData.user?.tenant_id
        || !canReadTenantSettings(authData)
      ) {
        setTenantSettings(null);
      }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
      if (authData.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(authData.token));
      }
      localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
      setAuth(authData);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'auth:', error);
      toast.error('Erreur lors de la sauvegarde de l\'authentification');
    }
  };

  const saveToken = (token: string) => {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
      localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
      setToken(token);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token:', error);
      toast.error('Erreur lors de la sauvegarde du token');
    }
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
   
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });

      if (response.data.requires_two_factor && response.data.challenge_token) {
        return { authenticated: false, challengeToken: response.data.challenge_token };
      }
      
      if (response.data.status === 200) {
        const data = response.data.data || response.data;
        const { token, user, permissions } = data;
        const active_store = response.data.active_store || user?.active_store || null;
        
        saveToken(token);
        saveAuth({ user, token, permissions, active_store });
        
        toast.success(response.data.message || 'Connexion réussie !');
        return {
          authenticated: true,
          permissions: permissions || [],
          roles: user?.roles || [],
          activeStoreId: active_store?.id,
        };
      } else {
        toast.error(response.data.message || 'Erreur lors de la connexion');
        return { authenticated: false };
      }
    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      const message = err.response?.data?.message || 'Erreur de connexion au serveur';
      toast.error(message);
      return { authenticated: false };
    } finally {
      setLoading(false);
    }
  };

  const verifyLoginOtp = async (challengeToken: string, otp: string): Promise<LoginResult | null> => {
    try {
      const response = await axiosInstance.post('/auth/login/verify-otp', {
        challenge_token: challengeToken,
        otp,
      });
      if (response.data.status !== 200) {
        toast.error(response.data.message || 'Code de vérification invalide.');
        return null;
      }

      const data = response.data.data || response.data;
      const { token, user, permissions } = data;
      const active_store = response.data.active_store || user?.active_store || null;
      if (!token || !user) {
        throw new Error('Réponse de vérification de connexion invalide.');
      }
      saveToken(token);
      saveAuth({ user, token, permissions, active_store });
      toast.success(response.data.message || 'Connexion réussie !');
      return {
        authenticated: true,
        permissions: permissions || [],
        roles: user.roles || [],
        activeStoreId: active_store?.id,
      };
    } catch (error: unknown) {
      console.error('Erreur lors de la vérification 2FA:', error);
      const message = axios.isAxiosError(error) ? error.response?.data?.message : null;
      toast.error(typeof message === 'string' ? message : 'Impossible de vérifier le code.');
      return null;
    }
  };

  const switchStore = async (storeId: string): Promise<boolean> => {
    if (!auth?.user) return false;

    try {
      const response = await axiosInstance.post('/auth/active-store', { store_id: storeId });
      const active_store = response.data?.active_store;
      const user = response.data?.user;
      if (!active_store || !user) {
        throw new Error('Réponse invalide lors du changement de magasin');
      }

      saveAuth({ ...auth, user, active_store });
      setStoreSettings(null);
      return true;
    } catch (error: unknown) {
      console.error('Erreur lors du changement de magasin:', error);
      const message = axios.isAxiosError(error) ? error.response?.data?.message : null;
      toast.error(typeof message === 'string' ? message : 'Impossible de changer de magasin');
      return false;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
      setToken(null);
      setAuth(null);
      setTenantSettings(null);
      toast.info('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  /* =========================================================
     TRADUCTIONS
  ========================================================= */

  const getTraductions = async (): Promise<void> => {
    try {
      const response = await axiosInstance.get('/getTraductions');
      if (response.data.status === 200) {
        setTransBaseWords(response.data.texts || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des traductions:', error);
    }
  };

  const translate = (key: string): string => {
    if (!key) return key;
    
    const word = transBaseWords.find(
      (item) => item.key === key && item.locale === lang
    );
    
    return word?.value || key;
  };

  /* =========================================================
     APP SETTINGS - MIS À JOUR
  ========================================================= */

  const getAppSettings = async (): Promise<void> => {
    try {
      // Récupérer les paramètres de l'application
      const response = await axiosInstance.get('/admin/settings');
      if (response.data.status === 200) {
        const apiSettings =response.data.result || {};
        console.log(apiSettings)


        // Fallback: utiliser uniquement les données de l'API
        setAppSettings(apiSettings);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      // Utiliser les valeurs par défaut en cas d'erreur
      setAppSettings({
        image_path: '',
        image: '',
        name: 'HumaniCare',
        address: 'Kinshasa, RDC',
        phone1: '+243 812 345 678',
        email_info: 'contact@humanicare.org',
        primary_color: '#176b59',
        secondary_color: '#398be8',
        app_logo: '',
        logo_locate: '',
      } as any);
    }
  };

  const getStoreSettings = async (): Promise<void> => {
    const activeStoreId = auth?.active_store?.id || auth?.user?.active_store?.id;
    if (!activeStoreId) {
      setStoreSettings(null);
      return;
    }

    try {
      const response = await axiosInstance.get(`/stores/${activeStoreId}/settings`);
      if (response.data.status === 200) {
        const store = response.data.result || response.data.data;
        setStoreSettings(store?.settings || store);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres du magasin:', error);
      setStoreSettings(null);
    }
  };

  const getTenantSettings = useCallback(async (): Promise<TenantSettingsData | null> => {
    if (!canReadTenantSettings(auth)) {
      setTenantSettings(null);
      return null;
    }

    if (tenantSettingsRequest.current) return tenantSettingsRequest.current;

    const request = axiosInstance.get('/tenant/settings')
      .then((response) => {
        const settings = response.data?.data || null;
        setTenantSettings(settings);
        return settings;
      })
      .catch((error: unknown) => {
        console.error('Erreur lors du chargement des paramètres de l’entreprise:', error);
        throw error;
      })
      .finally(() => {
        tenantSettingsRequest.current = null;
      });

    tenantSettingsRequest.current = request;
    return request;
  }, [auth]);

  useEffect(() => {
    if (!canReadTenantSettings(auth)) {
      return;
    }

    void getTenantSettings().catch(error => {
      console.error('Impossible de charger les paramètres de l’entreprise:', error);
    });
  }, [auth, getTenantSettings]);

  /* =========================================================
     PERMISSIONS
  ========================================================= */

  const hasPermission = (permission: string): boolean => {
    const permissions = auth?.permissions
      ?? auth?.user?.roles?.flatMap(role => role.permissions?.map(
        rolePermission => typeof rolePermission === 'string' ? rolePermission : rolePermission.name || ''
      ) || [])
      ?? [];

    return permissions.includes('*')
      || permissions.includes(permission)
      || Boolean(auth?.user?.roles?.some(role => role.name === 'super_admin'));
  };

  /* =========================================================
     NOUVEAUX UTILITAIRES
  ========================================================= */

  /**
   * Récupère les paramètres du thème
   */
  const getTheme = () => ({
    colorScheme: appSettings?.color_scheme || 'light',
    contentWidth: appSettings?.content_width || 'fluid',
    layoutMode: appSettings?.layout_mode || 'default',
    topbarColor: appSettings?.topbar_color || 'white',
    menuColor: appSettings?.menu_color || 'light',
    menuIconTone: appSettings?.menu_icon_tone || 'default',
    sidebarSize: appSettings?.sidebar_size || 'default',
    sidebarUserInfo: appSettings?.sidebar_user_info || false,
  });

  /**
   * Vérifie si un module est activé
   */
  const isModuleEnabled = (moduleKey: string): boolean => {
    if (!appSettings) return true;
    const key = moduleKey as keyof AppSettings;
    return appSettings[key] !== false;
  };

  /**
   * Récupère une couleur du thème
   */
  const getColor = (type: 'primary' | 'secondary'): string => {
    if (!appSettings) {
      return type === 'primary' ? '#176b59' : '#398be8';
    }
    return type === 'primary' 
      ? appSettings.primary_color || '#176b59'
      : appSettings.secondary_color || '#398be8';
  };

  /* =========================================================
     CONTEXT VALUE
  ========================================================= */

  const contextValue: AppContextType = {
    // États
    appSettings,
    storeSettings,
    tenantSettings,
    lang,
    access_token,
    auth,
    activeStore: auth?.active_store || auth?.user?.active_store || null,
    transBaseWords,
    loading,
    // Méthodes
    saveLang,
    saveAuth,
    saveToken,
    login,
    verifyLoginOtp,
    switchStore,
    logout,
    getTraductions,
    getAppSettings,
    getStoreSettings,
    getTenantSettings,
    updateTenantSettings: setTenantSettings,

    // Utilitaires
    translate,
    hasPermission,

    // Nouveaux utilitaires
    getTheme,
    isModuleEnabled,
    getColor,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;