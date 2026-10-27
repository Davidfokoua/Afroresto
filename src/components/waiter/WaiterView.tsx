import React, { useState } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  Clock, 
  Utensils, 
  DollarSign, 
  Plus, 
  BellRing, 
  MapPin, 
  User, 
  Sparkles,
  ChevronRight,
  X,
  Search,
  Printer
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatFCFA, formatRelativeTime, formatTime } from '../../utils/formatters';
import { Order, MenuItem } from '../../types';
import { BackDotButton } from '../layout/BackDotButton';
import { ThermalReceiptModal } from '../common/ThermalReceiptModal';

export const WaiterView: React.FC = () => {
  const { 
    orders, 
    tables, 
    areas, 
    menuItems, 
    updateOrderStatus, 
    updatePaymentStatus, 
    createOrder,
    waiterCalls,
    acknowledgeWaiterCall,
    acknowledgeTableWaiterCall
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'ready' | 'tables' | 'new_order'>('ready');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<string>(tables[0]?.id || '');
  const [waiterCart, setWaiterCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [searchDish, setSearchDish] = useState('');

  // Real-time pending waiter calls
  const pendingCalls = waiterCalls.filter(c => c.status === 'pending');

  // Orders ready to be served or in service
  const readyOrders = orders.filter(o => o.status === 'ready' || o.status === 'in_service');
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

  const handleTakeDelivery = (orderId: string) => {
    updateOrderStatus(orderId, 'in_service');
  };

  const handleMarkServed = (orderId: string) => {
    updateOrderStatus(orderId, 'served');
  };

  const handleQuickAddDish = (item: MenuItem) => {
    setWaiterCart(prev => {
      const idx = prev.findIndex(ci => ci.item.id === item.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleRemoveDish = (idx: number) => {
    setWaiterCart(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitWaiterOrder = () => {
    if (waiterCart.length === 0 || !selectedTableForOrder) return;

    createOrder({
      tableId: selectedTableForOrder,
      items: waiterCart.map(c => ({
        menuItemId: c.item.id,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
      })),
      notes: 'Prise par serveur en salle',
    });

    setWaiterCart([]);
    setActiveTab('ready');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackDotButton variant="inline" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900">Service en Salle & Serveurs</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                Poste Serveur
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Livraison des plats dressés, statut des tables et encaissement.</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="w-full sm:w-auto overflow-x-auto no-scrollbar flex bg-gray-100 p-1 rounded-2xl gap-1 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('ready')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'ready' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prêts à Servir ({readyOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'tables' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Plan des Tables</span>
            {pendingCalls.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse">
                {pendingCalls.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('new_order')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'new_order' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Prendre Commande</span>
          </button>
        </div>
      </div>

      {/* Real-time Waiter Call Alert Bar */}
      {pendingCalls.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 p-4 sm:p-5 rounded-3xl shadow-xl border-2 border-amber-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-amber-600 flex items-center justify-center shadow-lg shrink-0">
              <BellRing className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  {pendingCalls.length} Appel{pendingCalls.length > 1 ? 's' : ''} Serveur
                </span>
                <span className="text-xs font-bold text-amber-950">Notification Directe Client</span>
              </div>
              <h2 className="text-base font-black text-slate-950 mt-1">
                {pendingCalls.map(c => `${c.tableName} (${c.areaName || 'Salle'})`).join(' • ')} demande{pendingCalls.length > 1 ? 'nt' : ''} l'intervention d'un serveur !
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {pendingCalls.map(call => (
              <button
                key={call.id}
                onClick={() => acknowledgeWaiterCall(call.id)}
                className="flex-1 md:flex-none px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>J'arrive à la {call.tableName} !</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: READY ORDERS FOR SERVERS */}
      {activeTab === 'ready' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Plats prêts au passe-plat</h2>
            <span className="text-xs text-gray-700">Notification instantanée dès que la cuisine valide</span>
          </div>

          {readyOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Aucun plat en attente de service</h3>
              <p className="text-xs text-gray-700 max-w-sm mx-auto mt-1">Tous les plats prêts ont été livrés aux clients en salle.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyOrders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-gray-900 text-base">{order.orderNumber}</span>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-lg">
                      {order.areaName} • {order.tableName}
                    </span>
                  </div>

                  <div className="space-y-1.5 py-2 border-t border-b border-gray-100 text-xs">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between font-medium text-gray-800">
                        <span>{it.quantity} × {it.name}</span>
                        {it.notes && <span className="text-amber-600 font-bold">({it.notes})</span>}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">Client: <strong>{order.customerName}</strong></span>
                    <span className="font-extrabold text-emerald-700">{formatFCFA(order.totalAmount)}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPrintingOrder(order)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                      title="Imprimer l'addition / note de table"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {order.status === 'ready' ? (
                      <button
                        onClick={() => handleTakeDelivery(order.id)}
                        className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <Layers className="w-4 h-4" />
                        Prendre en charge
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkServed(order.id)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Marquer Livré
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FLOOR TABLES OVERVIEW */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          {areas.map(area => {
            const areaTables = tables.filter(t => t.areaId === area.id);

            return (
              <div key={area.id} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-gray-900">{area.name}</h3>
                  <span className="text-xs text-gray-700">{areaTables.length} tables</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {areaTables.map(tbl => {
                    const activeTableOrder = orders.find(o => o.tableId === tbl.id && !['completed', 'cancelled'].includes(o.status));
                    const isWaiterCalled = tbl.waiterCalled || pendingCalls.some(c => c.tableId === tbl.id);
                    const tablePendingCall = pendingCalls.find(c => c.tableId === tbl.id);

                    return (
                      <div
                        key={tbl.id}
                        className={`p-3.5 rounded-2xl border flex flex-col justify-between text-xs space-y-2 transition-all ${
                          isWaiterCalled
                            ? 'bg-amber-100/90 border-2 border-amber-500 shadow-md ring-2 ring-amber-400'
                            : tbl.status === 'occupied'
                            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400'
                            : 'bg-emerald-50/50 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-gray-900">{tbl.name}</span>
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            isWaiterCalled ? 'bg-red-500 animate-ping' : tbl.status === 'occupied' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}></span>
                        </div>

                        {isWaiterCalled && (
                          <div className="bg-gradient-to-r from-amber-600 to-red-600 text-white font-black text-[10px] px-2 py-1 rounded-xl flex items-center justify-between gap-1 shadow-xs">
                            <span className="flex items-center gap-1">
                              <BellRing className="w-3 h-3 animate-bounce" />
                              APPEL CLIENT !
                            </span>
                            <button
                              onClick={() => {
                                if (tablePendingCall) {
                                  acknowledgeWaiterCall(tablePendingCall.id);
                                } else {
                                  acknowledgeTableWaiterCall(tbl.id);
                                }
                              }}
                              className="bg-white text-slate-950 hover:bg-slate-100 px-1.5 py-0.5 rounded-md text-[9px] font-black cursor-pointer shadow-xs active:scale-95"
                            >
                              J'y vais !
                            </button>
                          </div>
                        )}

                        <p className="text-[11px] text-gray-700">{tbl.capacity} couverts</p>

                        {activeTableOrder ? (
                          <div className="pt-1.5 border-t border-amber-200 flex items-center justify-between gap-1">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-amber-800 block truncate">{activeTableOrder.orderNumber}</span>
                              <span className="text-[10px] text-emerald-800 font-extrabold">{formatFCFA(activeTableOrder.totalAmount)}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPrintingOrder(activeTableOrder)}
                              className="p-1 rounded-lg bg-white/80 hover:bg-white text-slate-700 shadow-2xs border border-amber-300 transition-colors shrink-0"
                              title="Imprimer l'addition de la table"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-bold">Disponible</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: TAKE ORDER DIRECTLY FROM WAITER TERMINAL */}
      {activeTab === 'new_order' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Menu selection (2 cols) */}
          <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Sélectionner les Plats</h2>
              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchDish}
                  onChange={e => setSearchDish(e.target.value)}
                  placeholder="Rechercher un plat..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {menuItems
                .filter(m => m.name.toLowerCase().includes(searchDish.toLowerCase()))
                .map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleQuickAddDish(item)}
                    className="p-3 rounded-2xl border border-gray-200 hover:border-emerald-500 cursor-pointer flex gap-3 items-center bg-gray-50/50 hover:bg-white transition-all"
                  >
                    <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-gray-900 truncate">{item.name}</h4>
                      <p className="text-xs font-extrabold text-emerald-700 mt-0.5">{formatFCFA(item.price)}</p>
                    </div>
                    <button className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Cart & Table Selector (1 col) */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-900">Table & Commande</h2>

              <div>
                <label className="text-xs font-bold text-gray-700">Assigner à la Table</label>
                <select
                  value={selectedTableForOrder}
                  onChange={e => setSelectedTableForOrder(e.target.value)}
                  className="w-full mt-1.5 p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold"
                >
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({areas.find(a => a.id === t.areaId)?.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items in waiter cart */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {waiterCart.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Aucun article sélectionné.</p>
                ) : (
                  waiterCart.map((ci, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-xl">
                      <span className="font-medium truncate flex-1">{ci.quantity} × {ci.item.name}</span>
                      <span className="font-bold text-emerald-700 mx-2">{formatFCFA(ci.item.price * ci.quantity)}</span>
                      <button onClick={() => handleRemoveDish(idx)} className="text-gray-400 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex justify-between text-xs font-black">
                <span>Total :</span>
                <span className="text-emerald-800 text-sm">
                  {formatFCFA(waiterCart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0))}
                </span>
              </div>

              <button
                disabled={waiterCart.length === 0}
                onClick={handleSubmitWaiterOrder}
                className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all ${
                  waiterCart.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                Envoyer la commande en Cuisine
              </button>
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
          initialType="receipt"
        />
      )}

    </div>
  );
};
