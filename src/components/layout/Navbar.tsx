import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Store, 
  ChefHat, 
  Layers, 
  Smartphone, 
  ShieldCheck, 
  ChevronDown, 
  PlusCircle, 
  LogOut, 
  UserCircle2,
  Globe,
  Menu,
  X,
  LayoutDashboard,
  ShoppingBag,
  Grid3X3,
  Utensils,
  DollarSign,
  Package,
  Users,
  BarChart3,
  Settings,
  Check,
  ArrowLeft,
  Lock,
  Bike
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useLanguage, LanguageSwitcher } from '../../context/LanguageContext';
import { UserRole, ActiveAppView } from '../../types';
import { getRoleLabel, getViewLabel } from '../../utils/formatters';
import { RestoCamLogo } from '../common/RestoCamLogo';
import { SwitchProfileModal } from '../auth/SwitchProfileModal';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { 
    isAuthenticated,
    logout,
    currentRestaurant, 
    restaurants, 
    switchRestaurant, 
    currentUser, 
    switchUserRole,
    currentView, 
    setCurrentView,
    soundEnabled,
    toggleSound,
    orders,
    tables,
    waiterCalls,
    setActiveCustomerTableId,
    canGoBack,
    goBack,
    previousView,
    isEmailVerified
  } = useRestaurant();

  const { t, language } = useLanguage();

  const [showRestDropdown, setShowRestDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileRestSelector, setShowMobileRestSelector] = useState(false);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [targetSwitchRole, setTargetSwitchRole] = useState<UserRole | null>(null);

  const pendingOrdersCount = orders.filter(o => o.status === 'new' || o.status === 'accepted').length;
  const pendingWaiterCallsCount = waiterCalls.filter(c => c.status === 'pending').length;

  const handleMobileNavClick = (view: ActiveAppView) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const isSuperAdmin = currentUser?.role === 'superadmin';

  const restaurantModules: { id: ActiveAppView; label: string; sub: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: t('view_dashboard'), sub: t('view_dashboard_sub'), icon: LayoutDashboard },
    { id: 'orders', label: t('view_orders'), sub: t('view_orders_sub'), icon: ShoppingBag, badge: pendingOrdersCount },
    { id: 'kitchen', label: t('view_kitchen'), sub: t('view_kitchen_sub'), icon: ChefHat },
    { id: 'waiter', label: t('view_waiter'), sub: t('view_waiter_sub'), icon: Layers, badge: pendingWaiterCallsCount > 0 ? pendingWaiterCallsCount : undefined },
    { id: 'tables', label: t('view_tables'), sub: t('view_tables_sub'), icon: Grid3X3 },
    { id: 'menu', label: t('view_menu'), sub: t('view_menu_sub'), icon: Utensils },
    { id: 'sales', label: t('view_sales'), sub: t('view_sales_sub'), icon: DollarSign },
    { id: 'inventory', label: t('view_inventory'), sub: t('view_inventory_sub'), icon: Package },
    { id: 'staff', label: t('view_staff'), sub: t('view_staff_sub'), icon: Users },
    { id: 'analytics', label: t('view_analytics'), sub: t('view_analytics_sub'), icon: BarChart3 },
    { id: 'settings', label: t('view_settings'), sub: t('view_settings_sub'), icon: Settings },
    { id: 'driver', label: 'Espace Livreur', sub: 'Courses & dispatch', icon: Bike },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-soft-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          
          {/* Left: Mobile hamburger + Brand */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 -ml-1 rounded-xl transition-all md:hidden flex items-center justify-center ${
                mobileMenuOpen 
                  ? 'bg-amber-50 text-amber-700 ring-2 ring-amber-200 shadow-soft-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-label={mobileMenuOpen ? "Fermer le menu de navigation" : "Dérouler le menu de navigation"}
              title="Menu des options"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 transition-transform rotate-90" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Back button to previous page - sleek, discrete, NO blinking */}
            {canGoBack && (
              <button
                id="navbar-back-button"
                onClick={goBack}
                title={previousView ? `Page précédente : ${getViewLabel(previousView)}` : 'Page précédente'}
                aria-label="Retour à la page précédente"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/90 text-xs font-bold transition-all duration-150 active:scale-95 shadow-xs shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline font-bold">Retour</span>
              </button>
            )}

            {/* Logo & Brand */}
            <button 
              id="brand-logo-btn"
              onClick={() => setCurrentView(isSuperAdmin ? 'superadmin' : 'landing')}
              className="flex items-center gap-2.5 text-left focus:outline-hidden group"
            >
              <div className="w-10 h-10 rounded-2xl bg-white p-0.5 border border-slate-200/80 shadow-xs group-hover:scale-105 transition-transform duration-150 shrink-0 flex items-center justify-center overflow-hidden">
                <RestoCamLogo size={38} />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">AFRO<span className="text-amber-500">RESTO</span></span>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 bg-amber-50 text-amber-700 border border-amber-200/60 rounded">SaaS</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium hidden sm:block">{t('platformSubtitle')}</p>
              </div>
            </button>

            {/* Quick View Mode Switcher Pills (Desktop) - Miniature, Compact & Uncluttered */}
            {isSuperAdmin ? (
              <div className="hidden lg:flex items-center bg-slate-100/80 p-0.5 rounded-xl gap-0.5 text-[11px] font-semibold border border-slate-200/70">
                <button
                  id="nav-view-superadmin"
                  onClick={() => setCurrentView('superadmin')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'superadmin' ? 'bg-white text-rose-700 shadow-soft-sm font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Super Admin</span>
                </button>
                <button
                  id="nav-view-dashboard"
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    ['dashboard', 'menu', 'tables', 'orders', 'sales', 'inventory', 'staff', 'analytics', 'settings'].includes(currentView)
                      ? 'bg-white text-emerald-700 shadow-soft-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 shrink-0" />
                  <span>Gestion</span>
                  {pendingOrdersCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      {pendingOrdersCount}
                    </span>
                  )}
                </button>
                <button
                  id="nav-view-customer-qr"
                  onClick={() => {
                    if (tables.length > 0) setActiveCustomerTableId(tables[0].id);
                    setCurrentView('customer_qr');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'customer_qr' ? 'bg-white text-amber-700 shadow-soft-sm font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span>Menu QR</span>
                </button>
                <button
                  id="nav-view-market-superadmin"
                  onClick={() => setCurrentView('market')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'market' ? 'bg-amber-500 text-slate-950 shadow-soft-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Hub Repas</span>
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center bg-slate-100/80 p-0.5 rounded-xl gap-0.5 text-[11px] font-semibold border border-slate-200/70">
                <button
                  id="nav-view-dashboard"
                  onClick={() => setCurrentView('dashboard')}
                  title="Tableau de bord et gestion"
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    ['dashboard', 'menu', 'tables', 'orders', 'sales', 'inventory', 'staff', 'analytics', 'settings'].includes(currentView)
                      ? 'bg-white text-emerald-700 shadow-soft-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 shrink-0" />
                  <span>Gestion</span>
                  {pendingOrdersCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      {pendingOrdersCount}
                    </span>
                  )}
                </button>

                <button
                  id="nav-view-customer-qr"
                  onClick={() => {
                    if (tables.length > 0) setActiveCustomerTableId(tables[0].id);
                    setCurrentView('customer_qr');
                  }}
                  title="Vitrine client QR"
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'customer_qr' ? 'bg-white text-amber-700 shadow-soft-sm font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span>Menu QR</span>
                </button>

                <button
                  id="nav-view-market"
                  onClick={() => setCurrentView('market')}
                  title="Centre de commande de repas en ligne (Hub Proximité Meituan)"
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'market' ? 'bg-amber-500 text-slate-950 shadow-soft-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Hub Repas</span>
                </button>

                <button
                  id="nav-view-kitchen"
                  onClick={() => setCurrentView('kitchen')}
                  title="Écran de cuisine KDS"
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'kitchen' ? 'bg-white text-purple-700 shadow-soft-sm font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5 shrink-0" />
                  <span>Cuisine</span>
                </button>

                <button
                  id="nav-view-waiter"
                  onClick={() => setCurrentView('waiter')}
                  title="Interface serveurs"
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'waiter' ? 'bg-white text-blue-700 shadow-soft-sm font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>Serveurs</span>
                </button>

                <button
                  id="nav-view-driver"
                  onClick={() => setCurrentView('driver')}
                  title="Espace coursier & livraisons express"
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'driver' ? 'bg-amber-400 text-slate-950 shadow-soft-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Livreur</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1 sm:gap-2.5">
            
            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={toggleSound}
              title={soundEnabled ? "Sons activés" : "Sons désactivés"}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all hidden xs:flex items-center justify-center ${
                soundEnabled 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-soft-sm' 
                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Bilingual Switcher (Responsive) */}
            <LanguageSwitcher variant="compact" />

            {/* Tenant Restaurant Dropdown Selector & Super Admin Badge */}
            {isAuthenticated ? (
              <>
                {isSuperAdmin && (
                  <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-bold text-rose-800 shadow-soft-sm">
                    <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="hidden sm:inline">David Fokoua (Admin)</span>
                    <span className="sm:hidden">Admin</span>
                  </div>
                )}

                <div className="relative">
                  <button
                    id="restaurant-selector-btn"
                    onClick={() => {
                      if (restaurants.length === 0) {
                        setCurrentView('onboarding');
                      } else {
                        setShowRestDropdown(!showRestDropdown);
                        setShowRoleDropdown(false);
                      }
                    }}
                    className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 transition-all shadow-soft-sm cursor-pointer"
                    title={restaurants.length === 0 ? "Créer un restaurant" : `Restaurant actif: ${currentRestaurant?.name}`}
                  >
                    <img 
                      src={currentRestaurant?.logo || '/logo.svg'} 
                      alt={currentRestaurant?.name || 'Restaurant'} 
                      className="w-5 h-5 rounded-md object-cover border border-slate-200 shrink-0"
                    />
                    <span className="max-w-[70px] xs:max-w-[100px] sm:max-w-[150px] truncate">
                      {restaurants.length === 0 ? '+ Créer restaurant' : currentRestaurant?.name}
                    </span>
                    {restaurants.length > 0 && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  </button>

                  {showRestDropdown && (
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-soft-lg border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Changer de Restaurant</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Actif</span>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                        {restaurants.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            <p>Aucun restaurant créé pour le moment.</p>
                          </div>
                        ) : (
                          restaurants.map(rest => (
                            <button
                              key={rest.id}
                              id={`select-restaurant-${rest.id}`}
                              onClick={() => {
                                switchRestaurant(rest.id);
                                setShowRestDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                                rest.id === currentRestaurant?.id ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-slate-700'
                              }`}
                            >
                              <img src={rest.logo || '/logo.svg'} alt={rest.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate text-slate-900">{rest.name}</p>
                                <p className="text-[11px] text-slate-500 truncate">{rest.city} • {rest.address}</p>
                              </div>
                              {rest.id === currentRestaurant?.id && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                              )}
                            </button>
                          ))
                        )}
                      </div>

                      <div className="mt-1 pt-2 border-t border-slate-100">
                        <button
                          id="nav-create-new-restaurant-btn"
                          onClick={() => {
                            setShowRestDropdown(false);
                            setCurrentView('onboarding');
                          }}
                          className="w-full py-2 px-3 rounded-xl text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <PlusCircle className="w-4 h-4" />
                          + Enregistrer un restaurant
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Role Switcher Pill */}
                <div className="relative">
                  <button
                    id="role-selector-btn"
                    onClick={() => {
                      setShowRoleDropdown(!showRoleDropdown);
                      setShowRestDropdown(false);
                    }}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-soft-sm border ${
                      isSuperAdmin 
                        ? 'bg-rose-50 hover:bg-rose-100/80 text-rose-800 border-rose-200/80' 
                        : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border-emerald-200/80'
                    }`}
                  >
                    <UserCircle2 className={`w-3.5 h-3.5 ${isSuperAdmin ? 'text-rose-600' : 'text-emerald-600'}`} />
                    <span className="hidden sm:inline">{getRoleLabel(currentUser.role).split(' ')[0]}</span>
                    {isEmailVerified ? (
                      <span title="Email vérifié" className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    ) : (
                      <span title="Email en attente de vérification" className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    )}
                    <ChevronDown className={`w-3 h-3 ${isSuperAdmin ? 'text-rose-600' : 'text-emerald-600'} shrink-0`} />
                  </button>

                  {showRoleDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-soft-lg border border-slate-200 p-2 z-50">
                      <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Profil Actif
                      </div>
                      <div className="py-1 space-y-0.5 max-h-60 overflow-y-auto">
                        {(['owner', 'manager', 'cashier', 'waiter', 'chef', 'accountant', 'superadmin'] as UserRole[]).map(role => (
                          <button
                            key={role}
                            id={`select-role-${role}`}
                            onClick={() => {
                              setShowRoleDropdown(false);
                              if (currentUser.role === role) return;
                              setTargetSwitchRole(role);
                              setIsSwitchModalOpen(true);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                              currentUser.role === role ? 'font-bold text-emerald-700 bg-emerald-50/70' : 'text-slate-700 font-medium'
                            }`}
                          >
                            <span>{getRoleLabel(role)}</span>
                            {currentUser.role === role ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            ) : (
                              <Lock className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  id="nav-logout-btn"
                  onClick={logout}
                  title="Se déconnecter"
                  className="hidden sm:flex p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Connexion
                </button>
                <button
                  id="nav-register-btn"
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Créer mon compte</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Mobile Roll-Down Navigation Menu (Menu Déroulant Pleine Largeur) */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 top-[88px] sm:top-[92px] z-50 bg-slate-900/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="w-full bg-white border-b border-slate-200 shadow-2xl max-h-[calc(100vh-5.5rem)] overflow-y-auto animate-in slide-in-from-top-3 duration-250 p-4 sm:p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Active Restaurant Summary Card & Quick Switcher */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-soft-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img 
                    src={currentRestaurant.logo} 
                    alt={currentRestaurant.name} 
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-soft-sm shrink-0" 
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-extrabold text-slate-900 truncate">{currentRestaurant.name}</p>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="En ligne"></span>
                    </div>
                    <p className="text-xs text-slate-500 truncate font-medium">
                      {currentRestaurant.city} • <span className="font-semibold text-emerald-700">Plan {currentRestaurant.subscriptionPlan.toUpperCase()}</span>
                    </p>
                  </div>
                </div>

                {restaurants.length > 1 && (
                  <button
                    onClick={() => setShowMobileRestSelector(!showMobileRestSelector)}
                    className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200/80 flex items-center gap-1 transition-colors shrink-0"
                  >
                    <span>Changer</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showMobileRestSelector ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {/* Inline restaurant selector if multiple exist */}
              {showMobileRestSelector && restaurants.length > 1 && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5 animate-in fade-in">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Changer d'établissement actif</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {restaurants.map(rest => (
                      <button
                        key={rest.id}
                        onClick={() => {
                          switchRestaurant(rest.id);
                          setShowMobileRestSelector(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          currentRestaurant.id === rest.id 
                            ? 'bg-emerald-600 text-white font-bold shadow-soft-sm' 
                            : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={rest.logo} alt={rest.name} className="w-6 h-6 rounded-md object-cover border border-slate-200/60 shrink-0" />
                          <div className="min-w-0">
                            <span className="truncate block font-semibold">{rest.name}</span>
                            <span className={`text-[10px] block truncate ${currentRestaurant.id === rest.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                              {rest.city} • {rest.restaurantType}
                            </span>
                          </div>
                        </div>
                        {currentRestaurant.id === rest.id && <Check className="w-4 h-4 shrink-0 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Super Admin Special Card (if user has superadmin role, e.g. David Fokoua) */}
            {isSuperAdmin && (
              <button
                onClick={() => handleMobileNavClick('superadmin')}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  currentView === 'superadmin'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-soft-sm font-bold'
                    : 'bg-gradient-to-r from-rose-50 to-orange-50 hover:bg-rose-100/80 border-rose-200/80 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    currentView === 'superadmin' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'
                  }`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-extrabold leading-tight">Plateforme Super Admin</p>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                        currentView === 'superadmin' ? 'bg-white text-rose-700' : 'bg-rose-200 text-rose-800'
                      }`}>Admin</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${currentView === 'superadmin' ? 'text-rose-100' : 'text-rose-700'}`}>
                      Supervision de tous les restaurants & forfaits SaaS
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 opacity-60 shrink-0" />
              </button>
            )}

            {/* 3. Primary Restaurant Management Modules (Full Grid déroulé) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Gestion du Restaurant ({currentRestaurant.name})
                </p>
                {pendingOrdersCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                    {pendingOrdersCount} commande{pendingOrdersCount > 1 ? 's' : ''} en attente
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {restaurantModules.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMobileNavClick(item.id)}
                      className={`p-2.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all relative ${
                        isActive 
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-soft-sm font-bold' 
                          : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold leading-tight truncate">{item.label}</p>
                        <p className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>{item.sub}</p>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold shrink-0 ${
                          isActive ? 'bg-white text-emerald-800' : 'bg-rose-500 text-white'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Public & Client Views */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                Expérience Client & Public
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleMobileNavClick('market')}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all ${
                    currentView === 'market'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-soft-sm'
                      : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-950 font-bold'
                  }`}
                >
                  <Bike className="w-4 h-4 text-amber-700" />
                  <span className="text-[11px] leading-tight">Hub Repas (Meituan)</span>
                </button>

                <button
                  onClick={() => {
                    if (tables.length > 0) setActiveCustomerTableId(tables[0].id);
                    handleMobileNavClick('customer_qr');
                  }}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all ${
                    currentView === 'customer_qr'
                      ? 'bg-amber-600 text-white border-amber-700 font-bold shadow-soft-sm'
                      : 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="text-[11px] font-bold leading-tight">Menu Client QR</span>
                </button>

                <button
                  onClick={() => handleMobileNavClick('landing')}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all ${
                    currentView === 'landing'
                      ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-soft-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-[11px] font-bold leading-tight">Site Public</span>
                </button>

                <button
                  onClick={() => handleMobileNavClick('privacy')}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all ${
                    currentView === 'privacy'
                      ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-soft-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-bold leading-tight">Confidentialité</span>
                </button>
              </div>
            </div>

            {/* Language Switcher in Mobile Drawer */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">{t('platformBilingualNotice')}</p>
                  <p className="text-[10px] text-slate-500">Français • English</p>
                </div>
              </div>
              <LanguageSwitcher variant="compact" />
            </div>

            {/* 5. User Account, Sound Toggle & Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserCircle2 className="w-5 h-5 text-slate-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser?.name || 'Utilisateur'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      Rôle : <span className="font-semibold text-emerald-700">{getRoleLabel(currentUser.role)}</span>
                    </p>
                  </div>
                </div>

                {/* Sound toggle button */}
                <button
                  onClick={toggleSound}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    soundEnabled 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={soundEnabled ? "Sons activés" : "Sons désactivés"}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundEnabled ? 'Son ON' : 'Son OFF'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setCurrentView('onboarding');
                      }}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-soft-sm transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>{isSuperAdmin ? 'Enregistrer Resto' : 'Nouveau Resto'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-rose-200 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Se Déconnecter</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth('login');
                      }}
                      className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-soft-sm cursor-pointer"
                    >
                      <UserCircle2 className="w-4 h-4" />
                      <span>Connexion</span>
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth('register');
                      }}
                      className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-soft-sm cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Créer mon compte</span>
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECURE PROFILE SWITCH MODAL (PIN / PASSWORD PROTECTED) */}
      <SwitchProfileModal
        isOpen={isSwitchModalOpen}
        onClose={() => {
          setIsSwitchModalOpen(false);
          setTargetSwitchRole(null);
        }}
        targetRole={targetSwitchRole}
      />
    </header>
  );
};
