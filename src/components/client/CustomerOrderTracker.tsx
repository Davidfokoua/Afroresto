import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Layers, 
  Utensils, 
  BellRing, 
  ArrowLeft, 
  Sparkles,
  MapPin,
  FileText,
  Volume2,
  Bike,
  Phone,
  MessageSquare,
  Navigation,
  Car,
  PackageCheck
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRestaurant } from '../../context/RestaurantContext';
import { useLanguage, LanguageSwitcher } from '../../context/LanguageContext';
import { formatFCFA, formatTime, getElapsedMinutes } from '../../utils/formatters';
import { Order, OrderStatus, DeliveryStatus } from '../../types';
import { soundFx } from '../../utils/audio';

export const CustomerOrderTracker: React.FC = () => {
  const { 
    orders, 
    allOrders,
    activeCustomerOrderId, 
    setActiveCustomerOrderId, 
    currentRestaurant,
    sendWaiterCall,
    activeCustomerTableId,
    tables,
    setCurrentView 
  } = useRestaurant();

  const { t, language } = useLanguage();

  const [callWaiterAlert, setCallWaiterAlert] = useState(false);
  const [liveOrder, setLiveOrder] = useState<Order | null>(null);
  const [arrivalChimeTriggered, setArrivalChimeTriggered] = useState(false);
  const prevStatusRef = useRef<OrderStatus | null>(null);
  const prevDeliveryStatusRef = useRef<DeliveryStatus | string | null>(null);

  // Real-time direct Firestore doc listener for active customer order
  useEffect(() => {
    if (!activeCustomerOrderId) return;

    try {
      const unsub = onSnapshot(doc(db, 'orders', activeCustomerOrderId), (snap) => {
        if (snap.exists()) {
          const orderData = { ...snap.data(), id: snap.id } as Order;
          setLiveOrder(orderData);

          // General status chime
          if (prevStatusRef.current && prevStatusRef.current !== orderData.status) {
            soundFx.playStatusUpdateChime();
          }
          prevStatusRef.current = orderData.status;

          // Delivery Arrival Bip Sonore Trigger
          if (
            orderData.orderType === 'delivery' &&
            orderData.deliveryStatus === 'arrived' &&
            prevDeliveryStatusRef.current !== 'arrived'
          ) {
            soundFx.playDeliveryArrivedChime();
            setArrivalChimeTriggered(true);
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([400, 150, 400, 150, 600]);
            }
          }
          prevDeliveryStatusRef.current = orderData.deliveryStatus || null;
        }
      }, err => console.warn('Customer tracker live doc notice:', err));

      return () => unsub();
    } catch (e) {
      console.warn('Customer tracker listener setup notice:', e);
    }
  }, [activeCustomerOrderId]);

  // Resolve current order securely
  const currentOrder = 
    liveOrder || 
    (activeCustomerOrderId ? orders.find(o => o.id === activeCustomerOrderId) : null) || 
    (activeCustomerOrderId ? allOrders.find(o => o.id === activeCustomerOrderId) : null) ||
    null;

  const isDelivery = currentOrder?.orderType === 'delivery';

  const handleCallWaiter = async () => {
    setCallWaiterAlert(true);
    const tableId = currentOrder?.tableId || activeCustomerTableId || (tables.length > 0 ? tables[0].id : 'tbl_01');
    const matchedTable = tables.find(t => t.id === tableId);
    const tableName = currentOrder?.tableName || matchedTable?.name || 'Table 01';

    await sendWaiterCall(
      tableId, 
      tableName, 
      language === 'fr' ? 'Appel d\'un serveur à table depuis le suivi de commande' : 'Waiter call requested from digital order tracker'
    );
    setTimeout(() => setCallWaiterAlert(false), 8000);
  };

  // Steps for Table Dining
  const tableSteps: { key: OrderStatus; label: string; icon: React.ElementType }[] = [
    { key: 'new', label: t('stepReceived'), icon: FileText },
    { key: 'accepted', label: t('stepConfirmed'), icon: CheckCircle2 },
    { key: 'preparing', label: t('stepCooking'), icon: ChefHat },
    { key: 'ready', label: t('stepReady'), icon: Sparkles },
    { key: 'in_service', label: t('stepInService'), icon: Layers },
    { key: 'served', label: t('stepServed'), icon: Utensils },
  ];

  const getTableStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 0;
      case 'accepted': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'in_service': return 4;
      case 'served':
      case 'completed': return 5;
      case 'cancelled': return -1;
    }
  };

  // Delivery Stages:
  // 0: Acceptée / Confirmée
  // 1: En cuisine
  // 2: En cours de livraison (Livreur assigné / récupéré)
  // 3: Arrivé au point de livraison (Bip sonore)
  // 4: Livrée
  const getDeliveryStepIndex = (order: Order) => {
    if (order.status === 'completed' || order.deliveryStatus === 'delivered') return 4;
    if (order.deliveryStatus === 'arrived') return 3;
    if (order.deliveryStatus === 'picked_up' || order.deliveryStatus === 'in_transit' || order.deliveryStatus === 'assigned') return 2;
    if (order.status === 'preparing' || order.status === 'ready') return 1;
    return 0; // new or accepted
  };

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl text-center space-y-4 border border-gray-200 animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-extrabold text-gray-900 text-sm">
            {language === 'fr' ? 'Chargement de votre commande...' : 'Loading your order...'}
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            {language === 'fr' ? 'Synchronisation en direct avec le restaurant.' : 'Live synchronization with restaurant.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActiveCustomerOrderId(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {language === 'fr' ? 'Retourner au menu' : 'Back to menu'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const elapsed = getElapsedMinutes(currentOrder.createdAt);

  // Delivery estimation calculations
  const estimatedMins = currentOrder.estimatedDeliveryMinutes || currentRestaurant.deliveryMaxMinutes || 35;
  const orderTimeMs = new Date(currentOrder.createdAt).getTime();
  const estimatedArrivalMs = orderTimeMs + estimatedMins * 60 * 1000;
  const remainingMinutes = Math.max(0, Math.round((estimatedArrivalMs - Date.now()) / (60 * 1000)));
  const estimatedArrivalTimeFormatted = new Date(estimatedArrivalMs).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const deliveryStepIdx = getDeliveryStepIndex(currentOrder);
  const currentTableStepIdx = getTableStepIndex(currentOrder.status);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-6 px-4">
      <div className="w-full max-w-md bg-white min-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between">
        
        {/* Top Header */}
        <div>
          <div className={`p-5 text-center relative text-white ${
            isDelivery 
              ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900' 
              : 'bg-gradient-to-r from-emerald-800 to-gray-900'
          }`}>
            <button
              id="tracker-back-dot-btn"
              onClick={() => setActiveCustomerOrderId(null)}
              className="absolute left-4 top-5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer active:scale-95"
              title={language === 'fr' ? 'Retourner à la carte' : 'Back to menu'}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Menu</span>
            </button>

            <div className="absolute right-4 top-5">
              <LanguageSwitcher variant="customer" />
            </div>

            <div className="w-12 h-12 rounded-2xl bg-white p-0.5 mx-auto mb-2 shadow-md">
              <img src={currentRestaurant.logo} alt={currentRestaurant.name} className="w-full h-full object-cover rounded-xl" />
            </div>

            <h1 className="text-sm font-extrabold text-white">{currentRestaurant.name}</h1>
            
            {isDelivery ? (
              <p className="text-[11px] text-amber-200 font-bold mt-0.5 flex items-center justify-center gap-1">
                <Bike className="w-3.5 h-3.5" />
                <span>Suivi de Livraison à Domicile / Bureau</span>
              </p>
            ) : (
              <p className="text-[11px] text-emerald-300 font-semibold mt-0.5 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" />
                {currentOrder ? `${currentOrder.areaName} — ${currentOrder.tableName}` : 'Table 01'}
              </p>
            )}
          </div>

          {/* Identity & ETA Card */}
          <div className={`p-5 border-b border-gray-100 ${isDelivery ? 'bg-amber-50/70' : 'bg-emerald-50/50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-700 tracking-wider">
                  {t('orderNumber')}
                </span>
                <h2 className="text-lg font-black text-gray-900">{currentOrder?.orderNumber || 'CMD-000125'}</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-700">{t('placedAt')}</span>
                <p className="text-xs font-bold text-gray-800">{formatTime(currentOrder.createdAt)}</p>
                <p className="text-[10px] text-slate-500 font-medium">Passée il y a {elapsed} min</p>
              </div>
            </div>

            {/* Estimated Delivery Time Banner for Delivery Orders */}
            {isDelivery && (
              <div className="mt-3 p-3.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl text-slate-950 shadow-md space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 fill-slate-950" />
                    <span className="text-xs font-black uppercase tracking-wider">Temps Estimatif de Livraison</span>
                  </div>
                  <span className="text-xs font-black bg-white/80 px-2 py-0.5 rounded-full">
                    {currentRestaurant.deliveryMinMinutes || 25} - {currentRestaurant.deliveryMaxMinutes || 35} min
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <p className="text-xs font-extrabold">
                    {deliveryStepIdx >= 4 
                      ? 'Commande livrée' 
                      : `Arrivée estimée : vers ${estimatedArrivalTimeFormatted}`}
                  </p>
                  {deliveryStepIdx < 4 && (
                    <span className="text-[11px] font-bold text-slate-900 bg-amber-300/80 px-2 py-0.5 rounded-lg">
                      ~{remainingMinutes} min restantes
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* DEDICATED DELIVERY TRACKING STEPPER */}
          {isDelivery ? (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Statut de Livraison en Direct
                </h3>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  GPS & Bip Sonore
                </span>
              </div>

              {/* Delivery Stepper */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                
                {/* 1. Acceptée */}
                <div className="relative flex items-center gap-3">
                  <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] transition-all ${
                    deliveryStepIdx >= 0 ? 'bg-amber-500 ring-4 ring-amber-100' : 'bg-gray-300'
                  }`}>
                    {deliveryStepIdx >= 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1'}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs ${deliveryStepIdx === 0 ? 'font-black text-amber-800 text-sm' : 'font-bold text-gray-800'}`}>
                      Commande Acceptée
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Le restaurant a validé votre commande et l'a transmise aux cuisines.
                    </p>
                  </div>
                </div>

                {/* 2. En Cuisine */}
                <div className="relative flex items-center gap-3">
                  <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] transition-all ${
                    deliveryStepIdx >= 1 ? 'bg-amber-500 ring-4 ring-amber-100 animate-pulse' : 'bg-gray-300'
                  }`}>
                    {deliveryStepIdx >= 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '2'}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs ${deliveryStepIdx === 1 ? 'font-black text-amber-800 text-sm' : deliveryStepIdx > 1 ? 'font-bold text-gray-800' : 'text-gray-400'}`}>
                      En Cuisine
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Le chef prépare vos plats chauds avec des ingrédients frais du jour.
                    </p>
                  </div>
                </div>

                {/* 3. En Cours de Livraison */}
                <div className="relative flex items-center gap-3">
                  <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] transition-all ${
                    deliveryStepIdx >= 2 ? 'bg-amber-500 ring-4 ring-amber-100 animate-pulse' : 'bg-gray-300'
                  }`}>
                    {deliveryStepIdx >= 3 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '3'}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs ${deliveryStepIdx === 2 ? 'font-black text-amber-800 text-sm' : deliveryStepIdx > 2 ? 'font-bold text-gray-800' : 'text-gray-400'}`}>
                      En Cours de Livraison
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {currentOrder.deliveryDriverName 
                        ? `Le coursier ${currentOrder.deliveryDriverName} roule vers votre adresse.` 
                        : 'Un coursier est en route pour récupérer le colis au restaurant.'}
                    </p>
                  </div>
                </div>

                {/* 4. Arrivé au Point de Livraison */}
                <div className="relative flex items-center gap-3">
                  <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] transition-all ${
                    deliveryStepIdx >= 3 ? 'bg-emerald-600 ring-4 ring-emerald-100 animate-bounce' : 'bg-gray-300'
                  }`}>
                    {deliveryStepIdx >= 4 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '4'}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs ${deliveryStepIdx === 3 ? 'font-black text-emerald-800 text-sm' : deliveryStepIdx > 3 ? 'font-bold text-gray-800' : 'text-gray-400'}`}>
                      Livreur au Point de Livraison (Bip Sonore)
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Le livreur est devant votre portail ou au point de repère convenu.
                    </p>
                  </div>
                </div>

                {/* 5. Livrée */}
                <div className="relative flex items-center gap-3">
                  <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] transition-all ${
                    deliveryStepIdx >= 4 ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs ${deliveryStepIdx === 4 ? 'font-black text-emerald-800 text-sm' : 'text-gray-400'}`}>
                      Commande Livrée
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Repas remis avec succès. Bonne dégustation !
                    </p>
                  </div>
                </div>

              </div>

              {/* SPECIAL ARRIVAL ALERT NOTIFICATION BANNER */}
              {currentOrder.deliveryStatus === 'arrived' && (
                <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-xl animate-bounce flex items-center gap-3.5 border-2 border-emerald-300">
                  <div className="p-2.5 rounded-xl bg-white/20 text-white shrink-0 animate-spin">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black">🔔 BIP SONORE : VOTRE LIVREUR EST LÀ !</h4>
                    <p className="text-xs text-white/95 mt-0.5">
                      Le coursier vous attend devant votre adresse. Veuillez le rejoindre pour récupérer votre commande.
                    </p>
                  </div>
                </div>
              )}

              {/* COURIER INFO CARD */}
              {currentOrder.deliveryDriverName && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center">
                        {currentOrder.deliveryDriverName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Votre Coursier Assigné</span>
                        <h4 className="text-sm font-black">{currentOrder.deliveryDriverName}</h4>
                        <p className="text-[11px] text-slate-300">
                          Matricule : <span className="font-mono text-amber-300 font-bold">{currentOrder.deliveryVehiclePlate || 'LT-842-AB'}</span>
                        </p>
                      </div>
                    </div>

                    {currentOrder.deliveryDriverPhone && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${currentOrder.deliveryDriverPhone}`}
                          className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold flex items-center gap-1 text-xs shadow-xs"
                          title="Appeler le livreur"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Appel</span>
                        </a>

                        <a
                          href={`https://wa.me/${currentOrder.deliveryDriverPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1 text-xs shadow-xs"
                          title="WhatsApp livreur"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DELIVERY ADDRESS DETAILS (Copied from buyer information) */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-gray-700 uppercase text-[10px]">
                  <Navigation className="w-3.5 h-3.5 text-amber-600" />
                  <span>Adresse de Livraison Fournie</span>
                </div>
                <p className="font-black text-gray-900">{currentOrder.deliveryInfo?.address || 'Adresse indiquée à la commande'}</p>
                {currentOrder.deliveryInfo?.notes && (
                  <p className="text-[11px] text-gray-600 italic">Repère : "{currentOrder.deliveryInfo.notes}"</p>
                )}
                <div className="flex justify-between text-[11px] text-gray-700 pt-1 border-t border-gray-200">
                  <span>Destinataire : <strong className="text-gray-900">{currentOrder.customerName}</strong></span>
                  <span>Tél : <strong className="text-gray-900">{currentOrder.customerPhone || 'Non renseigné'}</strong></span>
                </div>
              </div>

            </div>
          ) : (
            /* STANDARD TABLE DINE-IN STEPPER */
            <div className="p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                {t('realtimeStatus')}
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {tableSteps.map((step, idx) => {
                  const isPassed = idx <= currentTableStepIdx;
                  const isCurrent = idx === currentTableStepIdx;

                  return (
                    <div key={step.key} className="relative flex items-center gap-3">
                      <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] transition-all ${
                        isCurrent 
                          ? 'bg-emerald-600 ring-4 ring-emerald-100 animate-pulse' 
                          : isPassed 
                          ? 'bg-emerald-600' 
                          : 'bg-gray-300'
                      }`}>
                        {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                      </div>

                      <div className="flex-1">
                        <p className={`text-xs ${isCurrent ? 'font-black text-emerald-800 text-sm' : isPassed ? 'font-bold text-gray-800' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {idx === 0 && 'Votre commande a été transmise à notre équipe.'}
                            {idx === 1 && 'La commande est confirmée par le serveur.'}
                            {idx === 2 && 'Le chef prépare actuellement vos plats au feu de bois.'}
                            {idx === 3 && 'Les plats sont prêts et dressés.'}
                            {idx === 4 && 'Le serveur transporte vos plats vers votre table.'}
                            {idx === 5 && 'Bonne dégustation !'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items Summary */}
          {currentOrder && (
            <div className="px-5 pb-5">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                <h4 className="text-xs font-bold text-gray-800 border-b border-gray-200 pb-2">
                  {t('orderSummary')}
                </h4>
                {currentOrder.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-700">
                    <span>{it.quantity} × {it.name} {it.notes ? `(${it.notes})` : ''}</span>
                    <span className="font-bold">{formatFCFA(it.price * it.quantity)}</span>
                  </div>
                ))}
                {isDelivery && currentOrder.deliveryInfo?.deliveryFee !== undefined && (
                  <div className="flex justify-between text-xs text-amber-800 pt-1">
                    <span>Frais de livraison :</span>
                    <span className="font-bold">{formatFCFA(currentOrder.deliveryInfo.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black text-gray-900 pt-2 border-t border-gray-200">
                  <span>{t('total')} :</span>
                  <span className="text-emerald-800">{formatFCFA(currentOrder.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-5 bg-white border-t border-gray-100 space-y-2.5">
          {callWaiterAlert && (
            <div className="p-3.5 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-2xl text-xs font-bold text-center animate-in fade-in space-y-1.5 shadow-sm">
              <div className="flex items-center justify-center gap-2 text-emerald-800 font-extrabold text-sm">
                <BellRing className="w-4 h-4 text-emerald-600 animate-bounce" />
                <span>Serveur alerté avec succès !</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-normal leading-relaxed">
                Le carillon sonore et la notification sont parvenus au serveur en salle.
              </p>
            </div>
          )}

          {/* If delivery: test arrival chime button so customer knows what sound to listen for */}
          {isDelivery ? (
            <button
              onClick={() => soundFx.playDeliveryArrivedChime()}
              className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Volume2 className="w-4 h-4 text-amber-600" />
              <span>Tester le bip sonore d'arrivée du livreur</span>
            </button>
          ) : (
            <button
              onClick={handleCallWaiter}
              className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-95"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-600" />
              {t('callWaiter')}
            </button>
          )}

          <button
            onClick={() => setActiveCustomerOrderId(null)}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
          >
            {isDelivery ? 'Commander d\'autres plats' : t('orderMoreItems')}
          </button>
        </div>

      </div>
    </div>
  );
};
