import React, { useState } from 'react';
import { 
  Bike, 
  MapPin, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  Volume2, 
  Sparkles, 
  Send, 
  Check, 
  ExternalLink, 
  Power, 
  FileText, 
  ChevronRight, 
  Plus, 
  Package, 
  Share2, 
  Car,
  Compass,
  ArrowRight,
  MessageSquare,
  LayoutDashboard
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useLanguage } from '../../context/LanguageContext';
import { DeliveryDriver, Order, VehicleType } from '../../types';
import { formatFCFA, formatRelativeTime, formatTime } from '../../utils/formatters';
import { soundFx } from '../../utils/audio';
import { DriverDashboard } from './DriverDashboard';

export const DriverPortal: React.FC = () => {
  const { 
    drivers, 
    currentDriver, 
    setCurrentDriver, 
    registerDriver, 
    toggleDriverOnlineStatus, 
    broadcastedDeliveryOrders, 
    claimDeliveryMission, 
    updateDeliveryProgress,
    allOrders,
    restaurants,
    soundEnabled,
    toggleSound
  } = useRestaurant();

  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'missions' | 'active' | 'history' | 'profile'>('dashboard');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cniNumber: '',
    address: '',
    vehicleType: 'moto' as VehicleType,
    vehiclePlate: '',
    serviceCity: 'Douala',
    serviceZonesInput: 'Akwa, Bonanjo, Deido, Bali',
    password: ''
  });

  // Find active order for current driver
  const activeOrder: Order | undefined = allOrders.find(
    o => o.deliveryDriverId === currentDriver?.id && 
    o.deliveryStatus && 
    ['assigned', 'picked_up', 'in_transit', 'arrived'].includes(o.deliveryStatus)
  );

  // Find completed orders for this driver
  const completedOrders = allOrders.filter(
    o => o.deliveryDriverId === currentDriver?.id && (o.deliveryStatus === 'delivered' || o.status === 'completed')
  );

  // 80% net remuneration to the driver (platform keeps 20%)
  const totalEarnings = currentDriver?.driverEarnings ?? completedOrders.reduce((acc, o) => {
    const fee = o.driverFee || Math.round((o.deliveryFee || o.deliveryInfo?.deliveryFee || 1000) * 0.80);
    return acc + fee;
  }, 0);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.cniNumber || !formData.vehiclePlate) {
      alert('Veuillez remplir tous les champs obligatoires (Nom, Téléphone, CNI, Matricule).');
      return;
    }

    const serviceZones = formData.serviceZonesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const result = await registerDriver({
      name: formData.name,
      email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@coursier.cm`,
      phone: formData.phone,
      cniNumber: formData.cniNumber,
      address: formData.address || 'Douala, Cameroun',
      vehicleType: formData.vehicleType,
      vehiclePlate: formData.vehiclePlate.toUpperCase(),
      serviceCity: formData.serviceCity,
      serviceZones: serviceZones.length > 0 ? serviceZones : ['Akwa', 'Bonanjo', 'Deido'],
      isOnline: true,
      verificationStatus: 'pending_office_check',
      isVerified: false,
      driverEarnings: 0
    }, formData.password);

    if (result.success) {
      setIsRegisterModalOpen(false);
      soundFx.playStatusUpdateChime();
      alert('Votre compte a été enregistré. Rendez-vous au bureau AFRORESTO de votre ville avec vos pièces d\'identité et carte grise pour validation avant de commencer.');
    }
  };

  const handleClaim = async (orderId: string) => {
    if (!currentDriver) {
      setIsRegisterModalOpen(true);
      return;
    }

    if (!currentDriver.isOnline) {
      alert('Veuillez d\'abord passer votre statut "En Ligne" pour accepter des courses.');
      return;
    }

    setIsClaiming(orderId);
    setClaimFeedback(null);

    const res = await claimDeliveryMission(orderId, currentDriver);
    setIsClaiming(null);

    if (res.success) {
      soundFx.playStatusUpdateChime();
      setClaimFeedback({ type: 'success', message: res.message });
      setActiveTab('active');
    } else {
      setClaimFeedback({ type: 'error', message: res.message });
    }

    setTimeout(() => setClaimFeedback(null), 5000);
  };

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case 'moto': return '🏍️ Moto';
      case 'scooter': return '🛵 Scooter';
      case 'velo': return '🚲 Vélo';
      case 'voiture': return '🚗 Voiture';
      default: return '🛵 Véhicule';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
      
      {/* Top Mobile Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black tracking-tight text-white">AFRORESTO <span className="text-amber-400">EXPRESS</span></h1>
                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">Livreur</span>
              </div>
              <p className="text-[11px] text-slate-400">Réseau de coursiers & livraison express</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound preview */}
            <button
              onClick={() => {
                soundFx.playDeliveryBroadcastPing();
              }}
              title="Tester le bip sonore d'appel à livraison"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Bip</span>
            </button>

            {/* Driver Profile Switcher */}
            {currentDriver && (
              <button
                onClick={() => toggleDriverOnlineStatus(currentDriver.id, !currentDriver.isOnline)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  currentDriver.isOnline
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{currentDriver.isOnline ? 'EN LIGNE' : 'HORS LIGNE'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5 pb-24">
        
        {/* Driver identity summary card */}
        {currentDriver ? (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-400/20 shrink-0">
                  {currentDriver.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black text-white">{currentDriver.name}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-200 text-[10px] font-bold">
                      {getVehicleIcon(currentDriver.vehicleType)} • {currentDriver.vehiclePlate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{currentDriver.serviceCity} ({currentDriver.serviceZones.slice(0, 3).join(', ')}...)</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    CNI : <span className="font-mono text-slate-300">{currentDriver.cniNumber}</span> • Tél : {currentDriver.phone}
                  </p>
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
                <div className="bg-slate-950/60 border border-slate-700/60 px-3.5 py-2 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Courses</span>
                  <p className="text-base font-black text-white">{currentDriver.totalDeliveries || completedOrders.length}</p>
                </div>

                <div className="bg-slate-950/60 border border-slate-700/60 px-3.5 py-2 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Gains</span>
                  <p className="text-base font-black text-emerald-400">{formatFCFA(totalEarnings)}</p>
                </div>

                <div className="bg-slate-950/60 border border-slate-700/60 px-3.5 py-2 rounded-2xl text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Note</span>
                  <p className="text-base font-black text-amber-400">★ {currentDriver.rating || 4.9}</p>
                </div>
              </div>
            </div>

            {/* Driver verification badge */}
            <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-bold">Statut Compte :</span>
                {currentDriver.isVerified && currentDriver.verificationStatus === 'verified' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Vérifié & Activé pour les Courses</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-[10px] animate-pulse">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>En attente de vérification physique en bureau</span>
                  </span>
                )}
              </div>

              <span className="text-[11px] text-slate-400">
                Commission : <strong className="text-emerald-400 font-bold">80% net livreur</strong> (20% plateforme)
              </span>
            </div>

            {/* Quick driver selector & new account button */}
            <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <span className="text-slate-400 font-bold shrink-0">Changer de coursier :</span>
                {drivers.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setCurrentDriver(d)}
                    className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
                      d.id === currentDriver.id 
                        ? 'bg-amber-400 text-slate-950 shadow-xs' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {d.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau Livreur</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 text-center space-y-3">
            <Bike className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
            <h2 className="text-lg font-black text-white">Rejoignez la flotte des livreurs AFRORESTO</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Recevez les courses lancées par les restaurants partenaires en temps réel, livrez rapidement et encaissez vos commissions.
            </p>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-400/20 cursor-pointer"
            >
              Créer mon compte livreur
            </button>
          </div>
        )}

        {/* Mandatory Office Verification Notice if not verified */}
        {currentDriver && (!currentDriver.isVerified || currentDriver.verificationStatus !== 'verified') && (
          <div className="p-4 bg-amber-500/15 border-2 border-amber-500/50 rounded-3xl text-slate-100 space-y-2.5 shadow-lg">
            <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
              <span>Contrôle Physique Requis : Rendez-vous au Bureau AFRORESTO ({currentDriver.serviceCity})</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pour des raisons strictes de sécurité et d'intégrité des commandes clients, votre compte doit être validé physiquement avant votre première course. Présentez-vous au bureau AFRORESTO de <strong>{currentDriver.serviceCity}</strong> avec :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-bold text-slate-200">
              <div className="p-2 bg-slate-950/60 rounded-xl border border-amber-500/30 flex items-center gap-1.5">
                <span>🪪</span>
                <span>CNI / Passeport original</span>
              </div>
              <div className="p-2 bg-slate-950/60 rounded-xl border border-amber-500/30 flex items-center gap-1.5">
                <span>📄</span>
                <span>Carte grise ({currentDriver.vehiclePlate})</span>
              </div>
              <div className="p-2 bg-slate-950/60 rounded-xl border border-amber-500/30 flex items-center gap-1.5">
                <span>🏍️</span>
                <span>Permis de conduire valide</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
              <span className="text-amber-200/90 font-medium">
                📍 {currentDriver.serviceCity === 'Douala' ? 'Akwa, Rue Pau (Face Hôtel Douala Bercy)' : currentDriver.serviceCity === 'Yaoundé' ? 'Bastos, Immeuble Le Balafon (2e étage)' : 'Délégation Régionale AFRORESTO'}
              </span>
              <a
                href="https://wa.me/237653184307?text=Bonjour%20AFRORESTO,%20je%20suis%20le%20livreur%20inscrit%20et%20je%20souhaite%20valider%20mes%20pièces%20au%20bureau."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <Phone className="w-3 h-3" />
                <span>Prendre Rendez-vous WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* Feedback alert banner */}
        {claimFeedback && (
          <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 animate-in fade-in ${
            claimFeedback.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200' 
              : 'bg-rose-950/80 border-rose-600 text-rose-200'
          }`}>
            {claimFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            <span className="flex-1">{claimFeedback.message}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-amber-400 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tableau de bord</span>
          </button>

          <button
            onClick={() => setActiveTab('missions')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'missions' ? 'bg-amber-400 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Courses Disponibles ({broadcastedDeliveryOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 relative whitespace-nowrap cursor-pointer ${
              activeTab === 'active' ? 'bg-amber-400 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Course en Cours</span>
            {activeOrder && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'history' ? 'bg-amber-400 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Historique ({completedOrders.length})</span>
          </button>
        </div>

        {/* TAB 0: TABLEAU DE BORD LIVREURS */}
        {activeTab === 'dashboard' && (
          <DriverDashboard 
            onSelectTab={(tab) => setActiveTab(tab)}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          />
        )}

        {/* TAB 1: AVAILABLE MISSIONS / BROADCASTS */}
        {activeTab === 'missions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Flux des Appels à Livraison</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Le premier livreur à valider prend en charge la course.</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Radar Live</span>
                <p className="text-xs font-black text-amber-400">{broadcastedDeliveryOrders.length} appel(s) en attente</p>
              </div>
            </div>

            {broadcastedDeliveryOrders.length === 0 ? (
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-700/60 text-slate-400 flex items-center justify-center mx-auto">
                  <Compass className="w-7 h-7 animate-spin" />
                </div>
                <h4 className="text-sm font-black text-slate-200">En attente de courses...</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Dès qu'un restaurant prépare une commande à livrer et clique sur "Lancer l'appel à livraison", vous recevrez une alerte sonore avec tous les détails.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => soundFx.playDeliveryBroadcastPing()}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-amber-400 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    Tester le signal sonore d'alerte
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {broadcastedDeliveryOrders.map(order => {
                  const rest = restaurants.find(r => r.id === order.restaurantId);
                  const totalDeliveryFee = order.deliveryFee || order.deliveryInfo?.deliveryFee || 1000;
                  const driverNetRemuneration = order.driverFee || Math.round(totalDeliveryFee * 0.80);
                  const platformCut = order.platformFee || Math.round(totalDeliveryFee * 0.20);
                  const isVerifiedDriver = currentDriver?.isVerified && currentDriver?.verificationStatus === 'verified';

                  return (
                    <div 
                      key={order.id}
                      className="bg-slate-800 border-2 border-amber-400/80 rounded-3xl p-5 shadow-xl space-y-4 hover:border-amber-400 transition-all"
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider animate-pulse">
                            📢 NOUVELLE COURSE
                          </span>
                          <span className="text-xs font-black text-slate-300">{order.orderNumber}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400">Rémunération Nette (80%)</span>
                          <p className="text-base font-black text-emerald-400">{formatFCFA(driverNetRemuneration)}</p>
                          <span className="text-[9px] text-slate-400">Client : {formatFCFA(totalDeliveryFee)} (Frais AFRORESTO 20%: {formatFCFA(platformCut)})</span>
                        </div>
                      </div>

                      {/* Pickup & Dropoff Itinerary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        
                        {/* Point de Retrait (Restaurant) */}
                        <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-700/80 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-400 uppercase text-[10px]">
                            <Package className="w-3.5 h-3.5" />
                            <span>1. Retrait Restaurant</span>
                          </div>
                          <p className="text-sm font-black text-white">{rest?.name || 'Restaurant Partenaire'}</p>
                          <p className="text-slate-300 text-[11px] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{rest?.address || 'Quartier Bastos / Akwa'}, {rest?.city || 'Douala'}</span>
                          </p>
                          {rest?.phone && (
                            <p className="text-slate-400 text-[10px]">Contact : {rest.phone}</p>
                          )}
                        </div>

                        {/* Point de Livraison (Client) */}
                        <div className="p-3 bg-emerald-950/40 rounded-2xl border border-emerald-700/60 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-400 uppercase text-[10px]">
                            <Navigation className="w-3.5 h-3.5" />
                            <span>2. Destination Client</span>
                          </div>
                          <p className="text-sm font-black text-white">{order.customerName || 'Client'}</p>
                          <p className="text-emerald-200 text-[11px] font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{order.deliveryInfo?.address || 'Adresse fournie par l\'acheteur'}</span>
                          </p>
                          {order.deliveryInfo?.notes && (
                            <p className="text-slate-300 text-[10px] italic">Repère : "{order.deliveryInfo.notes}"</p>
                          )}
                        </div>

                      </div>

                      {/* Articles summary */}
                      <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-700/50 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 font-medium">Contenu : </span>
                          <span className="text-white font-bold">
                            {order.items.map(it => `${it.quantity}× ${it.name}`).join(', ')}
                          </span>
                        </div>
                        <span className="text-slate-300 font-black shrink-0 ml-2">Total commande : {formatFCFA(order.totalAmount)}</span>
                      </div>

                      {/* Claim Button */}
                      <div>
                        {isVerifiedDriver ? (
                          <button
                            onClick={() => handleClaim(order.id)}
                            disabled={isClaiming === order.id}
                            className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
                          >
                            <Bike className="w-5 h-5 fill-slate-950" />
                            <span>ACCEPTER CETTE COURSE ({formatFCFA(driverNetRemuneration)} NET)</span>
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </button>
                        ) : (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-1">
                            <button
                              disabled
                              className="w-full py-3 bg-slate-700/80 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                            >
                              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                              <span>Vérification Physique au Bureau Requise</span>
                            </button>
                            <p className="text-[10px] text-slate-400">
                              Passez au bureau AFRORESTO de votre ville avec votre CNI et carte grise pour valider votre compte.
                            </p>
                          </div>
                        )}
                        <p className="text-[10px] text-center text-slate-400 mt-1.5">
                          Attention : Le premier livreur qui valide se voit attribuer la course instantanément.
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE DELIVERY MISSION */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {!activeOrder ? (
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-10 text-center space-y-3">
                <Bike className="w-12 h-12 text-slate-500 mx-auto" />
                <h4 className="text-sm font-black text-slate-200">Aucune course en cours</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Consultez les courses disponibles pour accepter une nouvelle livraison.
                </p>
                <button
                  onClick={() => setActiveTab('missions')}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Voir les courses disponibles
                </button>
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Mission en Cours</span>
                    <h2 className="text-xl font-black text-white">{activeOrder.orderNumber}</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400">Gain de la course</span>
                    <p className="text-lg font-black text-emerald-400">
                      {formatFCFA(activeOrder.deliveryFee || activeOrder.deliveryInfo?.deliveryFee || 1000)}
                    </p>
                  </div>
                </div>

                {/* Live Mission Stepper */}
                <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-700/80">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Progression de la Course</h4>
                  
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className={`p-2 rounded-xl border ${
                      ['assigned', 'picked_up', 'in_transit', 'arrived', 'delivered'].includes(activeOrder.deliveryStatus || '')
                        ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      <p className="text-[10px]">Étape 1</p>
                      <p className="font-black text-[11px] truncate">Attribuée</p>
                    </div>

                    <div className={`p-2 rounded-xl border ${
                      ['picked_up', 'in_transit', 'arrived', 'delivered'].includes(activeOrder.deliveryStatus || '')
                        ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      <p className="text-[10px]">Étape 2</p>
                      <p className="font-black text-[11px] truncate">Récupérée</p>
                    </div>

                    <div className={`p-2 rounded-xl border ${
                      ['arrived', 'delivered'].includes(activeOrder.deliveryStatus || '')
                        ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold ring-2 ring-amber-300'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      <p className="text-[10px]">Étape 3</p>
                      <p className="font-black text-[11px] truncate">Arrivé Client</p>
                    </div>

                    <div className={`p-2 rounded-xl border ${
                      activeOrder.deliveryStatus === 'delivered'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      <p className="text-[10px]">Étape 4</p>
                      <p className="font-black text-[11px] truncate">Livrée</p>
                    </div>
                  </div>
                </div>

                {/* Customer Contact & Address Box */}
                <div className="bg-emerald-950/30 border border-emerald-700/60 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400">Client Destinataire</span>
                      <h4 className="text-base font-black text-white">{activeOrder.customerName || 'Acheteur en ligne'}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeOrder.customerPhone && (
                        <>
                          <a
                            href={`tel:${activeOrder.customerPhone}`}
                            className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-colors"
                            title="Appeler le client"
                          >
                            <Phone className="w-4 h-4" />
                            <span className="text-xs">Appeler</span>
                          </a>

                          <a
                            href={`https://wa.me/${activeOrder.customerPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-colors"
                            title="WhatsApp client"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs">WhatsApp</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-800/60 text-xs space-y-1">
                    <p className="text-emerald-100 font-bold flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{activeOrder.deliveryInfo?.address || 'Adresse de livraison non spécifiée'}</span>
                    </p>
                    {activeOrder.deliveryInfo?.notes && (
                      <p className="text-slate-300 italic text-[11px] pl-5.5">
                        Instructions de repère : "{activeOrder.deliveryInfo.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Food Items checklist */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Articles à remettre au client :</h4>
                  <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/60 divide-y divide-slate-800">
                    {activeOrder.items.map((it, idx) => (
                      <div key={idx} className="py-2 first:pt-0 last:pb-0 flex justify-between text-xs">
                        <span className="font-bold text-white">{it.quantity} × {it.name}</span>
                        <span className="text-slate-400">{formatFCFA(it.price * it.quantity)}</span>
                      </div>
                    ))}
                    <div className="pt-2 flex justify-between text-xs font-black text-amber-400">
                      <span>Total à encaisser (si espèces) :</span>
                      <span>{formatFCFA(activeOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Step Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  {activeOrder.deliveryStatus === 'assigned' && (
                    <button
                      onClick={() => updateDeliveryProgress(activeOrder.id, 'picked_up')}
                      className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Package className="w-5 h-5" />
                      <span>COLIS RÉCUPÉRÉ AU RESTAURANT (EN ROUTE VERS LE CLIENT)</span>
                    </button>
                  )}

                  {(activeOrder.deliveryStatus === 'picked_up' || activeOrder.deliveryStatus === 'in_transit') && (
                    <button
                      onClick={() => updateDeliveryProgress(activeOrder.id, 'arrived')}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all animate-pulse"
                    >
                      <Volume2 className="w-5 h-5" />
                      <span>JE SUIS ARRIVÉ AU POINT DE LIVRAISON (DÉCLENCHER LE BIP CLIENT)</span>
                    </button>
                  )}

                  {activeOrder.deliveryStatus === 'arrived' && (
                    <div className="space-y-2">
                      <div className="p-3 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2">
                        <Volume2 className="w-4 h-4 animate-bounce" />
                        <span>Bip sonore envoyé au client ! Vous êtes au pas de la porte.</span>
                      </div>

                      <button
                        onClick={() => updateDeliveryProgress(activeOrder.id, 'delivered')}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>VALIDER LA LIVRAISON EFFECTUÉE AVEC SUCCÈS</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMPLETED DELIVERIES HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-white">Historique de vos courses livrées</h3>

            {completedOrders.length === 0 ? (
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-8 text-center text-xs text-slate-400">
                Vous n'avez pas encore terminé de courses aujourd'hui.
              </div>
            ) : (
              <div className="space-y-2.5">
                {completedOrders.map(order => (
                  <div key={order.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white">{order.orderNumber}</span>
                        <span className="px-2 py-0.2 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold">Livrée</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{order.customerName} • {order.deliveryInfo?.address || 'Douala'}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-emerald-400 text-sm">
                        +{formatFCFA(order.deliveryFee || order.deliveryInfo?.deliveryFee || 1000)}
                      </span>
                      <p className="text-[10px] text-slate-500">{formatRelativeTime(order.deliveryDeliveredAt || order.updatedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* DRIVER REGISTRATION MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95 my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Création de Compte Livreur</h3>
                  <p className="text-[11px] text-slate-400">Informations personnelles, CNI & immatriculation</p>
                </div>
              </div>

              <button 
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nom complet & Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: Jean-Marc Mbarga"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Téléphone (MoMo / Orange) *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="ex: +237 691 44 88 22"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Numéro de CNI / Passeport *</label>
                  <input
                    type="text"
                    required
                    value={formData.cniNumber}
                    onChange={e => setFormData({ ...formData, cniNumber: e.target.value })}
                    placeholder="ex: CNI-114892019-LT"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Adresse de résidence *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="ex: Akwa, Rue Pau, Douala"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Type de véhicule *</label>
                  <select
                    value={formData.vehicleType}
                    onChange={e => setFormData({ ...formData, vehicleType: e.target.value as VehicleType })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                  >
                    <option value="moto">🏍️ Moto</option>
                    <option value="scooter">🛵 Scooter</option>
                    <option value="velo">🚲 Vélo</option>
                    <option value="voiture">🚗 Voiture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Matricule du véhicule *</label>
                  <input
                    type="text"
                    required
                    value={formData.vehiclePlate}
                    onChange={e => setFormData({ ...formData, vehiclePlate: e.target.value })}
                    placeholder="ex: LT-842-AB"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Ville de service *</label>
                  <select
                    value={formData.serviceCity}
                    onChange={e => setFormData({ ...formData, serviceCity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                  >
                    <option value="Douala">Douala</option>
                    <option value="Yaoundé">Yaoundé</option>
                    <option value="Bafoussam">Bafoussam</option>
                    <option value="Kribi">Kribi</option>
                    <option value="Abidjan">Abidjan</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Zones / Quartiers desservis *</label>
                  <input
                    type="text"
                    required
                    value={formData.serviceZonesInput}
                    onChange={e => setFormData({ ...formData, serviceZonesInput: e.target.value })}
                    placeholder="ex: Akwa, Bonanjo, Deido, Bali"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-400/20 cursor-pointer"
                >
                  Enregistrer & Valider mon Compte
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
