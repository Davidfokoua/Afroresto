import React, { useState } from 'react';
import { AlertTriangle, Clock, ArrowRight, X, CreditCard } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useLanguage } from '../../context/LanguageContext';

export const SubscriptionExpiryBanner: React.FC = () => {
  const { currentRestaurant, getSubscriptionInfo, openRenewalModal } = useRestaurant();
  const { t, language } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);

  const subInfo = getSubscriptionInfo(currentRestaurant);

  // Only display if active/trial and daysRemaining is between 1 and 5
  if (isDismissed || !subInfo.isActive || subInfo.daysRemaining > 5 || subInfo.daysRemaining <= 0) {
    return null;
  }

  const formattedDate = subInfo.expiresAt 
    ? new Date(subInfo.expiresAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : '';

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-slate-950 px-4 py-2.5 shadow-md flex items-center justify-between text-xs border-b border-amber-600/50 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-black/15 flex items-center justify-center font-black shrink-0">
          <AlertTriangle className="w-4 h-4 text-slate-950 animate-bounce" />
        </div>
        <div className="truncate">
          <span className="font-black mr-1">Rappel d'expiration :</span>
          <span>
            Votre abonnement AFRORESTO expire dans <strong>{subInfo.daysRemaining} jour{subInfo.daysRemaining > 1 ? 's' : ''}</strong> ({formattedDate}). 
            Pour éviter l'interruption directe de vos services, effectuez votre renouvellement dès maintenant.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        <button
          type="button"
          onClick={openRenewalModal}
          className="px-3 py-1 bg-slate-950 text-white font-extrabold rounded-lg text-[11px] hover:bg-slate-900 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
          <span>Renouveler</span>
        </button>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 hover:bg-black/10 rounded-md text-slate-950/70 hover:text-slate-950 transition-colors cursor-pointer"
          title="Masquer le rappel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
