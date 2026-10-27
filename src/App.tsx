import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  Grid3X3, 
  Utensils, 
  DollarSign, 
  Menu as MenuIcon,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Lock,
  MoreHorizontal,
  Package,
  Users,
  BarChart3,
  Settings,
  QrCode,
  Globe,
  X
} from 'lucide-react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './components/landing/LandingPage';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { OrdersKanban } from './components/orders/OrdersKanban';
import { KitchenDisplay } from './components/kitchen/KitchenDisplay';
import { WaiterView } from './components/waiter/WaiterView';
import { MenuManager } from './components/menu/MenuManager';
import { TableManager } from './components/tables/TableManager';
import { SalesPOS } from './components/sales/SalesPOS';
import { InventoryManager } from './components/inventory/InventoryManager';
import { StaffManager } from './components/staff/StaffManager';
import { AnalyticsReports } from './components/analytics/AnalyticsReports';
import { RestaurantSettings } from './components/settings/RestaurantSettings';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { CustomerStorefront } from './components/client/CustomerStorefront';
import { CustomerOrderTracker } from './components/client/CustomerOrderTracker';
import { OnlineFoodHub } from './components/foodhub/OnlineFoodHub';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { DriverPortal } from './components/driver/DriverPortal';
import { AuthModal } from './components/auth/AuthModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { IncomingOrderNotification } from './components/common/IncomingOrderNotification';
import { SubscriptionSuspendedScreen } from './components/subscription/SubscriptionSuspendedScreen';
import { SubscriptionRenewalModal } from './components/subscription/SubscriptionRenewalModal';
import { SubscriptionExpiryBanner } from './components/subscription/SubscriptionExpiryBanner';

const AppContent: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    activeCustomerOrderId, 
    orders, 
    currentUser, 
    waiterCalls,
    isAuthenticated,
    currentRestaurant,
    isSubscriptionActive
  } = useRestaurant();
  const { t } = useLanguage();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'new' || o.status === 'accepted').length;
  const pendingWaiterCalls = waiterCalls.filter(c => c.status === 'pending').length;
  const isSuperAdmin = currentUser?.role === 'superadmin';

  // 1. Landing page view (full screen)
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
        <Navbar onOpenAuth={handleOpenAuth} />
        <LandingPage onOpenAuth={handleOpenAuth} />
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode={authModalMode}
        />
        <SubscriptionRenewalModal />
      </div>
    );
  }

  // 2. Onboarding wizard view
  if (currentView === 'onboarding') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
        <Navbar onOpenAuth={handleOpenAuth} />
        <OnboardingWizard />
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode={authModalMode}
        />
        <SubscriptionRenewalModal />
      </div>
    );
  }

  // 3. Customer QR Storefront / Order Tracker (Dedicated full-screen customer interface)
  if (currentView === 'customer_qr') {
    return (
      <ErrorBoundary fallbackTitle="Menu Digital QR - AFRORESTO">
        <div className="min-h-screen bg-slate-900 md:bg-slate-100 flex flex-col antialiased">
          {activeCustomerOrderId ? (
            <CustomerOrderTracker />
          ) : (
            <CustomerStorefront />
          )}
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            initialMode={authModalMode}
          />
          <SubscriptionRenewalModal />
        </div>
      </ErrorBoundary>
    );
  }

  // 4. Online Food Ordering Hub (Meituan-style multi-restaurant proximity ordering)
  if (currentView === 'market') {
    return (
      <ErrorBoundary fallbackTitle="Centre de Commande de Repas en Ligne — AFRORESTO">
        <div className="min-h-screen bg-slate-900 md:bg-slate-100 flex flex-col antialiased">
          <Navbar onOpenAuth={handleOpenAuth} />
          <OnlineFoodHub />
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            initialMode={authModalMode}
          />
          <SubscriptionRenewalModal />
        </div>
      </ErrorBoundary>
    );
  }

  // 5. Privacy Policy View
  if (currentView === 'privacy') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
        <Navbar onOpenAuth={handleOpenAuth} />
        <main className="flex-1">
          <PrivacyPolicy />
        </main>
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode={authModalMode}
        />
        <SubscriptionRenewalModal />
      </div>
    );
  }

  // 6. Dedicated Delivery Courier Portal View (Livreurs & dispatch)
  if (currentView === 'driver') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col antialiased">
        <Navbar onOpenAuth={handleOpenAuth} />
        <DriverPortal />
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode={authModalMode}
        />
        <SubscriptionRenewalModal />
      </div>
    );
  }

  // 7. SECURITY GUARD: Require authentication with password for all staff views
  const isStaffView = !['landing', 'customer_qr', 'market', 'onboarding', 'privacy', 'driver'].includes(currentView);
  if (isStaffView && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col antialiased">
        <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 text-center space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{t('protectedAreaTitle')}</h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t('protectedAreaDescription')}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 font-medium">
              {t('protectedAreaInstruction')}
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                {t('signInWithPassword')}
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('customer_qr')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {t('returnToCustomerMenu')}
              </button>
            </div>
          </div>
        </div>
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
        <SubscriptionRenewalModal />
      </div>
    );
  }

  // 6. DIRECT SERVICE SUSPENSION GUARD:
  // If subscription is expired or suspended, directly block staff service access (except superadmin)
  if (isStaffView && !isSuperAdmin && !isSubscriptionActive(currentRestaurant)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col antialiased">
        <SubscriptionSuspendedScreen />
        <SubscriptionRenewalModal />
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </div>
    );
  }

  // 6. Kitchen Display System (Full terminal view - Authenticated staff only)
  if (currentView === 'kitchen') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col antialiased">
        <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />
        <IncomingOrderNotification />
        <KitchenDisplay />
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </div>
    );
  }

  // 7. Super Admin Platform View (Super Admin role only)
  if (currentView === 'superadmin') {
    if (currentUser?.role !== 'superadmin') {
      setCurrentView('dashboard');
      return null;
    }
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
        <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />
        <main className="flex-1">
          <SuperAdminDashboard />
        </main>
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </div>
    );
  }

  // 7. Main Restaurant Management Views with Persistent Sidebar and Mobile Bottom Bar (For Restaurant Staff / Owners / Super Admin)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />
      <SubscriptionExpiryBanner />
      <IncomingOrderNotification />
      
      <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-4rem)] bg-slate-50/60 pb-24 md:pb-8">
          {currentView === 'dashboard' && <DashboardOverview />}
          {currentView === 'orders' && <OrdersKanban />}
          {currentView === 'waiter' && <WaiterView />}
          {currentView === 'menu' && <MenuManager />}
          {currentView === 'tables' && <TableManager />}
          {currentView === 'sales' && <SalesPOS />}
          {currentView === 'inventory' && <InventoryManager />}
          {currentView === 'staff' && <StaffManager />}
          {currentView === 'analytics' && <AnalyticsReports />}
          {currentView === 'settings' && <RestaurantSettings />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar for rapid thumb access */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-1.5 py-1.5 flex items-center justify-around shadow-soft-lg">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            currentView === 'dashboard' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Accueil</span>
        </button>

        <button
          onClick={() => setCurrentView('orders')}
          className={`relative flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            currentView === 'orders' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span>Commandes</span>
          {pendingOrdersCount > 0 && (
            <span className="absolute -top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
              {pendingOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentView('tables')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            currentView === 'tables' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Grid3X3 className="w-5 h-5 mb-0.5" />
          <span>Tables QR</span>
        </button>

        <button
          onClick={() => setCurrentView('menu')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            currentView === 'menu' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Utensils className="w-5 h-5 mb-0.5" />
          <span>Menu</span>
        </button>

        <button
          onClick={() => setCurrentView('sales')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            currentView === 'sales' ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-5 h-5 mb-0.5" />
          <span>Caisse</span>
        </button>

        <button
          onClick={() => setIsMobileMoreOpen(true)}
          className={`relative flex flex-col items-center py-1 px-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            ['kitchen', 'waiter', 'inventory', 'staff', 'analytics', 'settings'].includes(currentView)
              ? 'text-emerald-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {pendingWaiterCalls > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          )}
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>Plus</span>
        </button>
      </nav>

      {/* Mobile Quick "More" Sheet Modal */}
      {isMobileMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in">
          <div 
            className="fixed inset-0"
            onClick={() => setIsMobileMoreOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 pb-8 space-y-4 max-h-[80vh] overflow-y-auto z-10 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Toutes les fonctionnalités</h3>
              </div>
              <button 
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => { setCurrentView('kitchen'); setIsMobileMoreOpen(false); }}
                className="p-3 rounded-2xl border text-left flex items-center gap-3 transition-all bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
              >
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs shrink-0">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">Cuisine (KDS)</p>
                  <p className="text-[10px] text-slate-500">Préparation</p>
                </div>
              </button>

              <button
                onClick={() => { setCurrentView('waiter'); setIsMobileMoreOpen(false); }}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                  currentView === 'waiter' ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500 text-white shadow-xs shrink-0">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">Serveurs</p>
                    <p className="text-[10px] text-slate-500">Prise de commande</p>
                  </div>
                </div>
                {pendingWaiterCalls > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] animate-pulse">
                    {pendingWaiterCalls}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setCurrentView('inventory'); setIsMobileMoreOpen(false); }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  currentView === 'inventory' ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold' : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-purple-500 text-white shadow-xs shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">Stocks</p>
                  <p className="text-[10px] text-slate-500">Ingrédients & alertes</p>
                </div>
              </button>

              <button
                onClick={() => { setCurrentView('staff'); setIsMobileMoreOpen(false); }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  currentView === 'staff' ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold' : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-indigo-500 text-white shadow-xs shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">Équipe</p>
                  <p className="text-[10px] text-slate-500">Membres & Rôles</p>
                </div>
              </button>

              <button
                onClick={() => { setCurrentView('analytics'); setIsMobileMoreOpen(false); }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  currentView === 'analytics' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">Statistiques</p>
                  <p className="text-[10px] text-slate-500">Rapports & Ventes</p>
                </div>
              </button>

              <button
                onClick={() => { setCurrentView('settings'); setIsMobileMoreOpen(false); }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  currentView === 'settings' ? 'bg-slate-200 border-slate-300 text-slate-900 font-bold' : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-700 text-white shadow-xs shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">Paramètres</p>
                  <p className="text-[10px] text-slate-500">Configuration</p>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                onClick={() => { setCurrentView('customer_qr'); setIsMobileMoreOpen(false); }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-emerald-200/80"
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                Tester la commande client QR (Simulateur)
              </button>

              <button
                onClick={() => { setCurrentView('landing'); setIsMobileMoreOpen(false); }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Globe className="w-4 h-4 text-slate-500" />
                Retour au site vitrine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal & Subscription Renewal Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
      <SubscriptionRenewalModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Une erreur inattendue est survenue">
      <LanguageProvider>
        <RestaurantProvider>
          <AppContent />
        </RestaurantProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
