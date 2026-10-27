import React, { useState } from 'react';
import { 
  QrCode, 
  Smartphone, 
  ChefHat, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Store, 
  Layers, 
  ChevronRight, 
  Phone, 
  Mail, 
  MapPin, 
  HelpCircle,
  Clock,
  Coins,
  ChevronDown,
  Bike,
  Navigation,
  UserPlus
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatFCFA } from '../../utils/formatters';
import { RestoCamLogo } from '../common/RestoCamLogo';
import { safeSessionStorage } from '../../utils/safeStorage';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { 
    setCurrentView, 
    plans, 
    currentRestaurant, 
    setActiveCustomerTableId, 
    setActiveCustomerOrderId,
    tables, 
    isAuthenticated 
  } = useRestaurant();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleTryDemo = () => {
    if (isAuthenticated) {
      setCurrentView('dashboard');
    } else {
      onOpenAuth();
    }
  };

  const handleTryQR = () => {
    if (tables.length > 0) {
      setActiveCustomerTableId(tables[0].id);
    }
    setCurrentView('customer_qr');
  };

  const handleStartOnboarding = () => {
    setCurrentView('onboarding');
  };

  const handleExploreFoodHub = () => {
    setActiveCustomerOrderId(null);
    safeSessionStorage.removeItem('restocam_active_customer_order_id');
    setCurrentView('market');
  };

  const faqs = [
    {
      q: 'Mes clients doivent-ils télécharger une application pour commander ?',
      a: 'Non, absolument pas ! Les clients scannent simplement le QR Code posé sur la table avec l\'appareil photo de leur smartphone (iPhone ou Android) et le menu digital s\'ouvre instantanément dans leur navigateur web mobile.',
    },
    {
      q: 'AFRORESTO fonctionne-t-il avec les paiements mobiles en Afrique (Orange Money, MTN MoMo, Wave, M-Pesa...) ?',
      a: 'Oui ! AFRORESTO permet à votre équipe d\'enregistrer et de valider les paiements par Orange Money, MTN Mobile Money, Wave, M-Pesa, Espèces ou Carte Bancaire, avec calcul immédiat du chiffre d\'affaires.',
    },
    {
      q: 'Comment les cuisiniers reçoivent-ils les commandes en cuisine ?',
      a: 'Vous pouvez installer une simple tablette tactile ou un vieil écran dans votre cuisine. L\'interface Kitchen Display System (KDS) affiche les commandes en direct avec alertes sonores et temps écoulé.',
    },
    {
      q: 'Puis-je imprimer des chevalets de table avec les QR Codes ?',
      a: 'Oui ! AFRORESTO intègre un générateur de chevalets de table ("Table Tents") prêts à imprimer en PDF ou PNG avec le logo de votre restaurant, le numéro de table et les instructions de scan.',
    },
    {
      q: 'Comment démarrer et mettre en service mon restaurant sur AFRORESTO ?',
      a: 'L\'inscription est immédiate : saisissez le nom de votre établissement, personnalisez votre carte de plats avec votre devise locale, imprimez vos chevalets QR codes et commencez immédiatement à recevoir des commandes réelles de vos clients.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-950/70 via-gray-900 to-gray-950 text-white pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Glow ambient effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/15 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-tight">
              Révolutionnez votre restaurant avec <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-emerald-400">AFRORESTO</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              La solution complète tout-en-un pour l'Afrique : <strong>Menu digital QR Code</strong> pour vos clients, <strong>commandes en temps réel</strong>, <strong>écran cuisine KDS</strong>, gestion des stocks, serveurs et encaissements multi-opérateurs (Orange Money, MTN MoMo, Wave, M-Pesa, Espèces).
            </p>

            {/* Action buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 flex-wrap">
              <button
                id="hero-create-account-btn"
                onClick={() => onOpenAuth('register')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer ring-2 ring-amber-400/50"
              >
                <UserPlus className="w-4 h-4 text-slate-950" />
                Créer mon compte
              </button>

              <button
                id="hero-online-food-hub-btn"
                onClick={handleExploreFoodHub}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer ring-2 ring-emerald-400/50"
              >
                <Bike className="w-4 h-4 text-white" />
                Commander en Ligne (Hub Repas 🛵)
              </button>

              <button
                id="hero-create-restaurant-btn"
                onClick={handleStartOnboarding}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gray-800/90 hover:bg-gray-800 text-gray-100 hover:text-white border border-gray-700 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Créer mon Restaurant (Boost Offert)
              </button>

              <button
                id="hero-try-demo-btn"
                onClick={handleTryDemo}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gray-800/90 hover:bg-gray-800 text-gray-100 hover:text-white border border-gray-700 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Store className="w-4 h-4 text-amber-400" />
                Espace Restaurant
              </button>

              <button
                id="hero-scan-qr-btn"
                onClick={handleTryQR}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                Menu QR Client
              </button>
            </div>

            {/* Launch Offer Banner */}
            <div className="mt-8 p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/40 rounded-2xl text-left sm:text-center backdrop-blur-md shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm font-bold text-amber-200">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                  🎁 Offre Spéciale Panafricaine
                </span>
                <span>
                  Tous les restaurants profitent du <strong className="text-amber-300 font-black">Forfait PREMIUM offert</strong> même au tarif STARTER !
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 max-w-2xl mx-auto">
                KDS cuisine, gestion des stocks, multi-espaces VIP/Terrasse, caisse Mobile Money multi-pays et statistiques avancées débloqués sans surcoût.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Activation Immédiate en Ligne
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Paiements Orange & MTN MoMo
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Support local Douala & Yaoundé
              </span>
            </div>
          </div>

          {/* Interactive Hero Mockup Showcase */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl bg-gray-900/90 border border-gray-800 shadow-2xl p-4 sm:p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-gray-400 font-mono ml-2">app.restocam.cm/dashboard — {currentRestaurant.name}</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                Live Multi-Tenant
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              
              {/* Feature Box 1: Storefront QR */}
              <div 
                onClick={handleTryQR}
                className="bg-gray-800/80 hover:bg-gray-800 p-4 rounded-xl border border-gray-700/60 cursor-pointer transition-all hover:border-emerald-500/50 group"
              >
                <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-2">
                  <span className="flex items-center gap-1.5"><Smartphone className="w-4 h-4" /> 1. Client Mobile</span>
                  <span className="text-gray-400 group-hover:text-emerald-300 flex items-center">Ouvrir <ChevronRight className="w-3 h-3" /></span>
                </div>
                <p className="text-xs text-gray-300">Scan QR Code sur la table, choix des plats (Poulet DG, Poisson braisé), personnalisation sans piment, commande en 1 clic.</p>
              </div>

              {/* Feature Box 2: Kitchen KDS */}
              <div 
                onClick={() => setCurrentView('kitchen')}
                className="bg-gray-800/80 hover:bg-gray-800 p-4 rounded-xl border border-gray-700/60 cursor-pointer transition-all hover:border-purple-500/50 group"
              >
                <div className="flex items-center justify-between text-xs text-purple-400 font-semibold mb-2">
                  <span className="flex items-center gap-1.5"><ChefHat className="w-4 h-4" /> 2. Écran Cuisine (KDS)</span>
                  <span className="text-gray-400 group-hover:text-purple-300 flex items-center">Voir <ChevronRight className="w-3 h-3" /></span>
                </div>
                <p className="text-xs text-gray-300">Affichage immédiat en cuisine avec temps de cuisson, alertes sonores et bouton "Marquer comme prête".</p>
              </div>

              {/* Feature Box 3: Dashboard & POS */}
              <div 
                onClick={handleTryDemo}
                className="bg-gray-800/80 hover:bg-gray-800 p-4 rounded-xl border border-gray-700/60 cursor-pointer transition-all hover:border-amber-500/50 group"
              >
                <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-2">
                  <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> 3. Dashboard & Encaissement</span>
                  <span className="text-gray-400 group-hover:text-amber-300 flex items-center">Gérer <ChevronRight className="w-3 h-3" /></span>
                </div>
                <p className="text-xs text-gray-300">Suivi des ventes en FCFA, encaissements OM/MoMo/Cash, alertes stocks et gestion du personnel avec permissions.</p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS (3 Simple Steps) */}
      <section className="py-16 sm:py-24 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-amber-600">Simplicité Absolue</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
              Comment fonctionne AFRORESTO en 3 étapes
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Votre établissement opérationnel en moins de 10 minutes, sans matériel coûteux.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 relative group hover:bg-white hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-md mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-gray-900">Configurez votre Menu & Tables</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Renseignez vos spécialités, grillades, boissons, devises locales et vos différents espaces (Terrasse, Salle VIP, Bar, Rooftop, Paillotes).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 relative group hover:bg-white hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white font-black text-lg flex items-center justify-center shadow-md mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-gray-900">Imprimez vos QR Codes Chevalets</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Téléchargez et imprimez en 1 clic vos supports de table professionnels avec QR Code unique pour chaque table.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 relative group hover:bg-white hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white font-black text-lg flex items-center justify-center shadow-md mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-gray-900">Recevez & Encaissez en direct</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Les clients commandent sans télécharger d'application. La cuisine prépare, les serveurs livrent et la caisse encaisse en toute sécurité.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 6 POWERFUL SAAS MODULES */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-amber-600">Fonctionnalités Panafricaines</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
              Tout ce dont votre restaurant a besoin en Afrique
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:border-amber-500 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Menu Digital QR Sans Contact</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Mises à jour des prix en temps réel, photos appétissantes, indisponibilité immédiate en 1 clic pour éviter les déceptions clients.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-500 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <ChefHat className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Écran Cuisine KDS en Temps Réel</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Fini les bons papier perdus ou illisibles. Les cuisiniers voient les commandes classées par urgence avec instructions spéciales ("Sans piment").
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:border-amber-500 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Coins className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Paiements Locaux & Mobile Money</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Gestion des règlements dans votre devise locale par Mobile Money (Wave, Orange Money, MTN MoMo, M-Pesa), Espèces et Carte avec impression de reçus.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-500 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Gestion des Espaces & Tables</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Plan interactif avec statuts en direct (Libre, Occupée, Réservée, À nettoyer) adapté aux terrasses, salons VIP et rooftops.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-500 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Rôles & Permissions (RBAC)</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Accès restreints pour Gérants, Chefs de cuisine, Serveurs, Caissiers et Comptables avec code PIN sécurisé.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-500 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Inventaire & Alertes de Rupture</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Suivi des matières premières (poulet, poisson bar, bières, plantains) avec notification dès qu'un seuil critique est atteint.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* PRICING PLANS IN FCFA */}
      <section className="py-16 sm:py-24 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-emerald-600">Tarifs Transparents</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
              Des forfaits adaptés à tous les restaurants
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Payables facilement en FCFA par Orange Money, MTN MoMo ou Virement bancaire.
            </p>

            {/* Toggle Monthly / Yearly */}
            <div className="mt-6 inline-flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200 text-xs font-semibold">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Facturation Mensuelle
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>Annuel</span>
                <span className="px-1.5 py-0.5 bg-amber-400 text-gray-950 text-[10px] rounded font-bold">-17%</span>
              </button>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map(plan => {
              const price = billingCycle === 'monthly' ? plan.priceMonthly : Math.round(plan.priceYearly / 12);
              const isStarter = plan.id === 'starter';

              return (
                <div 
                  key={plan.id}
                  className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                    plan.isPopular 
                      ? 'bg-gradient-to-b from-gray-900 to-gray-950 text-white ring-2 ring-emerald-500 shadow-2xl' 
                      : isStarter
                      ? 'bg-white text-gray-900 border-2 border-emerald-500/80 shadow-md ring-1 ring-emerald-400/30'
                      : 'bg-white text-gray-900 border border-gray-200 shadow-xs'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-950 text-xs font-black rounded-full shadow-md">
                      Le Plus Choisi en Afrique
                    </div>
                  )}

                  {isStarter && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-500 to-emerald-600 text-white text-[11px] font-black rounded-full shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-200" />
                      🎁 Boost PREMIUM Inclus
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        plan.isPopular 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : isStarter
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {plan.maxTables ? `Jusqu'à ${plan.maxTables} tables` : 'Tables illimitées'}
                      </span>
                    </div>

                    <p className={`text-xs mt-1 ${plan.isPopular ? 'text-gray-400' : 'text-gray-700'}`}>
                      {plan.tagline}
                    </p>

                    {plan.launchBonusNotice && (
                      <div className="mt-2.5 p-2 bg-amber-50/80 border border-amber-200/70 rounded-xl text-[11px] text-amber-900 font-semibold flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{plan.launchBonusNotice}</span>
                      </div>
                    )}

                    <div className="mt-5 mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-extrabold">{formatFCFA(price)}</span>
                        <span className={`text-xs ${plan.isPopular ? 'text-gray-400' : 'text-gray-700'}`}>/ mois</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <p className="text-[11px] text-emerald-600 font-medium mt-1">
                          Facturé {formatFCFA(plan.priceYearly)} par an
                        </p>
                      )}
                    </div>

                    <div className={`h-px w-full my-4 ${plan.isPopular ? 'bg-gray-800' : 'bg-gray-100'}`}></div>

                    <ul className="space-y-3 text-xs">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.isPopular ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span className={plan.isPopular ? 'text-gray-300' : 'text-gray-700'}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={handleStartOnboarding}
                    className={`w-full mt-8 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      plan.isPopular
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                        : isStarter
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    Démarrer avec {plan.name}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 sm:py-24 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-amber-600">Témoignages & Retours d'Expérience</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Adopté par les meilleurs restaurateurs en Afrique
            </p>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-500 font-medium">
              Découvrez comment nos restaurants partenaires à Abidjan, Dakar, Douala et Lagos optimisent leurs services au quotidien.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Testimonial 1 - Abidjan */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <img 
                    src="https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=150&auto=format&fit=crop&q=80" 
                    alt="Chef Yannick Kouamé - Restaurateur Abidjan" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/30 shadow-soft-sm"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Chef Yannick Kouamé</h4>
                    <p className="text-xs text-amber-700 font-semibold">Le Boukarou & Braises • Plateau, Abidjan</p>
                    <span className="text-[10px] text-slate-600">Poissons Braisés, Attiéké & Alloco</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {'★'.repeat(5)}
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "Depuis qu'on a installé les chevalets QR AFRORESTO sur nos 35 tables en terrasse à Abidjan, le temps de prise de commande a été divisé par 3 aux heures de pointe. Les clients scannent et commandent immédiatement sans attendre le serveur !"
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span>🇨🇮 Côte d'Ivoire</span>
                <span className="font-semibold text-amber-700">+35% de rotation des tables</span>
              </div>
            </div>

            {/* Testimonial 2 - Dakar */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <img 
                    src="https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=150&auto=format&fit=crop&q=80" 
                    alt="Mme Aïssatou Bello - Gérante Lounge Dakar" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/30 shadow-soft-sm"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Mme Aïssatou Bello</h4>
                    <p className="text-xs text-purple-700 font-semibold">La Teranga Gourmande • Almadies, Dakar</p>
                    <span className="text-[10px] text-slate-600">Thiéboudienne, Poulet Yassa & Cocktails</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {'★'.repeat(5)}
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "L'écran cuisine KDS a révolutionné la fluidité du service entre nos serveurs et la brigade en cuisine. Plus aucun ticket égaré et zéro erreur sur les instructions spéciales. La satisfaction client est au sommet !"
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span>🇸🇳 Sénégal</span>
                <span className="font-semibold text-purple-700">0 erreur de cuisson KDS</span>
              </div>
            </div>

            {/* Testimonial 3 - Douala */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <img 
                    src="https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150&auto=format&fit=crop&q=80" 
                    alt="M. Paul-Alain Kemajou - Restaurateur" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/30 shadow-soft-sm"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">M. Paul-Alain Kemajou</h4>
                    <p className="text-xs text-emerald-700 font-semibold">Le Grill Panafricain • Bonapriso, Douala</p>
                    <span className="text-[10px] text-slate-600">Ndolè, Bar Braisé & Suya</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {'★'.repeat(5)}
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "L'encaissement direct via Mobile Money (Orange Money, MTN MoMo, Wave) nous fait gagner un temps précieux en fin de soirée. Le rapport de clôture est instantané et nos stocks sont suivis en direct."
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span>🌍 Afrique Centrale</span>
                <span className="font-semibold text-emerald-700">Clôture de caisse en 2 min</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 sm:py-24 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-emerald-600">Questions Fréquentes</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
              Tout ce que vous devez savoir
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between text-xs sm:text-sm font-bold text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="p-4 sm:p-5 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-100 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-gray-950 text-white py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-extrabold">Prêt à digitaliser votre restaurant ?</h2>
          <p className="mt-3 text-sm text-emerald-100">
            Rejoignez dès aujourd'hui les restaurants leaders à Douala, Yaoundé, Kribi et Bafoussam.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleStartOnboarding}
              className="w-full sm:w-auto px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-gray-950 font-bold text-sm rounded-xl shadow-lg transition-transform hover:scale-105"
            >
              Créer mon restaurant en 2 minutes
            </button>
            <button
              onClick={handleTryDemo}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-700/80 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl border border-emerald-600"
            >
              Voir la démo complète
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-400 text-xs py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <div className="w-8 h-8 rounded-xl bg-white p-0.5 border border-gray-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                <RestoCamLogo size={28} />
              </div>
              <span>AFRO<span className="text-amber-400">RESTO</span></span>
            </div>
            <p className="text-gray-400 max-w-sm">
              Plateforme SaaS multi-tenant tout-en-un pour la gestion de restaurants, menus digitaux QR codes, commandes en temps réel et encaissements en Afrique.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button 
                onClick={() => setCurrentView('privacy')} 
                className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4 text-xs transition-colors"
              >
                Politique de Confidentialité & Protection des Données
              </button>
            </div>
            <p className="text-gray-500">© 2026 AFRORESTO Technologies. Tous droits réservés.</p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3">Interfaces & Démo</h4>
            <ul className="space-y-2">
              <li><button onClick={() => setCurrentView('dashboard')} className="hover:text-white">Tableau de bord Restaurant</button></li>
              <li><button onClick={handleTryQR} className="hover:text-white">Menu Client QR Mobile</button></li>
              <li><button onClick={() => setCurrentView('kitchen')} className="hover:text-white">Écran Cuisine (KDS)</button></li>
              <li><button onClick={() => setCurrentView('waiter')} className="hover:text-white">Interface Serveurs</button></li>
              <li><button onClick={() => setCurrentView('superadmin')} className="hover:text-white">Super Admin SaaS</button></li>
              <li><button onClick={() => setCurrentView('privacy')} className="text-amber-400 hover:text-amber-300">Politique de Confidentialité</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3">Support & Déploiement Afrique</h4>
            <ul className="space-y-2.5">
              <li>
                <a 
                  href="https://wa.me/237653184307" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-300 hover:text-amber-400 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" /> 
                  <span>WhatsApp Business Afrique</span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:contact@afroresto.com" 
                  className="flex items-center gap-2 text-gray-300 hover:text-amber-400 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" /> 
                  <span>contact@afroresto.com</span>
                </a>
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" /> 
                <span>Hubs : Abidjan • Dakar • Douala • Lagos</span>
              </li>
            </ul>
          </div>

        </div>
      </footer>

    </div>
  );
};
