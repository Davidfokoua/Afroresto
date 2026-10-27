import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  Building2, 
  Calendar,
  AlertCircle,
  ArrowRight,
  Flame,
  Check
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useLanguage, LanguageSwitcher } from '../../context/LanguageContext';
import { PlanType } from '../../types';
import { formatFCFA } from '../../utils/formatters';

interface PaymentOption {
  id: string;
  name: string;
  badge: string;
  color: string;
  countries: string;
}

const PAYMENT_METHODS: PaymentOption[] = [
  { id: 'orange_money', name: 'Orange Money', badge: 'OM', color: 'bg-orange-500 text-white', countries: "CI, SN, CM, ML, BF, GN" },
  { id: 'mtn_momo', name: 'MTN Mobile Money', badge: 'MoMo', color: 'bg-amber-400 text-slate-950 font-black', countries: "CI, CM, GH, BJ, CG" },
  { id: 'wave', name: 'Wave', badge: 'Wave', color: 'bg-sky-500 text-white font-black', countries: "SN, CI" },
  { id: 'moov_money', name: 'Moov Money', badge: 'Moov', color: 'bg-blue-600 text-white', countries: "CI, BJ, TG, GA" },
  { id: 'card', name: 'Carte Bancaire (Visa / Mastercard)', badge: 'CB', color: 'bg-slate-800 text-white', countries: "International" },
];

export const SubscriptionRenewalModal: React.FC = () => {
  const { 
    isRenewalModalOpen, 
    setIsRenewalModalOpen, 
    currentRestaurant, 
    plans,
    renewSubscription,
    getSubscriptionInfo
  } = useRestaurant();
  const { t, language } = useLanguage();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>(currentRestaurant?.subscriptionPlan || 'business');
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>('orange_money');
  const [phoneNumber, setPhoneNumber] = useState<string>(currentRestaurant?.phone || '');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<boolean>(false);

  if (!isRenewalModalOpen) return null;

  const currentPlanObj = plans.find(p => p.id === selectedPlan) || plans[1];
  const monthlyPrice = currentPlanObj ? currentPlanObj.priceMonthly : 10000;

  // Compute pricing discounts
  let discountPercent = 0;
  if (selectedMonths === 3) discountPercent = 5;
  else if (selectedMonths === 6) discountPercent = 10;
  else if (selectedMonths === 12) discountPercent = 20;

  const rawTotal = monthlyPrice * selectedMonths;
  const discountAmount = Math.round((rawTotal * discountPercent) / 100);
  const finalTotal = rawTotal - discountAmount;

  const handleConfirmRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      await renewSubscription(currentRestaurant.id, selectedMonths, selectedPlan, paymentMethod);
      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        setIsRenewalModalOpen(false);
      }, 1800);
    } catch (err) {
      console.error('Renewal failure:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {t('renewSubscriptionNow')}
              </h2>
              <p className="text-xs text-slate-300">
                Établissement : <strong>{currentRestaurant?.name}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <LanguageSwitcher variant="compact" />
            <button
              type="button"
              onClick={() => setIsRenewalModalOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Success Splash */}
        {successNotice ? (
          <div className="p-8 text-center space-y-4 my-auto animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Abonnement Réactivé avec Succès !</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Votre accès aux modules AFRORESTO et votre menu digital QR Code sont à présent immédiatement débloqués pour une durée de {selectedMonths} mois.
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold inline-block border border-emerald-200">
              Paiement validé par {paymentMethod.toUpperCase()} • Service rétabli
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmRenewal} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-slate-700">
            
            {/* Step 1: Select Plan */}
            <div className="space-y-2">
              <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                1. Choisissez votre forfait
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {plans.map(p => {
                  const isSelected = selectedPlan === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlan(p.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500 shadow-sm' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {p.isPopular && (
                        <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                          Recommandé
                        </span>
                      )}
                      <p className="font-black text-slate-900 text-xs">{p.name}</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-1">
                        {formatFCFA(p.priceMonthly)} <span className="text-[10px] font-normal text-slate-500">/ mois</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{p.tagline}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Duration */}
            <div className="space-y-2">
              <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                2. Durée du renouvellement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { months: 1, label: t('oneMonth'), badge: '' },
                  { months: 3, label: t('threeMonths'), badge: '-5%' },
                  { months: 6, label: t('sixMonths'), badge: '-10%' },
                  { months: 12, label: t('twelveMonths'), badge: 'Éco' },
                ].map(opt => {
                  const isSelected = selectedMonths === opt.months;
                  return (
                    <button
                      key={opt.months}
                      type="button"
                      onClick={() => setSelectedMonths(opt.months)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-sm' 
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <p className="font-bold text-xs">{opt.months} {opt.months > 1 ? 'Mois' : 'Mois'}</p>
                      {opt.badge && (
                        <span className={`inline-block mt-1 text-[9px] font-black px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {opt.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Payment Method (Pan-African Mobile Money & Card) */}
            <div className="space-y-2">
              <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                3. {t('selectPaymentMethod')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => {
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${m.color}`}>
                        {m.badge}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-slate-900 truncate">{m.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">Disponible en {m.countries}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Phone number input for mobile money */}
              {paymentMethod !== 'card' && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-700">
                    Numéro de compte Mobile Money pour le débit :
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono text-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Une notification push de validation PIN sera envoyée sur votre téléphone.
                  </p>
                </div>
              )}
            </div>

            {/* Price Summary Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Prix mensuel ({currentPlanObj.name}) :</span>
                <span>{formatFCFA(monthlyPrice)} / mois</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Durée choisie :</span>
                <span>{selectedMonths} mois</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                  <span>Remise ({discountPercent}%) :</span>
                  <span>- {formatFCFA(discountAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900">Total à régler :</span>
                <span className="text-base font-black text-emerald-700">{formatFCFA(finalTotal)}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRenewalModalOpen(false)}
                className="w-1/3 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Validation du règlement en cours...</span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>{t('confirmAndReactivate')} ({formatFCFA(finalTotal)})</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
