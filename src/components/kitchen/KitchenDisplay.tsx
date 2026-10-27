import React, { useState } from 'react';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Utensils, 
  Sparkles,
  RefreshCw,
  Layers,
  Check,
  Printer
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { getElapsedMinutes, formatTime } from '../../utils/formatters';
import { BackDotButton } from '../layout/BackDotButton';
import { Order } from '../../types';
import { ThermalReceiptModal } from '../common/ThermalReceiptModal';

export const KitchenDisplay: React.FC = () => {
  const { 
    orders, 
    updateOrderStatus, 
    soundEnabled, 
    toggleSound, 
    currentRestaurant,
    broadcastOrderForDelivery
  } = useRestaurant();

  const [activeFilter, setActiveFilter] = useState<'all' | 'accepted' | 'preparing' | 'ready'>('all');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Filter orders relevant for kitchen (accepted, preparing, ready)
  const kitchenOrders = orders.filter(o => 
    o.status === 'accepted' || o.status === 'preparing' || o.status === 'ready'
  ).filter(o => {
    if (activeFilter === 'all') return true;
    return o.status === activeFilter;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-950 text-white p-4 sm:p-6 flex flex-col space-y-4">
      
      {/* Top KDS Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <BackDotButton variant="inline" className="bg-gray-900 border-gray-800 text-gray-200 hover:bg-gray-800 hover:text-white" />
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-gray-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white">Écran Cuisine (KDS)</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                EN DIRECT
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{currentRestaurant.name} • {kitchenOrders.length} bons actifs</p>
          </div>
        </div>

        {/* Filter & Sound controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeFilter === 'all' ? 'bg-amber-500 text-gray-950' : 'text-gray-400 hover:text-white'
              }`}
            >
              Tous ({orders.filter(o => ['accepted', 'preparing', 'ready'].includes(o.status)).length})
            </button>
            <button
              onClick={() => setActiveFilter('accepted')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeFilter === 'accepted' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              À Cuire ({orders.filter(o => o.status === 'accepted').length})
            </button>
            <button
              onClick={() => setActiveFilter('preparing')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeFilter === 'preparing' ? 'bg-amber-500 text-gray-950' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sur le Feu ({orders.filter(o => o.status === 'preparing').length})
            </button>
            <button
              onClick={() => setActiveFilter('ready')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeFilter === 'ready' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Dressés ({orders.filter(o => o.status === 'ready').length})
            </button>
          </div>

          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
              soundEnabled ? 'bg-emerald-950 border-emerald-700 text-emerald-400' : 'bg-gray-900 border-gray-800 text-gray-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Bip Sonore</span>
          </button>
        </div>
      </div>

      {/* Grid of Kitchen Tickets */}
      <div className="flex-1">
        {kitchenOrders.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-gray-900/60 rounded-3xl border border-gray-800">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 mb-3">
              <Utensils className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-300">Poste Cuisine Prêt</h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1">En attente des prochaines commandes transmises par les serveurs ou passées via QR codes sur table.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {kitchenOrders.map(order => {
              const elapsed = getElapsedMinutes(order.createdAt);
              const isUrgent = elapsed >= 20;
              const isMedium = elapsed >= 12 && elapsed < 20;

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl p-4 flex flex-col justify-between border-2 transition-all shadow-lg ${
                    order.status === 'ready'
                      ? 'bg-emerald-950/40 border-emerald-500/80 text-white'
                      : isUrgent
                      ? 'bg-rose-950/40 border-rose-500 text-white ring-2 ring-rose-500/40'
                      : order.status === 'preparing'
                      ? 'bg-amber-950/30 border-amber-500 text-white'
                      : 'bg-gray-900 border-gray-700 text-white'
                  }`}
                >
                  {/* Ticket Header */}
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                      <div>
                        <span className="text-base font-black tracking-wide">{order.orderNumber}</span>
                        <p className="text-xs font-bold text-amber-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          {order.orderType === 'delivery' ? (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                              🛵 LIVRAISON
                            </span>
                          ) : order.orderType === 'takeaway' ? (
                            <span className="px-1.5 py-0.2 rounded bg-blue-500 text-white font-black text-[9px] uppercase tracking-wider">
                              🛍️ À EMPORTER
                            </span>
                          ) : null}
                          <span>{order.areaName} • </span>
                          <span className="text-white bg-gray-800 px-1.5 py-0.5 rounded">{order.tableName}</span>
                        </p>
                      </div>

                      {/* Chronometer & Print Button */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPrintingOrder(order)}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                          title="Imprimer le bon de cuisine (KOT)"
                        >
                          <Printer className="w-4 h-4 text-amber-400" />
                        </button>

                        <div className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black flex items-center gap-1.5 ${
                          isUrgent ? 'bg-rose-600 text-white animate-pulse' : isMedium ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-300'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{elapsed} min</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer or waiter notes if present */}
                    {order.notes && (
                      <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Note : "{order.notes}"</span>
                      </div>
                    )}

                    {/* Food Items List */}
                    <div className="mt-3 space-y-2">
                      {order.items.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="p-2.5 rounded-xl bg-gray-800/80 border border-gray-700 flex flex-col gap-1"
                        >
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-extrabold text-white">
                              {item.quantity} × {item.name}
                            </span>
                          </div>

                          {item.notes && (
                            <span className="text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60 flex items-center gap-1">
                              ⚠️ {item.notes}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ticket Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-gray-800 flex gap-2">
                    {order.status === 'accepted' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                      >
                        <Flame className="w-4 h-4 fill-gray-950" />
                        Démarrer la préparation
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 text-gray-950" />
                        Plats Prêts à Servir
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <div className="w-full space-y-1.5">
                        <div className="w-full py-2 bg-emerald-900/60 border border-emerald-700 text-emerald-300 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5">
                          <Sparkles className="w-4 h-4" />
                          Prête • {order.orderType === 'delivery' ? 'À emballer pour coursier' : 'En attente du serveur'}
                        </div>

                        {order.orderType === 'delivery' && (
                          !order.deliveryDriverId ? (
                            order.deliveryStatus === 'broadcasted' ? (
                              <div className="w-full py-1.5 px-2 bg-amber-500/20 border border-amber-400 text-amber-300 text-[11px] font-bold rounded-xl text-center animate-pulse">
                                📢 Appel coursier en cours...
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => broadcastOrderForDelivery(order.id)}
                                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                              >
                                <span>📢 Lancer l'appel à livraison</span>
                              </button>
                            )
                          ) : (
                            <div className="w-full py-1.5 px-2 bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-[10px] font-bold rounded-xl flex items-center justify-between">
                              <span className="truncate">🛵 {order.deliveryDriverName} ({order.deliveryVehiclePlate})</span>
                              <span className="capitalize text-emerald-300 shrink-0 font-black">
                                {order.deliveryStatus === 'arrived' ? 'Arrivé' : 'Assigné'}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Thermal Receipt Modal (Defaults to Kitchen KOT ticket) */}
      {printingOrder && (
        <ThermalReceiptModal
          order={printingOrder}
          isOpen={Boolean(printingOrder)}
          onClose={() => setPrintingOrder(null)}
          initialType="kitchen"
        />
      )}

    </div>
  );
};
