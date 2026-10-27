import React from 'react';
import { 
  ShieldAlert, 
  CreditCard, 
  Sparkles, 
  Clock, 
  Lock, 
  AlertCircle, 
  MessageCircle, 
  Phone, 
  RefreshCw, 
  Building2, 
  Store, 
  CheckCircle2, 
  LogOut,
  HelpCircle,
  Zap,
  RotateCcw
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useLanguage, LanguageSwitcher } from '../../context/LanguageContext';
import { formatDateTime } from '../../utils/formatters';
import { generateWhatsAppLink } from '../../utils/whatsapp';

export const SubscriptionSuspendedScreen: React.FC = () => {
  const { 
    currentRestaurant, 
    restaurants, 
    switchRestaurant, 
    getSubscriptionInfo, 
    openRenewalModal,
    extendSubscriptionDays,
    simulateSubscriptionExpiry,
    logout,
    setCurrentView
  } = useRestaurant();
  const { t, language } = useLanguage();

  const subInfo = getSubscriptionInfo(currentRestaurant);

  const formattedExpDate = subInfo.expiresAt 
    ? new Date(subInfo.expiresAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Date échue';

  const daysPassed = Math.abs(subInfo.daysRemaining);

  const handleWhatsAppContact = () => {
    const message = `Bonjour AFRORESTO, je souhaite régulariser et renouveler l'abonnement de mon établissement "${currentRestaurant.name}" (ID: ${currentRestaurant.id}, Gérant: ${currentRestaurant.ownerName}, Tél: ${currentRestaurant.phone}). Merci de m'indiquer la procédure de réactivation.`;
    const link = generateWhatsAppLink('+2250712345678', message);
    window.open(link, '_blank');
  };

  const otherActiveRestaurants = restaurants.filter(
    r => r.id !== currentRestaurant.id && (r.subscriptionStatus === 'active' || r.subscriptionStatus === 'trial')
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-rose-500 selection:text-white">
      
      {/* Background radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-rose-950/40 via-slate-950 to-slate-950 pointer-events-none -z-10" />

      <div className="w-full max-w-3xl space-y-6">

        {/* Top brand header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black">
              🌍
            </div>
            <div>
              <span className="text-xs font-black tracking-widest text-amber-400 uppercase">AFRORESTO</span>
              <p className="text-[11px] text-slate-400">Plateforme Panafricaine de Gestion de Restaurant</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>

        {/* Main Suspension Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/20 space-y-6 relative overflow-hidden">
          
          {/* Subtle alert top strip */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

          {/* Icon and status badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
                <ShieldAlert className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
                    {subInfo.isSuspended ? t('subscriptionSuspendedBadge') : t('subscriptionExpiredBadge')}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Plan {currentRestaurant.subscriptionPlan}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                  {t('subscriptionSuspendedTitle')}
                </h1>
              </div>
            </div>

            {/* Restaurant badge */}
            <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/80 flex items-center gap-3 shrink-0">
              <img 
                src={currentRestaurant.logo} 
                alt={currentRestaurant.name} 
                className="w-10 h-10 rounded-xl object-cover border border-slate-600 shadow-xs"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-white max-w-[160px] truncate">{currentRestaurant.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentRestaurant.city}, {currentRestaurant.country}</p>
              </div>
            </div>
          </div>

          {/* Explanation message */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-slate-200 text-xs sm:text-sm leading-relaxed space-y-2">
            <p>
              {language === 'fr' ? (
                <>L'abonnement de votre établissement <strong>« {currentRestaurant.name} »</strong> est arrivé à expiration le <strong>{formattedExpDate}</strong>{daysPassed > 0 ? ` (il y a ${daysPassed} jour${daysPassed > 1 ? 's' : ''})` : ''}.</>
              ) : (
                <>The subscription for your establishment <strong>« {currentRestaurant.name} »</strong> expired on <strong>{formattedExpDate}</strong>{daysPassed > 0 ? ` (${daysPassed} day${daysPassed > 1 ? 's' : ''} ago)` : ''}.</>
              )}
            </p>
            <p className="text-slate-300 text-xs">
              {language === 'fr' 
                ? "Conformément à la politique d'exploitation, l'accès direct aux modules opérationnels et au menu digital en ligne a été automatiquement suspendu."
                : "In accordance with operating policy, direct access to operational modules and the online digital menu has been automatically suspended."
              }
            </p>
          </div>

          {/* Blocked services grid */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              {t('frozenServicesNotice')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">✕</span>
                <span>{t('frozenServiceOrders')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">✕</span>
                <span>{t('frozenServiceQr')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">✕</span>
                <span>{t('frozenServiceKitchen')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">✕</span>
                <span>{t('frozenServiceStock')}</span>
              </div>
            </div>
          </div>

          {/* Safety & Data Preservation Guarantee */}
          <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-xs text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-300 block font-bold mb-0.5">Données 100% conservées en sécurité</strong>
              <span>{t('dataPreservedNotice')}</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={openRenewalModal}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
            >
              <CreditCard className="w-5 h-5" />
              <span>{t('renewSubscriptionNow')}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppContact}
              className="py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Assistance WhatsApp</span>
            </button>
          </div>

          {/* Switch restaurant if other exists */}
          {otherActiveRestaurants.length > 0 && (
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
              <span>Vous possédez un autre établissement actif :</span>
              <div className="flex items-center gap-2">
                {otherActiveRestaurants.map(r => (
                  <button
                    key={r.id}
                    onClick={() => switchRestaurant(r.id)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl border border-slate-700 transition-colors"
                  >
                    Basculer vers {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer storefront preview link */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => setCurrentView('customer_qr')}
              className="text-slate-400 hover:text-white underline underline-offset-2"
            >
              Voir la page publique du menu QR (vue client suspendue)
            </button>
            <button
              onClick={() => setCurrentView('landing')}
              className="text-slate-400 hover:text-white underline underline-offset-2"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>

        {/* DEVELOPER / DEMO TESTING BAR */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-300">Testeur & Démonstration :</span>
            <span>Vous pouvez réactiver ou suspendre en 1 clic pour tester le fonctionnement.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => extendSubscriptionDays(currentRestaurant.id, 30)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('demoReactivate30Days')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
