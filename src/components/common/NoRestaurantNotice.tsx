import React from 'react';
import { Plus, Store, Sparkles, QrCode, ArrowRight } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestoCamLogo } from './RestoCamLogo';

interface NoRestaurantNoticeProps {
  title?: string;
  subtitle?: string;
}

export const NoRestaurantNotice: React.FC<NoRestaurantNoticeProps> = ({
  title = "Aucun restaurant n'est encore configuré",
  subtitle = "Créez votre établissement en quelques étapes : nom, ville, carte de plats en FCFA et tables avec QR code."
}) => {
  const { setCurrentView } = useRestaurant();

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-soft-md text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 p-2.5 flex items-center justify-center mx-auto shadow-xs">
        <RestoCamLogo size={64} />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto py-2">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
          <Store className="w-5 h-5 text-emerald-600" />
          <p className="font-bold text-xs text-slate-900">1. Identité</p>
          <p className="text-[11px] text-slate-500">Nom, ville & coordonnées</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
          <QrCode className="w-5 h-5 text-emerald-600" />
          <p className="font-bold text-xs text-slate-900">2. Tables & QR</p>
          <p className="text-[11px] text-slate-500">Génération automatique</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <p className="font-bold text-xs text-slate-900">3. Menus en FCFA</p>
          <p className="text-[11px] text-slate-500">Prêt pour les commandes</p>
        </div>
      </div>

      <div className="pt-2">
        <button
          id="btn-create-first-restaurant"
          onClick={() => setCurrentView('onboarding')}
          className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-2xl shadow-soft hover:shadow-soft-md transition-all inline-flex items-center gap-2.5 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Créer mon restaurant maintenant</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
