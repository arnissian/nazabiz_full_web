import React, { useState, useEffect, useContext } from "react";
import {
  Package, Settings, ChevronDown, CreditCard, Receipt,
  Users, Truck, Store, Folder, Menu, X, RotateCcw, Layers,
  FolderTree, Tag, Scale, User, LogOut, UserCog, DollarSign, Shield, Building2, LayoutDashboard,
  LockKeyhole, type LucideIcon,
} from "lucide-react";
import "../styles/dashboard.css"; // Import du CSS global
import "../styles/custom-forms.css"; // Import du CSS global
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { TenantLogo } from "../components/common/TenantLogo";

type ThemeSettings = {
  colorScheme: string;
  contentWidth: string;
  layoutMode: string;
  topbarColor: string;
  menuColor: string;
  menuIconTone: string;
  sidebarSize: string;
  sidebarUserInfo: boolean;
};

const DEFAULT_SETTINGS: ThemeSettings = {
  colorScheme: "light",
  contentWidth: "fluid",
  layoutMode: "default",
  topbarColor: "white",
  menuColor: "light",
  menuIconTone: "default",
  sidebarSize: "default",
  sidebarUserInfo: false,
};

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    auth,
    logout,
    activeStore,
    switchStore,
    tenantSettings,
    hasPermission,
  } = useContext(AppContext);
  const isSuperAdmin = auth?.user?.roles?.some(role => role.name === "super_admin") ?? false;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
    try {
      const savedSettings = localStorage.getItem("app_theme_settings");
      return savedSettings
        ? { ...DEFAULT_SETTINGS, ...(JSON.parse(savedSettings) as Partial<ThemeSettings>) }
        : DEFAULT_SETTINGS;
    } catch (error) {
      console.error("Erreur de lecture du localStorage :", error);
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("app_theme_settings", JSON.stringify(themeSettings));
    } catch (error) {
      console.error("Erreur d'écriture du localStorage :", error);
    }
  }, [themeSettings]);

  const updateSetting = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setThemeSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setThemeSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem("app_theme_settings");
    } catch (error) {
      console.error("Erreur lors de la suppression du localStorage :", error);
    }
  };

  const getSidebarWidth = () => {
    switch (themeSettings.sidebarSize) {
      case "compact": return "180px";
      case "condensed": return "70px";
      case "full": return "260px";
      case "fullscreen": return "300px";
      default: return "220px";
    }
  };

  const isDarkScheme = themeSettings.colorScheme === "dark";
  const isCondensed = themeSettings.sidebarSize === "condensed";
  const storeSettingsPath = activeStore?.id ? `/pos/stores/${activeStore.id}/settings` : "/pos";

  type MenuItem = {
    label: string;
    icon: LucideIcon;
    path: string;
    permission: string | string[];
    superAdminOnly?: boolean;
    dropdown?: Array<{ label: string; icon: LucideIcon; path: string }>;
  };
  const menuItems: MenuItem[] = [
    { label: "Dashboard entreprise", icon: LayoutDashboard, path: "/tenant-dashboard", permission: "settings.manage", superAdminOnly: true },
    { label: "Magasins", icon: Store, path: "/stores", permission: "settings.manage", superAdminOnly: true },
    { label: "Produits", icon: Package, path: "/products", permission: "products.view", superAdminOnly: true },
    { label: "Domaines", icon: Layers, path: "/domains", permission: "products.view", superAdminOnly: true },
    { label: "Catégories", icon: Folder, path: "/categories", permission: "products.view", superAdminOnly: true },
    { label: "Sous-catégories", icon: FolderTree, path: "/subcategories", permission: "products.view", superAdminOnly: true },
    { label: "Marques", icon: Tag, path: "/brands", permission: "products.view", superAdminOnly: true },
    { label: "Unités", icon: Scale, path: "/units", permission: "products.view", superAdminOnly: true },
    { label: "Fournisseurs", icon: Truck, path: "/suppliers", permission: "suppliers.view", superAdminOnly: true },
    { label: "Utilisateurs", icon: UserCog, path: "/users", permission: "users.manage", superAdminOnly: true },
    { label: "Rôles & permissions", icon: Shield, path: "/roles", permission: "roles.manage", superAdminOnly: true },
    { label: "Comptes financiers", icon: CreditCard, path: "/financial-accounts", permission: "settings.manage", superAdminOnly: true },
    { label: "Paramètres entreprise", icon: Building2, path: "/tenant-settings", permission: "settings.manage", superAdminOnly: true },
    { label: "Abonnement", icon: CreditCard, path: "/tenant-subscription", permission: "settings.manage", superAdminOnly: true },
    { label: "Devise", icon: DollarSign, path: "/tenant/devises", permission: "settings.manage" },
    { label: "Langues", icon: User, path: "/languages", permission: "settings.manage", superAdminOnly: true },
    { label: "Dashboard magasin", icon: Store, path: "/pos/dashboard", permission: "pos.access" },
    { label: "Caisse POS", icon: Receipt, path: "/pos", permission: "pos.access" },
    { label: "Sessions de caisse", icon: Users, path: "/pos/sessions", permission: "pos.access" },
    { label: "Stocks", icon: Package, path: "/pos/stocks", permission: "products.view" },
    { label: "Mouvements de stock", icon: Truck, path: "/pos/stock-movements", permission: "products.view" },
    { label: "Inventaires", icon: Folder, path: "/pos/inventories", permission: "products.view" },
    { label: "Transferts", icon: Scale, path: "/pos/stock-transfers", permission: "products.view" },
    { label: "Clients", icon: Users, path: "/pos/customers", permission: "customers.view" },
    { label: "Ventes", icon: DollarSign, path: "/pos/sales", permission: "sales.view" },
    { label: "Devis & proformas", icon: Folder, path: "/pos/quotations", permission: "quotations.view" },
    { label: "Livraisons", icon: Truck, path: "/pos/deliveries", permission: "sales.view" },
    { label: "Paiements", icon: CreditCard, path: "/pos/payments", permission: "sales.view" },
    { label: "Créances clients", icon: DollarSign, path: "/pos/receivables", permission: "sales.view" },
    { label: "Achats", icon: Package, path: "/pos/purchases", permission: "purchases.view" },
    { label: "Paiements fournisseurs", icon: CreditCard, path: "/pos/purchase-payments", permission: "purchases.view" },
    { label: "Retours ventes", icon: RotateCcw, path: "/pos/sale-returns", permission: "sales.view" },
    { label: "Retours achats", icon: RotateCcw, path: "/pos/purchase-returns", permission: "purchases.view" },
    { label: "Dépenses", icon: DollarSign, path: "/pos/expenses", permission: "expenses.view" },
    { label: "Rapports", icon: Layers, path: "/pos/reports", permission: ["reports.sales", "reports.stocks", "reports.financial"] },
    { label: "Paramètres magasin", icon: Settings, path: storeSettingsPath, permission: "settings.manage" },
  ];

  return (
    <div className={`dashboard-page ${isDarkScheme ? "dark" : "light"}`} >
      
      <div  className={`dashboard-container ${isDarkScheme ? "dark":"danger"} ${themeSettings.contentWidth} ${themeSettings.layoutMode}`}>
        
        {/* Overlay Mobile */}
        <div className={`overlay ${isSidebarOpen ? "show" : ""}`} onClick={() => setIsSidebarOpen(false)} />

        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? "open" : ""} ${themeSettings.menuColor} ${isDarkScheme ? "dark-theme" : ""} ${themeSettings.sidebarSize}`} style={{ width: getSidebarWidth(), minWidth: getSidebarWidth() }}>
          <div className="p-2">

            {/* Brand */}
            <div className={`brand ${isCondensed ? "centered" : "space-between"}`}>
              <div className="brand-logo-group">
                <div
                  className="logo"
                  style={tenantSettings?.logo_path
                    ? { width: 32, height: 32, transform: "none", background: "transparent" }
                    : undefined}
                >
                  {tenantSettings?.logo_path
                    ? <TenantLogo style={{ width: 32, height: 32 }} />
                    : <span className="logo-text">◆</span>}
                </div>
                {!isCondensed && (
                  <span className={`brand-name ${themeSettings.menuColor} ${isDarkScheme ? "dark-theme" : ""}`}>
                    {isSuperAdmin ? tenantSettings?.name || "Gestion entreprise" : activeStore?.name || "Gestion magasin"}
                  </span>
                )}
              </div>
              <button type="button" className="mobile-toggle" onClick={() => setIsSidebarOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Shop Info (Affectation active) */}
            <div className={`shop-selector ${isCondensed ? "hidden" : "visible"}`}>
              <div className={`shop-button ${themeSettings.menuColor} ${isDarkScheme ? "dark-theme" : ""} d-flex align-items-center gap-2`}>
                {activeStore ? (
                  <>
                    <Store size={15} className="text-primary flex-shrink-0" />
                    {auth?.user?.stores && auth.user.stores.length > 1 ? (
                      <select
                        aria-label="Magasin actif"
                        className="form-select form-select-sm border-0 bg-transparent fw-semibold"
                        value={activeStore.id}
                        onChange={(event) => void switchStore(event.target.value)}
                      >
                        {auth.user.stores.map((store) => (
                          <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-truncate fw-semibold" style={{ fontSize: 13 }}>
                        {activeStore.name}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Building2 size={15} className="text-primary flex-shrink-0" />
                    <span className="text-truncate fw-semibold" style={{ fontSize: 13 }}>Espace entreprise</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* User Info */}
          {themeSettings.sidebarUserInfo && !isCondensed && (
            <div className={`p-2 mb-3 rounded border d-flex align-items-center gap-2 ${isDarkScheme ? "bg-dark text-white border-secondary" : "bg-white"}`}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0e8df", display: "flex", alignItems: "center", justifyContent: "center" }}>👩🏻</div>
              <div style={{ overflow: "hidden" }}>
                <div className="text-truncate" style={{ fontSize: 12, fontWeight: 600 }}>MyBusiness Admin</div>
                <div className="text-muted text-truncate" style={{ fontSize: 10 }}>Administrateur</div>
              </div>
            </div>
          )}

          {/* Menu */}
          <nav className="menu">
            {menuItems.filter(item => (!item.superAdminOnly || isSuperAdmin)
              && (Array.isArray(item.permission)
                ? item.permission.some(hasPermission)
                : hasPermission(item.permission))).map((item, index) => {
              const Icon = item.icon;
              const isActive = item.path ? location.pathname === item.path : false;

              if (item.dropdown && !isCondensed) {
                const collapseId = `submenu-${index}`;
                const hasActiveChild = item.dropdown.some(sub => location.pathname === sub.path);

                return (
                  <div key={item.label}>
                    <button 
                      type="button" 
                      className={`menu-item default-padding justify-content-between ${themeSettings.menuColor} ${isDarkScheme ? "dark-theme" : ""} ${hasActiveChild ? 'active' : ''}`} 
                      data-bs-toggle="collapse" 
                      data-bs-target={`#${collapseId}`}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <Icon size={16} strokeWidth={1.6} className={`menu-icon ${themeSettings.menuIconTone}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown size={13} />
                    </button>
                    <div id={collapseId} className={`collapse ${hasActiveChild ? 'show' : ''}`}>
                      <div className={`submenu ${isCondensed ? "condensed" : ""}`}>
                        {item.dropdown.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname === subItem.path;
                          return (
                            <button
                              key={subItem.label}
                              type="button"
                              className={`submenu-item ${themeSettings.menuColor} ${isDarkScheme ? "dark-theme" : ""} ${isSubActive ? 'fw-bold text-primary' : ''}`}
                              onClick={() => {
                                navigate(subItem.path);
                                setIsSidebarOpen(false);
                              }}
                            >
                              <SubIcon size={13} strokeWidth={1.6} className={`menu-icon ${themeSettings.menuIconTone}`} />
                              <span>{subItem.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              const activeClass = isActive ? `active-${themeSettings.menuColor}${isDarkScheme ? "-theme" : ""}` : "";
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`menu-item ${isCondensed ? "condensed" : "default-padding"} ${themeSettings.menuColor} ${isDarkScheme ? "dark-theme" : ""} ${activeClass}`}
                  title={isCondensed ? item.label : ""}
                  onClick={() => {
                    if (item.path) {
                      navigate(item.path);
                      setIsSidebarOpen(false);
                    }
                  }}
                >
                  <Icon size={16} strokeWidth={1.6} className={`menu-icon ${themeSettings.menuIconTone}`} />
                  {!isCondensed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`main ${isDarkScheme ? "dark" : "bg-light"}`}>
          
          {/* Topbar */}
          <header className={`topbar ${themeSettings.topbarColor} ${isDarkScheme ? "dark-theme" : ""}`}>
            <button type="button" className="mobile-toggle" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>

            <div className="topbar-right d-flex align-items-center gap-2">
              {/* Magasin actif badge informatif */}
              {activeStore && (
                <div className="d-none d-md-flex align-items-center gap-2 px-3 py-1 bg-light border rounded-pill text-dark" style={{ fontSize: 12 }}>
                  <Store size={14} className="text-primary" />
                  <span className="fw-semibold">{activeStore?.name || "Magasin actif"}</span>
                  <span className="badge bg-success text-white px-2 py-0.5 rounded-pill" style={{ fontSize: 9 }}>Affecté</span>
                </div>
              )}

              {hasPermission("pos.access") && <button
                type="button"
                className="btn btn-sm btn-primary d-none d-sm-flex align-items-center gap-2 px-3 py-1 rounded-pill shadow-xs"
                onClick={() => navigate('/pos')}
              >
                <Receipt size={14} />
                <span>Caisse POS</span>
              </button>}

              <button className={`top-link ${themeSettings.topbarColor} ${isDarkScheme ? "dark-theme" : ""}`}>Notifications</button>
              <button className={`top-link ${themeSettings.topbarColor} ${isDarkScheme ? "dark-theme" : ""}`}>Aide</button>
              
              <button type="button" className={`settings-btn ${themeSettings.topbarColor} ${isDarkScheme ? "dark-theme" : ""}`} data-bs-toggle="offcanvas" data-bs-target="#themeSettingsOffcanvas">
                <Settings size={16} />
              </button>

              <div className="dropdown">
                <button type="button" className="btn dropdown-toggle p-0 border-0 shadow-none d-flex align-items-center" data-bs-toggle="dropdown">
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f0e8df", display: "flex", alignItems: "center", justifyContent: "center" }}>👩🏻</div>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><button className="dropdown-item d-flex align-items-center gap-2" onClick={() => navigate(isSuperAdmin ? '/tenant-settings' : storeSettingsPath)}><User size={14} /> {auth?.user?.name || "Profil"}</button></li>
                  <li><button className="dropdown-item d-flex align-items-center gap-2" onClick={() => navigate('/change-password')}><LockKeyhole size={14} /> Changer le mot de passe</button></li>
                  <li><button className="dropdown-item d-flex align-items-center gap-2" onClick={() => navigate(isSuperAdmin ? '/tenant-settings' : storeSettingsPath)}><UserCog size={14} /> Paramètres </button></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item text-danger d-flex align-items-center gap-2"
                  onClick={()=>logout()}
                  ><LogOut size={14} /> Déconnexion</button></li>
                </ul>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="content ">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Theme Settings Offcanvas */}
      <div className="offcanvas offcanvas-end" tabIndex={-1} id="themeSettingsOffcanvas">
        <div className="offcanvas-header border-bottom">
          <div>
            <h5 className="offcanvas-title fw-bold" style={{ fontSize: 16 }}>Paramètres du Thème</h5>
            <p className="text-muted m-0" style={{ fontSize: 12 }}>Personnalisez l'apparence et le layout.</p>
          </div>
          <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" />
        </div>

        <div className="offcanvas-body">
          {/* Color Scheme */}
          <div className="setting-section-title">Mode de couleur</div>
          <div className="form-check mb-2">
            <input className="form-check-input" type="radio" name="colorScheme" id="schemeLight" checked={themeSettings.colorScheme === "light"} onChange={() => updateSetting("colorScheme", "light")} />
            <label className="setting-option-label" htmlFor="schemeLight">Clair</label>
          </div>
          <div className="form-check mb-3">
            <input className="form-check-input" type="radio" name="colorScheme" id="schemeDark" checked={themeSettings.colorScheme === "dark"} onChange={() => updateSetting("colorScheme", "dark")} />
            <label className="setting-option-label" htmlFor="schemeDark">Sombre</label>
          </div>
          <hr />

          {/* Content Width */}
          <div className="setting-section-title">Largeur du contenu</div>
          <div className="form-check mb-2">
            <input className="form-check-input" type="radio" name="contentWidth" id="widthFluid" checked={themeSettings.contentWidth === "fluid"} onChange={() => updateSetting("contentWidth", "fluid")} />
            <label className="setting-option-label" htmlFor="widthFluid">Fluide (Par défaut)</label>
          </div>
          <div className="form-check mb-3">
            <input className="form-check-input" type="radio" name="contentWidth" id="widthBoxed" checked={themeSettings.contentWidth === "boxed"} onChange={() => updateSetting("contentWidth", "boxed")} />
            <label className="setting-option-label" htmlFor="widthBoxed">Encadré (Boxed)</label>
          </div>
          <hr />

          {/* Layout Mode */}
          <div className="setting-section-title">Mode de Disposition</div>
          <div className="form-check mb-2">
            <input className="form-check-input" type="radio" name="layoutMode" id="layoutDefault" checked={themeSettings.layoutMode === "default"} onChange={() => updateSetting("layoutMode", "default")} />
            <label className="setting-option-label" htmlFor="layoutDefault">Par défaut</label>
          </div>
          <div className="form-check mb-3">
            <input className="form-check-input" type="radio" name="layoutMode" id="layoutDetached" checked={themeSettings.layoutMode === "detached"} onChange={() => updateSetting("layoutMode", "detached")} />
            <label className="setting-option-label" htmlFor="layoutDetached">Détaché</label>
          </div>
          <hr />

          {/* Topbar Color */}
          <div className="setting-section-title">Couleur de la barre supérieure</div>
          {[["white", "Blanc"], ["dark", "Sombre"], ["primary", "Primaire"]].map(([value, label]) => (
            <div className="form-check mb-2" key={value}>
              <input className="form-check-input" type="radio" name="topbarColor" id={`topbar-${value}`} checked={themeSettings.topbarColor === value} onChange={() => updateSetting("topbarColor", value)} />
              <label className="setting-option-label" htmlFor={`topbar-${value}`}>{label}</label>
            </div>
          ))}
          <hr />

          {/* Menu Color */}
          <div className="setting-section-title">Couleur du Menu</div>
          {[["light", "Clair"], ["dark", "Sombre"], ["primary", "Primaire"]].map(([value, label]) => (
            <div className="form-check mb-2" key={value}>
              <input className="form-check-input" type="radio" name="menuColor" id={`menu-${value}`} checked={themeSettings.menuColor === value} onChange={() => updateSetting("menuColor", value)} />
              <label className="setting-option-label" htmlFor={`menu-${value}`}>{label}</label>
            </div>
          ))}
          <hr />

          {/* Sidebar Size */}
          <div className="setting-section-title">Taille de la barre latérale</div>
          {[
            ["default", "Par défaut"],
            ["compact", "Compact (Moyen)"],
            ["condensed", "Condensé (Icônes uniquement)"],
            ["full", "Plein écran (Full)"],
            ["fullscreen", "Mode immersif"]
          ].map(([value, label]) => (
            <div className="form-check mb-2" key={value}>
              <input className="form-check-input" type="radio" name="sidebarSize" id={`size-${value}`} checked={themeSettings.sidebarSize === value} onChange={() => updateSetting("sidebarSize", value)} />
              <label className="setting-option-label" htmlFor={`size-${value}`}>{label}</label>
            </div>
          ))}
          <hr />

          {/* Sidebar User Info */}
          <div className="setting-section-title">Infos utilisateur en barre latérale</div>
          <div className="form-check form-switch mb-3">
            <input className="form-check-input" type="checkbox" id="sidebarUserInfo" checked={themeSettings.sidebarUserInfo} onChange={(e) => updateSetting("sidebarUserInfo", e.target.checked)} />
            <label className="setting-option-label" htmlFor="sidebarUserInfo">Activer</label>
          </div>
        </div>

        <div className="offcanvas-footer p-3 border-top bg-light">
          <button type="button" className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2" onClick={resetSettings}>
            <RotateCcw size={14} /> Réinitialiser par défaut
          </button>
        </div>
      </div>
    </div>
  );
}