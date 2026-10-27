import React from 'react';
import { 
  BellRing, 
  Utensils, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  ChefHat,
  Volume2
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatFCFA } from '../../utils/formatters';

export const IncomingOrderNotification: React.FC = () => {
  const { 
    incomingOrderAlert, 
    dismissIncomingOrderAlert,
    waiterCallAlert,
    dismissWaiterAlert,
    updateOrderStatus,
    setCurrentView,
    currentView
  } = useRestaurant();

  // Don't display staff alerts when the user is in client/customer storefront mode
  if (currentView === 'customer_qr') {
    return null;
  }

  return (
    <div className="fixed top-3 right-3 sm:right-6 z-50 flex flex-col gap-3 max-w-md w-[calc(100vw-24px)] sm:w-auto pointer-events-none">
      {/* 1. New Incoming Order Alert */}
      {incomingOrderAlert && (
        <div 
          id="incoming-order-banner"
          className="pointer-events-auto bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-4 rounded-2xl shadow-2xl border-2 border-emerald-400/80 animate-in slide-in-from-top-4 duration-300 backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping"></span>
                <BellRing className="w-5 h-5 relative z-10" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                    Nouveau QR Code
                  </span>
                  <span className="text-xs text-slate-300 font-mono font-bold">
                    {incomingOrderAlert.orderNumber}
                  </span>
                </div>
                <h4 className="font-extrabold text-white text-sm mt-0.5">
                  Commande {incomingOrderAlert.tableName} ({incomingOrderAlert.areaName})
                </h4>
              </div>
            </div>

            <button
              id="dismiss-incoming-order-btn"
              onClick={dismissIncomingOrderAlert}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Fermer l'alerte"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details & Items Summary */}
          <div className="mt-3 pt-2.5 border-t border-slate-700/80 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Client : <strong className="text-white">{incomingOrderAlert.customerName || 'Client Sur Place'}</strong></span>
              <span className="font-black text-emerald-400 text-sm">{formatFCFA(incomingOrderAlert.totalAmount)}</span>
            </div>

            <p className="text-slate-300 line-clamp-2 text-[11px] bg-slate-800/60 p-2 rounded-lg border border-slate-700">
              🍽️ {incomingOrderAlert.items.map(it => `${it.quantity}x ${it.name}`).join(' • ')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex items-center gap-2">
            <button
              id="accept-incoming-order-btn"
              onClick={async () => {
                await updateOrderStatus(incomingOrderAlert.id, 'preparing');
                dismissIncomingOrderAlert();
              }}
              className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <ChefHat className="w-4 h-4" />
              Accepter en cuisine
            </button>
            <button
              id="view-incoming-order-btn"
              onClick={() => {
                dismissIncomingOrderAlert();
                setCurrentView('orders');
              }}
              className="py-2 px-3 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Voir
            </button>
          </div>
        </div>
      )}

      {/* 2. Waiter Call Alert */}
      {waiterCallAlert && (
        <div 
          id="waiter-call-banner"
          className="pointer-events-auto bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 rounded-2xl shadow-2xl border-2 border-amber-300/80 animate-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 animate-bounce">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-wider text-amber-100">
                  Appel Serveur • {waiterCallAlert.time}
                </p>
                <h4 className="font-extrabold text-white text-sm">
                  {waiterCallAlert.tableName} ({waiterCallAlert.areaName || 'Salle'})
                </h4>
              </div>
            </div>

            <button
              id="dismiss-waiter-alert-btn"
              onClick={dismissWaiterAlert}
              className="py-1 px-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg transition-colors"
            >
              J'y vais !
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
