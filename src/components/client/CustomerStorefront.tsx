import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem, Restaurant, RestaurantTable, MenuCategory } from '../../types';
import { db } from '../../lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  Clock, 
  Flame, 
  ArrowRight, 
  MapPin, 
  AlertCircle, 
  Sparkles, 
  Utensils, 
  Smartphone,
  Phone,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Bell,
  BellRing,
  Store,
  Lock
} from 'lucide-react';
import { RestoCamLogo } from '../common/RestoCamLogo';
import { parseQrUrlParams } from '../../utils/qrUrl';
import { formatFCFA } from '../../utils/formatters';
import { safeStorage } from '../../utils/safeStorage';
import { useLanguage, LanguageSwitcher } from '../../context/LanguageContext';
import { INITIAL_RESTAURANTS, INITIAL_MENU_ITEMS, INITIAL_TABLES, INITIAL_CATEGORIES } from '../../data/mockData';

interface CartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80';
const DEFAULT_LOGO = '/logo.svg';
const DEFAULT_FOOD_IMG = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

export const CustomerStorefront: React.FC = () => {
  const { 
    currentRestaurant, 
    restaurants, 
    categories, 
    menuItems, 
    tables, 
    areas,
    orders,
    activeCustomerTableId,
    setActiveCustomerTableId,
    activeCustomerOrderId,
    setActiveCustomerOrderId,
    createOrder,
    sendWaiterCall,
    setCurrentView,
    switchRestaurant,
    goBack,
    canGoBack,
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthMessage,
    isSubscriptionActive
  } = useRestaurant();

  const { t, language } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedDishModal, setSelectedDishModal] = useState<MenuItem | null>(null);
  const [dishNotes, setDishNotes] = useState('');
  const [dishQty, setDishQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessNotice, setOrderSuccessNotice] = useState(false);

  // Optional customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderGeneralNotes, setOrderGeneralNotes] = useState('');

  // Direct local states for resilient near-instant menu rendering on mobile scan
  const [directRestaurant, setDirectRestaurant] = useState<Restaurant | null>(null);
  const [directCategories, setDirectCategories] = useState<MenuCategory[]>([]);
  const [directMenuItems, setDirectMenuItems] = useState<MenuItem[]>([]);
  const [directTable, setDirectTable] = useState<RestaurantTable | null>(null);
  const [isStorefrontLoading, setIsStorefrontLoading] = useState<boolean>(true);
  const [isRetryingFetch, setIsRetryingFetch] = useState(false);
  const [waiterCallStatus, setWaiterCallStatus] = useState<'idle' | 'calling' | 'called'>('idle');

  // Active direct Firestore recovery for the scanned restaurant and menu
  const performDirectFetch = useCallback(async () => {
    const urlParams = parseQrUrlParams();
    let targetRestId = urlParams.restaurantId;
    const targetTableId = urlParams.tableId;
    setIsRetryingFetch(true);

    try {
      // 1. If table ID is present, fetch table doc directly
      if (targetTableId) {
        try {
          const tSnap = await getDoc(doc(db, 'tables', targetTableId));
          if (tSnap.exists()) {
            const tData = { ...tSnap.data(), id: tSnap.id } as RestaurantTable;
            setDirectTable(tData);
            if (!targetRestId && tData.restaurantId) {
              targetRestId = tData.restaurantId;
            }
          }
        } catch (err) {
          console.warn('Direct table doc check notice:', err);
        }
      }

      // If restaurantId is still missing, extract from tableId if possible
      if (!targetRestId && targetTableId && targetTableId.startsWith('tbl_rest_')) {
        const extracted = targetTableId.replace(/^tbl_/, '').replace(/_[^_]+$/, '');
        if (extracted.startsWith('rest_')) {
          targetRestId = extracted;
        }
      }

      // 2. Fetch Restaurant doc
      if (targetRestId) {
        try {
          const snap = await getDoc(doc(db, 'restaurants', targetRestId));
          if (snap.exists()) {
            const rData = { ...snap.data(), id: snap.id } as Restaurant;
            setDirectRestaurant(rData);
            switchRestaurant(rData.id);
          } else {
            // Also search by slug or query restaurants collection
            const colSnap = await getDocs(collection(db, 'restaurants'));
            if (!colSnap.empty) {
              const list = colSnap.docs.map(d => ({ ...d.data(), id: d.id } as Restaurant));
              const matched = list.find(r => 
                r.id === targetRestId ||
                r.slug === targetRestId ||
                r.id.startsWith(targetRestId!) ||
                targetRestId!.startsWith(r.id) ||
                (r.name && r.name.toLowerCase().includes(targetRestId!.toLowerCase()))
              ) || list[0];
              if (matched) {
                setDirectRestaurant(matched);
                switchRestaurant(matched.id);
                targetRestId = matched.id;
              }
            }
          }
        } catch (err) {
          console.warn('Restaurant fetch notice:', err);
        }
      } else {
        // Fallback: check all restaurants
        const colSnap = await getDocs(collection(db, 'restaurants'));
        if (!colSnap.empty) {
          const first = { ...colSnap.docs[0].data(), id: colSnap.docs[0].id } as Restaurant;
          setDirectRestaurant(first);
          switchRestaurant(first.id);
          targetRestId = first.id;
        }
      }

      // 3. Fetch Menu Items directly for this restaurant
      if (targetRestId) {
        try {
          const itemsQuery = query(collection(db, 'menu_items'), where('restaurantId', '==', targetRestId));
          const itemsSnap = await getDocs(itemsQuery);
          if (!itemsSnap.empty) {
            const itemsList = itemsSnap.docs.map(d => ({ ...d.data(), id: d.id } as MenuItem));
            setDirectMenuItems(itemsList);
          } else {
            // Fallback: search all items in collection matching restaurantId
            const allItemsSnap = await getDocs(collection(db, 'menu_items'));
            const matchedItems = allItemsSnap.docs
              .map(d => ({ ...d.data(), id: d.id } as MenuItem))
              .filter(i => i.restaurantId === targetRestId || (targetRestId && (targetRestId.startsWith(i.restaurantId) || i.restaurantId?.startsWith(targetRestId))));
            if (matchedItems.length > 0) {
              setDirectMenuItems(matchedItems);
            }
          }
        } catch (err) {
          console.warn('Menu items fetch notice:', err);
        }

        // 4. Fetch Categories directly for this restaurant
        try {
          const catsQuery = query(collection(db, 'categories'), where('restaurantId', '==', targetRestId));
          const catsSnap = await getDocs(catsQuery);
          if (!catsSnap.empty) {
            const catsList = catsSnap.docs.map(d => ({ ...d.data(), id: d.id } as MenuCategory));
            setDirectCategories(catsList);
          } else {
            const allCatsSnap = await getDocs(collection(db, 'categories'));
            const matchedCats = allCatsSnap.docs
              .map(d => ({ ...d.data(), id: d.id } as MenuCategory))
              .filter(c => c.restaurantId === targetRestId || (targetRestId && (targetRestId.startsWith(c.restaurantId) || c.restaurantId?.startsWith(targetRestId))));
            if (matchedCats.length > 0) {
              setDirectCategories(matchedCats);
            }
          }
        } catch (err) {
          console.warn('Categories fetch notice:', err);
        }
      }
    } catch (err) {
      console.warn('CustomerStorefront direct fetch retry notice:', err);
    } finally {
      setIsRetryingFetch(false);
      setIsStorefrontLoading(false);
    }
  }, [switchRestaurant]);

  useEffect(() => {
    const urlParams = parseQrUrlParams();
    if (urlParams.restaurantId && currentRestaurant?.id !== urlParams.restaurantId) {
      switchRestaurant(urlParams.restaurantId);
    }
    if (urlParams.tableId && activeCustomerTableId !== urlParams.tableId) {
      setActiveCustomerTableId(urlParams.tableId);
    }

    performDirectFetch();

    // Safety timeout: stop spinner after 4 seconds even if slow network
    const timer = setTimeout(() => {
      setIsStorefrontLoading(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [currentRestaurant?.id, activeCustomerTableId, performDirectFetch, switchRestaurant, setActiveCustomerTableId]);

  // Has valid restaurant loaded or fallback
  const effectiveRestaurant: Restaurant = directRestaurant || 
    ((currentRestaurant && currentRestaurant.id && currentRestaurant.id.trim() !== '') ? currentRestaurant : null) ||
    (restaurants.length > 0 ? restaurants[0] : null) ||
    INITIAL_RESTAURANTS[0] || {
      id: parseQrUrlParams().restaurantId || 'rest_authentic',
      name: 'Authentic traste',
      slug: 'authentic-traste',
      currency: 'FCFA',
      subscriptionStatus: 'trial',
      country: "Cameroun",
      city: "Yaoundé",
      region: "Centre",
      address: "Rue 2023",
      phone: "+8619824332664",
      logo: "/logo.svg",
      coverImage: DEFAULT_COVER,
      ownerName: "DAVID FOKOUA",
      ownerEmail: "davidfokoua143@gmail.com",
      minOrderAmount: 1000,
      deliveryMinMinutes: 20,
      deliveryMaxMinutes: 40,
      deliveryFeeBase: 1000,
      freeDeliveryThreshold: 15000,
      restaurantType: 'Restaurant & Grillades',
      description: 'Bienvenue dans notre restaurant.',
      rating: 5.0,
      reviewsCount: 0,
      cuisineTypes: [],
      isOpenNow: true,
      subscriptionPlan: 'starter',
      subscriptionStartedAt: new Date().toISOString(),
      subscriptionExpiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      autoRenew: true,
      createdAt: new Date().toISOString(),
      soundAlertsEnabled: true,
      autoAcceptOrders: false
    };

  // Safe table identification
  const effectiveTables = tables.length > 0 ? tables : (directTable ? [directTable] : INITIAL_TABLES);
  const matchedTable = directTable || effectiveTables.find(t => t.id === activeCustomerTableId) || effectiveTables[0];
  const currentTable = matchedTable || {
    id: activeCustomerTableId || `tbl_${effectiveRestaurant.id}_1`,
    name: 'Table 01',
    capacity: 4,
    areaId: areas[0]?.id || 'area_terrasse',
    restaurantId: effectiveRestaurant.id,
    status: 'occupied' as const,
    qrCodeUrl: '',
  };
  const currentArea = areas.find(a => a.id === currentTable.areaId);

  const handleCallWaiterFromMenu = async () => {
    try {
      setWaiterCallStatus('calling');
      await sendWaiterCall(
        currentTable.id, 
        currentTable.name, 
        `Demande d'assistance au menu digital (${currentTable.name})`
      );
      setWaiterCallStatus('called');
      setTimeout(() => setWaiterCallStatus('idle'), 8000);
    } catch (e) {
      console.warn('Call waiter error:', e);
      setWaiterCallStatus('idle');
    }
  };

  // Active in-progress order at this table (so customer never loses tracker)
  const savedOrderId = safeStorage.getItem('restocam_active_customer_order_id');
  const currentTableActiveOrder = 
    orders.find(o => o.tableId === currentTable.id && !['completed', 'cancelled'].includes(o.status)) ||
    orders.find(o => o.id === savedOrderId && !['completed', 'cancelled'].includes(o.status));

  // Filtered menu items with bulletproof direct priority
  const effectiveMenuItems = directMenuItems.length > 0 
    ? directMenuItems 
    : (menuItems.length > 0 ? menuItems : INITIAL_MENU_ITEMS);

  const effectiveCategories = directCategories.length > 0 
    ? directCategories 
    : (categories.length > 0 ? categories : INITIAL_CATEGORIES);

  const filteredItems = effectiveMenuItems.filter(item => {
    if (!item) return false;
    const itemName = (item.name || '').toLowerCase();
    const itemDesc = (item.description || '').toLowerCase();
    const q = (searchQuery || '').toLowerCase().trim();
    
    const matchesCat = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = !q || itemName.includes(q) || itemDesc.includes(q);
    return matchesCat && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, ci) => sum + (ci.item?.price || 0) * ci.quantity, 0);
  const cartItemCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  const handleOpenDishModal = (item: MenuItem) => {
    setSelectedDishModal(item);
    setDishNotes('');
    setDishQty(1);
  };

  const handleAddToCartFromModal = () => {
    if (!selectedDishModal) return;
    
    setCart(prev => {
      const existingIdx = prev.findIndex(ci => ci.item.id === selectedDishModal.id && ci.notes === dishNotes);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += dishQty;
        return next;
      } else {
        return [...prev, { item: selectedDishModal, quantity: dishQty, notes: dishNotes }];
      }
    });

    setSelectedDishModal(null);
  };

  const handleQuickAdd = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    setCart(prev => {
      const existingIdx = prev.findIndex(ci => ci.item.id === item.id && ci.notes === '');
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        return next;
      } else {
        return [...prev, { item, quantity: 1, notes: '' }];
      }
    });
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setCart(prev => {
      const next = [...prev];
      next[index].quantity += delta;
      if (next[index].quantity <= 0) {
        return next.filter((_, i) => i !== index);
      }
      return next;
    });
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const urlParams = parseQrUrlParams();
      const targetRestId = 
        currentRestaurant?.id || 
        currentTable.restaurantId || 
        matchedTable?.restaurantId || 
        urlParams.restaurantId;

      const newOrder = await createOrder({
        restaurantId: targetRestId,
        tableId: currentTable.id,
        items: cart.map(ci => ({
          menuItemId: ci.item.id,
          name: ci.item.name,
          price: ci.item.price,
          quantity: ci.quantity,
          notes: ci.notes || undefined,
        })),
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        notes: orderGeneralNotes.trim() || undefined,
      });

      setCart([]);
      setIsCartOpen(false);
      setOrderSuccessNotice(true);
      
      if (newOrder && newOrder.id) {
        setActiveCustomerOrderId(newOrder.id);
      }
    } catch (err) {
      console.error('Failed to submit order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading Screen while resolving QR code restaurant and menu
  if (isStorefrontLoading && effectiveMenuItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 md:bg-slate-100 flex justify-center items-center p-4 antialiased">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center space-y-4 border border-slate-200 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <Utensils className="w-8 h-8 animate-pulse text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              {effectiveRestaurant?.name || 'Menu Digital Restaurant'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Chargement de la carte et des spécialités...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-50 py-2 px-4 rounded-xl">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>Connexion sécurisée en direct</span>
          </div>
        </div>
      </div>
    );
  }

  // DIRECT SERVICE SUSPENSION GUARD FOR CUSTOMER DIGITAL MENU:
  // If the restaurant's subscription has expired or is suspended, orders and menu are suspended
  if (!isSubscriptionActive(effectiveRestaurant)) {
    return (
      <div className="min-h-screen bg-slate-900 md:bg-slate-100 flex justify-center antialiased">
        <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[92vh] sm:my-4 sm:rounded-3xl shadow-2xl flex flex-col relative sm:border sm:border-slate-200/80 overflow-hidden">
          
          {/* Top header with restaurant and language */}
          <div className="bg-slate-950 text-white px-4 py-3 text-xs flex items-center justify-between sticky top-0 z-30 border-b border-slate-800 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src={effectiveRestaurant.logo || '/logo.svg'} 
                alt={effectiveRestaurant.name} 
                className="w-7 h-7 rounded-lg object-cover bg-white p-0.5 border border-slate-700 shrink-0" 
              />
              <div className="min-w-0">
                <h1 className="font-extrabold text-xs text-white truncate leading-tight">
                  {effectiveRestaurant.name}
                </h1>
                <p className="text-[10px] text-slate-400 truncate">
                  {effectiveRestaurant.city}, {effectiveRestaurant.country}
                </p>
              </div>
            </div>
            <LanguageSwitcher variant="customer" />
          </div>

          {/* Suspended message body */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
              <Store className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-xs">
              <span className="px-3 py-1 bg-rose-100 text-rose-800 text-[10px] font-black uppercase rounded-full tracking-wider">
                {t('subscriptionSuspendedBadge')}
              </span>
              <h2 className="text-lg font-black text-slate-900">
                {t('customerSuspendedTitle')}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('customerSuspendedMessage')}
              </p>
            </div>

            {/* Restaurant contact info */}
            <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2.5 justify-center font-bold text-slate-900">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>{effectiveRestaurant.phone || '+225 07 00 00 00 00'}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {effectiveRestaurant.address}, {effectiveRestaurant.city}
              </p>
            </div>

            {/* Action buttons */}
            <div className="w-full space-y-2 pt-2">
              {effectiveRestaurant.phone && (
                <a
                  href={`tel:${effectiveRestaurant.phone}`}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t('callRestaurant')}</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setAuthMessage("Connectez-vous pour régulariser l'abonnement de votre restaurant");
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('managerAccess')}</span>
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="p-3 bg-slate-100 border-t border-slate-200 text-center text-[10px] text-slate-500 font-medium">
            Propulsé par AFRORESTO — Plateforme Panafricaine
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 md:bg-slate-100 flex justify-center antialiased">
      {/* Container: Full-width on smartphone, elegant card on desktop */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[92vh] sm:my-4 sm:rounded-3xl shadow-2xl flex flex-col relative pb-28 sm:border sm:border-slate-200/80 overflow-hidden">
        
        {/* Top Customer Header Bar: Restaurant identity + table badge */}
        <div className="bg-slate-950 text-white px-3.5 py-2.5 text-xs flex items-center justify-between sticky top-0 z-30 border-b border-slate-800 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            {currentRestaurant.logo ? (
              <img 
                src={currentRestaurant.logo} 
                alt={currentRestaurant.name} 
                className="w-7 h-7 rounded-lg object-cover bg-white p-0.5 border border-slate-700 shrink-0" 
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                {currentRestaurant.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-extrabold text-xs text-white truncate leading-tight">
                {currentRestaurant.name}
              </h1>
              <p className="text-[10px] text-emerald-400 font-semibold truncate">
                {t('digitalMenuSub')}
              </p>
            </div>
          </div>

          {/* Secure read-only table badge & Bilingual Language Switcher */}
          <div className="flex items-center gap-1.5 shrink-0">
            <LanguageSwitcher variant="customer" />
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-xl shrink-0 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-amber-300 font-black text-xs uppercase tracking-wide">
                {currentTable.name}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Call Waiter Action Bar */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-3 py-2 flex items-center justify-between gap-2 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
              <BellRing className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-900 truncate">
                  {currentTable.name}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  • {currentArea?.name || 'Salle'}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 truncate">
                {waiterCallStatus === 'called' 
                  ? (language === 'fr' ? '✅ Le serveur a été averti !' : '✅ Waiter has been notified!') 
                  : t('waiterCallDescription')}
              </p>
            </div>
          </div>

          <button
            id="call-waiter-storefront-btn"
            onClick={handleCallWaiterFromMenu}
            disabled={waiterCallStatus === 'calling'}
            className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 ${
              waiterCallStatus === 'called'
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            <BellRing className={`w-3.5 h-3.5 ${waiterCallStatus === 'calling' ? 'animate-spin' : ''}`} />
            <span>
              {waiterCallStatus === 'calling' ? t('callWaiterSending') : waiterCallStatus === 'called' ? t('waiterCalledSuccess') : t('callWaiter')}
            </span>
          </button>
        </div>

        {/* Waiter called confirmation banner */}
        {waiterCallStatus === 'called' && (
          <div className="bg-emerald-600 text-white px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 shadow-md animate-in slide-in-from-top duration-200 border-b border-emerald-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0"></span>
              <span>
                {language === 'fr' 
                  ? `🔔 Votre serveur a bien été notifié par un carillon sonore et arrive à la ${currentTable.name} !` 
                  : `🔔 Your waiter has been notified with a sound chime and is arriving at ${currentTable.name}!`}
              </span>
            </div>
          </div>
        )}

        {/* Real-time active order banner so customer can track status with 1 click */}
        {currentTableActiveOrder && (
          <div className="bg-gradient-to-r from-emerald-700 to-slate-900 text-white px-3 py-2.5 text-xs font-bold flex items-center justify-between shadow-md sticky top-[37px] z-20 border-b border-emerald-500/40">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <div className="truncate">
                <span className="font-black text-emerald-300">{currentTableActiveOrder.orderNumber}</span> • {
                  currentTableActiveOrder.status === 'new' ? 'Reçue par le restaurant' :
                  currentTableActiveOrder.status === 'accepted' ? 'Confirmée' :
                  currentTableActiveOrder.status === 'preparing' ? 'En cuisson au feu de bois' :
                  currentTableActiveOrder.status === 'ready' ? 'Plats prêts !' :
                  currentTableActiveOrder.status === 'in_service' ? 'En cours de service' :
                  currentTableActiveOrder.status === 'served' ? 'Servie à table' : 'En cours'
                }
              </div>
            </div>
            <button
              id="goto-order-tracker-btn"
              onClick={() => {
                setActiveCustomerOrderId(currentTableActiveOrder.id);
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 transition-all shadow-xs"
            >
              {t('trackLive')}
            </button>
          </div>
        )}

        {/* Restaurant Header Banner with Cover and Logo */}
        <div className="relative h-44 bg-slate-900 overflow-hidden shrink-0">
          <img 
            src={currentRestaurant.coverImage || DEFAULT_COVER} 
            alt={currentRestaurant.name || 'Restaurant'}
            className="w-full h-full object-cover opacity-65" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent"></div>

          {/* Restaurant identity */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3 text-white">
            <img 
              src={currentRestaurant.logo || DEFAULT_LOGO} 
              alt={currentRestaurant.name || 'Logo'}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md shrink-0 bg-white" 
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-white truncate">{currentRestaurant.name}</h1>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{currentArea?.name || 'Salle principale'} — {currentTable.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Suspended Alert Banner */}
        {currentRestaurant.subscriptionStatus === 'suspended' && (
          <div className="m-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {language === 'fr' ? 'Établissement Temporairement Hors Service' : 'Establishment Temporarily Out of Service'}
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                {language === 'fr' 
                  ? 'Ce restaurant est temporairement indisponible pour les commandes directes. Veuillez vous adresser au personnel.'
                  : 'This restaurant is temporarily unavailable for direct orders. Please contact floor staff.'}
              </p>
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="p-3 pb-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Horizontal Navigation Pills */}
        <div className="px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('allDishes')} ({effectiveMenuItems.length})
          </button>
          {effectiveCategories.map(cat => {
            const count = effectiveMenuItems.filter(i => i.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1 rounded-full ${selectedCategory === cat.id ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Menu Items List */}
        <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <p className="font-extrabold text-slate-800 text-sm">
                  {effectiveMenuItems.length === 0 ? 'Carte en cours de préparation' : 'Aucun plat dans cette sélection'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
                  {effectiveMenuItems.length === 0 
                    ? `Bienvenue chez ${effectiveRestaurant.name}. Notre carte numérique est en cours d'actualisation. Veuillez vous renseigner auprès du personnel.`
                    : 'Modifiez votre recherche ou sélectionnez une autre catégorie pour explorer le reste du menu.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-emerald-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
                  >
                    Afficher tous les plats ({effectiveMenuItems.length})
                  </button>
                )}

                <button
                  onClick={() => performDirectFetch()}
                  disabled={isRetryingFetch}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRetryingFetch ? 'animate-spin' : ''}`} />
                  <span>{isRetryingFetch ? 'Actualisation...' : 'Rafraîchir le menu'}</span>
                </button>
              </div>

              {effectiveRestaurant.phone && (
                <div className="pt-2">
                  <a
                    href={`tel:${effectiveRestaurant.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Appeler l'établissement ({effectiveRestaurant.phone})</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleOpenDishModal(item)}
                className={`p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer flex gap-3 ${
                  !item.available ? 'opacity-60 bg-slate-50' : ''
                }`}
              >
                {/* Food Image */}
                <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                  <img 
                    src={item.image || DEFAULT_FOOD_IMG} 
                    alt={item.name || 'Plat'} 
                    className="w-full h-full object-cover" 
                  />
                  {item.badge && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[9px] rounded shadow-xs">
                      {item.badge}
                    </span>
                  )}
                  {!item.available && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold text-center p-1">
                      Épuisé
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 leading-snug line-clamp-1">{item.name}</h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{item.description || 'Préparé avec soin par le chef.'}</p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
                    <span className="text-xs font-black text-emerald-700">
                      {formatFCFA(item.price)}
                    </span>

                    {item.available && (
                      <button
                        onClick={e => handleQuickAdd(e, item)}
                        className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition-transform active:scale-90"
                        title="Ajouter rapidement au panier"
                        aria-label={`Ajouter ${item.name}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Pan-African Gastronomy Footer Note */}
          <div className="pt-6 pb-12 text-center flex flex-col items-center justify-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white p-0.5 border border-slate-200 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                <RestoCamLogo size={18} />
              </div>
              <span className="text-[11px] font-extrabold text-slate-700 tracking-tight">
                Propulsé par <strong className="text-slate-900">AFRO<span className="text-amber-500">RESTO</span></strong>
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Excellence de la Gastronomie Africaine & Menu QR interactif</p>
          </div>
        </div>

        {/* Floating Cart Bottom Bar */}
        {cartItemCount > 0 && (
          <div className="fixed bottom-3 inset-x-0 max-w-md mx-auto px-3 z-40">
            <button
              id="customer-view-cart-btn"
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between font-extrabold text-xs transition-all transform active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white text-emerald-800 text-xs font-black flex items-center justify-center shadow-xs">
                  {cartItemCount}
                </div>
                <span>Voir mon panier</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black">{formatFCFA(cartTotal)}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Dish Detail Modal */}
        {selectedDishModal && (
          <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5 max-h-[90vh] flex flex-col">
              
              {/* Modal Image */}
              <div className="relative h-48 bg-slate-900 shrink-0">
                <img 
                  src={selectedDishModal.image || DEFAULT_FOOD_IMG} 
                  alt={selectedDishModal.name} 
                  className="w-full h-full object-cover" 
                />
                <button
                  onClick={() => setSelectedDishModal(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-extrabold text-slate-900 leading-snug">{selectedDishModal.name}</h2>
                    <span className="text-base font-black text-emerald-700 shrink-0">{formatFCFA(selectedDishModal.price)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {selectedDishModal.description || 'Préparé avec soin par le chef de cuisine.'}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      ~{selectedDishModal.preparationTime || 15} min de préparation
                    </span>
                    {selectedDishModal.isSpicy && (
                      <span className="flex items-center gap-1 text-rose-600 font-bold">
                        <Flame className="w-3.5 h-3.5" /> Épicé
                      </span>
                    )}
                  </div>
                </div>

                {/* Special instructions */}
                <div>
                  <label className="text-xs font-bold text-slate-800">Instructions pour la cuisine (facultatif)</label>
                  <textarea
                    value={dishNotes}
                    onChange={e => setDishNotes(e.target.value)}
                    placeholder="Ex: Sans piment, sauce à part, bien cuit..."
                    rows={2}
                    className="w-full mt-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  ></textarea>
                </div>

                {/* Quantity selector & Add Button */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <button
                      onClick={() => setDishQty(Math.max(1, dishQty - 1))}
                      className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold shadow-2xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-900">{dishQty}</span>
                    <button
                      onClick={() => setDishQty(dishQty + 1)}
                      className="w-8 h-8 rounded-lg bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCartFromModal}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    <span>Ajouter au panier</span>
                    <span>• {formatFCFA(selectedDishModal.price * dishQty)}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Cart Drawer Modal */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-5">
              
              {/* Cart Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-black text-sm text-slate-900">Votre Commande en Salle</h3>
                  <p className="text-[11px] text-emerald-700 font-bold">{currentArea?.name || 'Salle'} — {currentTable.name}</p>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="p-4 flex-1 overflow-y-auto space-y-3 divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Votre panier est vide.
                  </div>
                ) : (
                  cart.map((ci, idx) => (
                    <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between text-xs gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900">{ci.item.name}</p>
                        {ci.notes && <p className="text-[11px] text-amber-700 italic">"{ci.notes}"</p>}
                        <p className="text-emerald-700 font-black mt-0.5">{formatFCFA(ci.item.price * ci.quantity)}</p>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
                        <button 
                          onClick={() => handleUpdateQty(idx, -1)} 
                          className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 shadow-2xs font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-slate-900">{ci.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQty(idx, 1)} 
                          className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 shadow-2xs font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Optional Contact & Submit */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Votre Nom (facultatif)</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Ex: David"
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Téléphone (facultatif)</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="6XX XX XX XX"
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600">Note générale pour la commande (facultatif)</label>
                  <input
                    type="text"
                    value={orderGeneralNotes}
                    onChange={e => setOrderGeneralNotes(e.target.value)}
                    placeholder="Ex: Servir les boissons en premier..."
                    className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-600 font-bold">{t('totalToPayOnSite')}</span>
                  <span className="text-base font-black text-emerald-800">{formatFCFA(cartTotal)}</span>
                </div>

                <button
                  id="customer-submit-order-btn"
                  onClick={handleSubmitOrder}
                  disabled={cart.length === 0 || isSubmitting || currentRestaurant.subscriptionStatus === 'suspended'}
                  className={`w-full py-3.5 text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${
                    cart.length === 0 || isSubmitting || currentRestaurant.subscriptionStatus === 'suspended'
                      ? 'bg-slate-400 cursor-not-allowed opacity-70'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  {isSubmitting 
                    ? t('sendingToKitchen') 
                    : currentRestaurant.subscriptionStatus === 'suspended' 
                      ? t('ordersUnavailable') 
                      : t('confirmAndSendOrder')}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Discover other restaurants in Food Hub (Meituan) */}
        <div className="mx-4 mt-6 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
              🛵
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 leading-tight">Hub Repas en Ligne (Meituan)</div>
              <div className="text-[10px] text-slate-600 leading-tight">Commander en livraison à domicile ou au bureau</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('market')}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
          >
            Explorer
          </button>
        </div>

        {/* Discreet Customer Footer */}
        <div className="mt-6 mb-4 px-6 text-center space-y-1">
          <p className="text-[11px] text-slate-400 font-medium">
            {t('secureDigitalMenu')} • {currentRestaurant.name}
          </p>
          <button
            type="button"
            onClick={() => {
              setAuthMessage(language === 'fr' 
                ? 'Accès protégé: Cette section est strictement réservée au personnel et à la direction du restaurant. Veuillez vous identifier avec votre mot de passe ou code PIN.'
                : 'Secured access: This section is strictly reserved for restaurant staff and management. Please identify with your password or staff PIN code.');
              setIsAuthModalOpen(true);
            }}
            className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold inline-flex items-center gap-1 py-1 cursor-pointer transition-colors"
          >
            <Lock className="w-2.5 h-2.5 text-slate-400" />
            <span>{t('staffAndOwnerAccess')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
