import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Search, 
  Filter, 
  DollarSign, 
  X, 
  Check, 
  AlertCircle,
  Sparkles,
  ChevronRight,
  Eye,
  Printer
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from '../../types';
import { formatFCFA, formatRelativeTime, formatTime, getOrderStatusConfig, getPaymentStatusConfig } from '../../utils/formatters';
import { ThermalReceiptModal } from '../common/ThermalReceiptModal';

export const OrdersKanban: React.FC = () => {
  const { 
    orders, 
    updateOrderStatus, 
    updatePaymentStatus, 
    cancelOrder,
    soundEnabled,
    toggleSound,
    broadcastOrderForDelivery
  } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'unpaid' | 'urgent'>('all');

  const [selectedMobileColumn, setSelectedMobileColumn] = useState<OrderStatus | 'all_columns'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 'new';
    }
    return 'all_columns';
  });

  const columns: { status: OrderStatus; title: string; desc: string; color: string }[] = [
    { status: 'new', title: 'Nouvelle', desc: 'Commande reçue', color: 'border-rose-500 bg-rose-500' },
    { status: 'accepted', title: 'Acceptée', desc: 'Confirmée par l\'équipe', color: 'border-blue-500 bg-blue-500' },
    { status: 'preparing', title: 'En préparation', desc: 'Cuisine en cours', color: 'border-amber-500 bg-amber-500' },
    { status: 'ready', title: 'Prête', desc: 'Cuisine terminée', color: 'border-emerald-500 bg-emerald-500' },
    { status: 'in_service', title: 'En service', desc: 'Serveur transporte', color: 'border-purple-500 bg-purple-500' },
    { status: 'served', title: 'Servie', desc: 'Livrée au client', color: 'border-teal-500 bg-teal-500' },
    { status: 'completed', title: 'Terminée', desc: 'Clôturée & Réglée', color: 'border-gray-500 bg-gray-500' },
  ];

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'new': return 'accepted';
      case 'accepted': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'in_service';
      case 'in_service': return 'served';
      case 'served': return 'completed';
      default: return null;
    }
  };

  const getNextButtonLabel = (current: OrderStatus): string => {
    switch (current) {
      case 'new': return 'Accepter';
      case 'accepted': return 'En cuisine';
      case 'preparing': return 'Prête';
      case 'ready': return 'En service';
      case 'in_service': return 'Servie';
      case 'served': return 'Clôturer';
      default: return 'Suivant';
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTabFilter === 'unpaid') return order.paymentStatus === 'unpaid';
    if (activeTabFilter === 'urgent') return order.status === 'new' || order.status === 'ready';
    return true;
  });

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5 max-w-full flex flex-col min-h-[calc(100dvh-5rem)] md:h-[calc(100vh-4.5rem)] md:overflow-hidden pb-16 md:pb-0">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-gray-900">Gestion des Commandes</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {orders.length} au total
            </span>
          </div>
          <p className="text-xs text-gray-700 mt-0.5">Suivi en direct de la prise de commande jusqu'au service à table.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher table, numéro..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1 text-xs">
            <button
              onClick={() => setActiveTabFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTabFilter === 'all' ? 'bg-white text-gray-900 shadow-xs font-bold' : 'text-gray-600'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setActiveTabFilter('urgent')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTabFilter === 'urgent' ? 'bg-rose-600 text-white shadow-xs font-bold' : 'text-gray-600'
              }`}
            >
              Urgentes
            </button>
            <button
              onClick={() => setActiveTabFilter('unpaid')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTabFilter === 'unpaid' ? 'bg-amber-500 text-white shadow-xs font-bold' : 'text-gray-600'
              }`}
            >
              Non Payées
            </button>
          </div>

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${
              soundEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-400 border-gray-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Stage Selector Tabs (Optimized for Phones & Tablets) */}
      <div className="flex xl:hidden items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
        <button
          onClick={() => setSelectedMobileColumn('all_columns')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedMobileColumn === 'all_columns'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Vue Défilement ({filteredOrders.length})
        </button>
        {columns.map(col => {
          const count = filteredOrders.filter(o => o.status === col.status).length;
          const isSelected = selectedMobileColumn === col.status;
          return (
            <button
              key={col.status}
              onClick={() => setSelectedMobileColumn(col.status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${col.color}`}></span>
              <span>{col.title}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Board Container (Horizontally Scrollable on desktop, adaptive on mobile) */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className={`flex gap-3 sm:gap-4 h-full ${
          selectedMobileColumn !== 'all_columns'
            ? 'w-full max-w-2xl mx-auto md:max-w-none md:min-w-[1400px]'
            : 'min-w-[1400px]'
        }`}>
          {columns
            .filter(col => selectedMobileColumn === 'all_columns' || selectedMobileColumn === col.status)
            .map(col => {
            const columnOrders = filteredOrders.filter(o => o.status === col.status);

            return (
              <div
                key={col.status}
                className={`${
                  selectedMobileColumn !== 'all_columns' ? 'w-full md:w-72' : 'w-72'
                } bg-gray-100/90 rounded-2xl p-3 flex flex-col h-full border border-gray-200/80 shadow-2xs shrink-0`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.color}`}></span>
                    <h3 className="font-bold text-xs text-gray-900">{col.title}</h3>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-white text-gray-700 text-xs font-bold flex items-center justify-center shadow-2xs">
                    {columnOrders.length}
                  </span>
                </div>

                {/* Orders List inside column */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {columnOrders.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-gray-400 text-xs italic">
                      Aucune commande
                    </div>
                  ) : (
                    columnOrders.map(order => {
                      const next = getNextStatus(order.status);
                      const paymentConf = getPaymentStatusConfig(order.paymentStatus);

                      return (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrderModal(order)}
                          className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 text-xs group"
                        >
                          {/* Order Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-gray-900">{order.orderNumber}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPrintingOrder(order);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                title="Imprimer le ticket thermique"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[10px] text-gray-700 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              {formatRelativeTime(order.createdAt)}
                            </span>
                          </div>

                          {/* Table, Delivery & Area info */}
                          <div className={`flex items-center justify-between text-[11px] font-semibold px-2 py-1 rounded-lg gap-1 ${
                            order.orderType === 'delivery' 
                              ? 'bg-amber-50 border border-amber-200 text-amber-950' 
                              : order.orderType === 'takeaway'
                              ? 'bg-blue-50 border border-blue-200 text-blue-950'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            <div className="flex items-center gap-1.5 min-w-0">
                              {order.orderType === 'delivery' ? (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider shrink-0">
                                  🛵 Livraison
                                </span>
                              ) : order.orderType === 'takeaway' ? (
                                <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white font-black text-[9px] uppercase tracking-wider shrink-0">
                                  🛍️ À Emporter
                                </span>
                              ) : null}
                              <span className="font-bold truncate">{order.tableName}</span>
                            </div>
                            <span className="text-[10px] opacity-75 shrink-0">{order.areaName}</span>
                          </div>

                          {/* Items summary */}
                          <div className="space-y-1 py-1 border-t border-b border-gray-100 text-gray-700 text-[11px]">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="font-medium truncate">{item.quantity} × {item.name}</span>
                                {item.notes && (
                                  <span className="text-amber-600 font-bold ml-1 shrink-0">⚠️ note</span>
                                )}
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <p className="text-[10px] text-gray-700 italic">+{order.items.length - 3} autre(s) plat(s)...</p>
                            )}
                          </div>

                          {/* Total & Payment Badge */}
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="font-extrabold text-gray-900">{formatFCFA(order.totalAmount)}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${paymentConf.color}`}>
                              {paymentConf.label}
                            </span>
                          </div>

                          {/* Delivery Driver & Race Broadcast Status / Actions */}
                          {order.orderType === 'delivery' && (
                            <div className="pt-1">
                              {!order.deliveryDriverId ? (
                                order.deliveryStatus === 'broadcasted' ? (
                                  <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-400 text-amber-900 text-[10px] font-bold flex items-center justify-between animate-pulse">
                                    <span>📢 Appel coursier en cours...</span>
                                    <span className="text-[9px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-black">EN ATTENTE</span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      broadcastOrderForDelivery(order.id);
                                    }}
                                    className="w-full py-1.5 px-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-lg text-[10px] flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                                  >
                                    <span>📢 Lancer l'appel à livraison</span>
                                  </button>
                                )
                              ) : (
                                <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10px] font-bold flex items-center justify-between">
                                  <span className="truncate">🛵 {order.deliveryDriverName} ({order.deliveryVehiclePlate})</span>
                                  <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-black shrink-0 capitalize">
                                    {order.deliveryStatus === 'arrived' ? 'Arrivé' : order.deliveryStatus === 'in_transit' ? 'En route' : 'Attribué'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Advance Status Button */}
                          {next && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                updateOrderStatus(order.id, next);
                              }}
                              className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                            >
                              <span>{getNextButtonLabel(order.status)}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-emerald-600">Détails de la Commande</span>
                <h2 className="text-lg font-black text-gray-900">{selectedOrderModal.orderNumber}</h2>
              </div>
              <button onClick={() => setSelectedOrderModal(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-2xl">
              <div>
                <span className="text-gray-700">Emplacement :</span>
                <p className="font-bold text-gray-900">{selectedOrderModal.areaName} — {selectedOrderModal.tableName}</p>
              </div>
              <div>
                <span className="text-gray-700">Client :</span>
                <p className="font-bold text-gray-900">{selectedOrderModal.customerName} {selectedOrderModal.customerPhone ? `(${selectedOrderModal.customerPhone})` : ''}</p>
              </div>
              <div>
                <span className="text-gray-700">Heure de commande :</span>
                <p className="font-bold text-gray-900">{formatTime(selectedOrderModal.createdAt)} ({formatRelativeTime(selectedOrderModal.createdAt)})</p>
              </div>
              <div>
                <span className="text-gray-700">Mode & Service :</span>
                <p className="font-bold text-gray-900">
                  {selectedOrderModal.orderType === 'delivery' 
                    ? '🛵 Livraison à Domicile/Bureau' 
                    : selectedOrderModal.orderType === 'takeaway' 
                    ? '🛍️ À Emporter (Click & Collect)' 
                    : '🍽️ Sur Place'}
                </p>
              </div>
            </div>

            {/* Delivery address details & Broadcast action for remote delivery orders */}
            {selectedOrderModal.orderType === 'delivery' && (
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-2">
                <div className="flex items-center justify-between font-black text-amber-950 uppercase text-[10px]">
                  <span>🛵 Course & Appel à Livraison</span>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
                    {selectedOrderModal.deliveryStatus === 'arrived' 
                      ? 'Livreur Arrivé Client' 
                      : selectedOrderModal.deliveryStatus === 'in_transit' 
                      ? 'En Transit' 
                      : selectedOrderModal.deliveryStatus === 'assigned' 
                      ? 'Coursier Assigné' 
                      : selectedOrderModal.deliveryStatus === 'broadcasted' 
                      ? 'Diffusé aux livreurs' 
                      : 'Non diffusé'}
                  </span>
                </div>

                {selectedOrderModal.deliveryInfo && (
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">{selectedOrderModal.deliveryInfo.address}</p>
                    {selectedOrderModal.deliveryInfo.notes && (
                      <p className="text-[11px] text-slate-600 italic">Instruction : "{selectedOrderModal.deliveryInfo.notes}"</p>
                    )}
                  </div>
                )}

                {selectedOrderModal.deliveryDriverName ? (
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Coursier : {selectedOrderModal.deliveryDriverName}</span>
                      <span className="font-mono text-amber-700">{selectedOrderModal.deliveryVehiclePlate}</span>
                    </div>
                    {selectedOrderModal.deliveryDriverPhone && (
                      <p className="text-slate-600">Contact : {selectedOrderModal.deliveryDriverPhone}</p>
                    )}
                  </div>
                ) : selectedOrderModal.deliveryStatus === 'broadcasted' ? (
                  <div className="p-2.5 bg-amber-100/90 rounded-xl text-amber-950 font-bold text-center text-xs animate-pulse">
                    📢 Appel à livraison diffusé sur le réseau ! En attente de la prise en charge du premier coursier.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      broadcastOrderForDelivery(selectedOrderModal.id);
                      setSelectedOrderModal({
                        ...selectedOrderModal,
                        deliveryStatus: 'broadcasted',
                        status: 'ready'
                      });
                    }}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>📢 Lancer l'appel à livraison à tous les livreurs</span>
                  </button>
                )}
              </div>
            )}

            {/* Dishes list */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-900">Articles Commandés</h3>
              <div className="max-h-48 overflow-y-auto space-y-2 divide-y divide-gray-100">
                {selectedOrderModal.items.map((item, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 flex justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{item.quantity} × {item.name}</p>
                      {item.notes && <p className="text-[11px] text-amber-700 italic">Instruction : "{item.notes}"</p>}
                    </div>
                    <span className="font-bold text-gray-900">{formatFCFA(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-700">Total :</span>
              <span className="text-base font-black text-emerald-800">{formatFCFA(selectedOrderModal.totalAmount)}</span>
            </div>

            {/* Payment Actions */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-gray-800">Règlement / Paiement</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    updatePaymentStatus(selectedOrderModal.id, 'paid', 'orange_money');
                    setSelectedOrderModal({ ...selectedOrderModal, paymentStatus: 'paid', paymentMethod: 'orange_money' });
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 ${
                    selectedOrderModal.paymentMethod === 'orange_money' ? 'bg-amber-500 text-white border-amber-600' : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  Orange Money
                </button>
                <button
                  onClick={() => {
                    updatePaymentStatus(selectedOrderModal.id, 'paid', 'mtn_momo');
                    setSelectedOrderModal({ ...selectedOrderModal, paymentStatus: 'paid', paymentMethod: 'mtn_momo' });
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 ${
                    selectedOrderModal.paymentMethod === 'mtn_momo' ? 'bg-amber-400 text-gray-950 border-amber-500' : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  MTN MoMo
                </button>
                <button
                  onClick={() => {
                    updatePaymentStatus(selectedOrderModal.id, 'paid', 'cash');
                    setSelectedOrderModal({ ...selectedOrderModal, paymentStatus: 'paid', paymentMethod: 'cash' });
                  }}
                  className={`p-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 ${
                    selectedOrderModal.paymentMethod === 'cash' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  Espèces
                </button>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-wrap gap-2">
              <button
                onClick={() => {
                  cancelOrder(selectedOrderModal.id);
                  setSelectedOrderModal(null);
                }}
                className="text-xs text-red-600 hover:text-red-700 font-semibold"
              >
                Annuler la commande
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintingOrder(selectedOrderModal)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer Ticket</span>
                </button>

                <button
                  onClick={() => setSelectedOrderModal(null)}
                  className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold"
                >
                  Fermer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Reusable Thermal Receipt Modal */}
      {printingOrder && (
        <ThermalReceiptModal
          order={printingOrder}
          isOpen={Boolean(printingOrder)}
          onClose={() => setPrintingOrder(null)}
        />
      )}

    </div>
  );
};
