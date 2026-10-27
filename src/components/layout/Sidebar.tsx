import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  Layers, 
  Utensils, 
  Grid3X3, 
  DollarSign, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  QrCode, 
  ExternalLink,
  AlertTriangle,
  LogOut,
  UserCircle2,
  BellRing,
  KeyRound,
  Database,
  RefreshCw,
  ShieldCheck,
  Bike
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useLanguage } from '../../context/LanguageContext';
import { ActiveAppView } from '../../types';
import { getRoleLabel } from '../../utils/formatters';
import { SwitchProfileModal } from '../auth/SwitchProfileModal';

export const Sidebar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    currentRestaurant, 
    currentUser,
    isAuthenticated,
    logout,
    orders, 
    inventory, 
    tables,
    waiterCalls,
    setActiveCustomerTableId,
    getSubscriptionInfo,
    openRenewalModal,
    isSyncing,
    triggerCloudSync,
    lastStatsSyncTime
  } = useRestaurant();

  const { t, language } = useLanguage();

  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const newOrdersCount = orders.filter(o => o.status === 'new').length;
  const kitchenCount = orders.filter(o => o.status === 'accepted' || o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const lowStockCount = inventory.filter(i => i.quantity <= i.minimumQuantity).length;
  const pendingWaiterCalls = waiterCalls.filter(c => c.status === 'pending').length;

  const menuItems: { id: ActiveAppView; label: string; icon: React.ElementType; badge?: number; alertBadge?: boolean }[] = [
    { id: 'dashboard', label: t('view_dashboard'), icon: LayoutDashboard },
    { id: 'orders', label: t('view_orders'), icon: ShoppingBag, badge: newOrdersCount },
    { id: 'kitchen', label: t('view_kitchen'), icon: ChefHat, badge: kitchenCount },
    { id: 'waiter', label: t('view_waiter'), icon: Layers, badge: pendingWaiterCalls > 0 ? pendingWaiterCalls : readyCount },
    { id: 'menu', label: t('view_menu'), icon: Utensils },
    { id: 'tables', label: t('view_tables'), icon: Grid3X3 },
    { id: 'sales', label: t('view_sales'), icon: DollarSign },
    { id: 'inventory', label: t('view_inventory'), icon: Package, alertBadge: lowStockCount > 0 },
    { id: 'staff', label: t('view_staff'), icon: Users },
    { id: 'analytics', label: t('view_analytics'), icon: BarChart3 },
    { id: 'settings', label: t('view_settings'), icon: Settings },
  ];

  const handleOpenStorefront = () => {
    if (tables.length > 0) {
      setActiveCustomerTableId(tables[0].id);
    }
    setCurrentView('customer_qr');
  };

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/80 flex-col shrink-0 min-h-[calc(100vh-4rem)] select-none">
      
      {/* Restaurant summary header card */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <img 
            src={currentRestaurant.logo} 
            alt={currentRestaurant.name} 
            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-soft-sm"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-900 truncate tracking-tight">{currentRestaurant.name}</h2>
            <p className="text-xs text-slate-500 truncate font-medium">{currentRestaurant.restaurantType}</p>
            {(() => {
              const subInfo = getSubscriptionInfo(currentRestaurant);
              if (subInfo.isExpired || subInfo.isSuspended) {
                return (
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-[11px] font-bold text-rose-700 capitalize">
                      {subInfo.isSuspended ? 'Suspendu' : 'Expiré'}
                    </span>
                    <button
                      type="button"
                      onClick={openRenewalModal}
                      className="ml-auto text-[10px] font-black text-white bg-rose-600 hover:bg-rose-700 px-1.5 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                    >
                      Renouveler
                    </button>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${subInfo.daysRemaining <= 5 ? 'bg-amber-500' : 'bg-emerald-500 ring-2 ring-emerald-100'}`}></span>
                  <span className={`text-[11px] font-semibold capitalize ${subInfo.daysRemaining <= 5 ? 'text-amber-700 font-bold' : 'text-emerald-700'}`}>
                    {subInfo.daysRemaining <= 5 ? `${subInfo.daysRemaining}j restants` : currentRestaurant.subscriptionStatus}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">• Plan {currentRestaurant.subscriptionPlan.toUpperCase()}</span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              id={`sidebar-link-${item.id}`}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow-soft font-semibold' 
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{item.label}</span>
              </div>

              {item.id === 'waiter' && pendingWaiterCalls > 0 ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 animate-pulse shadow-xs">
                  <BellRing className="w-3 h-3 animate-bounce" />
                  {pendingWaiterCalls}
                </span>
              ) : item.badge !== undefined && item.badge > 0 ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-rose-500 text-white shadow-xs'
                }`}>
                  {item.badge}
                </span>
              ) : null}

              {item.alertBadge && (
                <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isActive ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900'
                }`}>
                  <AlertTriangle className="w-3 h-3" />
                  {lowStockCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Cloud Sync & Backup Mini-Indicator */}
      <div className="mx-3 mt-1 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-800 truncate flex items-center gap-1">
              <span>Cloud Sync</span>
              <span className="text-[9px] text-emerald-700 bg-emerald-100 font-black px-1 rounded">LIVE</span>
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {lastStatsSyncTime ? `À ${lastStatsSyncTime}` : 'Sauvegarde active'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => triggerCloudSync()}
          disabled={isSyncing}
          title="Synchroniser immédiatement avec le Cloud"
          className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-emerald-700 rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* Quick QR Storefront Card */}
      <div className="p-3.5 m-3 bg-gradient-to-br from-emerald-50/90 via-slate-50 to-amber-50/60 rounded-2xl border border-emerald-100/80 shadow-soft-sm">
        <div className="flex items-start justify-between">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-soft-sm">
            <QrCode className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200/60">
            En Ligne
          </span>
        </div>
        <h4 className="text-xs font-bold text-slate-900 mt-2">Menu Client QR</h4>
        <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-relaxed">Accédez au menu numérique en direct de vos tables.</p>
        
        <button
          id="sidebar-open-storefront-btn"
          onClick={handleOpenStorefront}
          className="w-full mt-2.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-soft transition-all duration-150 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ouvrir Menu Client
        </button>

        <button
          id="sidebar-open-food-hub-btn"
          onClick={() => setCurrentView('market')}
          className="w-full mt-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-soft transition-all duration-150 cursor-pointer"
        >
          <Bike className="w-3.5 h-3.5 text-amber-400" />
          <span>Hub Repas (Meituan)</span>
        </button>

        <button
          id="sidebar-open-driver-portal-btn"
          onClick={() => setCurrentView('driver')}
          className="w-full mt-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-soft transition-all duration-150 cursor-pointer"
        >
          <Bike className="w-3.5 h-3.5 fill-slate-950" />
          <span>Espace Livreur (Courses)</span>
        </button>
      </div>

      {/* User Session & Logout */}
      {isAuthenticated && (
        <div className="p-3 mx-3 mb-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
          <button
            onClick={() => setIsSwitchModalOpen(true)}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer group"
            title="Changer d'utilisateur (Code PIN / Mot de passe requis)"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs group-hover:bg-emerald-200">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{getRoleLabel(currentUser.role)} • PIN 🔒</p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSwitchModalOpen(true)}
              title="Changer de profil employé"
              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
            <button
              id="sidebar-logout-btn"
              onClick={logout}
              title="Se déconnecter"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Secure Switch Profile Modal */}
      <SwitchProfileModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
      />

    </aside>
  );
};
