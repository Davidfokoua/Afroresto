import React, { useState } from 'react';
import { 
  Bike, 
  MapPin, 
  Phone, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Download, 
  Sparkles, 
  Wallet, 
  Smartphone, 
  RefreshCw, 
  ChevronRight, 
  FileText, 
  ShieldCheck, 
  ExternalLink, 
  Eye, 
  Check, 
  X, 
  ArrowRight,
  Filter,
  Calendar,
  Layers,
  Compass,
  Building2,
  Receipt
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { DeliveryDriver, Order, DriverPayout, DriverPayoutMethod } from '../../types';
import { formatFCFA, formatRelativeTime, formatTime } from '../../utils/formatters';
import { soundFx } from '../../utils/audio';

interface DriverDashboardProps {
  onSelectTab: (tab: 'dashboard' | 'missions' | 'active' | 'history' | 'profile') => void;
  onOpenRegisterModal: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  onSelectTab,
  onOpenRegisterModal
}) => {
  const { 
    currentDriver, 
    drivers,
    setCurrentDriver,
    broadcastedDeliveryOrders, 
    allOrders, 
    claimDeliveryMission,
    toggleDriverOnlineStatus,
    driverPayouts,
    requestDriverPayout,
    restaurants
  } = useRestaurant();

  // Local state for modals & filters
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<DriverPayout | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(5000);
  const [payoutMethod, setPayoutMethod] = useState<DriverPayoutMethod>('orange_money');
  const [payoutPhone, setPayoutPhone] = useState(currentDriver?.phone || '+237 699 42 18 09');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutFeedback, setPayoutFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter for pending orders view inside dashboard
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'in_progress'>('all');
  const [payoutFilter, setPayoutFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Find active orders for current driver
  const activeOrder = allOrders.find(
    o => o.deliveryDriverId === currentDriver?.id && 
    o.deliveryStatus && 
    ['assigned', 'picked_up', 'in_transit', 'arrived'].includes(o.deliveryStatus)
  );

  // Delivered orders for current driver
  const deliveredOrders = allOrders.filter(
    o => o.deliveryDriverId === currentDriver?.id && 
    (o.deliveryStatus === 'delivered' || o.status === 'completed')
  );

  // Delivery orders currently waiting for dispatch across the network
  const pendingBroadcasts = broadcastedDeliveryOrders.filter(o => !o.deliveryDriverId);

  // Orders currently in transit/progress across the platform
  const inProgressOrders = allOrders.filter(
    o => o.orderType === 'delivery' && 
    o.deliveryStatus && 
    ['assigned', 'picked_up', 'in_transit', 'arrived'].includes(o.deliveryStatus)
  );

  // All pending & in-flight delivery runs
  const pendingAndActiveDeliveries = allOrders.filter(
    o => o.orderType === 'delivery' && 
    o.status !== 'cancelled' &&
    (o.deliveryStatus === 'broadcasted' || 
     o.deliveryStatus === 'assigned' || 
     o.deliveryStatus === 'picked_up' || 
     o.deliveryStatus === 'in_transit' ||
     o.deliveryStatus === 'arrived' ||
     (!o.deliveryDriverId && o.status === 'ready'))
  );

  // Payout history for current driver (or all if superview)
  const driverSpecificPayouts = currentDriver 
    ? driverPayouts.filter(p => p.driverId === currentDriver.id || p.driverPhone === currentDriver.phone)
    : driverPayouts;

  const totalPaidOut = driverSpecificPayouts
    .filter(p => p.status === 'completed')
    .reduce((acc, p) => acc + p.amount, 0);

  // Total accumulated driver commissions (80% net)
  // Either from driver.driverEarnings or calculated from delivered orders
  const totalAccumulatedEarnings = currentDriver?.driverEarnings && currentDriver.driverEarnings > 0
    ? currentDriver.driverEarnings
    : Math.max(
        totalPaidOut + 8200, // sensible realistic baseline if no history yet
        deliveredOrders.reduce((acc, o) => {
          const fee = o.driverFee || Math.round((o.deliveryFee || o.deliveryInfo?.deliveryFee || 1000) * 0.80);
          return acc + fee;
        }, 0)
      );

  // Available balance for withdrawal
  const availableBalance = Math.max(0, totalAccumulatedEarnings - totalPaidOut);

  // Total platform commission cut (20%)
  const totalPlatformCut = Math.round(totalAccumulatedEarnings * 0.25); // 20% of 100% is 25% of 80%

  // Handle Payout submission
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDriver) {
      alert('Veuillez d\'abord sélectionner ou créer votre compte livreur.');
      return;
    }

    if (payoutAmount <= 0) {
      setPayoutFeedback({ type: 'error', message: 'Veuillez saisir un montant valide.' });
      return;
    }

    if (payoutAmount > availableBalance) {
      setPayoutFeedback({ 
        type: 'error', 
        message: `Le montant demandé (${formatFCFA(payoutAmount)}) dépasse votre solde disponible (${formatFCFA(availableBalance)}).` 
      });
      return;
    }

    if (!payoutPhone.trim()) {
      setPayoutFeedback({ type: 'error', message: 'Veuillez renseigner le numéro Mobile Money récepteur.' });
      return;
    }

    setIsSubmittingPayout(true);
    setPayoutFeedback(null);

    try {
      const res = await requestDriverPayout(
        currentDriver.id,
        payoutAmount,
        payoutMethod,
        payoutPhone,
        payoutNotes
      );

      setIsSubmittingPayout(false);
      if (res.success) {
        soundFx.playStatusUpdateChime();
        setPayoutFeedback({ type: 'success', message: res.message });
        if (res.payout) {
          setSelectedReceipt(res.payout);
        }
        setTimeout(() => {
          setIsPayoutModalOpen(false);
          setPayoutFeedback(null);
        }, 3000);
      } else {
        setPayoutFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setIsSubmittingPayout(false);
      setPayoutFeedback({ type: 'error', message: err.message || 'Erreur lors du versement.' });
    }
  };

  const getRestaurantName = (restaurantId: string) => {
    const r = restaurants.find(item => item.id === restaurantId);
    return r ? r.name : 'Restaurant Partenaire';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Banner & Driver Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0 border-2 border-amber-300">
              {currentDriver ? currentDriver.name.charAt(0) : <Bike className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Tableau de bord Livreurs
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Portail Financier & Courses
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                {currentDriver ? (
                  <>
                    <strong className="text-white font-bold">{currentDriver.name}</strong>
                    <span className="text-slate-500">•</span>
                    <span className="text-amber-400 font-mono font-semibold">{currentDriver.vehiclePlate}</span>
                    <span className="text-slate-500">•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      {currentDriver.serviceCity}
                    </span>
                  </>
                ) : (
                  <span className="text-amber-300">Aucun profil coursier actif sélectionné</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {currentDriver && (
              <button
                onClick={() => toggleDriverOnlineStatus(currentDriver.id, !currentDriver.isOnline)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                  currentDriver.isOnline
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
                    : 'bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${currentDriver.isOnline ? 'bg-slate-950 animate-ping' : 'bg-rose-400'}`}></span>
                <span>{currentDriver.isOnline ? 'DISPONIBLE EN LIGNE' : 'HORS LIGNE'}</span>
              </button>
            )}

            <button
              onClick={() => setIsPayoutModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-400/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>Demander un versement</span>
            </button>
          </div>
        </div>

        {/* Verification status alert if pending office check */}
        {currentDriver && (!currentDriver.isVerified || currentDriver.verificationStatus !== 'verified') && (
          <div className="mt-4 pt-4 border-t border-slate-700/80 flex items-center justify-between text-xs flex-wrap gap-2 text-amber-200 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30">
            <div className="flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
              <span>
                Compte en attente de vérification physique au bureau AFRORESTO de <strong>{currentDriver.serviceCity}</strong> (CNI & carte grise requises).
              </span>
            </div>
            <span className="text-[11px] font-bold text-amber-400 underline cursor-pointer" onClick={() => onSelectTab('profile')}>
              Voir adresse du bureau & pièces à fournir &rarr;
            </span>
          </div>
        )}
      </div>

      {/* 2. Key Metrics Cards (Financials & Pending Runs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Commissions Accumulées (80% net) */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-400/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Commissions Accumulées</span>
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {formatFCFA(totalAccumulatedEarnings)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
            <span className="text-emerald-400 font-bold">80% part nette livreur</span>
            <span>20% retenue AFRORESTO</span>
          </div>
        </div>

        {/* Card 2: Solde Disponible pour Retrait */}
        <div className="bg-gradient-to-br from-emerald-950/60 to-slate-800/90 border border-emerald-500/40 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between text-emerald-300 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Solde Disponible</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
            {formatFCFA(availableBalance)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-emerald-900/60">
            <span className="font-medium">Retrait Mobile Money</span>
            <button 
              onClick={() => setIsPayoutModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
            >
              Décaisser &rarr;
            </button>
          </div>
        </div>

        {/* Card 3: Total Paiements Versés */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-sky-400/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Paiements Versés</span>
            <div className="w-9 h-9 rounded-xl bg-sky-400/10 text-sky-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 tracking-tight">
            {formatFCFA(totalPaidOut)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
            <span>{driverSpecificPayouts.filter(p => p.status === 'completed').length} virement(s) effectué(s)</span>
            <span className="text-sky-300 font-bold font-mono">OM / MoMo</span>
          </div>
        </div>

        {/* Card 4: Statut des Courses en Attente */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-400/50 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Courses en Attente</span>
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center animate-pulse">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight flex items-center gap-2">
            <span>{pendingBroadcasts.length}</span>
            <span className="text-xs font-normal text-slate-400">à pourvoir</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
            <span className="text-slate-300">Réseau en direct</span>
            <button 
              onClick={() => onSelectTab('missions')}
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
            >
              Voir radar &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* 3. Section: Statut des Courses en Attente & Flux en direct */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Statut des Courses en Attente & Prises en Charge
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Suivi en temps réel des appels de livraison broadcastés par les restaurants et statut des courses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-700/70 text-xs flex">
              <button
                onClick={() => setOrderFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  orderFilter === 'all' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Toutes ({pendingAndActiveDeliveries.length})
              </button>
              <button
                onClick={() => setOrderFilter('pending')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  orderFilter === 'pending' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                En attente ({pendingBroadcasts.length})
              </button>
              <button
                onClick={() => setOrderFilter('in_progress')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  orderFilter === 'in_progress' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                En cours ({inProgressOrders.length})
              </button>
            </div>
          </div>
        </div>

        {/* Deliveries list */}
        {pendingAndActiveDeliveries.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/60 rounded-2xl border border-slate-700/50 p-6 space-y-2">
            <Bike className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-slate-300">Aucune course en attente pour le moment</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Dès qu'un client passe commande et qu'un restaurant lance l'appel à livraison, la mission apparaît instantanément ici avec son tarif de commission garanti.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAndActiveDeliveries
              .filter(o => {
                if (orderFilter === 'pending') return !o.deliveryDriverId;
                if (orderFilter === 'in_progress') return Boolean(o.deliveryDriverId);
                return true;
              })
              .map(order => {
                const totalDeliveryFee = order.deliveryFee || order.deliveryInfo?.deliveryFee || 1000;
                const courierCommission = order.driverFee || Math.round(totalDeliveryFee * 0.80);
                const platformCut = order.platformFee || Math.round(totalDeliveryFee * 0.20);
                const isClaimedByMe = order.deliveryDriverId === currentDriver?.id;
                const isPendingPickup = !order.deliveryDriverId;

                return (
                  <div 
                    key={order.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isClaimedByMe
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                        : isPendingPickup
                          ? 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                          : 'bg-slate-900/40 border-slate-800 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left: Info */}
                      <div className="flex items-start gap-3.5">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                          isPendingPickup 
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' 
                            : isClaimedByMe 
                              ? 'bg-emerald-500 text-slate-950 font-black' 
                              : 'bg-slate-800 text-slate-400'
                        }`}>
                          <Bike className="w-5 h-5" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                              {order.orderNumber}
                            </span>
                            <span className="text-xs font-bold text-amber-400">
                              {getRestaurantName(order.restaurantId)}
                            </span>
                            <span className="text-slate-500 text-xs">•</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {formatRelativeTime(order.createdAt)}
                            </span>
                          </div>

                          <div className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span>Destination: <strong>{order.deliveryInfo?.neighborhood || order.deliveryInfo?.address || 'Adresse de livraison'}</strong></span>
                            </span>
                            {order.deliveryInfo?.city && (
                              <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded text-[10px]">
                                {order.deliveryInfo.city}
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400">
                            Client : <strong className="text-slate-200">{order.customerName || 'Client AFRORESTO'}</strong> • {order.items.length} article(s)
                          </div>
                        </div>
                      </div>

                      {/* Right: Commission & Status Badge & Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-3 self-stretch md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Commission Livreur (80%)</span>
                          <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                            {formatFCFA(courierCommission)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Budget client : {formatFCFA(totalDeliveryFee)} (Plateforme: {formatFCFA(platformCut)})
                          </span>
                        </div>

                        <div>
                          {isPendingPickup ? (
                            <div className="flex flex-col items-end gap-1.5">
                              <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                En Attente de Prise en Charge
                              </span>
                              <button
                                onClick={async () => {
                                  if (!currentDriver) {
                                    onOpenRegisterModal();
                                    return;
                                  }
                                  const res = await claimDeliveryMission(order.id, currentDriver);
                                  if (res.success) {
                                    soundFx.playStatusUpdateChime();
                                    onSelectTab('active');
                                  } else {
                                    alert(res.message);
                                  }
                                }}
                                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span>Prendre la course</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : isClaimedByMe ? (
                            <div className="flex flex-col items-end gap-1.5">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Course Attribuée à Vous
                              </span>
                              <button
                                onClick={() => onSelectTab('active')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span>Voir progression &rarr;</span>
                              </button>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">
                              Prise par {order.deliveryDriverName || 'Autre coursier'}
                            </span>
                          )}
                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* 4. Section: Historique des Paiements Versés par la Plateforme */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-black text-white">
                Historique des Paiements Versés par la Plateforme
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Registre officiel des virements Mobile Money (Orange Money, MTN MoMo) et retraits bureau.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-700/70 text-xs flex">
              <button
                onClick={() => setPayoutFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  payoutFilter === 'all' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tous ({driverSpecificPayouts.length})
              </button>
              <button
                onClick={() => setPayoutFilter('completed')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  payoutFilter === 'completed' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Effectués ({driverSpecificPayouts.filter(p => p.status === 'completed').length})
              </button>
              <button
                onClick={() => setPayoutFilter('pending')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  payoutFilter === 'pending' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                En cours ({driverSpecificPayouts.filter(p => p.status === 'pending').length})
              </button>
            </div>
          </div>
        </div>

        {/* Payouts list / table */}
        {driverSpecificPayouts.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/60 rounded-2xl border border-slate-700/50 p-6 space-y-2">
            <Wallet className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-slate-300">Aucun versement enregistré pour le moment</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Dès que vous cumulez des commissions de courses, vous pouvez demander un versement instantané vers votre compte Orange Money ou MTN MoMo.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsPayoutModalOpen(true)}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Effectuer un premier retrait test</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Réf / Reçu</th>
                  <th className="pb-3 px-3">Date & Heure</th>
                  <th className="pb-3 px-3">Mode & Numéro</th>
                  <th className="pb-3 px-3">Transaction</th>
                  <th className="pb-3 px-3 text-right">Montant Versé</th>
                  <th className="pb-3 px-3 text-center">Statut</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {driverSpecificPayouts
                  .filter(p => {
                    if (payoutFilter === 'completed') return p.status === 'completed';
                    if (payoutFilter === 'pending') return p.status === 'pending';
                    return true;
                  })
                  .map(payout => {
                    const isCompleted = payout.status === 'completed';
                    const isPending = payout.status === 'pending';

                    return (
                      <tr key={payout.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-amber-400">
                          {payout.payoutNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                          <div>{new Date(payout.requestedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          <div className="text-[10px] text-slate-500">{new Date(payout.requestedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            {payout.paymentMethod === 'orange_money' ? (
                              <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold text-[10px]">
                                Orange Money
                              </span>
                            ) : payout.paymentMethod === 'mtn_momo' ? (
                              <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-bold text-[10px]">
                                MTN MoMo
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px]">
                                Espèces Bureau
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {payout.phoneNumber}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {payout.transactionRef || 'En attente réf'}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-sm text-emerald-400 font-mono">
                          {formatFCFA(payout.amount)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Effectué
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase animate-pulse">
                              <Clock className="w-3 h-3 text-amber-400" />
                              En cours
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase">
                              <X className="w-3 h-3 text-rose-400" />
                              Rejeté
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedReceipt(payout)}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Voir reçu officiel"
                          >
                            <FileText className="w-3 h-3 text-amber-400" />
                            <span>Reçu</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modal: Demande de versement Mobile Money */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setIsPayoutModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-400/20">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Demande de Versement de Commissions</h3>
                <p className="text-xs text-slate-400">Transfert immédiat sur votre compte Mobile Money</p>
              </div>
            </div>

            {payoutFeedback && (
              <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                payoutFeedback.type === 'success' 
                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200' 
                  : 'bg-rose-950/80 border-rose-600 text-rose-200'
              }`}>
                {payoutFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{payoutFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleRequestPayout} className="space-y-4">
              
              {/* Available balance highlight */}
              <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block">Solde Net Disponible :</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">{formatFCFA(availableBalance)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPayoutAmount(availableBalance)}
                  className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Tout retirer
                </button>
              </div>

              {/* Amount input & presets */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Montant à verser (FCFA) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={300}
                    max={availableBalance}
                    step={100}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-base font-bold focus:border-amber-400 focus:outline-hidden"
                    placeholder="ex: 5000"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs text-slate-500 font-bold">FCFA</span>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[2000, 5000, 10000, 20000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPayoutAmount(Math.min(val, availableBalance))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                    >
                      +{formatFCFA(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment method selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Moyen de paiement de destination *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('orange_money')}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      payoutMethod === 'orange_money'
                        ? 'bg-orange-500/20 border-orange-500 text-white font-black shadow-md'
                        : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-orange-400" />
                    <div>
                      <div className="text-xs font-bold">Orange Money</div>
                      <div className="text-[10px] text-slate-400">Instantané (Cameroun)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutMethod('mtn_momo')}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      payoutMethod === 'mtn_momo'
                        ? 'bg-yellow-500/20 border-yellow-500 text-white font-black shadow-md'
                        : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-yellow-400" />
                    <div>
                      <div className="text-xs font-bold">MTN Mobile Money</div>
                      <div className="text-[10px] text-slate-400">Instantané (MoMo)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Phone number */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Numéro de téléphone récepteur *
                </label>
                <input
                  type="tel"
                  value={payoutPhone}
                  onChange={(e) => setPayoutPhone(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs font-mono font-bold focus:border-amber-400 focus:outline-hidden"
                  placeholder="+237 699 12 34 56"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Commentaire / Motif (Optionnel)
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white text-xs focus:border-amber-400 focus:outline-hidden"
                  placeholder="ex: Versement hebdomadaire des livraisons"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingPayout || availableBalance <= 0}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-400/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingPayout ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Virement en cours...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4" />
                      <span>Confirmer le versement de {formatFCFA(payoutAmount)}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Reçu officiel de versement AFRORESTO */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 border border-slate-200">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-900 p-1 rounded-full bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center border-b border-slate-200 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto mb-2 font-black shadow-md">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black tracking-tight text-slate-950">AFRORESTO EXPRESS</h3>
              <p className="text-[11px] text-slate-500 uppercase font-mono">Bordereau Officiel de Versement</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-black">
                {selectedReceipt.payoutNumber}
              </span>
            </div>

            {/* Receipt Details */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Bénéficiaire :</span>
                <span className="font-bold text-slate-900">{selectedReceipt.driverName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Numéro crédité :</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.phoneNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Moyen de paiement :</span>
                <span className="font-bold text-slate-900 uppercase">{selectedReceipt.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Réf Transaction :</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.transactionRef}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date d'exécution :</span>
                <span className="text-slate-800">{new Date(selectedReceipt.requestedAt).toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Émetteur :</span>
                <span className="font-medium text-slate-700">{selectedReceipt.processedBy || 'Direction Financière AFRORESTO'}</span>
              </div>
              
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between mt-3">
                <span className="text-xs font-bold text-emerald-900">Montant Net Versé :</span>
                <span className="text-lg font-black text-emerald-700 font-mono">
                  {formatFCFA(selectedReceipt.amount)}
                </span>
              </div>
            </div>

            {/* Electronic Stamp */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cachet Électronique & Sécurité</div>
              <p className="text-[10px] text-slate-600 leading-tight">
                Certifié conforme par le système de compensation financière AFRORESTO SAS.
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Imprimer / Télécharger</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
