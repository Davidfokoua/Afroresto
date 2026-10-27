import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Clock, 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  Star, 
  Sparkles, 
  Flame, 
  ChevronRight, 
  Check, 
  Phone, 
  Store, 
  SlidersHorizontal, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Compass,
  Bike,
  PackageCheck,
  Eye,
  UtensilsCrossed,
  Layers,
  Info,
  DollarSign
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useLanguage } from '../../context/LanguageContext';
import { MenuItem, Restaurant, OrderType, PaymentMethod, DeliveryInfo } from '../../types';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { 
  calculateDistanceKm, 
  formatDistance, 
  estimateDeliveryTime, 
  calculateDeliveryFee, 
  POPULAR_LOCATION_PRESETS, 
  DEFAULT_CUSTOMER_LOCATION, 
  LocationPreset,
  getBrowserLocation,
  Coordinates
} from '../../utils/geolocation';
import { formatFCFA } from '../../utils/formatters';

interface CartItem {
  item: MenuItem;
  restaurant: Restaurant;
  quantity: number;
  notes?: string;
}

export const OnlineFoodHub: React.FC = () => {
  const { 
    restaurants, 
    allMenuItems, 
    createOrder, 
    setActiveCustomerOrderId, 
    setCurrentView,
    currentRestaurant
  } = useRestaurant();
  const { t } = useLanguage();

  // Active customer location (default to Bastos, Yaoundé or detect via GPS)
  const [customerLocation, setCustomerLocation] = useState<LocationPreset>(DEFAULT_CUSTOMER_LOCATION);
  const [customAddressText, setCustomAddressText] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Fulfillment mode: Delivery vs Takeaway
  const [fulfillmentType, setFulfillmentType] = useState<OrderType>('delivery');

  // Exploration view: 'dishes' (browse all online menus) vs 'restaurants' (browse spots by proximity)
  const [browseView, setBrowseView] = useState<'dishes' | 'restaurants'>('dishes');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisineCategory, setSelectedCuisineCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'proximity' | 'rating' | 'speed' | 'price'>('proximity');
  const [maxDistanceFilter, setMaxDistanceFilter] = useState<number | 'all'>('all');

  // Cart & Checkout
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Selected dish detail modal
  const [detailDish, setDetailDish] = useState<{ item: MenuItem; restaurant: Restaurant } | null>(null);
  const [detailDishNotes, setDetailDishNotes] = useState('');
  const [detailDishQty, setDetailDishQty] = useState(1);

  // Selected restaurant view modal (inspect full menu of one restaurant)
  const [inspectRestaurant, setInspectRestaurant] = useState<Restaurant | null>(null);

  // Customer Checkout Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryStreet, setDeliveryStreet] = useState('');
  const [deliveryBuilding, setDeliveryBuilding] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('orange_money');
  // Client configurable delivery budget (300 to 1 500 FCFA within same city)
  const [clientDeliveryBudget, setClientDeliveryBudget] = useState<number>(800);

  // Success Confirmation State
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  // Direct Firestore real-time synchronization for multi-restaurant hub
  const [directRestaurants, setDirectRestaurants] = useState<Restaurant[]>([]);
  const [directMenuItems, setDirectMenuItems] = useState<MenuItem[]>([]);
  const [isLoadingHub, setIsLoadingHub] = useState<boolean>(true);

  useEffect(() => {
    let unsubR = () => {};
    let unsubM = () => {};

    try {
      unsubR = onSnapshot(collection(db, 'restaurants'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Restaurant));
        if (list.length > 0) {
          setDirectRestaurants(list);
        }
      }, err => console.warn('OnlineFoodHub restaurants sync error:', err));

      unsubM = onSnapshot(collection(db, 'menu_items'), snap => {
        const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as MenuItem));
        if (list.length > 0) {
          setDirectMenuItems(list);
        }
        setIsLoadingHub(false);
      }, err => console.warn('OnlineFoodHub menu items sync error:', err));
    } catch (e) {
      console.warn('OnlineFoodHub listener setup notice:', e);
      setIsLoadingHub(false);
    }

    const timer = setTimeout(() => setIsLoadingHub(false), 3000);

    return () => {
      unsubR();
      unsubM();
      clearTimeout(timer);
    };
  }, []);

  // Effective lists merging direct snapshots with context
  const effectiveRestaurantsList = directRestaurants.length > 0 ? directRestaurants : restaurants;
  const effectiveMenuItemsList = directMenuItems.length > 0 ? directMenuItems : allMenuItems;

  // Only consider active restaurants (exclude expired or suspended)
  const activeRestaurants = useMemo(() => {
    const list = effectiveRestaurantsList.filter(r => r.subscriptionStatus !== 'expired' && r.subscriptionStatus !== 'suspended');
    return list.length > 0 ? list : effectiveRestaurantsList;
  }, [effectiveRestaurantsList]);

  // Compute distance for each restaurant relative to customer location
  const restaurantsWithDistance = useMemo(() => {
    return activeRestaurants.map(r => {
      const restLat = r.latitude || 3.8824;
      const restLng = r.longitude || 11.5165;
      const distKm = calculateDistanceKm(
        customerLocation.coordinates.latitude,
        customerLocation.coordinates.longitude,
        restLat,
        restLng
      );
      const deliveryEst = estimateDeliveryTime(distKm, r.deliveryMinMinutes || 20);
      const deliveryFeeObj = calculateDeliveryFee(distKm, 0, r.freeDeliveryThreshold || 15000);

      return {
        ...r,
        distanceKm: distKm,
        deliveryEst,
        deliveryFeeObj,
      };
    });
  }, [activeRestaurants, customerLocation]);

  // Map for fast restaurant lookup
  const restaurantMap = useMemo(() => {
    const map = new Map<string, typeof restaurantsWithDistance[0]>();
    restaurantsWithDistance.forEach(r => map.set(r.id, r));
    return map;
  }, [restaurantsWithDistance]);

  // Enriched menu items with their host restaurant and distance
  const enrichedDishes = useMemo(() => {
    return effectiveMenuItemsList
      .filter(item => item.available !== false)
      .map(item => {
        const rest = 
          restaurantMap.get(item.restaurantId) || 
          restaurantsWithDistance.find(r => r.id === item.restaurantId || item.restaurantId?.startsWith(r.id) || r.id?.startsWith(item.restaurantId)) ||
          restaurantsWithDistance[0];
        return {
          ...item,
          restaurant: rest,
          distanceKm: rest ? (rest.distanceKm ?? 1.5) : 1.5,
        };
      })
      .filter(item => Boolean(item.restaurant));
  }, [effectiveMenuItemsList, restaurantMap, restaurantsWithDistance]);

  // Filter & Sort Dishes (Default = PROXIMITY PRIORITY)
  const filteredDishes = useMemo(() => {
    let list = [...enrichedDishes];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(d => 
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.restaurant.name.toLowerCase().includes(q) ||
        (d.badge && d.badge.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCuisineCategory !== 'all') {
      const cat = selectedCuisineCategory.toLowerCase();
      list = list.filter(d => {
        const dishText = `${d.name} ${d.description} ${d.badge || ''}`.toLowerCase();
        if (cat === 'braises') return dishText.includes('brais') || dishText.includes('grill') || dishText.includes('poisson') || dishText.includes('suya');
        if (cat === 'plats') return dishText.includes('ndol') || dishText.includes('riz') || dishText.includes('poulet') || dishText.includes('garba') || dishText.includes('koki');
        if (cat === 'burgers') return dishText.includes('burger') || dishText.includes('frite') || dishText.includes('sandwich');
        if (cat === 'pizzas') return dishText.includes('pizza') || dishText.includes('pasta') || dishText.includes('lasagne');
        if (cat === 'boissons') return dishText.includes('jus') || dishText.includes('smoothie') || dishText.includes('bière') || dishText.includes('eau') || dishText.includes('boisson');
        if (cat === 'desserts') return dishText.includes('crêpe') || dishText.includes('dessert') || dishText.includes('fruit') || dishText.includes('glace');
        return true;
      });
    }

    // Distance filter
    if (typeof maxDistanceFilter === 'number') {
      list = list.filter(d => d.distanceKm <= maxDistanceFilter);
    }

    // Sort priority
    if (sortBy === 'proximity') {
      list.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.restaurant.rating || 4.5) - (a.restaurant.rating || 4.5));
    } else if (sortBy === 'speed') {
      list.sort((a, b) => a.restaurant.deliveryEst.minMinutes - b.restaurant.deliveryEst.minMinutes);
    } else if (sortBy === 'price') {
      list.sort((a, b) => a.price - b.price);
    }

    return list;
  }, [enrichedDishes, searchQuery, selectedCuisineCategory, maxDistanceFilter, sortBy]);

  // Filter & Sort Restaurants (Default = PROXIMITY PRIORITY)
  const filteredRestaurants = useMemo(() => {
    let list = [...restaurantsWithDistance];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r => 
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.cuisineTypes?.some(c => c.toLowerCase().includes(q))
      );
    }

    if (typeof maxDistanceFilter === 'number') {
      list = list.filter(r => r.distanceKm <= maxDistanceFilter);
    }

    if (sortBy === 'proximity') {
      list.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    } else if (sortBy === 'speed') {
      list.sort((a, b) => a.deliveryEst.minMinutes - b.deliveryEst.minMinutes);
    }

    return list;
  }, [restaurantsWithDistance, searchQuery, maxDistanceFilter, sortBy]);

  // Current Cart totals and restaurant
  const cartRestaurant = useMemo(() => {
    if (cart.length === 0) return null;
    return cart[0].restaurant;
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  }, [cart]);

  const cartDeliveryFee = useMemo(() => {
    if (fulfillmentType === 'takeaway') return 0;
    // Client can set delivery budget between 300 FCFA and 1 500 FCFA within same city
    const budget = Number(clientDeliveryBudget) || 800;
    return Math.min(1500, Math.max(300, budget));
  }, [fulfillmentType, clientDeliveryBudget]);

  // Platform cuts 20%, driver gets 80%
  const platformDeliveryCommission = Math.round(cartDeliveryFee * 0.20);
  const driverNetDeliveryRemuneration = Math.round(cartDeliveryFee * 0.80);

  const cartTotalAmount = cartSubtotal + cartDeliveryFee;
  const cartItemsCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  // Cart operations
  const handleAddToCart = (item: MenuItem, restaurant: Restaurant, quantity: number = 1, notes?: string) => {
    if (cart.length > 0 && cart[0].restaurant.id !== restaurant.id) {
      if (!window.confirm(`Votre panier contient déjà des plats de "${cart[0].restaurant.name}". Souhaitez-vous le remplacer par des plats de "${restaurant.name}" ?`)) {
        return;
      }
      setCart([{ item, restaurant, quantity, notes }]);
      return;
    }

    setCart(prev => {
      const existingIdx = prev.findIndex(ci => ci.item.id === item.id && ci.notes === notes);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      }
      return [...prev, { item, restaurant, quantity, notes }];
    });
  };

  const handleUpdateCartQty = (index: number, delta: number) => {
    setCart(prev => {
      const next = [...prev];
      next[index].quantity += delta;
      if (next[index].quantity <= 0) {
        return next.filter((_, i) => i !== index);
      }
      return next;
    });
  };

  // GPS Geolocation Handler
  const handleRequestGps = async () => {
    try {
      setIsLocatingGps(true);
      setGpsError(null);
      const coords = await getBrowserLocation();
      if (!coords) {
        setGpsError('Position GPS inaccessible. Choisissez un quartier ci-dessous.');
        return;
      }

      // Find closest predefined preset or create custom
      let closestPreset = POPULAR_LOCATION_PRESETS[0];
      let minD = 99999;
      for (const preset of POPULAR_LOCATION_PRESETS) {
        const d = calculateDistanceKm(coords.latitude, coords.longitude, preset.coordinates.latitude, preset.coordinates.longitude);
        if (d < minD) {
          minD = d;
          closestPreset = preset;
        }
      }

      setCustomerLocation({
        id: 'gps_detected',
        name: `Ma Position Actuelle (GPS ± ${formatDistance(minD)})`,
        neighborhood: closestPreset.neighborhood,
        city: closestPreset.city,
        country: closestPreset.country,
        coordinates: coords
      });
      setIsLocationModalOpen(false);
    } catch (e) {
      setGpsError('Erreur de géolocalisation.');
    } finally {
      setIsLocatingGps(false);
    }
  };

  // Submit Online Remote Order
  const handleConfirmOrder = async () => {
    if (cart.length === 0 || !cartRestaurant || isSubmittingOrder) return;
    if (!customerPhone.trim()) {
      alert('Veuillez renseigner votre numéro de téléphone pour le suivi de votre commande.');
      return;
    }

    try {
      setIsSubmittingOrder(true);

      const deliveryInfo: DeliveryInfo = {
        address: `${deliveryStreet.trim() || customerLocation.name}${deliveryBuilding ? `, ${deliveryBuilding.trim()}` : ''}`,
        city: customerLocation.city,
        neighborhood: customerLocation.neighborhood,
        deliveryFee: cartDeliveryFee,
        notes: deliveryNotes.trim() || undefined
      };

      const newOrder = await createOrder({
        restaurantId: cartRestaurant.id,
        tableId: fulfillmentType === 'delivery' ? 'online_delivery' : 'online_takeaway',
        orderType: fulfillmentType,
        deliveryInfo: fulfillmentType === 'delivery' ? deliveryInfo : undefined,
        paymentMethod,
        customerName: customerName.trim() || 'Client en Ligne',
        customerPhone: customerPhone.trim(),
        notes: deliveryNotes.trim() || undefined,
        items: cart.map(ci => ({
          menuItemId: ci.item.id,
          name: ci.item.name,
          price: ci.item.price,
          quantity: ci.quantity,
          notes: ci.notes
        }))
      });

      setCart([]);
      setIsCheckoutModalOpen(false);
      setIsCartOpen(false);
      setPlacedOrderId(newOrder.id);
      setActiveCustomerOrderId(newOrder.id);
    } catch (err) {
      console.error('Erreur lors de la validation de la commande en ligne:', err);
      alert('Une erreur est survenue lors de l\'envoi de votre commande. Veuillez réessayer.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 md:bg-slate-100 flex justify-center antialiased pb-24 md:pb-12">
      <div className="w-full max-w-5xl bg-white min-h-screen sm:min-h-[94vh] sm:my-3 sm:rounded-3xl shadow-2xl flex flex-col relative sm:border sm:border-slate-200/90 overflow-hidden">
        
        {/* ========================================================= */}
        {/* TOP HERO & LOCATION HEADER (MEITUAN STYLE)                 */}
        {/* ========================================================= */}
        <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-4 sm:p-5 sticky top-0 z-30 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            
            {/* Delivery address & GPS locator */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-2xl border border-white/15 transition-all text-left group cursor-pointer max-w-full"
                title="Modifier mon adresse de livraison"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <MapPin className="w-4 h-4 fill-slate-950" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    <span>{fulfillmentType === 'delivery' ? 'Livrer à' : 'À emporter près de'}</span>
                    <span className="text-white/60">▼</span>
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm text-white truncate max-w-[200px] sm:max-w-[280px]">
                    {customerLocation.name}
                  </div>
                </div>
              </button>
            </div>

            {/* Delivery vs Takeaway Switcher */}
            <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/15 self-start sm:self-auto">
              <button
                onClick={() => setFulfillmentType('delivery')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  fulfillmentType === 'delivery'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Livraison</span>
              </button>
              <button
                onClick={() => setFulfillmentType('takeaway')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  fulfillmentType === 'takeaway'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>À Emporter</span>
              </button>
            </div>

            {/* Floating Cart Pill (Desktop) */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Panier ({cartItemsCount})</span>
              {cartItemsCount > 0 && (
                <span className="bg-emerald-700/80 px-2 py-0.5 rounded-lg text-[11px]">
                  {formatFCFA(cartTotalAmount)}
                </span>
              )}
            </button>
          </div>

          {/* Quick search input */}
          <div className="mt-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un plat (poulet braisé, burger, ndolé, pizza, jus...) ou un restaurant..."
              className="w-full bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm pl-10 pr-10 py-2.5 rounded-2xl border border-white/20 focus:border-amber-500 focus:outline-hidden transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* ========================================================= */}
        {/* PROXIMITY PRIORITY BANNER & MEITUAN NOTICE                */}
        {/* ========================================================= */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="font-black text-slate-900">Hub Repas en Ligne (Meituan)</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-700 font-medium hidden sm:inline">
              Menus de tous les restaurants triés par <strong className="text-amber-800">priorité de proximité</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-xl">
            <Navigation className="w-3 h-3 text-amber-600 rotate-45" />
            <span>Rayon actif : {customerLocation.neighborhood}</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* EXPLORATION SUB-BAR: VIEW TOGGLE & PROXIMITY SORT         */}
        {/* ========================================================= */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            
            {/* View Selector: Dishes vs Restaurants */}
            <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setBrowseView('dishes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  browseView === 'dishes'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Tous les Menus ({filteredDishes.length})</span>
              </button>
              <button
                onClick={() => setBrowseView('restaurants')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  browseView === 'restaurants'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Restaurants ({filteredRestaurants.length})</span>
              </button>
            </div>

            {/* Sorting criteria (PROXIMITY PRIORITY IS HIGHLIGHTED) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0">Trier par :</span>
              <button
                onClick={() => setSortBy('proximity')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-black text-xs transition-all shrink-0 cursor-pointer ${
                  sortBy === 'proximity'
                    ? 'bg-amber-500 text-slate-950 shadow-sm border border-amber-600/30'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Navigation className="w-3 h-3 rotate-45 text-slate-950" />
                <span>⚡ Le plus proche (Priorité)</span>
              </button>
              <button
                onClick={() => setSortBy('rating')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 cursor-pointer ${
                  sortBy === 'rating'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>Mieux notés</span>
              </button>
              <button
                onClick={() => setSortBy('speed')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 cursor-pointer ${
                  sortBy === 'speed'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Livraison rapide</span>
              </button>
            </div>
          </div>

          {/* Cuisine Categories Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label: 'Toutes les envies', icon: '🍽️' },
              { id: 'braises', label: 'Grillades & Braises', icon: '🔥' },
              { id: 'plats', label: 'Plats Authentiques', icon: '🍲' },
              { id: 'burgers', label: 'Burgers & Suya Express', icon: '🍔' },
              { id: 'pizzas', label: 'Pizzas au Feu de Bois', icon: '🍕' },
              { id: 'boissons', label: 'Jus Frais & Smoothies', icon: '🍹' },
              { id: 'desserts', label: 'Desserts & Crêpes', icon: '🍰' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCuisineCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCuisineCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN BODY: DISHES OR RESTAURANTS VIEW                     */}
        {/* ========================================================= */}
        <main className="flex-1 p-3 sm:p-5 overflow-y-auto">
          {browseView === 'dishes' ? (
            /* ----------------------------------------------------- */
            /* VIEW 1: DISHES ACROSS ALL MENUS WITH PROXIMITY BADGE  */
            /* ----------------------------------------------------- */
            <div>
              {isLoadingHub && enrichedDishes.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                    <Bike className="w-8 h-8 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Hub Repas en Ligne</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Chargement des menus et spécialités de tous les restaurants partenaires...
                    </p>
                  </div>
                </div>
              ) : filteredDishes.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <UtensilsCrossed className="w-8 h-8" />
                  </div>
                  <h3 className="font-black text-slate-900 text-base">Aucun plat ne correspond à vos critères</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Essayez de réinitialiser la recherche ou de changer de catégorie pour voir les menus d'autres restaurants.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCuisineCategory('all'); }}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {filteredDishes.map(dish => (
                    <div 
                      key={dish.id}
                      onClick={() => {
                        setDetailDish({ item: dish, restaurant: dish.restaurant });
                        setDetailDishNotes('');
                        setDetailDishQty(1);
                      }}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-soft-sm hover:shadow-md hover:border-amber-400/80 transition-all overflow-hidden flex flex-col group cursor-pointer"
                    >
                      {/* Image header with proximity & badge */}
                      <div className="relative h-44 bg-slate-100 overflow-hidden">
                        <img 
                          src={dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'} 
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />

                        {/* Distance Badge (PROXIMITY PRIORITY) */}
                        <div className="absolute top-2.5 left-2.5 bg-slate-950/85 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1 border border-white/10">
                          <Navigation className="w-3 h-3 text-amber-400 rotate-45 shrink-0" />
                          <span>{formatDistance(dish.distanceKm)}</span>
                        </div>

                        {/* Estimated delivery time */}
                        <div className="absolute top-2.5 right-2.5 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{dish.restaurant.deliveryEst.label}</span>
                        </div>

                        {/* Badge if available */}
                        {dish.badge && (
                          <div className="absolute bottom-2.5 left-2.5 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                            {dish.badge}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          {/* Restaurant source attribution */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectRestaurant(dish.restaurant);
                            }}
                            className="text-[11px] font-extrabold text-amber-700 hover:text-amber-800 flex items-center gap-1 text-left truncate group/rest cursor-pointer"
                          >
                            <Store className="w-3 h-3 shrink-0" />
                            <span className="truncate">{dish.restaurant.name}</span>
                            <span className="text-slate-400 font-normal">({dish.restaurant.city})</span>
                          </button>

                          <h4 className="font-black text-sm text-slate-900 leading-snug line-clamp-1 group-hover:text-amber-700 transition-colors">
                            {dish.name}
                          </h4>

                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {dish.description}
                          </p>
                        </div>

                        {/* Price & Add to Cart Action */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-base font-black text-slate-950">
                              {formatFCFA(dish.price)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailDish({ item: dish, restaurant: dish.restaurant });
                                setDetailDishNotes('');
                                setDetailDishQty(1);
                              }}
                              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Personnaliser ce plat"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(dish, dish.restaurant, 1);
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Commander</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ----------------------------------------------------- */
            /* VIEW 2: RESTAURANTS RANKED BY PROXIMITY               */
            /* ----------------------------------------------------- */
            <div className="space-y-4">
              {filteredRestaurants.map(rest => (
                <div 
                  key={rest.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-soft-sm hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row group"
                >
                  {/* Restaurant Cover Photo with distance overlay */}
                  <div className="relative md:w-72 h-44 md:h-auto bg-slate-900 shrink-0 overflow-hidden">
                    <img 
                      src={rest.coverImage} 
                      alt={rest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent md:hidden" />

                    {/* Proximity badge */}
                    <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-xl shadow-md flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 rotate-45 text-slate-950" />
                      <span>{formatDistance(rest.distanceKm)} de vous</span>
                    </div>

                    {/* Rating badge */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-slate-900 text-xs font-black px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{rest.rating || 4.8} ({rest.reviewsCount || 120})</span>
                    </div>
                  </div>

                  {/* Restaurant details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black text-base sm:text-lg text-slate-900 leading-snug">
                            {rest.name}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{rest.address}, {rest.neighborhood || rest.city}</span>
                          </p>
                        </div>

                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase rounded-lg border border-emerald-200 shrink-0">
                          Ouvert
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {rest.description}
                      </p>

                      {/* Delivery perks badges */}
                      <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>~{rest.deliveryEst.label}</span>
                        </span>

                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold">
                          <Bike className="w-3.5 h-3.5 text-slate-500" />
                          <span>Livraison : {rest.deliveryFeeObj.label}</span>
                        </span>

                        {rest.cuisineTypes?.map(ct => (
                          <span key={ct} className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200/60">
                            {ct}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom action: open full menu */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {allMenuItems.filter(i => i.restaurantId === rest.id && i.available).length} plats au menu
                      </span>

                      <button
                        onClick={() => setInspectRestaurant(rest)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Voir le Menu</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ========================================================= */}
        {/* MOBILE STICKY BOTTOM CART BAR                             */}
        {/* ========================================================= */}
        {cartItemsCount > 0 && (
          <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 z-40 shadow-2xl flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-slate-500 font-medium">
                {cartItemsCount} article{cartItemsCount > 1 ? 's' : ''} chez {cartRestaurant?.name}
              </div>
              <div className="text-base font-black text-slate-950">
                {formatFCFA(cartTotalAmount)}
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-md active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Voir le Panier</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* LOCATION SELECTOR MODAL                                   */}
        {/* ========================================================= */}
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-base text-slate-900">
                    Votre Adresse de Livraison
                  </h3>
                </div>
                <button 
                  onClick={() => setIsLocationModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Les restaurants et menus s'affichent par ordre de proximité pour vous garantir la livraison la plus rapide.
              </p>

              {/* GPS button */}
              <button
                onClick={handleRequestGps}
                disabled={isLocatingGps}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Navigation className={`w-4 h-4 rotate-45 ${isLocatingGps ? 'animate-spin' : ''}`} />
                <span>{isLocatingGps ? 'Détection GPS en cours...' : 'Utiliser ma position GPS actuelle'}</span>
              </button>

              {gpsError && (
                <div className="p-2.5 bg-rose-50 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{gpsError}</span>
                </div>
              )}

              {/* Popular Neighborhood Presets */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Ou choisir un quartier de livraison :
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {POPULAR_LOCATION_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setCustomerLocation(preset);
                        setIsLocationModalOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-2xl text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                        customerLocation.id === preset.id
                          ? 'bg-amber-50 border border-amber-300 text-amber-950 font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{preset.name}</div>
                        <div className="text-[10px] text-slate-500">{preset.city}, {preset.country}</div>
                      </div>
                      {customerLocation.id === preset.id && (
                        <Check className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* DISH CUSTOMIZATION MODAL                                  */}
        {/* ========================================================= */}
        {detailDish && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
              {/* Image banner */}
              <div className="relative h-48 bg-slate-100 shrink-0">
                <img 
                  src={detailDish.item.image} 
                  alt={detailDish.item.name} 
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setDetailDish(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                <div>
                  <div className="text-xs font-bold text-amber-700 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" />
                    <span>{detailDish.restaurant.name} • {formatDistance(detailDish.restaurant.distanceKm ?? 1.5)}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    {detailDish.item.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {detailDish.item.description}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Temps estimé de préparation :</span>
                  <span className="font-black text-slate-900">~{detailDish.item.preparationTime} minutes</span>
                </div>

                {/* Preparation notes / allergies */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instructions particulières pour le chef (facultatif) :
                  </label>
                  <input
                    type="text"
                    value={detailDishNotes}
                    onChange={(e) => setDetailDishNotes(e.target.value)}
                    placeholder="Ex: Sans oignons, piment à part, bien cuit..."
                    className="w-full p-2.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-bold text-slate-700">Quantité :</span>
                  <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setDetailDishQty(q => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold shadow-xs cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-black text-xs min-w-[20px] text-center">{detailDishQty}</span>
                    <button
                      onClick={() => setDetailDishQty(q => q + 1)}
                      className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold shadow-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500">Total</div>
                  <div className="text-base font-black text-slate-900">
                    {formatFCFA(detailDish.item.price * detailDishQty)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleAddToCart(detailDish.item, detailDish.restaurant, detailDishQty, detailDishNotes.trim() || undefined);
                    setDetailDish(null);
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  Ajouter au Panier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* RESTAURANT COMPLETE DIGITAL MENU MODAL                    */}
        {/* ========================================================= */}
        {inspectRestaurant && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95">
              
              {/* Header */}
              <div className="relative h-36 bg-slate-900 shrink-0">
                <img 
                  src={inspectRestaurant.coverImage} 
                  alt={inspectRestaurant.name}
                  className="w-full h-full object-cover opacity-80" 
                />
                <button
                  onClick={() => setInspectRestaurant(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="text-base sm:text-lg font-black truncate">{inspectRestaurant.name}</h3>
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{inspectRestaurant.address} • {formatDistance(inspectRestaurant.distanceKm ?? 1.5)}</span>
                  </p>
                </div>
              </div>

              {/* Menu list */}
              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                <div className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Menu Complet ({allMenuItems.filter(i => i.restaurantId === inspectRestaurant.id && i.available).length} plats)
                </div>

                <div className="divide-y divide-slate-100">
                  {allMenuItems
                    .filter(item => item.restaurantId === inspectRestaurant.id && item.available)
                    .map(dish => (
                      <div key={dish.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={dish.image} 
                            alt={dish.name}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100" 
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate">{dish.name}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{dish.description}</p>
                            <span className="font-black text-xs text-amber-800">{formatFCFA(dish.price)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddToCart(dish, inspectRestaurant, 1)}
                          className="px-3 py-1.5 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
                        >
                          + Ajouter
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setInspectRestaurant(null)}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CART DRAWER / MODAL                                       */}
        {/* ========================================================= */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
              
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-sm">Votre Panier en Ligne</h3>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Votre panier est vide</h4>
                  <p className="text-xs text-slate-500">Sélectionnez les plats qui vous font envie pour commander.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Restaurant info */}
                  {cartRestaurant && (
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-amber-950">{cartRestaurant.name}</div>
                        <div className="text-[10px] text-amber-700">Distance : {formatDistance(cartRestaurant.distanceKm ?? 1.5)}</div>
                      </div>
                      <span className="font-black text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-lg text-[10px]">
                        {fulfillmentType === 'delivery' ? 'Livraison' : 'À emporter'}
                      </span>
                    </div>
                  )}

                  {/* Cart items */}
                  <div className="divide-y divide-slate-100">
                    {cart.map((ci, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-xs text-slate-900 truncate">{ci.item.name}</h5>
                          {ci.notes && (
                            <p className="text-[10px] text-amber-700 italic truncate">Note: {ci.notes}</p>
                          )}
                          <span className="text-xs font-black text-slate-700">{formatFCFA(ci.item.price * ci.quantity)}</span>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                          <button
                            onClick={() => handleUpdateCartQty(idx, -1)}
                            className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-bold text-xs min-w-[16px] text-center">{ci.quantity}</span>
                          <button
                            onClick={() => handleUpdateCartQty(idx, 1)}
                            className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing summary */}
                  <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Sous-total plats</span>
                      <span>{formatFCFA(cartSubtotal)}</span>
                    </div>

                    {fulfillmentType === 'delivery' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Commission livraison ({formatDistance(cartRestaurant?.distanceKm || 1)})</span>
                          <span className="font-bold text-slate-900">
                            {formatFCFA(cartDeliveryFee)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Nette livreur (80%) : {formatFCFA(driverNetDeliveryRemuneration)}</span>
                          <span>Plateforme (20%) : {formatFCFA(platformDeliveryCommission)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-950 font-black text-sm pt-2 border-t border-slate-100">
                      <span>Total à payer</span>
                      <span>{formatFCFA(cartTotalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {cart.length > 0 && (
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutModalOpen(true);
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Passer la commande ({formatFCFA(cartTotalAmount)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CHECKOUT MODAL: CUSTOMER & ADDRESS DETAILS                */}
        {/* ========================================================= */}
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
              
              <div className="p-4 bg-slate-950 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm">Validation de votre Commande</h3>
                  <p className="text-[10px] text-slate-400">
                    Restaurant : {cartRestaurant?.name} ({formatDistance(cartRestaurant?.distanceKm || 1)})
                  </p>
                </div>
                <button 
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
                
                {/* Contact information */}
                <div className="space-y-3">
                  <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-600" />
                    <span>Vos Coordonnées</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nom complet *
                      </label>
                      <input 
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ex: Clarisse M."
                        className="w-full p-2.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Numéro de téléphone (WhatsApp/Mobile Money) *
                      </label>
                      <input 
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Ex: +237 6 99 12 34 56"
                        className="w-full p-2.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery details if fulfillment is delivery */}
                {fulfillmentType === 'delivery' && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>Adresse de Livraison (Domicile ou Bureau)</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Quartier & Ville :
                      </label>
                      <div className="p-2.5 bg-amber-50/80 rounded-xl text-xs font-bold text-amber-900 border border-amber-200/80 flex items-center justify-between">
                        <span>{customerLocation.name} ({customerLocation.city})</span>
                        <button
                          type="button"
                          onClick={() => setIsLocationModalOpen(true)}
                          className="text-[10px] text-amber-700 underline font-extrabold cursor-pointer"
                        >
                          Changer
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Rue, Bâtiment, Entreprise ou Nom de la villa *
                      </label>
                      <input 
                        type="text"
                        value={deliveryStreet}
                        onChange={(e) => setDeliveryStreet(e.target.value)}
                        placeholder="Ex: Rue des Palmiers, Immeuble Horizon 3e étage, Porte 12"
                        className="w-full p-2.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Repère pour le livreur :
                      </label>
                      <input 
                        type="text"
                        value={deliveryBuilding}
                        onChange={(e) => setDeliveryBuilding(e.target.value)}
                        placeholder="Ex: Face pharmacie du Rond-Point, portail noir"
                        className="w-full p-2.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Note pour la livraison :
                      </label>
                      <input 
                        type="text"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Ex: Appeler à la barrière, sonner à l'interphone"
                        className="w-full p-2.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
                      />
                    </div>

                    {/* Delivery Budget & Courier Commission Customization (300 to 1 500 FCFA) */}
                    <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl border border-amber-200/90 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                            <Bike className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 block">Votre Budget Livraison</span>
                            <span className="text-[10px] text-slate-500">Fixez la commission du coursier (300 à 1 500 FCFA)</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-xs">
                          {formatFCFA(cartDeliveryFee)}
                        </span>
                      </div>

                      {/* Quick Choice Buttons */}
                      <div className="grid grid-cols-5 gap-1 pt-0.5">
                        {[
                          { label: '300 F', sub: 'Éco', val: 300 },
                          { label: '500 F', sub: 'Standard', val: 500 },
                          { label: '800 F', sub: 'Conseillé', val: 800 },
                          { label: '1 000 F', sub: 'Rapide', val: 1000 },
                          { label: '1 500 F', sub: 'Prioritaire', val: 1500 },
                        ].map(t => (
                          <button
                            key={t.val}
                            type="button"
                            onClick={() => setClientDeliveryBudget(t.val)}
                            className={`p-1.5 rounded-xl text-center border transition-all cursor-pointer ${
                              cartDeliveryFee === t.val
                                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs font-black'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200 font-bold'
                            }`}
                          >
                            <span className="block text-[11px] leading-tight">{t.label}</span>
                            <span className="block text-[8px] opacity-80">{t.sub}</span>
                          </button>
                        ))}
                      </div>

                      {/* Slider for smooth adjustment */}
                      <div className="space-y-1">
                        <input
                          type="range"
                          min={300}
                          max={1500}
                          step={50}
                          value={cartDeliveryFee}
                          onChange={(e) => setClientDeliveryBudget(Number(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] font-bold text-slate-500">
                          <span>Min: 300 FCFA</span>
                          <span>Conseillé: 800 FCFA</span>
                          <span>Max: 1 500 FCFA</span>
                        </div>
                      </div>

                      {/* 20% platform / 80% driver commission breakdown */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/60 text-xs">
                        <div className="p-2 rounded-xl bg-white/90 border border-slate-200 text-slate-800 space-y-0.5">
                          <span className="text-[10px] text-slate-500 block font-semibold">Commission Plateforme (20%)</span>
                          <span className="font-extrabold text-slate-900 block">{formatFCFA(platformDeliveryCommission)}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-0.5">
                          <span className="text-[10px] text-emerald-700 block font-bold">Rémunération Nette Livreur (80%)</span>
                          <span className="font-black text-emerald-700 block">{formatFCFA(driverNetDeliveryRemuneration)}</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-600 italic">
                        💡 Une commission plus élevée motive immédiatement les livreurs de proximité à accepter votre commande en priorité.
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment method */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                    Mode de Paiement
                  </label>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('orange_money')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        paymentMethod === 'orange_money'
                          ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Orange Money</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mtn_momo')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        paymentMethod === 'mtn_momo'
                          ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <span>MTN MoMo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        paymentMethod === 'cash'
                          ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Espèces à réception</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        paymentMethod === 'card'
                          ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>💳 Carte Bancaire</span>
                    </button>
                  </div>
                </div>

                {/* Final cost recap */}
                <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <div className="text-slate-400 text-[10px]">Total de la commande</div>
                    <div className="text-base font-black text-amber-400">{formatFCFA(cartTotalAmount)}</div>
                  </div>
                  <div className="text-right text-[10px] text-slate-300">
                    <div>{cartItemsCount} article{cartItemsCount > 1 ? 's' : ''}</div>
                    <div>{fulfillmentType === 'delivery' ? 'Livraison directe' : 'À emporter'}</div>
                  </div>
                </div>
              </div>

              {/* Action button */}
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <button
                  onClick={handleConfirmOrder}
                  disabled={isSubmittingOrder}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmittingOrder ? 'Transmission au restaurant...' : `Confirmer et Commander (${formatFCFA(cartTotalAmount)})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ORDER SUCCESS POPUP WITH INSTANT TRACKER REDIRECT         */}
        {/* ========================================================= */}
        {placedOrderId && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">Commande Transmise !</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Le restaurant a immédiatement reçu votre commande. La cuisine la prépare pour vous.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-500">Numéro de commande : </span>
                <span className="font-black text-slate-900">{placedOrderId}</span>
              </div>

              <button
                onClick={() => {
                  setPlacedOrderId(null);
                  setCurrentView('customer_qr');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Suivre la Préparation en Direct ⚡
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
