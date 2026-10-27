import React, { useState } from 'react';
import { 
  Building2, 
  DollarSign, 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Power, 
  Sparkles,
  Plus,
  Trash2,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  BarChart3,
  Calendar,
  Lock,
  Edit2,
  Check,
  X,
  CreditCard,
  Store,
  Clock,
  Bike
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Restaurant, PlanType, SubscriptionStatus, DeliveryDriver } from '../../types';
import { formatFCFA, formatDateTime } from '../../utils/formatters';
import { 
  generateWhatsAppLink, 
  getRestaurantManagerWhatsAppMessage 
} from '../../utils/whatsapp';

type SuperAdminTab = 'restaurants' | 'saas_plans' | 'drivers';

export const SuperAdminDashboard: React.FC = () => {
  const { 
    restaurants, 
    setCurrentView, 
    plans,
    toggleRestaurantSuspension,
    deleteRestaurant,
    updateRestaurantSubscription,
    currentUser,
    switchRestaurant,
    getSubscriptionInfo,
    extendSubscriptionDays,
    simulateSubscriptionExpiry,
    isSubscriptionActive,
    drivers,
    validateDriverAccount
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<SuperAdminTab>('restaurants');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  
  // Driver verification tab filters
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  
  // Restaurant to delete confirmation modal
  const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick edit SaaS plan & status modal
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [editPlan, setEditPlan] = useState<PlanType>('business');
  const [editStatus, setEditStatus] = useState<SubscriptionStatus>('active');
  const [editExpiresAt, setEditExpiresAt] = useState<string>('');
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Success toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // SaaS metrics
  const totalMRR = restaurants.reduce((sum, r) => {
    if (!isSubscriptionActive(r)) return sum;
    const p = plans.find(plan => plan.id === r.subscriptionPlan);
    return sum + (p ? p.priceMonthly : 0);
  }, 0);

  const activeRestaurantsCount = restaurants.filter(r => isSubscriptionActive(r) && r.subscriptionStatus !== 'trial').length;
  const trialRestaurantsCount = restaurants.filter(r => isSubscriptionActive(r) && r.subscriptionStatus === 'trial').length;
  const expiredOrSuspendedCount = restaurants.filter(r => !isSubscriptionActive(r)).length;
  const expiringSoonCount = restaurants.filter(r => {
    const info = getSubscriptionInfo(r);
    return info.isActive && info.daysRemaining <= 5 && info.daysRemaining > 0;
  }).length;

  // Filtered restaurants
  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.ownerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedPlanFilter !== 'all' && r.subscriptionPlan !== selectedPlanFilter) return false;
    
    if (selectedStatusFilter === 'active') {
      if (!isSubscriptionActive(r) || r.subscriptionStatus === 'trial') return false;
    } else if (selectedStatusFilter === 'trial') {
      if (r.subscriptionStatus !== 'trial' || !isSubscriptionActive(r)) return false;
    } else if (selectedStatusFilter === 'expired_suspended') {
      if (isSubscriptionActive(r)) return false;
    } else if (selectedStatusFilter === 'expiring_soon') {
      const info = getSubscriptionInfo(r);
      if (!info.isActive || info.daysRemaining > 5 || info.daysRemaining <= 0) return false;
    }
    return true;
  });

  const handleToggleSuspension = async (resto: Restaurant) => {
    await toggleRestaurantSuspension(resto.id);
    const subInfo = getSubscriptionInfo(resto);
    const newStatus = subInfo.isSuspended ? 'remis en service' : 'suspendu directement';
    showToast(`L'accès au service du restaurant "${resto.name}" a été ${newStatus}.`);
  };

  const handleQuickExtend = async (resto: Restaurant, days: number) => {
    await extendSubscriptionDays(resto.id, days);
    showToast(`Abonnement de "${resto.name}" prolongé de +${days} jours.`);
  };

  const handleSimulateExpiry = async (resto: Restaurant) => {
    await simulateSubscriptionExpiry(resto.id);
    showToast(`Expiration immédiate simulée pour "${resto.name}". Accès au service suspendu !`);
  };

  const confirmDeleteRestaurant = async () => {
    if (!restaurantToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRestaurant(restaurantToDelete.id);
      showToast(`Le restaurant "${restaurantToDelete.name}" a été définitivement supprimé.`);
      setRestaurantToDelete(null);
    } catch (err) {
      console.error(err);
      showToast("Une erreur est survenue lors de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEditPlan = (resto: Restaurant) => {
    setEditingRestaurant(resto);
    setEditPlan(resto.subscriptionPlan);
    setEditStatus(resto.subscriptionStatus);
    setEditExpiresAt(resto.subscriptionExpiresAt ? resto.subscriptionExpiresAt.slice(0, 10) : '');
  };

  const handleSaveSubscription = async () => {
    if (!editingRestaurant) return;
    setIsSavingPlan(true);
    try {
      const expIso = editExpiresAt ? new Date(`${editExpiresAt}T23:59:59.000Z`).toISOString() : undefined;
      await updateRestaurantSubscription(editingRestaurant.id, editPlan, editStatus, expIso);
      showToast(`Abonnement du restaurant "${editingRestaurant.name}" mis à jour avec succès.`);
      setEditingRestaurant(null);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la mise à jour de l'abonnement.");
    } finally {
      setIsSavingPlan(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Super Admin Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black tracking-tight">Super Administration Plateforme AFRORESTO</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Gérant Principal : <span className="font-bold text-white">David Fokoua</span> (davidfokoua143@gmail.com) • Plateforme Panafricaine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            id="superadmin-new-resto-btn"
            onClick={() => setCurrentView('onboarding')}
            className="w-full md:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer un Restaurant</span>
          </button>
        </div>
      </div>

      {/* Confidentiality Commitment Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-950">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <p className="font-bold text-blue-900 flex items-center gap-1.5">
              Politique de Confidentialité & Respect du Secret Commercial
            </p>
            <p className="text-blue-800/90 leading-relaxed text-[11px]">
              Conformément à la charte de confidentialité AFRORESTO, l'administrateur de la plateforme n'a aucun accès aux données de gestion interne d'un établissement (commandes privées, recettes de cuisine, inventaires ou clôtures de caisse). Vos prérogatives administratives sont strictement limitées à la supervision des comptes, la gestion des forfaits SaaS, les suspensions/remises en service et le support direct avec les dirigeants.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCurrentView('privacy')}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shrink-0 transition-colors shadow-2xs"
        >
          Consulter la Charte Complète
        </button>
      </div>

      {/* Global SaaS Platform Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-soft-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Restaurants Inscrits</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">{restaurants.length}</p>
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <span className="text-emerald-700">{activeRestaurantsCount} Actifs</span>
            <span className="text-blue-600">• {trialRestaurantsCount} Essai</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-soft-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Revenu SaaS Mensuel (MRR)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-800">{formatFCFA(totalMRR)}</p>
          <p className="text-[11px] text-slate-500 font-medium">Abonnements actifs collectés</p>
        </div>

        <div 
          onClick={() => setSelectedStatusFilter('expiring_soon')}
          className={`p-4 sm:p-5 rounded-3xl border shadow-soft-sm space-y-1 cursor-pointer transition-all ${
            selectedStatusFilter === 'expiring_soon' 
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400' 
              : 'bg-white border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Expire Bientôt (&le; 5j)</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600">{expiringSoonCount}</p>
          <p className="text-[11px] text-slate-500 font-medium">Rappels de renouvellement</p>
        </div>

        <div 
          onClick={() => setSelectedStatusFilter('expired_suspended')}
          className={`p-4 sm:p-5 rounded-3xl border shadow-soft-sm space-y-1 cursor-pointer transition-all ${
            selectedStatusFilter === 'expired_suspended' 
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400' 
              : 'bg-white border-slate-200/80 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Accès Suspendus / Expirés</span>
            <Power className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-700">{expiredOrSuspendedCount}</p>
          <p className="text-[11px] text-slate-500 font-medium">Service bloqué directement</p>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          id="tab-superadmin-restaurants"
          onClick={() => setActiveTab('restaurants')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'restaurants'
              ? 'bg-slate-900 text-white shadow-soft-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Gestion des Établissements ({restaurants.length})</span>
        </button>

        <button
          id="tab-superadmin-saas"
          onClick={() => setActiveTab('saas_plans')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'saas_plans'
              ? 'bg-slate-900 text-white shadow-soft-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Tarifs & Forfaits SaaS AFRORESTO</span>
        </button>

        <button
          id="tab-superadmin-drivers"
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === 'drivers'
              ? 'bg-amber-500 text-slate-950 font-black shadow-soft-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/60'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Livreurs & Validation Bureau ({drivers.length})</span>
          {drivers.filter(d => !d.isVerified || d.verificationStatus === 'pending_office_check').length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] animate-pulse">
              {drivers.filter(d => !d.isVerified || d.verificationStatus === 'pending_office_check').length} à vérifier
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: GESTION DES ÉTABLISSEMENTS & ABONNEMENTS */}
      {activeTab === 'restaurants' && (
        <div className="space-y-4">
          
          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-soft-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher nom, gérant, ville, tél..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="all">Tous les Statuts</option>
                <option value="active">Actifs (En service)</option>
                <option value="expiring_soon">⚠️ Expire Bientôt (&le; 5 jours)</option>
                <option value="expired_suspended">🔴 Suspendus ou Expirés (Bloqués)</option>
                <option value="trial">En Période d'Essai</option>
              </select>

              {/* Plan Filter */}
              <select
                value={selectedPlanFilter}
                onChange={e => setSelectedPlanFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="all">Tous les Forfaits</option>
                <option value="starter">Starter</option>
                <option value="business">Business</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              {filteredRestaurants.length} établissement{filteredRestaurants.length > 1 ? 's' : ''} répertorié{filteredRestaurants.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Restaurants Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft-sm overflow-hidden">
            {filteredRestaurants.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-800">Aucun restaurant trouvé</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {restaurants.length === 0 
                    ? "Aucun restaurant n'a encore été créé. Cliquez sur 'Enregistrer un Restaurant' pour créer le premier établissement."
                    : "Aucun résultat ne correspond à vos filtres de recherche."}
                </p>
                {restaurants.length === 0 && (
                  <button
                    onClick={() => setCurrentView('onboarding')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-soft transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Créer un Restaurant
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Établissement</th>
                      <th className="p-4">Dirigeant & Contact</th>
                      <th className="p-4">Forfait SaaS & Échéance</th>
                      <th className="p-4">Statut Service</th>
                      <th className="p-4">Date Inscription</th>
                      <th className="p-4 text-right">Actions & Gestion Abonnement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRestaurants.map(r => {
                      const subInfo = getSubscriptionInfo(r);
                      const isSuspended = subInfo.isSuspended;
                      const isExpired = subInfo.isExpired;
                      const isInactive = !subInfo.isActive;
                      
                      const whatsappText = isInactive
                        ? `Bonjour ${r.ownerName || 'Gérant'}, votre abonnement AFRORESTO pour "${r.name}" est expiré. L'accès au service est actuellement suspendu. Souhaitez-vous régulariser votre abonnement dès maintenant ?`
                        : `Bonjour ${r.ownerName || 'Gérant'}, l'équipe AFRORESTO reste à votre disposition pour votre établissement "${r.name}".`;
                      
                      const whatsappLink = generateWhatsAppLink(r.phone, whatsappText);
                      const phoneHref = r.phone ? `tel:${r.phone.replace(/\s+/g, '')}` : '#';
                      const planInfo = plans.find(p => p.id === r.subscriptionPlan);

                      const formattedExp = subInfo.expiresAt 
                        ? new Date(subInfo.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Non définie';

                      return (
                        <tr key={r.id} className={`hover:bg-slate-50/80 transition-colors ${isInactive ? 'bg-rose-50/30' : ''}`}>
                          
                          {/* Restaurant Info */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={r.logo || '/logo.svg'} 
                                alt={r.name} 
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-white" 
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 text-sm truncate">{r.name}</p>
                                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {r.city}, {r.country || "Afrique"} • {r.restaurantType || 'Restaurant'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Owner & Phone */}
                          <td className="p-4">
                            <p className="font-bold text-slate-800">{r.ownerName || 'Non renseigné'}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{r.phone || 'Pas de numéro'}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3 fill-current" />
                                <span>WhatsApp</span>
                              </a>
                              {r.phone && (
                                <a
                                  href={phoneHref}
                                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px]"
                                  title="Appeler"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Plan & Expiration Date */}
                          <td className="p-4 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] uppercase border border-purple-200/60">
                                {r.subscriptionPlan}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                ({planInfo ? formatFCFA(planInfo.priceMonthly) : ''}/mois)
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Échéance : <strong>{formattedExp}</strong></span>
                            </div>
                          </td>

                          {/* Service Status Badge */}
                          <td className="p-4">
                            {isSuspended ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-black text-[10px] uppercase">
                                <Power className="w-3 h-3" /> SUSPENDU
                              </span>
                            ) : isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-black text-[10px] uppercase">
                                <AlertCircle className="w-3 h-3 animate-pulse" /> EXPIRÉ (Bloqué)
                              </span>
                            ) : subInfo.daysRemaining <= 5 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                <Clock className="w-3 h-3" /> Expire dans {subInfo.daysRemaining}j
                              </span>
                            ) : subInfo.isTrial ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                                <Calendar className="w-3 h-3" /> ESSAI ({subInfo.daysRemaining}j)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                <CheckCircle2 className="w-3 h-3" /> ACTIF ({subInfo.daysRemaining}j)
                              </span>
                            )}
                          </td>

                          {/* Created Date */}
                          <td className="p-4 text-slate-500 font-mono text-[11px]">
                            {r.createdAt ? formatDateTime(r.createdAt) : 'Inconnue'}
                          </td>

                          {/* Administrator Actions */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Open Restaurant Dashboard directly */}
                              <button
                                onClick={() => {
                                  switchRestaurant(r.id);
                                  setCurrentView('dashboard');
                                }}
                                title={`Ouvrir l'espace de ${r.name}`}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Store className="w-3.5 h-3.5" />
                                <span className="hidden lg:inline">Accéder</span>
                              </button>

                              {/* Quick +30 Days Extend */}
                              <button
                                onClick={() => handleQuickExtend(r, 30)}
                                title="Prolonger de +30 jours l'abonnement"
                                className="px-2 py-1 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-all cursor-pointer border border-slate-200"
                              >
                                +30j
                              </button>

                              {/* Simulate immediate expiration (Test tool) */}
                              <button
                                onClick={() => handleSimulateExpiry(r)}
                                title="Simuler l'expiration immédiate (pour tester la suspension de service)"
                                className="px-2 py-1 rounded-xl text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer border border-rose-200"
                              >
                                Expirer (Test)
                              </button>
                              
                              {/* Edit SaaS Plan & Expiration */}
                              <button
                                onClick={() => handleOpenEditPlan(r)}
                                title="Modifier le forfait SaaS ou l'échéance"
                                className="p-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Suspension */}
                              <button
                                onClick={() => handleToggleSuspension(r)}
                                title={isInactive ? "Rétablir l'accès au service" : "Suspendre directement l'accès au service"}
                                className={`p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  isInactive
                                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                                    : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Restaurant */}
                              <button
                                onClick={() => setRestaurantToDelete(r)}
                                title="Supprimer définitivement le restaurant"
                                className="p-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-all border border-rose-200/60 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: TARIFS & FORFAITS SAAS */}
      {activeTab === 'saas_plans' && (
        <div className="space-y-6">
          {/* Launch policy explanation banner */}
          <div className="p-5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 border border-amber-300/80 rounded-3xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
              🎁
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Stratégie de Rétention & Boost de Lancement AFRORESTO
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Pour ce lancement, <strong>tous les établissements partenaires profitent de 100% des fonctionnalités du forfait PREMIUM</strong> sans aucune bride, même lorsqu'ils souscrivent au forfait STARTER. Cette politique permet à chaque restaurateur de tester la puissance du KDS, des stocks, du multi-espaces et d'engager durablement ses clients dès les premiers mois.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft-sm p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Grille Tarifaire SaaS AFRORESTO Afrique</h3>
              <p className="text-xs text-slate-500 mt-1">
                Abonnements mensuels destinés aux restaurants, bars, lounges, snacks et maquis partenaires en Afrique.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map(plan => {
                const subscribersCount = restaurants.filter(r => r.subscriptionPlan === plan.id && r.subscriptionStatus !== 'suspended').length;
                const monthlyRevenue = subscribersCount * plan.priceMonthly;

                return (
                  <div 
                    key={plan.id}
                    className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                      plan.isPopular || plan.popular 
                        ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20 shadow-lg' 
                        : 'border-slate-200 bg-white shadow-soft-sm'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{plan.name}</span>
                        {plan.id === 'starter' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                            BOOST PREMIUM
                          </span>
                        ) : (plan.isPopular || plan.popular) ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                            POPULAIRE
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <span className="text-2xl font-black text-slate-900">{formatFCFA(plan.priceMonthly)}</span>
                        <span className="text-xs text-slate-500 font-medium"> / mois</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex justify-between items-center">
                        <span className="text-slate-600 font-semibold">Restaurants abonnés :</span>
                        <span className="font-black text-slate-900">{subscribersCount}</span>
                      </div>

                      <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs flex justify-between items-center text-emerald-900">
                        <span className="font-semibold">Revenu mensuel généré :</span>
                        <span className="font-black">{formatFCFA(monthlyRevenue)}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                        <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Fonctionnalités incluses :</p>
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-600 text-[11px]">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GESTION DES LIVREURS & VALIDATION PHYSIQUE EN BUREAU */}
      {activeTab === 'drivers' && (
        <div className="space-y-4">
          
          {/* Header & KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-soft-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Livreurs Inscrits</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{drivers.length}</p>
              <p className="text-[11px] text-slate-400">Réseau panafricain de coursiers</p>
            </div>

            <div className="p-4 bg-amber-50 rounded-3xl border border-amber-200 shadow-soft-sm">
              <span className="text-[11px] font-bold text-amber-800 uppercase">En Attente Contrôle Bureau</span>
              <p className="text-2xl font-black text-amber-900 mt-1">
                {drivers.filter(d => !d.isVerified || d.verificationStatus === 'pending_office_check').length}
              </p>
              <p className="text-[11px] text-amber-700">CNI & véhicule à vérifier en agence</p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-200 shadow-soft-sm">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Livreurs Validés & Actifs</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">
                {drivers.filter(d => d.isVerified && d.verificationStatus === 'verified').length}
              </p>
              <p className="text-[11px] text-emerald-700">Autorisés à accepter les courses (80% net)</p>
            </div>
          </div>

          {/* Operational Policy Reminder */}
          <div className="p-4 bg-slate-900 text-white rounded-3xl flex items-start gap-3 shadow-md">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-extrabold text-amber-300 block">
                Protocole Obligatoire de Vérification Physique AFRORESTO :
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Conformément à la politique de sécurité de la plateforme, chaque livreur partenaire doit obligatoirement se présenter physiquement à l'agence AFRORESTO de sa ville muni de sa <strong>CNI originale</strong>, de la <strong>carte grise / certificat d'immatriculation</strong> de son véhicule et de son <strong>permis de conduire</strong>. Ne validez un compte coursier qu'après avoir inspecté physiquement la conformité des pièces. Une fois validé, le livreur reçoit les alertes de commandes et perçoit <strong>80% de la commission de livraison</strong> fixée par le client (entre 300 et 1 500 FCFA).
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-soft-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher coursier (nom, téléphone, CNI, matricule, ville)..."
                value={driverSearchQuery}
                onChange={e => setDriverSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {[
                { id: 'all', label: `Tous (${drivers.length})` },
                { id: 'pending', label: `En attente bureau (${drivers.filter(d => !d.isVerified || d.verificationStatus === 'pending_office_check').length})` },
                { id: 'verified', label: `Validés (${drivers.filter(d => d.isVerified && d.verificationStatus === 'verified').length})` },
                { id: 'rejected', label: `Rejetés (${drivers.filter(d => d.verificationStatus === 'rejected').length})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setDriverStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    driverStatusFilter === f.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drivers Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Coursier</th>
                    <th className="p-3.5">Coordonnées & CNI</th>
                    <th className="p-3.5">Véhicule & Matricule</th>
                    <th className="p-3.5">Ville & Secteurs</th>
                    <th className="p-3.5">Statut Vérification</th>
                    <th className="p-3.5 text-right">Actions Contrôle Bureau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drivers
                    .filter(d => {
                      if (driverStatusFilter === 'pending' && (d.isVerified || d.verificationStatus === 'verified')) return false;
                      if (driverStatusFilter === 'verified' && (!d.isVerified || d.verificationStatus !== 'verified')) return false;
                      if (driverStatusFilter === 'rejected' && d.verificationStatus !== 'rejected') return false;

                      if (driverSearchQuery.trim()) {
                        const q = driverSearchQuery.toLowerCase().trim();
                        return (
                          d.name?.toLowerCase().includes(q) ||
                          d.phone?.toLowerCase().includes(q) ||
                          d.email?.toLowerCase().includes(q) ||
                          d.cniNumber?.toLowerCase().includes(q) ||
                          d.vehiclePlate?.toLowerCase().includes(q) ||
                          d.serviceCity?.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map(d => {
                      const isPending = !d.isVerified || d.verificationStatus === 'pending_office_check';
                      const isVerified = d.isVerified && d.verificationStatus === 'verified';
                      const isRejected = d.verificationStatus === 'rejected';
                      const cleanPhone = (d.phone || '').replace(/[^0-9]/g, '');

                      return (
                        <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black shrink-0">
                                <Bike className="w-5 h-5 text-amber-700" />
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 block">{d.name}</span>
                                <span className="text-[10px] text-slate-400">Inscrit : {formatDateTime(d.createdAt)}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800 block">{d.phone}</span>
                              <span className="text-[11px] text-slate-500 block">{d.email}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold inline-block">
                                CNI: {d.cniNumber || 'Non renseigné'}
                              </span>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800 capitalize block">
                                {d.vehicleType === 'moto' && '🏍️ Moto'}
                                {d.vehicleType === 'scooter' && '🛵 Scooter'}
                                {d.vehicleType === 'velo' && '🚲 Vélo'}
                                {d.vehicleType === 'voiture' && '🚗 Voiture'}
                              </span>
                              <span className="text-[11px] font-mono font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 inline-block">
                                {d.vehiclePlate || 'Sans plaque'}
                              </span>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 block">{d.serviceCity || 'Douala'}</span>
                              <span className="text-[10px] text-slate-500 block line-clamp-1">
                                {d.serviceZones?.join(', ') || 'Toutes zones'}
                              </span>
                            </div>
                          </td>

                          <td className="p-3.5">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>En attente passage bureau</span>
                              </span>
                            )}
                            {isVerified && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>Vérifié & Activé</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 text-[10px] font-black border border-rose-300">
                                <AlertCircle className="w-3 h-3 text-rose-700" />
                                <span>Rejeté ({d.rejectionReason || 'Documents invalides'})</span>
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => validateDriverAccount(d.id, true)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                  title="Confirmer la vérification physique des documents et activer le compte"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Valider au bureau</span>
                                </button>
                              )}

                              {isVerified && (
                                <button
                                  type="button"
                                  onClick={() => validateDriverAccount(d.id, false, 'Suspendu par Super Admin')}
                                  className="px-2 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-[11px] rounded-xl transition-colors cursor-pointer"
                                  title="Désactiver temporairement ce livreur"
                                >
                                  Suspendre
                                </button>
                              )}

                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const reason = prompt('Motif du refus des documents (ex: CNI périmée, matricule non conforme) :') || 'Documents non conformes';
                                    validateDriverAccount(d.id, false, reason);
                                  }}
                                  className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-xl transition-colors cursor-pointer"
                                  title="Refuser ce profil"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/${cleanPhone.startsWith('237') || cleanPhone.startsWith('225') ? cleanPhone : `237${cleanPhone}`}?text=Bonjour%20${encodeURIComponent(d.name)},%20ici%20l'administration%20AFRORESTO%20concernant%20votre%20compte%20livreur.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl transition-colors"
                                  title="Écrire sur WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4 text-emerald-700" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {drivers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Aucun livreur partenaire enregistré pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODAL: EDIT SAAS PLAN & STATUS */}
      {editingRestaurant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">Modifier Forfait SaaS & Statut</h3>
              </div>
              <button 
                onClick={() => setEditingRestaurant(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3">
              <img src={editingRestaurant.logo || '/logo.svg'} alt={editingRestaurant.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
              <div>
                <p className="font-bold text-slate-900 text-xs">{editingRestaurant.name}</p>
                <p className="text-[11px] text-slate-500">{editingRestaurant.city} • {editingRestaurant.ownerName}</p>
              </div>
            </div>

            {/* Select Plan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Forfait SaaS</label>
              <select
                value={editPlan}
                onChange={e => setEditPlan(e.target.value as PlanType)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatFCFA(p.priceMonthly)} / mois {p.id === 'starter' ? '(avec Boost Premium Offert)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Statut de l'Établissement</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as SubscriptionStatus)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              >
                <option value="active">Actif (Abonnement valide, commandes ouvertes)</option>
                <option value="trial">En Période d'Essai (14 jours offerts)</option>
                <option value="expired">Expiré (Abonnement échu, service suspendu directement)</option>
                <option value="suspended">Hors Service (Suspendu manuellement, service bloqué)</option>
              </select>
            </div>

            {/* Expiration Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Date d'Échéance / Expiration</label>
              <input
                type="date"
                value={editExpiresAt}
                onChange={e => setEditExpiresAt(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-500">
                Dès que cette date est atteinte, l'accès au service de ce restaurant est suspendu automatiquement.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRestaurant(null)}
                disabled={isSavingPlan}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveSubscription}
                disabled={isSavingPlan}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-soft-sm"
              >
                {isSavingPlan ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isSavingPlan ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE RESTAURANT CONFIRMATION */}
      {restaurantToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-rose-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Supprimer le restaurant "{restaurantToDelete.name}" ?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cette action est <span className="font-bold text-rose-600">irréversible</span>. Elle supprimera définitivement l'établissement de la plateforme.
              </p>
            </div>

            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs space-y-1 text-rose-900">
              <p className="font-bold">Détails de l'établissement :</p>
              <p className="text-[11px]">• Propriétaire : {restaurantToDelete.ownerName} ({restaurantToDelete.ownerEmail})</p>
              <p className="text-[11px]">• Ville : {restaurantToDelete.city}, {restaurantToDelete.address}</p>
              <p className="text-[11px]">• Téléphone : {restaurantToDelete.phone}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestaurantToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteRestaurant}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-soft-sm"
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeleting ? 'Suppression...' : 'Supprimer Définitivement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
