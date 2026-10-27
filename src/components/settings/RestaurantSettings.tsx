import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  Save, 
  ShieldCheck, 
  Volume2, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  ArrowRight,
  Smartphone,
  Coins,
  AlertTriangle,
  RotateCcw,
  Zap,
  Calendar,
  Lock
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatFCFA } from '../../utils/formatters';
import { DeviceImageUploader } from '../common/DeviceImageUploader';
import { CloudSyncStatusCard } from '../common/CloudSyncStatusCard';
import { ThermalPrinterSettingsCard } from './ThermalPrinterSettingsCard';

export const RestaurantSettings: React.FC = () => {
  const { 
    currentRestaurant, 
    updateRestaurantSettings, 
    plans, 
    soundEnabled, 
    toggleSound, 
    setCurrentView,
    getSubscriptionInfo,
    openRenewalModal,
    simulateSubscriptionExpiry,
    extendSubscriptionDays
  } = useRestaurant();

  const [formData, setFormData] = useState({
    name: currentRestaurant?.name || '',
    restaurantType: currentRestaurant?.restaurantType || 'Restaurant & Grillades',
    phone: currentRestaurant?.phone || '',
    address: currentRestaurant?.address || '',
    city: currentRestaurant?.city || '',
    region: currentRestaurant?.region || '',
    country: currentRestaurant?.country || 'Cameroun',
    description: currentRestaurant?.description || '',
    logo: currentRestaurant?.logo || '/logo.svg',
    coverImage: currentRestaurant?.coverImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
  });

  useEffect(() => {
    if (currentRestaurant) {
      setFormData({
        name: currentRestaurant.name || '',
        restaurantType: currentRestaurant.restaurantType || 'Restaurant & Grillades',
        phone: currentRestaurant.phone || '',
        address: currentRestaurant.address || '',
        city: currentRestaurant.city || '',
        region: currentRestaurant.region || '',
        country: currentRestaurant.country || 'Cameroun',
        description: currentRestaurant.description || '',
        logo: currentRestaurant.logo || '/logo.svg',
        coverImage: currentRestaurant.coverImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
      });
    }
  }, [currentRestaurant]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedPlanUpgrade, setSelectedPlanUpgrade] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestaurantSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleUpgradePlan = (planId: string) => {
    updateRestaurantSettings({ subscriptionPlan: planId as any });
    setSelectedPlanUpgrade(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-gray-900">Paramètres de l'Établissement & Abonnement</h1>
        <p className="text-xs text-gray-700 mt-0.5">Configurez l'identité visuelle de votre établissement et gérez votre forfait SaaS AFRORESTO.</p>
      </div>

      {/* Profile Form Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Profil & Coordonnées Publiques</h2>
            <p className="text-xs text-gray-700">Ces informations apparaissent sur le menu digital QR code de vos clients.</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-gray-700">Nom du Restaurant *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700">Type d'Établissement</label>
              <input
                type="text"
                value={formData.restaurantType}
                onChange={e => setFormData({ ...formData, restaurantType: e.target.value })}
                className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700">Numéro de Contact (WhatsApp) *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700">Adresse / Quartier</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700">Pays d'implantation</label>
              <select
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white text-gray-900"
              >
                <option value="Côte d'Ivoire">🇨🇮 Côte d'Ivoire</option>
                <option value="Sénégal">🇸🇳 Sénégal</option>
                <option value="Cameroun">🇨🇲 Cameroun</option>
                <option value="Nigeria">🇳🇬 Nigeria</option>
                <option value="Ghana">🇬🇭 Ghana</option>
                <option value="Gabon">🇬🇦 Gabon</option>
                <option value="RDC">🇨🇩 RD Congo</option>
                <option value="Bénin">🇧🇯 Bénin</option>
                <option value="Togo">🇹🇬 Togo</option>
                <option value="Mali">🇲🇱 Mali</option>
                <option value="Burkina Faso">🇧🇫 Burkina Faso</option>
                <option value="Guinée">🇬🇳 Guinée</option>
                <option value="Autre pays africain">🌍 Autre pays d'Afrique</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700">Ville</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700">Région</label>
              <input
                type="text"
                value={formData.region}
                onChange={e => setFormData({ ...formData, region: e.target.value })}
                className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-gray-700">Description / Slogan</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300"
              ></textarea>
            </div>

            <div>
              <DeviceImageUploader
                value={formData.logo || ''}
                onChange={(newLogo) => setFormData({ ...formData, logo: newLogo })}
                label="Logo de l'Établissement"
                helperText="Sélectionnez votre logo depuis votre appareil (format carré recommandé)"
                aspectRatio="square"
                showPresets={false}
              />
            </div>

            <div>
              <DeviceImageUploader
                value={formData.coverImage || ''}
                onChange={(newCover) => setFormData({ ...formData, coverImage: newCover })}
                label="Bannière & Photo de Couverture"
                helperText="Photo de salle ou terrasse pour l'en-tête de votre menu digital"
                aspectRatio="wide"
                showPresets={false}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {savedSuccess ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Modifications enregistrées avec succès !
              </span>
            ) : (
              <span></span>
            )}

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Enregistrer le profil
            </button>
          </div>
        </form>
      </div>

      {/* Thermal Printer (ESC/POS 58mm/80mm) Settings Card */}
      <ThermalPrinterSettingsCard />

      {/* Subscription Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
        {(() => {
          const subInfo = getSubscriptionInfo(currentRestaurant);
          const formattedExp = subInfo.expiresAt
            ? new Date(subInfo.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Non définie';

          return (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Abonnement SaaS & Statut du Service</h2>
                    <p className="text-xs text-gray-700">Gestion de votre formule, échéances et suspension automatique.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {subInfo.isSuspended ? (
                    <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-black rounded-full uppercase flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                      Service Suspendu
                    </span>
                  ) : subInfo.isExpired ? (
                    <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-black rounded-full uppercase flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                      Abonnement Expiré (Bloqué)
                    </span>
                  ) : subInfo.daysRemaining <= 5 ? (
                    <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-black rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Expire dans {subInfo.daysRemaining} jour(s)
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full uppercase">
                      Plan {currentRestaurant.subscriptionPlan} • ACTIF
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={openRenewalModal}
                    className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full transition-colors cursor-pointer shadow-xs"
                  >
                    Renouveler / Prolonger
                  </button>
                </div>
              </div>

              {/* Expiration Details and Status Notice */}
              <div className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                subInfo.isExpired || subInfo.isSuspended 
                  ? 'bg-rose-50 border-rose-200 text-rose-900' 
                  : subInfo.daysRemaining <= 5 
                    ? 'bg-amber-50 border-amber-200 text-amber-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <span>Date d'expiration de votre formule : <strong>{formattedExp}</strong></span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {subInfo.isExpired 
                      ? "⚠️ Votre abonnement est expiré. L'accès au service et au menu QR est directement suspendu jusqu'à régularisation."
                      : subInfo.isSuspended
                        ? "⚠️ L'accès à votre établissement a été suspendu manuellement."
                        : `✅ Votre service est pleinement opérationnel. Fin de période dans ${subInfo.daysRemaining} jour(s).`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openRenewalModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shrink-0 shadow-xs cursor-pointer transition-colors"
                >
                  Régler / Renouveler l'Abonnement
                </button>
              </div>

              {/* Developer / Demo Simulator Box */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-300">Simulateur de Test pour l'Évaluation :</span>
                    <p className="text-[11px] text-slate-400">
                      Vérifiez que l'accès au service est suspendu directement lorsque l'abonnement expire.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => simulateSubscriptionExpiry(currentRestaurant.id)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-[11px] cursor-pointer transition-colors"
                  >
                    Simuler l'expiration immédiate
                  </button>

                  <button
                    type="button"
                    onClick={() => extendSubscriptionDays(currentRestaurant.id, 30)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Réactiver (+30j)</span>
                  </button>
                </div>
              </div>
            </>
          );
        })()}

        {/* Launch Gift Banner */}
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border border-amber-300/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-xs mt-0.5">
              🎁
            </div>
            <div>
              <p className="font-extrabold text-slate-900">
                Offre Spéciale de Bienvenue : Forfait Premium Débloqué
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Même avec votre abonnement <strong>{currentRestaurant.subscriptionPlan.toUpperCase()}</strong>, vous disposez sans surcoût de <strong>100% des outils du forfait PREMIUM</strong> (Écran Cuisine KDS, Gestion des Stocks, Multi-espaces, Ventes & Caisse OM/MoMo, Rôles illimités et Rapports analytiques).
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-lg shrink-0">
            ✓ Débloqué à 100%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => {
            const isCurrent = currentRestaurant.subscriptionPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCurrent 
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500 shadow-sm' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-gray-900">{plan.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-200 px-2 py-0.5 rounded">
                        Votre Plan
                      </span>
                    )}
                  </div>

                  <p className="text-lg font-black text-gray-900 mt-2">{formatFCFA(plan.priceMonthly)} <span className="text-xs font-normal text-gray-700">/ mois</span></p>
                  <p className="text-[11px] text-gray-700 mt-0.5">{plan.tagline}</p>

                  <ul className="mt-3 space-y-1.5 text-xs text-gray-700 border-t border-gray-100 pt-3">
                    {plan.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[11px]">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {!isCurrent ? (
                  <button
                    onClick={() => handleUpgradePlan(plan.id)}
                    className="w-full mt-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Passer à {plan.name}
                  </button>
                ) : (
                  <div className="w-full mt-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold text-center">
                    Plan Actif
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-gray-800">Mode de règlement de l'abonnement :</span>
            <p className="text-gray-700">Prélèvement automatique Orange Money (+237 691 23 45 67) • Renouvellement le 1er du mois</p>
          </div>
          <button className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-800 rounded-xl font-bold hover:bg-gray-100">
            Modifier le numéro de paiement
          </button>
        </div>

        {/* Legal & Privacy policy link */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <p>Données hébergées sous protection stricte et secret commercial garanti (FOWA-TECHNOLOGY.SARL).</p>
          <button
            onClick={() => setCurrentView('privacy')}
            className="text-emerald-700 hover:text-emerald-800 font-bold underline underline-offset-2 shrink-0 ml-2"
          >
            Consulter la Politique de Confidentialité
          </button>
        </div>
      </div>

      {/* Cloud Synchronization & Data Backup Card */}
      <CloudSyncStatusCard />

    </div>
  );
};
