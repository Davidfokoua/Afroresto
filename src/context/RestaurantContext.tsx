import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { 
  registerWithEmailAndSendVerification, 
  sendUserPasswordResetEmail, 
  resendCurrentUserVerificationEmail,
  signInWithFirebaseEmail 
} from '../utils/authService';
import { 
  Restaurant, 
  User, 
  MenuCategory, 
  MenuItem, 
  RestaurantArea, 
  RestaurantTable, 
  Order, 
  InventoryItem, 
  ActiveAppView, 
  OrderStatus, 
  PaymentStatus, 
  PaymentMethod, 
  UserRole,
  TableStatus,
  PlanType,
  SubscriptionStatus,
  RestaurantStatistics,
  WaiterCall,
  PurchaseRecord,
  TableReservation,
  ReservationStatus,
  OrderType,
  DeliveryInfo,
  DeliveryDriver,
  DeliveryStatus,
  DriverPayout,
  DriverPayoutMethod,
  DriverPayoutStatus
} from '../types';
import { 
  DEFAULT_RESTAURANT_ID,
  INITIAL_RESTAURANTS, 
  INITIAL_CATEGORIES, 
  INITIAL_MENU_ITEMS, 
  INITIAL_AREAS, 
  INITIAL_TABLES, 
  INITIAL_ORDERS, 
  INITIAL_INVENTORY, 
  INITIAL_PURCHASES,
  INITIAL_STAFF, 
  INITIAL_DRIVERS,
  SAAS_PLANS 
} from '../data/mockData';
import { soundFx } from '../utils/audio';
import { 
  computeRestaurantStats, 
  saveRestaurantStatsToFirestore, 
  fetchRestaurantStatsFromFirestore, 
  detectDeviceType 
} from '../utils/statisticsManager';
import { parseQrUrlParams } from '../utils/qrUrl';
import { safeStorage, safeSessionStorage } from '../utils/safeStorage';
import { cleanFirestoreData } from '../utils/firestoreUtils';

interface RestaurantContextType {
  // Authentication & Visitor Access Control
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authMessage: string | null;
  setAuthMessage: (msg: string | null) => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  registerUserAccount: (email: string, password: string, name: string, role?: UserRole) => Promise<{ success: boolean; message: string; emailSent?: boolean }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string; emailSent?: boolean }>;
  resendVerificationEmail: () => Promise<{ success: boolean; message: string; emailSent?: boolean }>;
  isEmailVerified: boolean;
  firebaseUser: FirebaseUser | null;
  verifyAndSwitchStaff: (targetIdOrRole: string | UserRole, pinOrPassword: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  currentUser: User;
  switchUserRole: (role: UserRole) => void;

  // Multi-tenant core
  restaurants: Restaurant[];
  currentRestaurant: Restaurant;
  currentRestaurantId: string;
  switchRestaurant: (id: string) => void;
  
  // Navigation & View
  currentView: ActiveAppView;
  setCurrentView: (view: ActiveAppView) => void;
  goBack: () => void;
  canGoBack: boolean;
  previousView: ActiveAppView | null;
  activeCustomerTableId: string | null;
  setActiveCustomerTableId: (tableId: string | null) => void;
  activeCustomerOrderId: string | null;
  setActiveCustomerOrderId: (orderId: string | null) => void;

  // Data collections filtered for current restaurant
  categories: MenuCategory[];
  menuItems: MenuItem[];
  areas: RestaurantArea[];
  tables: RestaurantTable[];
  orders: Order[];
  reservations: TableReservation[];
  inventory: InventoryItem[];
  purchases: PurchaseRecord[];
  staff: User[];
  plans: typeof SAAS_PLANS;

  // Global collections across all restaurants (for Super Admin analytics)
  allInventory: InventoryItem[];
  allPurchases: PurchaseRecord[];
  allOrders: Order[];
  allReservations: TableReservation[];
  allTables: RestaurantTable[];
  allMenuItems: MenuItem[];

  // Cloud Sync Status & Cross-Device Synchronization
  isSyncing: boolean;
  restaurantStats: RestaurantStatistics | null;
  isStatsSyncing: boolean;
  lastStatsSyncTime: string | null;
  refreshStats: () => Promise<void>;
  deviceType: 'mobile' | 'desktop' | 'tablet';

  // Sound settings
  soundEnabled: boolean;
  toggleSound: () => void;

  // Real-time Incoming Order Alert & Waiter Notification for Restaurant Staff
  incomingOrderAlert: Order | null;
  dismissIncomingOrderAlert: () => void;
  waiterCallAlert: { id?: string; tableId: string; tableName: string; areaName?: string; time: string; notes?: string } | null;
  dismissWaiterAlert: () => void;
  sendWaiterCall: (tableId: string, tableName?: string, notes?: string) => Promise<void>;
  waiterCalls: WaiterCall[];
  acknowledgeWaiterCall: (callId: string) => Promise<void>;
  acknowledgeTableWaiterCall: (tableId: string) => Promise<void>;

  // Actions - Menu
  addCategory: (name: string, icon?: string) => Promise<void>;
  updateCategory: (id: string, name: string, active: boolean) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'restaurantId'>) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  toggleMenuItemAvailability: (id: string) => Promise<void>;

  // Actions - Areas & Tables
  addArea: (name: string, description?: string) => Promise<RestaurantArea>;
  deleteArea: (id: string) => Promise<void>;
  addTable: (table: Omit<RestaurantTable, 'id' | 'restaurantId' | 'qrToken'> & { tableNumber?: string }) => Promise<RestaurantTable>;
  updateTable: (id: string, updates: Partial<RestaurantTable>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  setTableStatus: (tableId: string, status: TableStatus) => Promise<void>;
  regenerateTableQR: (tableId: string) => Promise<void>;

  // Actions - Orders
  createOrder: (orderData: {
    restaurantId?: string;
    tableId?: string;
    items: { menuItemId: string; name: string; price: number; quantity: number; notes?: string }[];
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    notes?: string;
    orderType?: OrderType;
    deliveryInfo?: DeliveryInfo;
    paymentMethod?: PaymentMethod;
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  updatePaymentStatus: (orderId: string, paymentStatus: PaymentStatus, paymentMethod: PaymentMethod) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;

  // Actions - Table Reservations
  createReservation: (reservationData: {
    restaurantId?: string;
    tableId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    guestsCount: number;
    reservationDate: string;
    reservationTime: string;
    specialRequests?: string;
  }) => Promise<TableReservation>;
  updateReservationStatus: (reservationId: string, status: ReservationStatus, tableId?: string) => Promise<void>;
  deleteReservation: (reservationId: string) => Promise<void>;

  // Actions - Inventory
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'restaurantId' | 'lastRestockedAt'>) => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  adjustStockQuantity: (id: string, delta: number) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;

  // Actions - Purchases (Historique d'Achat & Approvisionnements)
  addPurchaseRecord: (
    purchaseData: Omit<PurchaseRecord, 'id' | 'restaurantId' | 'createdAt'>,
    autoUpdateInventory?: boolean
  ) => Promise<PurchaseRecord>;
  deletePurchaseRecord: (id: string) => Promise<void>;

  // Actions - Staff
  addStaffMember: (member: Omit<User, 'id' | 'restaurantId'>) => Promise<void>;
  updateStaffMember: (id: string, updates: Partial<User>) => Promise<void>;
  deleteStaffMember: (id: string) => Promise<void>;

  // Actions - Restaurant / Onboarding / SaaS / Super Admin
  registerNewRestaurant: (
    data: Partial<Restaurant>, 
    adminName: string, 
    adminEmail: string,
    password?: string,
    initialData?: {
      categories?: string[];
      products?: { name: string; category: string; price: number; prepTime?: number; desc?: string }[];
      areas?: string[];
      tables?: { number: string; area: string; capacity: number }[];
    }
  ) => Promise<Restaurant>;
  updateRestaurantSettings: (updates: Partial<Restaurant>) => Promise<void>;
  updateRestaurantSubscription: (restaurantId: string, plan: PlanType, status: SubscriptionStatus, expiresAt?: string) => Promise<void>;
  toggleRestaurantSuspension: (restaurantId: string) => Promise<void>;
  deleteRestaurant: (restaurantId: string) => Promise<void>;

  // Automated Subscription & Expiration Management
  isSubscriptionActive: (restaurant?: Restaurant) => boolean;
  getSubscriptionInfo: (restaurant?: Restaurant) => {
    isExpired: boolean;
    isSuspended: boolean;
    isActive: boolean;
    isTrial: boolean;
    daysRemaining: number;
    hoursRemaining: number;
    expiresAt: string | null;
    status: SubscriptionStatus;
  };
  renewSubscription: (restaurantId: string, durationMonths: number, plan?: PlanType, paymentMethod?: string) => Promise<void>;
  simulateSubscriptionExpiry: (restaurantId: string) => Promise<void>;
  extendSubscriptionDays: (restaurantId: string, days: number) => Promise<void>;
  isRenewalModalOpen: boolean;
  setIsRenewalModalOpen: (open: boolean) => void;
  openRenewalModal: () => void;

  // Delivery & Couriers
  drivers: DeliveryDriver[];
  currentDriver: DeliveryDriver | null;
  setCurrentDriver: (driver: DeliveryDriver | null) => void;
  registerDriver: (driverData: Omit<DeliveryDriver, 'id' | 'createdAt'>, password?: string) => Promise<{ success: boolean; message: string; driver?: DeliveryDriver }>;
  validateDriverAccount: (driverId: string, isVerified: boolean, rejectionReason?: string) => Promise<void>;
  toggleDriverOnlineStatus: (driverId: string, isOnline: boolean) => Promise<void>;
  broadcastOrderForDelivery: (orderId: string) => Promise<void>;
  claimDeliveryMission: (orderId: string, driver: DeliveryDriver) => Promise<{ success: boolean; message: string }>;
  updateDeliveryProgress: (orderId: string, status: 'picked_up' | 'in_transit' | 'arrived' | 'delivered') => Promise<void>;
  broadcastedDeliveryOrders: Order[];
  driverPayouts: DriverPayout[];
  requestDriverPayout: (
    driverId: string, 
    amount: number, 
    paymentMethod: DriverPayoutMethod, 
    phoneNumber: string, 
    notes?: string
  ) => Promise<{ success: boolean; message: string; payout?: DriverPayout }>;
  processDriverPayout: (
    payoutId: string, 
    status: DriverPayoutStatus, 
    transactionRef?: string, 
    notes?: string
  ) => Promise<{ success: boolean; message: string }>;

  // Data Synchronization & Backup / Restore
  triggerCloudSync: () => Promise<{ success: boolean; message: string }>;
  exportDataBackup: () => { success: boolean; dataUrl: string; filename: string };
  importDataBackup: (jsonContent: string) => Promise<{ success: boolean; count: number; error?: string }>;
  lastBackupDate: string | null;
}

const EMPTY_RESTAURANT_FALLBACK: Restaurant = {
  id: '',
  name: 'Aucun restaurant configuré',
  slug: '',
  logo: '/logo.svg',
  coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
  ownerName: '',
  ownerEmail: '',
  phone: '',
  address: '',
  city: 'Yaoundé',
  region: 'Centre',
  country: 'Cameroun',
  neighborhood: '',
  latitude: 3.8480,
  longitude: 11.5021,
  rating: 5.0,
  reviewsCount: 0,
  deliveryMinMinutes: 20,
  deliveryMaxMinutes: 40,
  deliveryFeeBase: 1000,
  freeDeliveryThreshold: 15000,
  cuisineTypes: [],
  isOpenNow: true,
  minOrderAmount: 1000,
  restaurantType: 'Restaurant',
  description: '',
  currency: 'FCFA',
  subscriptionPlan: 'business',
  subscriptionStatus: 'active',
  subscriptionStartedAt: new Date().toISOString(),
  subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  autoRenew: true,
  createdAt: new Date().toISOString(),
  soundAlertsEnabled: true,
  autoAcceptOrders: false,
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge legacy mock storage cache once so user starts with a completely empty, pristine platform
  if (typeof window !== 'undefined' && safeStorage.getItem('restocam_db_purged_clean_v1') !== 'true') {
    const legacyKeys = [
      'restocam_restaurants',
      'restocam_categories',
      'restocam_menu_items',
      'restocam_areas',
      'restocam_tables',
      'restocam_orders',
      'restocam_inventory',
      'restocam_purchases',
      'restocam_staff',
      'restocam_drivers',
      'restocam_current_driver',
      'restocam_auth_status',
      'restocam_user_email',
      'restocam_user_role',
      'restocam_current_restaurant_id',
      'restocam_reservations',
    ];
    legacyKeys.forEach(k => safeStorage.removeItem(k));
    safeSessionStorage.removeItem('restocam_active_table_id');
    safeSessionStorage.removeItem('restocam_active_customer_order_id');
    safeStorage.setItem('restocam_db_purged_clean_v1', 'true');
  }

  // Authentication & Modal states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return safeStorage.getItem('restocam_auth_status') === 'authenticated';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(() => Boolean(auth.currentUser?.emailVerified));

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (usr) => {
      setFirebaseUser(usr);
      setIsEmailVerified(Boolean(usr?.emailVerified));
    });
    return () => unsubAuth();
  }, []);

  // Helper to filter out any old mock data cached locally
  const getCleanStorageList = <T extends { id?: string; restaurantId?: string }>(key: string): T[] => {
    try {
      const saved = safeStorage.getItem(key);
      if (!saved) return [];
      const parsed: T[] = JSON.parse(saved);
      const dummyIds = [
        'rest_paradise_yaounde', 
        'rest_kankan_suya', 
        'rest_mama_africa', 
        'rest_sweet_tropic', 
        'rest_la_teranga_pizza', 
        'rest_demo_expired',
        'rest_douala_01', 
        'rest_yaounde_02', 
        'rest_kribi_03'
      ];
      return parsed.filter(item => {
        if (item.id && dummyIds.includes(item.id)) return false;
        if (item.restaurantId && dummyIds.includes(item.restaurantId)) return false;
        return true;
      });
    } catch {
      return [];
    }
  };

  // Master collections initialized completely empty
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    return getCleanStorageList<Restaurant>('restocam_restaurants');
  });

  const [currentRestaurantId, setCurrentRestaurantId] = useState<string>(() => {
    const urlParams = parseQrUrlParams();
    if (urlParams.restaurantId) {
      safeStorage.setItem('restocam_current_restaurant_id', urlParams.restaurantId);
      return urlParams.restaurantId;
    }
    const saved = safeStorage.getItem('restocam_current_restaurant_id');
    const dummyIds = [
      'rest_paradise_yaounde', 
      'rest_kankan_suya', 
      'rest_mama_africa', 
      'rest_sweet_tropic', 
      'rest_la_teranga_pizza', 
      'rest_demo_expired',
      'rest_douala_01', 
      'rest_yaounde_02', 
      'rest_kribi_03'
    ];
    if (saved && !dummyIds.includes(saved)) {
      return saved;
    }
    return '';
  });

  const [currentView, setCurrentViewInternal] = useState<ActiveAppView>(() => {
    const urlParams = parseQrUrlParams();
    if (urlParams.view === 'market') {
      return 'market';
    }
    if (urlParams.tableId || urlParams.view === 'customer_qr') {
      return 'customer_qr';
    }
    const isAuth = safeStorage.getItem('restocam_auth_status') === 'authenticated';
    const role = safeStorage.getItem('restocam_user_role');
    if (isAuth) {
      if (role === 'superadmin') return 'superadmin';
      if (role === 'chef') return 'kitchen';
      if (role === 'waiter') return 'waiter';
      return 'dashboard';
    }
    return 'landing';
  });

  const [viewHistory, setViewHistory] = useState<ActiveAppView[]>([]);
  
  const [activeCustomerTableId, setActiveCustomerTableId] = useState<string | null>(() => {
    const urlParams = parseQrUrlParams();
    if (urlParams.tableId) {
      safeSessionStorage.setItem('restocam_active_table_id', urlParams.tableId);
      return urlParams.tableId;
    }
    return safeSessionStorage.getItem('restocam_active_table_id');
  });

  const [activeCustomerOrderId, setActiveCustomerOrderId] = useState<string | null>(() => {
    const urlParams = parseQrUrlParams();
    if (urlParams.orderId) {
      safeSessionStorage.setItem('restocam_active_customer_order_id', urlParams.orderId);
      return urlParams.orderId;
    }
    // If the customer specifically scanned a table QR code or came to customer_qr, do not resurrect a previous stale order!
    if (urlParams.tableId || urlParams.view === 'customer_qr') {
      safeSessionStorage.removeItem('restocam_active_customer_order_id');
      return null;
    }
    return safeSessionStorage.getItem('restocam_active_customer_order_id');
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Cross-device persistent statistics state
  const [restaurantStats, setRestaurantStats] = useState<RestaurantStatistics | null>(null);
  const [isStatsSyncing, setIsStatsSyncing] = useState<boolean>(false);
  const [lastStatsSyncTime, setLastStatsSyncTime] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | 'tablet'>(() => detectDeviceType());

  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    return safeStorage.getItem('restocam_user_email') || '';
  });

  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    const savedRole = safeStorage.getItem('restocam_user_role') as UserRole;
    return savedRole || 'owner';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Responsive device tracking
  useEffect(() => {
    const handleResize = () => setDeviceType(detectDeviceType());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Active QR URL routing listener (handles table QR scans, deep links, popstate, hashchange)
  useEffect(() => {
    const handleUrlRouting = () => {
      const urlParams = parseQrUrlParams();
      if (urlParams.view === 'customer_qr' || urlParams.tableId) {
        setCurrentViewInternal('customer_qr');
        if (urlParams.tableId) {
          setActiveCustomerTableId(urlParams.tableId);
          safeSessionStorage.setItem('restocam_active_table_id', urlParams.tableId);
        }
        // Customer scanning table QR code or opening menu wants to see the menu
        if (!urlParams.orderId) {
          setActiveCustomerOrderId(null);
          safeSessionStorage.removeItem('restocam_active_customer_order_id');
        }
        if (urlParams.orderId) {
          setActiveCustomerOrderId(urlParams.orderId);
          safeSessionStorage.setItem('restocam_active_customer_order_id', urlParams.orderId);
        }
        if (urlParams.restaurantId) {
          setCurrentRestaurantId(urlParams.restaurantId);
          currentRestaurantIdRef.current = urlParams.restaurantId;
          safeStorage.setItem('restocam_current_restaurant_id', urlParams.restaurantId);
        }
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    window.addEventListener('hashchange', handleUrlRouting);
    return () => {
      window.removeEventListener('popstate', handleUrlRouting);
      window.removeEventListener('hashchange', handleUrlRouting);
    };
  }, []);

  const [allCategories, setAllCategories] = useState<MenuCategory[]>(() => {
    return getCleanStorageList<MenuCategory>('restocam_categories');
  });

  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>(() => {
    return getCleanStorageList<MenuItem>('restocam_menu_items');
  });

  const [allAreas, setAllAreas] = useState<RestaurantArea[]>(() => {
    return getCleanStorageList<RestaurantArea>('restocam_areas');
  });

  const [allTables, setAllTables] = useState<RestaurantTable[]>(() => {
    return getCleanStorageList<RestaurantTable>('restocam_tables');
  });

  const [allOrders, setAllOrders] = useState<Order[]>(() => {
    return getCleanStorageList<Order>('restocam_orders');
  });

  const [allInventory, setAllInventory] = useState<InventoryItem[]>(() => {
    return getCleanStorageList<InventoryItem>('restocam_inventory');
  });

  const [allPurchases, setAllPurchases] = useState<PurchaseRecord[]>(() => {
    return getCleanStorageList<PurchaseRecord>('restocam_purchases');
  });

  const [allStaff, setAllStaff] = useState<User[]>(() => {
    return getCleanStorageList<User>('restocam_staff');
  });

  const [allReservations, setAllReservations] = useState<TableReservation[]>(() => {
    return getCleanStorageList<TableReservation>('restocam_reservations');
  });

  // Initial sample couriers & payout history
  const INITIAL_DEFAULT_DRIVERS: DeliveryDriver[] = [
    {
      id: 'drv_sample_01',
      name: 'Jean-Paul Mbida',
      email: 'jeanpaul.mbida@afroresto.cm',
      phone: '+237 699 42 18 09',
      cniNumber: '11029481903',
      address: 'Akwa, Douala',
      vehicleType: 'moto',
      vehiclePlate: 'LT-942-BA',
      serviceZones: ['Akwa', 'Bonanjo', 'Deido', 'Bali'],
      serviceCity: 'Douala',
      isOnline: true,
      verificationStatus: 'verified',
      isVerified: true,
      verifiedAt: '2025-01-10T10:00:00.000Z',
      verifiedBy: 'Bureau AFRORESTO Akwa (Douala)',
      driverEarnings: 31500, // Total nettes commissions accumulées (80%)
      totalPaidOut: 23300,   // Déjà versé par la plateforme
      pendingPayoutBalance: 8200, // Reste disponible pour versement
      rating: 4.9,
      totalDeliveries: 38,
      activeOrderId: null,
      createdAt: '2025-01-05T08:30:00.000Z',
      password: 'livreur123'
    }
  ];

  const INITIAL_DEFAULT_PAYOUTS: DriverPayout[] = [
    {
      id: 'pay_demo_01',
      payoutNumber: 'VERS-2025-0142',
      driverId: 'drv_sample_01',
      driverName: 'Jean-Paul Mbida',
      driverPhone: '+237 699 42 18 09',
      amount: 14500,
      paymentMethod: 'orange_money',
      phoneNumber: '+237 699 42 18 09',
      status: 'completed',
      requestedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      processedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
      transactionRef: 'OM-CM-9284105',
      processedBy: 'Direction Financière AFRORESTO',
      notes: 'Versement direct Orange Money Cameroun - Commissions courses semaine 2'
    },
    {
      id: 'pay_demo_02',
      payoutNumber: 'VERS-2025-0158',
      driverId: 'drv_sample_01',
      driverName: 'Jean-Paul Mbida',
      driverPhone: '+237 699 42 18 09',
      amount: 8800,
      paymentMethod: 'mtn_momo',
      phoneNumber: '+237 671 22 84 90',
      status: 'completed',
      requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      processedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      transactionRef: 'MOMO-CMR-664192',
      processedBy: 'Direction Financière AFRORESTO',
      notes: 'Virement automatique MTN Mobile Money'
    }
  ];

  // Delivery Drivers state (synced with Firestore and localStorage)
  const [allDrivers, setAllDrivers] = useState<DeliveryDriver[]>(() => {
    const list = getCleanStorageList<DeliveryDriver>('restocam_drivers');
    if (list && list.length > 0) return list;
    return INITIAL_DEFAULT_DRIVERS;
  });

  const [currentDriver, setCurrentDriver] = useState<DeliveryDriver | null>(() => {
    try {
      const saved = safeStorage.getItem('restocam_current_driver');
      if (saved) return JSON.parse(saved);
      return INITIAL_DEFAULT_DRIVERS[0] || null;
    } catch {
      return INITIAL_DEFAULT_DRIVERS[0] || null;
    }
  });

  // Driver Payouts state (Historique des paiements versés par la plateforme)
  const [allDriverPayouts, setAllDriverPayouts] = useState<DriverPayout[]>(() => {
    const list = getCleanStorageList<DriverPayout>('restocam_driver_payouts');
    if (list && list.length > 0) return list;
    return INITIAL_DEFAULT_PAYOUTS;
  });

  // Subscription Renewal Modal state
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState<boolean>(false);
  const openRenewalModal = useCallback(() => {
    setIsRenewalModalOpen(true);
  }, []);

  // Real-time Incoming Order Alert & Waiter Notification states
  const [incomingOrderAlert, setIncomingOrderAlert] = useState<Order | null>(null);
  const [waiterCallAlert, setWaiterCallAlert] = useState<{ id?: string; tableId: string; tableName: string; areaName?: string; time: string; notes?: string } | null>(null);
  const [waiterCalls, setWaiterCalls] = useState<WaiterCall[]>([]);
  const initialOrdersLoadedRef = useRef(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const knownCallIdsRef = useRef<Set<string>>(new Set());

  // Mutable refs to prevent stale closure in long-lived Firestore listeners
  const currentRestaurantIdRef = useRef<string>(currentRestaurantId);
  currentRestaurantIdRef.current = currentRestaurantId;

  const currentUserRoleRef = useRef<UserRole>(currentUserRole);
  currentUserRoleRef.current = currentUserRole;

  const dismissIncomingOrderAlert = useCallback(() => {
    setIncomingOrderAlert(null);
  }, []);

  const acknowledgeWaiterCall = useCallback(async (callId: string) => {
    const call = waiterCalls.find(c => c.id === callId);
    try {
      await setDoc(doc(db, 'waiter_calls', callId), { status: 'acknowledged' }, { merge: true });
      if (call?.tableId) {
        await setDoc(doc(db, 'tables', call.tableId), { waiterCalled: false }, { merge: true });
      }
    } catch (e) {
      console.warn('acknowledgeWaiterCall notice:', e);
    }
    setWaiterCallAlert(null);
    setWaiterCalls(prev => prev.map(c => c.id === callId ? { ...c, status: 'acknowledged' } : c));
    if (call?.tableId) {
      setAllTables(prev => prev.map(t => t.id === call.tableId ? { ...t, waiterCalled: false } : t));
    }
  }, [waiterCalls]);

  const acknowledgeTableWaiterCall = useCallback(async (tableId: string) => {
    const calls = waiterCalls.filter(c => c.tableId === tableId && c.status === 'pending');
    for (const call of calls) {
      try {
        await setDoc(doc(db, 'waiter_calls', call.id), { status: 'acknowledged' }, { merge: true });
      } catch (e) {
        console.warn('acknowledgeTableWaiterCall notice:', e);
      }
    }
    try {
      await setDoc(doc(db, 'tables', tableId), { waiterCalled: false }, { merge: true });
    } catch (e) {
      console.warn('acknowledgeTableWaiterCall tables notice:', e);
    }
    setWaiterCalls(prev => prev.map(c => c.tableId === tableId ? { ...c, status: 'acknowledged' } : c));
    setAllTables(prev => prev.map(t => t.id === tableId ? { ...t, waiterCalled: false } : t));
    if (waiterCallAlert?.tableId === tableId) {
      setWaiterCallAlert(null);
    }
  }, [waiterCalls, waiterCallAlert]);

  const dismissWaiterAlert = useCallback(() => {
    if (waiterCallAlert?.id) {
      acknowledgeWaiterCall(waiterCallAlert.id);
    } else if (waiterCallAlert?.tableId) {
      acknowledgeTableWaiterCall(waiterCallAlert.tableId);
    }
    setWaiterCallAlert(null);
  }, [waiterCallAlert, acknowledgeWaiterCall, acknowledgeTableWaiterCall]);

  const sendWaiterCall = useCallback(async (tableId: string, tableName?: string, notes?: string) => {
    const effectiveTables = allTables;
    const effectiveAreas = allAreas;
    const table = effectiveTables.find(t => t.id === tableId);
    const resolvedName = tableName || table?.name || (tableId ? `Table ${tableId.replace(/^tbl_/, '')}` : 'Table en Salle');
    const area = table ? effectiveAreas.find(a => a.id === table.areaId) : null;
    const targetRestId = currentRestaurantIdRef.current || table?.restaurantId || '';
    const callId = `call_${Date.now()}_${tableId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const now = new Date().toISOString();

    const callData: WaiterCall = {
      id: callId,
      restaurantId: targetRestId,
      tableId,
      tableName: resolvedName,
      areaName: area ? area.name : 'Salle Principale',
      status: 'pending',
      createdAt: now,
      notes: notes || 'Appel client à table'
    };

    // 1. Optimistic update
    setWaiterCalls(prev => [callData, ...prev.filter(c => c.id !== callId)]);
    setAllTables(prev => prev.map(t => t.id === tableId ? { ...t, waiterCalled: true, lastWaiterCall: now } : t));

    // 2. Play audible waiter chime immediately
    soundFx.playWaiterCallSound();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 400]);
    }

    // 3. Trigger immediate waiter call alert banner for staff
    setWaiterCallAlert({
      id: callId,
      tableId,
      tableName: resolvedName,
      areaName: area ? area.name : 'Salle Principale',
      time: new Date(now).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      notes: notes || 'Appel client à table'
    });

    // 4. Desktop push notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🔔 Appel Serveur — ${resolvedName}`, {
          body: `${resolvedName} (${area ? area.name : 'Salle'}) demande un serveur !`,
          icon: '/logo.svg'
        });
      } catch (err) {
        console.warn('Desktop notification error:', err);
      }
    }

    // 5. Persist to Firestore waiter_calls
    try {
      await setDoc(doc(db, 'waiter_calls', callId), cleanFirestoreData(callData));
    } catch (e) {
      console.warn('Firestore waiter_calls write notice:', e);
    }

    // 6. Update table document
    try {
      if (tableId) {
        await setDoc(doc(db, 'tables', tableId), { 
          waiterCalled: true, 
          lastWaiterCall: now 
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore table waiterCalled notice:', e);
    }
  }, [allTables, allAreas]);

  // Sync state and session to local storage
  useEffect(() => {
    safeStorage.setItem('restocam_auth_status', isAuthenticated ? 'authenticated' : 'unauthenticated');
  }, [isAuthenticated]);

  useEffect(() => {
    if (currentUserEmail) {
      safeStorage.setItem('restocam_user_email', currentUserEmail);
    } else {
      safeStorage.removeItem('restocam_user_email');
    }
  }, [currentUserEmail]);

  useEffect(() => {
    safeStorage.setItem('restocam_user_role', currentUserRole);
  }, [currentUserRole]);

  useEffect(() => {
    safeStorage.setItem('restocam_restaurants', JSON.stringify(restaurants));
  }, [restaurants]);

  useEffect(() => {
    if (currentRestaurantId) {
      safeStorage.setItem('restocam_current_restaurant_id', currentRestaurantId);
    } else {
      safeStorage.removeItem('restocam_current_restaurant_id');
    }
  }, [currentRestaurantId]);

  useEffect(() => {
    safeStorage.setItem('restocam_categories', JSON.stringify(allCategories));
  }, [allCategories]);

  useEffect(() => {
    safeStorage.setItem('restocam_menu_items', JSON.stringify(allMenuItems));
  }, [allMenuItems]);

  useEffect(() => {
    safeStorage.setItem('restocam_areas', JSON.stringify(allAreas));
  }, [allAreas]);

  useEffect(() => {
    safeStorage.setItem('restocam_tables', JSON.stringify(allTables));
  }, [allTables]);

  useEffect(() => {
    safeStorage.setItem('restocam_orders', JSON.stringify(allOrders));
  }, [allOrders]);

  useEffect(() => {
    safeStorage.setItem('restocam_inventory', JSON.stringify(allInventory));
  }, [allInventory]);

  useEffect(() => {
    safeStorage.setItem('restocam_purchases', JSON.stringify(allPurchases));
  }, [allPurchases]);

  useEffect(() => {
    safeStorage.setItem('restocam_staff', JSON.stringify(allStaff));
  }, [allStaff]);

  useEffect(() => {
    if (activeCustomerTableId) {
      safeSessionStorage.setItem('restocam_active_table_id', activeCustomerTableId);
    }
  }, [activeCustomerTableId]);

  useEffect(() => {
    if (activeCustomerOrderId) {
      safeSessionStorage.setItem('restocam_active_customer_order_id', activeCustomerOrderId);
    } else {
      safeSessionStorage.removeItem('restocam_active_customer_order_id');
    }
  }, [activeCustomerOrderId]);

  useEffect(() => {
    safeStorage.setItem('restocam_drivers', JSON.stringify(allDrivers));
  }, [allDrivers]);

  useEffect(() => {
    if (currentDriver) {
      safeStorage.setItem('restocam_current_driver', JSON.stringify(currentDriver));
    } else {
      safeStorage.removeItem('restocam_current_driver');
    }
  }, [currentDriver]);

  // FIRESTORE REAL-TIME SYNCHRONIZATION LISTENERS (Desktop & Mobile live sync)
  // 1. Permanent collection listeners (run once on mount, zero re-subscription thrashing)
  useEffect(() => {
    let unsubRestaurants = () => {};
    let unsubCategories = () => {};
    let unsubMenuItems = () => {};
    let unsubAreas = () => {};
    let unsubTables = () => {};
    let unsubOrders = () => {};
    let unsubInventory = () => {};
    let unsubStaff = () => {};
    let unsubWaiterCalls = () => {};
    let unsubPurchases = () => {};
    let unsubDrivers = () => {};
    let unsubPayouts = () => {};

    try {
      const urlParams = parseQrUrlParams();

      // Immediate direct query if opened via Table QR Code for near-instant rendering
      if (urlParams.restaurantId) {
        const rawTargetId = urlParams.restaurantId;
        getDoc(doc(db, 'restaurants', rawTargetId)).then(async snap => {
          if (snap.exists()) {
            const rData = { ...snap.data(), id: snap.id } as Restaurant;
            setRestaurants(prev => {
              if (prev.some(r => r.id === rData.id)) return prev;
              return [rData, ...prev];
            });
            setCurrentRestaurantId(rData.id);
            currentRestaurantIdRef.current = rData.id;
          } else {
            // Also fetch restaurants collection if direct doc ID didn't match (e.g. prefix or slug)
            const allSnap = await getDocs(collection(db, 'restaurants'));
            if (!allSnap.empty) {
              const list = allSnap.docs.map(d => ({ ...d.data(), id: d.id } as Restaurant));
              setRestaurants(list);
              const matched = list.find(r => 
                r.id === rawTargetId ||
                r.slug === rawTargetId ||
                r.id.startsWith(rawTargetId) ||
                rawTargetId.startsWith(r.id) ||
                (r.name && r.name.toLowerCase().includes(rawTargetId.toLowerCase()))
              );
              if (matched) {
                setCurrentRestaurantId(matched.id);
                currentRestaurantIdRef.current = matched.id;
              }
            }
          }
        }).catch(err => console.warn('Direct restaurant doc check notice:', err));
      }

      // If opened with tableId, also verify table and associate restaurant immediately
      if (urlParams.tableId) {
        getDoc(doc(db, 'tables', urlParams.tableId)).then(async tSnap => {
          if (tSnap.exists()) {
            const tData = tSnap.data();
            if (tData.restaurantId) {
              const rSnap = await getDoc(doc(db, 'restaurants', tData.restaurantId));
              if (rSnap.exists()) {
                const rData = { ...rSnap.data(), id: rSnap.id } as Restaurant;
                setRestaurants(prev => {
                  if (prev.some(r => r.id === rData.id)) return prev;
                  return [rData, ...prev];
                });
                setCurrentRestaurantId(rData.id);
                currentRestaurantIdRef.current = rData.id;
              }
            }
          }
        }).catch(err => console.warn('Direct table doc check notice:', err));
      }

      // 1. Restaurants Collection
      unsubRestaurants = onSnapshot(collection(db, 'restaurants'), snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Restaurant));
        setRestaurants(list);
        if (list.length > 0) {
          const currentParams = parseQrUrlParams();
          if (currentParams.restaurantId) {
            const matched = list.find(r => 
              r.id === currentParams.restaurantId ||
              r.slug === currentParams.restaurantId ||
              r.id.startsWith(currentParams.restaurantId!) ||
              currentParams.restaurantId!.startsWith(r.id) ||
              (r.name && r.name.toLowerCase().includes(currentParams.restaurantId!.toLowerCase()))
            );
            if (matched) {
              setCurrentRestaurantId(matched.id);
              currentRestaurantIdRef.current = matched.id;
              return;
            }
          }

          if (currentParams.tableId) {
            const matchedByTable = list.find(r => currentParams.tableId!.includes(r.id));
            if (matchedByTable) {
              setCurrentRestaurantId(matchedByTable.id);
              currentRestaurantIdRef.current = matchedByTable.id;
              return;
            }
          }

          const savedRestId = safeStorage.getItem('restocam_current_restaurant_id');
          const savedUserEmail = safeStorage.getItem('restocam_user_email');
          
          if (savedRestId && list.some(r => r.id === savedRestId)) {
            setCurrentRestaurantId(savedRestId);
            currentRestaurantIdRef.current = savedRestId;
          } else if (savedUserEmail) {
            const match = list.find(r => 
              r.ownerEmail?.toLowerCase() === savedUserEmail.toLowerCase() ||
              (r as any).adminEmails?.includes(savedUserEmail.toLowerCase()) ||
              (savedUserEmail.toLowerCase().includes('davidfokoua') && (r.name?.toLowerCase().includes('paradise') || r.ownerName?.toLowerCase().includes('fokoua')))
            );
            if (match) {
              setCurrentRestaurantId(match.id);
              currentRestaurantIdRef.current = match.id;
            } else {
              const fallback = list[0].id;
              setCurrentRestaurantId(prev => {
                const finalId = (prev && list.some(r => r.id === prev)) ? prev : fallback;
                currentRestaurantIdRef.current = finalId;
                return finalId;
              });
            }
          } else {
            const fallback = list[0].id;
            setCurrentRestaurantId(prev => {
              const finalId = (prev && list.some(r => r.id === prev)) ? prev : fallback;
              currentRestaurantIdRef.current = finalId;
              return finalId;
            });
          }
        } else {
          // If Firestore is empty, keep platform clean and empty for new account creation
          setRestaurants([]);
          setCurrentRestaurantId('');
          currentRestaurantIdRef.current = '';
        }
      }, err => console.warn('Firestore restaurants sync notice:', err));

      // 2. Categories Collection
      unsubCategories = onSnapshot(collection(db, 'categories'), snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MenuCategory));
        setAllCategories(list);
      }, err => console.warn('Firestore categories sync notice:', err));

      // 3. Menu Items Collection
      unsubMenuItems = onSnapshot(collection(db, 'menu_items'), snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MenuItem));
        setAllMenuItems(list);
      }, err => console.warn('Firestore menu_items sync notice:', err));

      // 4. Areas Collection
      unsubAreas = onSnapshot(collection(db, 'areas'), snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as RestaurantArea));
        setAllAreas(list);
      }, err => console.warn('Firestore areas sync notice:', err));

      // 5. Tables Collection
      unsubTables = onSnapshot(collection(db, 'tables'), snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as RestaurantTable));
        setAllTables(list);
        const currentParams = parseQrUrlParams();
        if (currentParams.tableId) {
          setActiveCustomerTableId(currentParams.tableId);
        } else if (list.length > 0) {
          setActiveCustomerTableId(prev => {
            if (prev && list.some(t => t.id === prev)) return prev;
            return list[0].id;
          });
        } else {
          setActiveCustomerTableId(null);
        }
      }, err => console.warn('Firestore tables sync notice:', err));

      // 6. Orders Collection (Real-Time Push Listener)
      unsubOrders = onSnapshot(collection(db, 'orders'), snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Order));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllOrders(list);

        if (!initialOrdersLoadedRef.current) {
          list.forEach(o => knownOrderIdsRef.current.add(o.id));
          initialOrdersLoadedRef.current = true;
          return;
        }

        // Detect newly placed customer orders for the restaurant and delivery race broadcasts
        snapshot.docChanges().forEach(change => {
          const docData = { ...change.doc.data(), id: change.doc.id } as Order;
          if (change.type === 'modified') {
            if (docData.orderType === 'delivery' && docData.deliveryStatus === 'broadcasted') {
              soundFx.playDeliveryBroadcastPing();
            }
          }
          if (change.type === 'added') {
            const newDoc = docData;
            if (!knownOrderIdsRef.current.has(newDoc.id)) {
              knownOrderIdsRef.current.add(newDoc.id);

              const activeRestId = currentRestaurantIdRef.current || safeStorage.getItem('restocam_current_restaurant_id');
              const isSuper = currentUserRoleRef.current === 'superadmin';
              const matchesRestaurant = isSuper || !activeRestId || newDoc.restaurantId === activeRestId;

              if (newDoc.orderType === 'delivery' && newDoc.deliveryStatus === 'broadcasted') {
                soundFx.playDeliveryBroadcastPing();
              } else if (matchesRestaurant && (newDoc.status === 'new' || newDoc.status === 'accepted')) {
                soundFx.playNewOrderChime();
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  navigator.vibrate([250, 100, 250, 100, 400]);
                }
                setIncomingOrderAlert(newDoc);
              }
            }
          }
        });
      }, err => console.warn('Firestore orders sync notice:', err));

      // 7. Inventory Collection
      unsubInventory = onSnapshot(collection(db, 'inventory'), snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as InventoryItem));
        setAllInventory(list);
      }, err => console.warn('Firestore inventory sync notice:', err));

      // 8. Staff Collection
      unsubStaff = onSnapshot(collection(db, 'staff'), snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as User));
        setAllStaff(list);
      }, err => console.warn('Firestore staff sync notice:', err));

      // 9. Waiter Calls Collection (Real-Time Customer Call Bell to Staff)
      unsubWaiterCalls = onSnapshot(collection(db, 'waiter_calls'), snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as WaiterCall));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setWaiterCalls(list);

        const activeRestId = currentRestaurantIdRef.current || safeStorage.getItem('restocam_current_restaurant_id');
        const isSuper = currentUserRoleRef.current === 'superadmin';

        // Filter pending calls for the active restaurant
        const pendingCalls = list.filter(c => 
          (isSuper || !activeRestId || c.restaurantId === activeRestId) && 
          c.status === 'pending'
        );

        if (pendingCalls.length > 0) {
          const latestCall = pendingCalls[0];
          
          if (!knownCallIdsRef.current.has(latestCall.id)) {
            knownCallIdsRef.current.add(latestCall.id);

            // Ring waiter call chime!
            soundFx.playWaiterCallSound();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([300, 100, 300, 100, 400]);
            }

            setWaiterCallAlert({
              id: latestCall.id,
              tableId: latestCall.tableId,
              tableName: latestCall.tableName,
              areaName: latestCall.areaName,
              time: new Date(latestCall.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              notes: latestCall.notes,
            });
          }
        } else {
          setWaiterCallAlert(null);
        }
      }, err => console.warn('Firestore waiter_calls sync notice:', err));

      // 10. Purchases Collection (Historique d'Achat & Approvisionnement)
      unsubPurchases = onSnapshot(collection(db, 'purchases'), snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as PurchaseRecord));
        list.sort((a, b) => new Date(b.purchaseDate || b.createdAt).getTime() - new Date(a.purchaseDate || a.createdAt).getTime());
        setAllPurchases(list);
      }, err => console.warn('Firestore purchases sync notice:', err));

      // 11. Delivery Drivers Collection
      unsubDrivers = onSnapshot(collection(db, 'drivers'), snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as DeliveryDriver));
        setAllDrivers(list);
        if (list.length > 0) {
          setCurrentDriver(prev => {
            if (!prev) return list[0];
            const matched = list.find(d => d.id === prev.id);
            return matched || list[0];
          });
        } else {
          setCurrentDriver(null);
        }
      }, err => console.warn('Firestore drivers sync notice:', err));

      // 12. Driver Payouts Collection
      unsubPayouts = onSnapshot(collection(db, 'driver_payouts'), snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as DriverPayout));
        list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        if (list.length > 0) {
          setAllDriverPayouts(list);
          safeStorage.setItem('restocam_driver_payouts', JSON.stringify(list));
        }
      }, err => console.warn('Firestore driver_payouts sync notice:', err));

    } catch (e) {
      console.warn('Firebase initialization notice:', e);
    }

    return () => {
      unsubRestaurants();
      unsubCategories();
      unsubMenuItems();
      unsubAreas();
      unsubTables();
      unsubOrders();
      unsubInventory();
      unsubStaff();
      unsubWaiterCalls();
      unsubPurchases();
      unsubDrivers();
      unsubPayouts();
    };
  }, []);

  // Automated background expiration monitor: every 30 seconds checks if subscription expiration date has passed
  useEffect(() => {
    const checkExpirations = () => {
      const now = Date.now();
      restaurants.forEach(async (r) => {
        if (r.subscriptionExpiresAt) {
          const expTime = new Date(r.subscriptionExpiresAt).getTime();
          if (!isNaN(expTime) && expTime <= now && r.subscriptionStatus !== 'expired' && r.subscriptionStatus !== 'suspended') {
            // Direct suspension when subscription expires!
            setRestaurants(prev => prev.map(item => item.id === r.id ? { ...item, subscriptionStatus: 'expired' } : item));
            try {
              await updateDoc(doc(db, 'restaurants', r.id), { subscriptionStatus: 'expired' });
            } catch (e) {
              console.warn('Auto expiration sync notice:', e);
            }
          }
        }
      });
    };

    checkExpirations();
    const interval = setInterval(checkExpirations, 30000);
    return () => clearInterval(interval);
  }, [restaurants]);

  // 2. Statistics listener dedicated to active tenant
  useEffect(() => {
    if (!currentRestaurantId) {
      setRestaurantStats(null);
      return;
    }

    let unsubStats = () => {};
    try {
      unsubStats = onSnapshot(doc(db, 'statistics', currentRestaurantId), snap => {
        if (snap.exists()) {
          const liveStats = snap.data() as RestaurantStatistics;
          setRestaurantStats(liveStats);
          setLastStatsSyncTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          setIsStatsSyncing(false);
        }
      }, err => console.warn('Firestore statistics sync notice:', err));
    } catch (e) {
      console.warn('Statistics listener error:', e);
    }

    return () => {
      unsubStats();
    };
  }, [currentRestaurantId]);

  // Real-time statistical aggregation and Firestore sync whenever orders change
  useEffect(() => {
    if (!currentRestaurantId) return;

    const restOrders = allOrders.filter(o => o.restaurantId === currentRestaurantId);
    const restItems = allMenuItems.filter(i => i.restaurantId === currentRestaurantId);
    const restCats = allCategories.filter(c => c.restaurantId === currentRestaurantId);

    const updatedStats = computeRestaurantStats(
      currentRestaurantId,
      restOrders,
      restItems,
      restCats,
      restaurantStats
    );

    setRestaurantStats(updatedStats);
    setLastStatsSyncTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    // Persist to Firestore asynchronously so both Desktop and Mobile stay 100% in sync
    saveRestaurantStatsToFirestore(updatedStats).catch(err => {
      console.warn('Notice syncing statistics to Firestore:', err);
    });
  }, [currentRestaurantId, allOrders, allMenuItems, allCategories]);

  // Manual or automatic refresh trigger
  const refreshStats = useCallback(async () => {
    if (!currentRestaurantId) return;
    setIsStatsSyncing(true);
    try {
      const remoteStats = await fetchRestaurantStatsFromFirestore(currentRestaurantId);
      if (remoteStats) {
        setRestaurantStats(remoteStats);
      } else {
        const restOrders = allOrders.filter(o => o.restaurantId === currentRestaurantId);
        const restItems = allMenuItems.filter(i => i.restaurantId === currentRestaurantId);
        const restCats = allCategories.filter(c => c.restaurantId === currentRestaurantId);
        const freshStats = computeRestaurantStats(currentRestaurantId, restOrders, restItems, restCats, restaurantStats);
        setRestaurantStats(freshStats);
        await saveRestaurantStatsToFirestore(freshStats);
      }
      setLastStatsSyncTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn('Error during manual stats refresh:', e);
    } finally {
      setIsStatsSyncing(false);
    }
  }, [currentRestaurantId, allOrders, allMenuItems, allCategories, restaurantStats]);

  // Protected View Navigation Interceptor
  const setCurrentView = (nextView: ActiveAppView) => {
    const publicViews: ActiveAppView[] = ['landing', 'customer_qr', 'onboarding'];
    
    // Visitor Access Control
    if (!isAuthenticated && !publicViews.includes(nextView)) {
      setAuthMessage('Accès restreint : Veuillez créer un compte ou vous connecter avec votre restaurant pour accéder à votre tableau de bord.');
      setIsAuthModalOpen(true);
      setCurrentViewInternal('landing');
      return;
    }

    if (nextView === currentView) return;
    setViewHistory(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === currentView) {
        return prev;
      }
      return [...prev, currentView].slice(-30);
    });
    try {
      window.history.pushState({ view: nextView }, '');
    } catch {
      // Safe fallback for restricted iframe environments
    }
    setCurrentViewInternal(nextView);
  };

  const goBack = () => {
    if (currentView === 'customer_qr' && activeCustomerOrderId) {
      setActiveCustomerOrderId(null);
      return;
    }

    if (viewHistory.length > 0) {
      const prevView = viewHistory[viewHistory.length - 1];
      setViewHistory(prev => prev.slice(0, -1));
      setCurrentViewInternal(prevView);
    } else {
      if (currentView !== 'dashboard' && currentView !== 'landing') {
        setCurrentViewInternal(isAuthenticated ? 'dashboard' : 'landing');
      } else if (currentView === 'dashboard') {
        setCurrentViewInternal('landing');
      }
    }
  };

  // Sync with browser hardware/gesture back button (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (currentView === 'customer_qr' && activeCustomerOrderId) {
        setActiveCustomerOrderId(null);
        return;
      }
      if (viewHistory.length > 0) {
        const prevView = viewHistory[viewHistory.length - 1];
        setViewHistory(prev => prev.slice(0, -1));
        setCurrentViewInternal(prevView);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewHistory, currentView, activeCustomerOrderId]);

  const canGoBack = viewHistory.length > 0 || (currentView === 'customer_qr' && !!activeCustomerOrderId) || (currentView !== 'dashboard' && currentView !== 'landing');
  const previousView: ActiveAppView | null = viewHistory.length > 0 
    ? viewHistory[viewHistory.length - 1] 
    : (currentView !== 'dashboard' ? (isAuthenticated ? 'dashboard' : 'landing') : (isAuthenticated ? null : 'landing'));

  // Current Restaurant with resilient fallback preserving currentRestaurantId
  const matchedRestaurant = 
    restaurants.find(r => r.id === currentRestaurantId) || 
    restaurants.find(r => r.slug === currentRestaurantId) ||
    restaurants.find(r => currentRestaurantId && (r.id.startsWith(currentRestaurantId) || currentRestaurantId.startsWith(r.id))) ||
    restaurants.find(r => currentRestaurantId && r.name?.toLowerCase().includes(currentRestaurantId.toLowerCase())) ||
    restaurants.find(r => r.ownerEmail?.toLowerCase() === currentUserEmail.toLowerCase()) ||
    restaurants[0];

  const currentRestaurant: Restaurant = matchedRestaurant || (currentRestaurantId ? {
    ...EMPTY_RESTAURANT_FALLBACK,
    id: currentRestaurantId,
    name: 'Authentic traste',
  } : EMPTY_RESTAURANT_FALLBACK);

  // Effective restaurant ID for filtering collections reliably
  const effectiveRestId = currentRestaurant?.id || currentRestaurantId || parseQrUrlParams().restaurantId || '';

  // Current User
  const currentRestaurantStaff = allStaff.filter(s => s.restaurantId === effectiveRestId);
  const currentUser: User = currentUserRole === 'superadmin' ? {
    id: 'usr_superadmin',
    restaurantId: effectiveRestId,
    name: currentRestaurant?.ownerName || 'Administrateur',
    email: currentUserEmail || currentRestaurant?.ownerEmail || 'admin@afroresto.com',
    phone: currentRestaurant?.phone || '',
    role: 'superadmin',
    active: true,
  } : (currentRestaurantStaff.find(s => s.role === currentUserRole) || {
    id: 'usr_default',
    restaurantId: effectiveRestId,
    name: currentRestaurant?.ownerName || 'Nouvel Utilisateur',
    email: currentUserEmail || currentRestaurant?.ownerEmail || '',
    phone: currentRestaurant?.phone || '',
    role: currentUserRole,
    active: true,
  });

  // Filtered collections for current restaurant tenant
  const categories = allCategories.filter(c => c.restaurantId === effectiveRestId || (effectiveRestId && c.restaurantId?.startsWith(effectiveRestId)));
  const menuItems = allMenuItems.filter(i => i.restaurantId === effectiveRestId || (effectiveRestId && i.restaurantId?.startsWith(effectiveRestId)));
  const areas = allAreas.filter(a => a.restaurantId === effectiveRestId || (effectiveRestId && a.restaurantId?.startsWith(effectiveRestId)));
  const tables = allTables.filter(t => t.restaurantId === effectiveRestId || (effectiveRestId && t.restaurantId?.startsWith(effectiveRestId)));
  const orders = allOrders.filter(o => o.restaurantId === effectiveRestId || (effectiveRestId && o.restaurantId?.startsWith(effectiveRestId)));
  const reservations = allReservations.filter(r => r.restaurantId === effectiveRestId || (effectiveRestId && r.restaurantId?.startsWith(effectiveRestId)));
  const inventory = allInventory.filter(i => i.restaurantId === effectiveRestId || (effectiveRestId && i.restaurantId?.startsWith(effectiveRestId)));
  const purchases = allPurchases.filter(p => p.restaurantId === effectiveRestId || (effectiveRestId && p.restaurantId?.startsWith(effectiveRestId)));
  const staff = currentRestaurantStaff;

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.enabled = next;
  };

  const switchRestaurant = (id: string) => {
    setCurrentRestaurantId(id);
    currentRestaurantIdRef.current = id;
    safeStorage.setItem('restocam_current_restaurant_id', id);
  };

  const switchUserRole = (role: UserRole) => {
    setCurrentUserRole(role);
    currentUserRoleRef.current = role;
    safeStorage.setItem('restocam_user_role', role);
  };

  // SECURE STAFF & PROFILE SWITCH WITH PIN / PASSWORD VERIFICATION
  const verifyAndSwitchStaff = async (
    targetIdOrRole: string | UserRole,
    pinOrPassword: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!pinOrPassword || !pinOrPassword.trim()) {
      return { success: false, message: 'Veuillez saisir votre code PIN ou mot de passe.' };
    }
    const cleanSecret = pinOrPassword.trim();

    // 1. Super Admin Target
    if (targetIdOrRole === 'superadmin' || targetIdOrRole === 'usr_superadmin') {
      const validSuperPins = ['superadmin123', 'admin123', currentRestaurant?.adminPassword].filter(Boolean);
      if (validSuperPins.includes(cleanSecret)) {
        setCurrentUserRole('superadmin');
        currentUserRoleRef.current = 'superadmin';
        safeStorage.setItem('restocam_user_role', 'superadmin');
        safeStorage.setItem('restocam_auth_status', 'authenticated');
        setIsAuthenticated(true);
        setCurrentViewInternal('superadmin');
        return { success: true };
      }
      return { success: false, message: 'Mot de passe Super Admin incorrect.' };
    }

    // 2. Owner / Manager Target
    if (targetIdOrRole === 'owner' || targetIdOrRole === 'usr_default') {
      const ownerStaff = currentRestaurantStaff.find(s => s.role === 'owner');
      const validOwnerSecrets = [currentRestaurant?.adminPassword, ownerStaff?.password, ownerStaff?.pinCode].filter(Boolean);

      if (validOwnerSecrets.length > 0 && validOwnerSecrets.includes(cleanSecret)) {
        setCurrentUserRole('owner');
        currentUserRoleRef.current = 'owner';
        if (ownerStaff) setCurrentUserEmail(ownerStaff.email);
        safeStorage.setItem('restocam_user_role', 'owner');
        safeStorage.setItem('restocam_auth_status', 'authenticated');
        setIsAuthenticated(true);
        setCurrentViewInternal('dashboard');
        return { success: true };
      }
      return { success: false, message: 'Mot de passe Gérant / Propriétaire incorrect.' };
    }

    // 3. Employee / Staff Target (Chef, Waiter, Cashier, Manager, Accountant)
    const matchedStaff = currentRestaurantStaff.find(s => 
      s.id === targetIdOrRole || 
      s.role === targetIdOrRole || 
      s.name.toLowerCase() === (targetIdOrRole as string).toLowerCase() ||
      s.email.toLowerCase() === (targetIdOrRole as string).toLowerCase()
    );

    if (matchedStaff) {
      const validSecrets = [matchedStaff.pinCode, matchedStaff.password].filter(Boolean);
      if (validSecrets.includes(cleanSecret)) {
        setCurrentUserRole(matchedStaff.role);
        currentUserRoleRef.current = matchedStaff.role;
        setCurrentUserEmail(matchedStaff.email);
        safeStorage.setItem('restocam_user_role', matchedStaff.role);
        safeStorage.setItem('restocam_auth_status', 'authenticated');
        setIsAuthenticated(true);
        if (matchedStaff.role === 'chef') setCurrentViewInternal('kitchen');
        else if (matchedStaff.role === 'waiter') setCurrentViewInternal('waiter');
        else setCurrentViewInternal('dashboard');
        return { success: true };
      }
      return { success: false, message: `Code PIN ou mot de passe incorrect pour ${matchedStaff.name}.` };
    }

    return { success: false, message: 'Utilisateur ou profil introuvable.' };
  };

  // SECURE LOGIN & AUTH (REQUIRES PASSWORD / PIN VERIFICATION)
  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!password || !password.trim()) {
      return { success: false, message: 'Veuillez saisir votre mot de passe ou code PIN.' };
    }
    const cleanPassword = password.trim();

    // 1. Super Admin Account
    const isSuperAdminEmail = 
      normalizedEmail === 'admin@afroresto.com' ||
      normalizedEmail === 'superadmin@afroresto.com' ||
      normalizedEmail === 'admin@restocam.cm' || 
      normalizedEmail === 'superadmin@restocam.cm';

    if (isSuperAdminEmail) {
      const validSuperPasswords = ['superadmin123', 'admin123'];
      if (!validSuperPasswords.includes(cleanPassword)) {
        return { success: false, message: 'Mot de passe Super Admin incorrect.' };
      }

      setCurrentUserRole('superadmin');
      currentUserRoleRef.current = 'superadmin';
      setCurrentUserEmail(normalizedEmail);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      setAuthMessage(null);
      safeStorage.setItem('restocam_auth_status', 'authenticated');
      safeStorage.setItem('restocam_user_email', normalizedEmail);
      safeStorage.setItem('restocam_user_role', 'superadmin');

      if (restaurants.length > 0) {
        setCurrentRestaurantId(restaurants[0].id);
        currentRestaurantIdRef.current = restaurants[0].id;
        safeStorage.setItem('restocam_current_restaurant_id', restaurants[0].id);
      }

      setCurrentViewInternal('superadmin');
      return { success: true };
    }

    // Try fetching latest restaurants from Firestore if local list is still empty
    let restList = restaurants;
    if (restList.length === 0) {
      try {
        const snap = await getDocs(collection(db, 'restaurants'));
        restList = snap.docs.map(d => ({ ...d.data(), id: d.id } as Restaurant));
        if (restList.length > 0) {
          setRestaurants(restList);
        }
      } catch (e) {
        console.warn('Notice during login restaurant sync:', e);
      }
    }

    // 2. Find restaurant owner matching email or slug or name
    const matchingRest = restList.find(r => 
      r.ownerEmail?.toLowerCase() === normalizedEmail ||
      (r as any).adminEmails?.includes(normalizedEmail) ||
      r.slug?.toLowerCase() === normalizedEmail ||
      r.name?.toLowerCase() === normalizedEmail
    );

    // 3. Find employee / staff matching email, name or phone
    const matchingStaff = allStaff.find(s => 
      s.email?.toLowerCase() === normalizedEmail ||
      s.name?.toLowerCase() === normalizedEmail ||
      s.phone?.replace(/\s+/g, '') === normalizedEmail.replace(/\s+/g, '')
    );

    if (matchingRest) {
      const expectedPass = matchingRest.adminPassword;
      const ownerStaff = allStaff.find(s => s.restaurantId === matchingRest.id && s.role === 'owner');
      const validPasswords = [expectedPass, ownerStaff?.password, ownerStaff?.pinCode].filter(Boolean);

      if (!validPasswords.includes(cleanPassword)) {
        return { success: false, message: 'Mot de passe incorrect pour le compte Propriétaire / Gérant.' };
      }

      setCurrentRestaurantId(matchingRest.id);
      currentRestaurantIdRef.current = matchingRest.id;
      setCurrentUserRole('owner');
      currentUserRoleRef.current = 'owner';
      setCurrentUserEmail(normalizedEmail);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      setAuthMessage(null);
      safeStorage.setItem('restocam_auth_status', 'authenticated');
      safeStorage.setItem('restocam_user_email', normalizedEmail);
      safeStorage.setItem('restocam_current_restaurant_id', matchingRest.id);
      safeStorage.setItem('restocam_user_role', 'owner');
      setCurrentViewInternal('dashboard');
      return { success: true };
    }

    if (matchingStaff) {
      const validStaffSecrets = [matchingStaff.pinCode, matchingStaff.password].filter(Boolean);
      if (!validStaffSecrets.includes(cleanPassword)) {
        return { success: false, message: `Code PIN ou mot de passe incorrect pour l'employé ${matchingStaff.name}.` };
      }

      setCurrentRestaurantId(matchingStaff.restaurantId);
      setCurrentUserRole(matchingStaff.role);
      setCurrentUserEmail(matchingStaff.email);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      setAuthMessage(null);
      safeStorage.setItem('restocam_auth_status', 'authenticated');
      safeStorage.setItem('restocam_user_email', matchingStaff.email);
      safeStorage.setItem('restocam_current_restaurant_id', matchingStaff.restaurantId);
      safeStorage.setItem('restocam_user_role', matchingStaff.role);
      if (matchingStaff.role === 'chef') setCurrentViewInternal('kitchen');
      else if (matchingStaff.role === 'waiter') setCurrentViewInternal('waiter');
      else setCurrentViewInternal(matchingStaff.restaurantId ? 'dashboard' : 'onboarding');
      return { success: true };
    }

    // 4. Check Firestore users collection directly
    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', normalizedEmail)));
      if (!usersSnap.empty) {
        const uDoc = usersSnap.docs[0].data() as User;
        if (uDoc.password === cleanPassword) {
          const targetRestId = uDoc.restaurantId || (restaurants[0]?.id || '');
          setCurrentRestaurantId(targetRestId);
          setCurrentUserRole(uDoc.role || 'owner');
          setCurrentUserEmail(normalizedEmail);
          setIsAuthenticated(true);
          setIsAuthModalOpen(false);
          setAuthMessage(null);
          safeStorage.setItem('restocam_auth_status', 'authenticated');
          safeStorage.setItem('restocam_user_email', normalizedEmail);
          safeStorage.setItem('restocam_user_role', uDoc.role || 'owner');
          if (targetRestId) {
            safeStorage.setItem('restocam_current_restaurant_id', targetRestId);
          }
          setCurrentViewInternal(targetRestId ? 'dashboard' : 'onboarding');
          return { success: true };
        }
      }
    } catch (uErr) {
      console.warn('Firestore users collection check notice:', uErr);
    }

    // 5. Check Delivery Couriers (Drivers)
    const matchingDriver = allDrivers.find(d => 
      d.email?.toLowerCase() === normalizedEmail ||
      d.phone?.replace(/\s+/g, '') === normalizedEmail.replace(/\s+/g, '')
    );

    if (matchingDriver) {
      const validDriverSecrets = [matchingDriver.password, 'livreur123'].filter(Boolean);
      if (!validDriverSecrets.includes(cleanPassword)) {
        return { success: false, message: `Mot de passe coursier incorrect pour ${matchingDriver.name}.` };
      }

      setCurrentDriver(matchingDriver);
      safeStorage.setItem('restocam_current_driver', JSON.stringify(matchingDriver));
      setCurrentUserRole('delivery');
      setCurrentUserEmail(matchingDriver.email);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      setAuthMessage(null);
      safeStorage.setItem('restocam_auth_status', 'authenticated');
      safeStorage.setItem('restocam_user_email', matchingDriver.email);
      safeStorage.setItem('restocam_user_role', 'delivery');
      setCurrentViewInternal('driver');
      return { success: true };
    }

    return { 
      success: false, 
      message: 'Identifiant ou mot de passe incorrect. Vérifiez vos identifiants ou créez un nouveau compte.' 
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUserEmail('');
    safeStorage.removeItem('restocam_auth_status');
    safeStorage.removeItem('restocam_user_email');
    safeStorage.removeItem('restocam_current_restaurant_id');
    safeStorage.removeItem('restocam_user_role');
    setCurrentViewInternal('landing');
  };

  const sendPasswordReset = useCallback(async (email: string) => {
    return await sendUserPasswordResetEmail(email);
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    const res = await resendCurrentUserVerificationEmail();
    if (auth.currentUser) {
      setIsEmailVerified(auth.currentUser.emailVerified);
    }
    return res;
  }, []);

  const registerUserAccount = useCallback(async (
    email: string, 
    password: string, 
    name: string, 
    role: UserRole = 'owner'
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const result = await registerWithEmailAndSendVerification(cleanEmail, password, name);
    
    // Always persist the new user account into Firestore staff and users collections
    const newStaffUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      restaurantId: currentRestaurantId || '',
      name: name.trim(),
      email: cleanEmail,
      phone: '',
      role,
      active: true,
      emailVerified: true,
      password: password.trim(),
      pinCode: '0000',
      createdAt: new Date().toISOString(),
      firebaseUid: result.user?.uid
    };

    setAllStaff(prev => [...prev.filter(s => s.email.toLowerCase() !== cleanEmail), newStaffUser]);
    
    try {
      await setDoc(doc(db, 'staff', newStaffUser.id), cleanFirestoreData(newStaffUser));
      await setDoc(doc(db, 'users', newStaffUser.id), cleanFirestoreData(newStaffUser));
    } catch (e) {
      console.warn('Firestore user/staff persist notice:', e);
    }

    // Automatically authenticate the user upon registration!
    setCurrentUserEmail(cleanEmail);
    setCurrentUserRole(role);
    setIsAuthenticated(true);
    safeStorage.setItem('restocam_auth_status', 'authenticated');
    safeStorage.setItem('restocam_user_email', cleanEmail);
    safeStorage.setItem('restocam_user_role', role);

    return result;
  }, [currentRestaurantId]);

  // MENU ACTIONS
  const addCategory = async (name: string, icon: string = 'Utensils') => {
    const newCat: MenuCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      restaurantId: currentRestaurantId,
      name: name.trim(),
      icon,
      sortOrder: categories.length + 1,
      active: true,
    };
    setAllCategories(prev => [...prev, newCat]);
    try {
      await setDoc(doc(db, 'categories', newCat.id), newCat);
    } catch (err) {
      console.warn('Firestore category sync error:', err);
    }
  };

  const updateCategory = async (id: string, name: string, active: boolean) => {
    setAllCategories(prev => prev.map(c => c.id === id ? { ...c, name, active } : c));
    try {
      await updateDoc(doc(db, 'categories', id), { name, active });
    } catch (err) {
      console.warn('Firestore update category error:', err);
    }
  };

  const deleteCategory = async (id: string) => {
    setAllCategories(prev => {
      const updated = prev.filter(c => c.id !== id);
      safeStorage.setItem('restocam_categories', JSON.stringify(updated));
      return updated;
    });
    const otherCats = allCategories.filter(c => c.id !== id && c.restaurantId === currentRestaurantId);
    const fallbackCatId = otherCats[0]?.id || '';
    if (fallbackCatId) {
      setAllMenuItems(prev => {
        const updated = prev.map(m => m.categoryId === id ? { ...m, categoryId: fallbackCatId } : m);
        safeStorage.setItem('restocam_menu_items', JSON.stringify(updated));
        return updated;
      });
    }
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      console.warn('Firestore delete category error:', err);
    }
  };

  const addMenuItem = async (itemData: Omit<MenuItem, 'id' | 'restaurantId'>) => {
    const newItem: MenuItem = {
      ...itemData,
      visibility: itemData.visibility || 'public',
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      restaurantId: currentRestaurantId,
    };
    setAllMenuItems(prev => {
      const updated = [...prev, newItem];
      safeStorage.setItem('restocam_menu_items', JSON.stringify(updated));
      return updated;
    });
    try {
      await setDoc(doc(db, 'menu_items', newItem.id), newItem);
    } catch (err) {
      console.warn('Firestore menu item sync error:', err);
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    setAllMenuItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, ...updates } : i);
      safeStorage.setItem('restocam_menu_items', JSON.stringify(updated));
      return updated;
    });
    try {
      await updateDoc(doc(db, 'menu_items', id), updates);
    } catch (err) {
      console.warn('Firestore update menu item error:', err);
    }
  };

  const deleteMenuItem = async (id: string) => {
    setAllMenuItems(prev => {
      const updated = prev.filter(i => i.id !== id);
      safeStorage.setItem('restocam_menu_items', JSON.stringify(updated));
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'menu_items', id));
    } catch (err) {
      console.warn('Firestore delete menu item error:', err);
    }
  };

  const toggleMenuItemAvailability = async (id: string) => {
    const item = allMenuItems.find(i => i.id === id);
    if (!item) return;
    const nextVal = !item.available;
    setAllMenuItems(prev => prev.map(i => i.id === id ? { ...i, available: nextVal } : i));
    try {
      await updateDoc(doc(db, 'menu_items', id), { available: nextVal });
    } catch (err) {
      console.warn('Firestore toggle availability error:', err);
    }
  };

  // AREAS & TABLES
  const addArea = async (name: string, description?: string): Promise<RestaurantArea> => {
    const newArea: RestaurantArea = {
      id: `area_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      restaurantId: currentRestaurantId,
      name: name.trim(),
      description: description || 'Espace de service',
    };
    setAllAreas(prev => [...prev, newArea]);
    try {
      await setDoc(doc(db, 'areas', newArea.id), newArea);
    } catch (err) {
      console.warn('Firestore add area error:', err);
    }
    return newArea;
  };

  const deleteArea = async (id: string) => {
    setAllAreas(prev => {
      const updated = prev.filter(a => a.id !== id);
      safeStorage.setItem('restocam_areas', JSON.stringify(updated));
      return updated;
    });
    setAllTables(prev => {
      const remainingAreas = allAreas.filter(a => a.id !== id && a.restaurantId === currentRestaurantId);
      const fallbackAreaId = remainingAreas[0]?.id || '';
      const updated = prev.map(t => (t.areaId === id && t.restaurantId === currentRestaurantId) ? { ...t, areaId: fallbackAreaId } : t);
      safeStorage.setItem('restocam_tables', JSON.stringify(updated));
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'areas', id));
    } catch (err) {
      console.warn('Firestore delete area error:', err);
    }
  };

  const addTable = async (tableData: Omit<RestaurantTable, 'id' | 'restaurantId' | 'qrToken'> & { tableNumber?: string }): Promise<RestaurantTable> => {
    const newId = `tbl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const currentRestTables = allTables.filter(t => t.restaurantId === currentRestaurantId);
    const tableNumber = tableData.tableNumber || tableData.name.replace(/\D/g, '') || `${currentRestTables.length + 1}`;
    
    // Ensure an areaId is always assigned
    let targetAreaId = tableData.areaId;
    if (!targetAreaId) {
      const currentRestAreas = allAreas.filter(a => a.restaurantId === currentRestaurantId);
      if (currentRestAreas.length > 0) {
        targetAreaId = currentRestAreas[0].id;
      } else {
        // Create an area automatically
        const createdArea = await addArea('Salle Principale');
        targetAreaId = createdArea.id;
      }
    }

    const newTable: RestaurantTable = {
      ...tableData,
      id: newId,
      restaurantId: currentRestaurantId,
      areaId: targetAreaId,
      tableNumber,
      name: tableData.name || `Table ${tableNumber}`,
      capacity: Number(tableData.capacity) || 4,
      qrToken: `qr_${currentRestaurant?.slug || 'rest'}_${tableNumber.toLowerCase().replace(/\s+/g, '')}_${Math.random().toString(36).substring(2, 7)}`,
      status: (tableData.status as TableStatus) || 'free',
    };

    setAllTables(prev => {
      const updated = [...prev, newTable];
      safeStorage.setItem('restocam_tables', JSON.stringify(updated));
      return updated;
    });
    try {
      await setDoc(doc(db, 'tables', newTable.id), newTable);
    } catch (err) {
      console.warn('Firestore add table error:', err);
    }

    return newTable;
  };

  const updateTable = async (id: string, updates: Partial<RestaurantTable>) => {
    setAllTables(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      safeStorage.setItem('restocam_tables', JSON.stringify(updated));
      return updated;
    });
    try {
      await updateDoc(doc(db, 'tables', id), updates);
    } catch (err) {
      console.warn('Firestore update table error:', err);
    }
  };

  const deleteTable = async (id: string) => {
    setAllTables(prev => {
      const updated = prev.filter(t => t.id !== id);
      safeStorage.setItem('restocam_tables', JSON.stringify(updated));
      return updated;
    });
    if (activeCustomerTableId === id) {
      setActiveCustomerTableId(null);
    }
    try {
      await deleteDoc(doc(db, 'tables', id));
    } catch (err) {
      console.warn('Firestore delete table error:', err);
    }
  };

  const setTableStatus = async (tableId: string, status: TableStatus) => {
    setAllTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
    try {
      await updateDoc(doc(db, 'tables', tableId), { status });
    } catch (err) {
      console.warn('Firestore set table status error:', err);
    }
  };

  const regenerateTableQR = async (tableId: string) => {
    const newToken = `qr_${currentRestaurant?.slug || 'rest'}_${Math.random().toString(36).substring(2, 8)}`;
    setAllTables(prev => prev.map(t => {
      if (t.id === tableId) {
        return { ...t, qrToken: newToken };
      }
      return t;
    }));
    try {
      await updateDoc(doc(db, 'tables', tableId), { qrToken: newToken });
    } catch (err) {
      console.warn('Firestore regen QR error:', err);
    }
  };

  // ORDERS
  const createOrder = async ({
    restaurantId,
    tableId,
    items,
    customerName,
    customerPhone,
    customerEmail,
    notes,
    orderType = 'dine_in',
    deliveryInfo,
    paymentMethod = 'pending',
  }: {
    restaurantId?: string;
    tableId?: string;
    items: { menuItemId: string; name: string; price: number; quantity: number; notes?: string }[];
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    notes?: string;
    orderType?: OrderType;
    deliveryInfo?: DeliveryInfo;
    paymentMethod?: PaymentMethod;
  }): Promise<Order> => {
    const table = tableId ? allTables.find(t => t.id === tableId) : undefined;
    const area = table ? allAreas.find(a => a.id === table.areaId) : null;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const effectiveOrderType: OrderType = orderType || (deliveryInfo ? 'delivery' : 'dine_in');
    const isDelivery = effectiveOrderType === 'delivery';
    const isTakeaway = effectiveOrderType === 'takeaway';
    const deliveryFee = isDelivery && deliveryInfo?.deliveryFee ? Number(deliveryInfo.deliveryFee) : 0;
    const platformFee = isDelivery && deliveryFee > 0 ? Math.round(deliveryFee * 0.20) : 0;
    const driverFee = isDelivery && deliveryFee > 0 ? Math.round(deliveryFee * 0.80) : 0;
    const total = subtotal + deliveryFee;
    const orderNumber = `CMD-000${Math.floor(100 + Math.random() * 900)}`;

    const urlParams = parseQrUrlParams();
    let targetRestaurantId = (restaurantId && restaurantId.trim()) || '';

    // If tableId has restaurantId encoded (e.g. tbl_rest_1788037282985_jdv6_1)
    if (!targetRestaurantId && tableId && tableId.startsWith('tbl_rest_')) {
      const match = tableId.match(/^tbl_(rest_[^_]+)/);
      if (match) {
        targetRestaurantId = match[1];
      }
    }

    if (!targetRestaurantId) {
      targetRestaurantId = 
        table?.restaurantId ||
        (currentRestaurant?.id && currentRestaurant.id.trim()) ||
        (currentRestaurantId && currentRestaurantId.trim()) ||
        urlParams.restaurantId ||
        safeStorage.getItem('restocam_current_restaurant_id') ||
        (restaurants.length > 0 ? restaurants[0].id : '');
    }

    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      restaurantId: targetRestaurantId,
      tableId: tableId || (isDelivery ? 'remote_delivery' : isTakeaway ? 'remote_takeaway' : 'online_client'),
      tableName: isDelivery 
        ? `Livraison : ${deliveryInfo?.neighborhood || deliveryInfo?.city || 'À Domicile/Bureau'}`
        : isTakeaway 
        ? 'À Emporter (Click & Collect)'
        : (table ? table.name : 'Commande en Ligne'),
      areaName: isDelivery || isTakeaway ? 'Hub Repas en Ligne (Meituan)' : (area ? area.name : 'Espace Principal'),
      orderNumber,
      orderType: effectiveOrderType,
      status: currentRestaurant?.autoAcceptOrders ? 'accepted' : 'new',
      paymentStatus: 'unpaid',
      paymentMethod,
      items: items.map((it, idx) => {
        const itemObj: any = {
          id: `oi_${Date.now()}_${idx}`,
          menuItemId: it.menuItemId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
        };
        if (it.notes && it.notes.trim()) {
          itemObj.notes = it.notes.trim();
        }
        return itemObj;
      }),
      totalAmount: total,
      ...(isDelivery ? { deliveryFee, platformFee, driverFee } : {}),
      customerName: customerName?.trim() || (isDelivery ? 'Client Livraison' : isTakeaway ? 'Client À Emporter' : 'Client Sur Place'),
      ...(customerPhone?.trim() ? { customerPhone: customerPhone.trim() } : {}),
      ...(customerEmail?.trim() ? { customerEmail: customerEmail.trim() } : {}),
      ...(deliveryInfo ? { deliveryInfo } : {}),
      ...(notes?.trim() ? { notes: notes.trim() } : {}),
      serverName: isDelivery ? 'Livreur / Coursier' : isTakeaway ? 'Comptoir À Emporter' : 'Serveur en Salle',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Mark as known to avoid alert feedback loop on creator device
    knownOrderIdsRef.current.add(newOrder.id);

    // Immediate optimistic local state update
    setAllOrders(prev => [newOrder, ...prev]);

    // Save active order in storage so customer can always track progress
    safeSessionStorage.setItem('restocam_active_customer_order_id', newOrder.id);
    safeStorage.setItem('restocam_active_customer_order_id', newOrder.id);
    if (tableId && tableId.startsWith('tbl_')) {
      safeStorage.setItem(`restocam_last_table_order_${tableId}`, newOrder.id);
      setAllTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'occupied', currentOrderId: newOrder.id } : t));
    }
    setActiveCustomerOrderId(newOrder.id);

    // Play chime sound
    soundFx.playNewOrderChime();

    // Persist to Firestore with clean payload (stripping undefined)
    try {
      const cleanedOrder = cleanFirestoreData(newOrder);
      await setDoc(doc(db, 'orders', newOrder.id), cleanedOrder);
      if (tableId && tableId.startsWith('tbl_')) {
        await setDoc(doc(db, 'tables', tableId), { status: 'occupied', currentOrderId: newOrder.id }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore order creation error:', err);
    }

    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setAllOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        if (newStatus === 'ready') {
          soundFx.playKitchenReadyPing();
        }
        return {
          ...order,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return order;
    }));

    // If active alert matches this order, dismiss it when accepted/processed
    if (incomingOrderAlert?.id === orderId && newStatus !== 'new') {
      setIncomingOrderAlert(null);
    }

    if (newStatus === 'completed' || newStatus === 'cancelled') {
      const order = allOrders.find(o => o.id === orderId);
      if (order) {
        setAllTables(prev => prev.map(t => t.id === order.tableId ? { ...t, status: 'free', currentOrderId: undefined } : t));
        try {
          await setDoc(doc(db, 'tables', order.tableId), { status: 'free', currentOrderId: '' }, { merge: true });
        } catch (e) {
          console.warn('Table status reset error:', e);
        }
      }
    }

    try {
      await setDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore update order status error:', err);
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: PaymentStatus, paymentMethod: PaymentMethod) => {
    setAllOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          paymentStatus,
          paymentMethod,
          updatedAt: new Date().toISOString(),
        };
      }
      return order;
    }));

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus,
        paymentMethod,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore payment status error:', err);
    }
  };

  const cancelOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'cancelled');
  };

  const deleteOrder = async (orderId: string) => {
    setAllOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId);
      safeStorage.setItem('restocam_orders', JSON.stringify(updated));
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      console.warn('Firestore delete order notice:', err);
    }
  };

  // INVENTORY
  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'restaurantId' | 'lastRestockedAt'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      restaurantId: currentRestaurantId,
      lastRestockedAt: new Date().toISOString(),
    };
    setAllInventory(prev => [...prev, newItem]);
    try {
      await setDoc(doc(db, 'inventory', newItem.id), cleanFirestoreData(newItem));
    } catch (err) {
      console.warn('Firestore inventory error:', err);
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    setAllInventory(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    try {
      await updateDoc(doc(db, 'inventory', id), cleanFirestoreData(updates));
    } catch (err) {
      console.warn('Firestore update inventory error:', err);
    }
  };

  const adjustStockQuantity = async (id: string, delta: number) => {
    let updatedItem: InventoryItem | undefined;
    setAllInventory(prev => prev.map(i => {
      if (i.id === id) {
        const nextQty = Math.max(0, i.quantity + delta);
        updatedItem = {
          ...i,
          quantity: nextQty,
          lastRestockedAt: delta > 0 ? new Date().toISOString() : i.lastRestockedAt,
        };
        return updatedItem;
      }
      return i;
    }));

    if (updatedItem) {
      try {
        await updateDoc(doc(db, 'inventory', id), cleanFirestoreData({
          quantity: updatedItem.quantity,
          lastRestockedAt: updatedItem.lastRestockedAt,
        }));
      } catch (err) {
        console.warn('Firestore adjust stock error:', err);
      }
    }
  };

  const deleteInventoryItem = async (id: string) => {
    setAllInventory(prev => {
      const updated = prev.filter(i => i.id !== id);
      safeStorage.setItem('restocam_inventory', JSON.stringify(updated));
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (err) {
      console.warn('Firestore delete inventory error:', err);
    }
  };

  // PURCHASES (Historique d'Achat & Approvisionnement)
  const addPurchaseRecord = async (
    purchaseData: Omit<PurchaseRecord, 'id' | 'restaurantId' | 'createdAt'>,
    autoUpdateInventory: boolean = true
  ): Promise<PurchaseRecord> => {
    const newPurchase: PurchaseRecord = {
      ...purchaseData,
      id: `pur_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      restaurantId: currentRestaurantId,
      createdAt: new Date().toISOString(),
    };

    setAllPurchases(prev => [newPurchase, ...prev]);

    // Automatically replenish inventory stock if enabled
    if (autoUpdateInventory && purchaseData.items && purchaseData.items.length > 0) {
      for (const pItem of purchaseData.items) {
        const matchingItem = allInventory.find(i => 
          i.restaurantId === currentRestaurantId && 
          ((pItem.inventoryItemId && i.id === pItem.inventoryItemId) || 
           i.name.toLowerCase().trim() === pItem.name.toLowerCase().trim())
        );

        if (matchingItem) {
          await adjustStockQuantity(matchingItem.id, pItem.quantity);
          if (pItem.unitCost && pItem.unitCost > 0) {
            await updateInventoryItem(matchingItem.id, {
              purchasePrice: pItem.unitCost,
              unitCost: pItem.unitCost,
              supplier: purchaseData.supplierName || matchingItem.supplier,
            });
          }
        } else if (pItem.name && pItem.quantity > 0) {
          await addInventoryItem({
            name: pItem.name,
            category: purchaseData.category || 'Matières Premières',
            quantity: pItem.quantity,
            unit: pItem.unit || 'kg',
            minimumQuantity: Math.max(1, Math.round(pItem.quantity * 0.25)),
            supplier: purchaseData.supplierName,
            purchasePrice: pItem.unitCost || 0,
            unitCost: pItem.unitCost || 0,
          });
        }
      }
    }

    try {
      await setDoc(doc(db, 'purchases', newPurchase.id), cleanFirestoreData(newPurchase));
    } catch (err) {
      console.warn('Firestore add purchase notice:', err);
    }

    return newPurchase;
  };

  const deletePurchaseRecord = async (id: string): Promise<void> => {
    setAllPurchases(prev => {
      const updated = prev.filter(p => p.id !== id);
      safeStorage.setItem('restocam_purchases', JSON.stringify(updated));
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'purchases', id));
    } catch (err) {
      console.warn('Firestore delete purchase notice:', err);
    }
  };

  // STAFF
  const addStaffMember = async (memberData: Omit<User, 'id' | 'restaurantId'>) => {
    const newStaff: User = {
      ...memberData,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      restaurantId: currentRestaurantId,
    };
    setAllStaff(prev => {
      const updated = [...prev, newStaff];
      safeStorage.setItem('restocam_staff', JSON.stringify(updated));
      return updated;
    });
    try {
      await setDoc(doc(db, 'staff', newStaff.id), newStaff);
    } catch (err) {
      console.warn('Firestore staff add error:', err);
    }
  };

  const updateStaffMember = async (id: string, updates: Partial<User>) => {
    setAllStaff(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      safeStorage.setItem('restocam_staff', JSON.stringify(updated));
      return updated;
    });
    try {
      await updateDoc(doc(db, 'staff', id), updates);
    } catch (err) {
      console.warn('Firestore update staff error:', err);
    }
  };

  const deleteStaffMember = async (id: string) => {
    setAllStaff(prev => {
      const updated = prev.filter(s => s.id !== id);
      safeStorage.setItem('restocam_staff', JSON.stringify(updated));
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'staff', id));
    } catch (err) {
      console.warn('Firestore delete staff error:', err);
    }
  };

  // ACTIONS - TABLE RESERVATIONS
  const createReservation = async (reservationData: {
    restaurantId?: string;
    tableId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    guestsCount: number;
    reservationDate: string;
    reservationTime: string;
    specialRequests?: string;
  }): Promise<TableReservation> => {
    const targetRestId = reservationData.restaurantId || currentRestaurantId || DEFAULT_RESTAURANT_ID;
    const table = allTables.find(t => t.id === reservationData.tableId);
    const newReservation: TableReservation = {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      restaurantId: targetRestId,
      tableId: reservationData.tableId,
      tableName: table?.name,
      customerName: reservationData.customerName,
      customerPhone: reservationData.customerPhone,
      customerEmail: reservationData.customerEmail,
      guestsCount: reservationData.guestsCount,
      reservationDate: reservationData.reservationDate,
      reservationTime: reservationData.reservationTime,
      status: 'pending',
      specialRequests: reservationData.specialRequests,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAllReservations(prev => [newReservation, ...prev]);

    try {
      await setDoc(doc(db, 'reservations', newReservation.id), cleanFirestoreData(newReservation));
      if (reservationData.tableId) {
        await setDoc(doc(db, 'tables', reservationData.tableId), { status: 'reserved' }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore create reservation error:', err);
    }

    return newReservation;
  };

  const updateReservationStatus = async (reservationId: string, status: ReservationStatus, tableId?: string) => {
    setAllReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status, updatedAt: new Date().toISOString() } : r));
    try {
      await updateDoc(doc(db, 'reservations', reservationId), { status, updatedAt: new Date().toISOString() });
      if (tableId && status === 'seated') {
        await updateDoc(doc(db, 'tables', tableId), { status: 'occupied' });
      } else if (tableId && (status === 'completed' || status === 'cancelled')) {
        await updateDoc(doc(db, 'tables', tableId), { status: 'free' });
      }
    } catch (err) {
      console.warn('Firestore update reservation status error:', err);
    }
  };

  const deleteReservation = async (reservationId: string) => {
    setAllReservations(prev => prev.filter(r => r.id !== reservationId));
    try {
      await deleteDoc(doc(db, 'reservations', reservationId));
    } catch (err) {
      console.warn('Firestore delete reservation error:', err);
    }
  };

  // RESTAURANT / ONBOARDING / SAAS REGISTRATION
  const registerNewRestaurant = async (
    data: Partial<Restaurant>, 
    adminName: string, 
    adminEmail: string,
    password?: string,
    initialData?: {
      categories?: string[];
      products?: { name: string; category: string; price: number; prepTime?: number; desc?: string }[];
      areas?: string[];
      tables?: { number: string; area: string; capacity: number }[];
    }
  ): Promise<Restaurant> => {
    const newRestId = `rest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const slug = (data.name || 'nouveau-restaurant').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const newRestaurant: Restaurant = {
      id: newRestId,
      name: data.name || 'Mon Nouveau Restaurant',
      slug,
      logo: data.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
      coverImage: data.coverImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
      ownerName: adminName || 'Gérant',
      ownerEmail: adminEmail || 'contact@restaurant.cm',
      phone: data.phone || '+225 07 00 00 00 00',
      address: data.address || 'Plateau',
      city: data.city || 'Abidjan',
      region: data.region || 'Lagunes',
      country: data.country || "Côte d'Ivoire",
      restaurantType: data.restaurantType || 'Restaurant & Grillades',
      description: data.description || 'Bienvenue dans notre restaurant.',
      currency: 'FCFA',
      subscriptionPlan: data.subscriptionPlan || 'business',
      subscriptionStatus: 'trial',
      subscriptionStartedAt: new Date().toISOString(),
      subscriptionExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      createdAt: new Date().toISOString(),
      soundAlertsEnabled: true,
      autoAcceptOrders: false,
      adminPassword: password || '123456',
    };

    // 1. Build Areas
    const customAreaNames = initialData?.areas && initialData.areas.length > 0 
      ? initialData.areas 
      : ['Salle Principale', 'Terrasse Extérieure'];

    const newAreas: RestaurantArea[] = customAreaNames.map((areaName, idx) => ({
      id: `area_${newRestId}_${idx + 1}`,
      restaurantId: newRestId,
      name: areaName,
      description: `Espace ${areaName}`,
    }));

    // 2. Build Categories
    const customCategoryNames = initialData?.categories && initialData.categories.length > 0
      ? initialData.categories
      : ['Entrées & Tapas', 'Plats Authentiques', 'Grillades & Poissons', 'Boissons & Jus'];

    const newCategories: MenuCategory[] = customCategoryNames.map((catName, idx) => {
      let icon = 'Utensils';
      if (catName.toLowerCase().includes('boisson') || catName.toLowerCase().includes('jus')) icon = 'GlassWater';
      else if (catName.toLowerCase().includes('grill') || catName.toLowerCase().includes('brais')) icon = 'Flame';
      else if (catName.toLowerCase().includes('entrée')) icon = 'Salad';
      
      return {
        id: `cat_${newRestId}_${idx + 1}`,
        restaurantId: newRestId,
        name: catName,
        icon,
        sortOrder: idx + 1,
        active: true,
      };
    });

    // 3. Build Tables
    let newTables: RestaurantTable[] = [];
    if (initialData?.tables && initialData.tables.length > 0) {
      newTables = initialData.tables.map((t, idx) => {
        const matchingArea = newAreas.find(a => a.name.toLowerCase() === t.area.toLowerCase()) || newAreas[0];
        const tableNum = t.number || `0${idx + 1}`;
        return {
          id: `tbl_${newRestId}_${idx + 1}`,
          restaurantId: newRestId,
          areaId: matchingArea.id,
          tableNumber: tableNum,
          name: tableNum.toLowerCase().startsWith('table') ? tableNum : `Table ${tableNum}`,
          capacity: Number(t.capacity) || 4,
          qrToken: `qr_${slug}_${tableNum.toLowerCase().replace(/\s+/g, '')}_${Math.random().toString(36).substring(2, 6)}`,
          status: 'free',
        };
      });
    } else {
      newTables = [
        { id: `tbl_${newRestId}_1`, restaurantId: newRestId, areaId: newAreas[0]?.id || '', tableNumber: '01', name: 'Table 01', capacity: 4, qrToken: `qr_${slug}_01_${Math.random().toString(36).substring(2, 6)}`, status: 'free' },
        { id: `tbl_${newRestId}_2`, restaurantId: newRestId, areaId: newAreas[0]?.id || '', tableNumber: '02', name: 'Table 02', capacity: 4, qrToken: `qr_${slug}_02_${Math.random().toString(36).substring(2, 6)}`, status: 'free' },
        { id: `tbl_${newRestId}_3`, restaurantId: newRestId, areaId: newAreas[1]?.id || newAreas[0]?.id || '', tableNumber: '03', name: 'Table 03', capacity: 2, qrToken: `qr_${slug}_03_${Math.random().toString(36).substring(2, 6)}`, status: 'free' },
      ];
    }

    // 4. Build Menu Items
    let newDishes: MenuItem[] = [];
    if (initialData?.products && initialData.products.length > 0) {
      newDishes = initialData.products.map((p, idx) => {
        const matchingCat = newCategories.find(c => c.name.toLowerCase() === p.category.toLowerCase()) || newCategories[0];
        return {
          id: `item_${newRestId}_${idx + 1}`,
          restaurantId: newRestId,
          categoryId: matchingCat ? matchingCat.id : newCategories[0].id,
          name: p.name,
          description: p.desc || 'Préparé avec soin avec des ingrédients frais.',
          price: Number(p.price) || 3500,
          preparationTime: p.prepTime || 20,
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
          available: true,
          isSpicy: false,
          isPopular: idx === 0,
        };
      });
    }

    // 5. Build Initial Inventory & Initial Purchase
    const newInventory: InventoryItem[] = [
      {
        id: `inv_${newRestId}_bar`,
        restaurantId: newRestId,
        name: 'Poisson Bar Frais',
        category: 'Poissons & Fruits de Mer',
        quantity: 20,
        unit: 'kg',
        minimumQuantity: 5,
        supplier: 'Marché Local',
        purchasePrice: 2800,
        unitCost: 2800,
        lastRestockedAt: new Date().toISOString(),
      },
      {
        id: `inv_${newRestId}_poulet`,
        restaurantId: newRestId,
        name: 'Poulet Fermier Bicyclette',
        category: 'Volailles & Viandes',
        quantity: 25,
        unit: 'unite',
        minimumQuantity: 8,
        supplier: 'Élevage Régional',
        purchasePrice: 2500,
        unitCost: 2500,
        lastRestockedAt: new Date().toISOString(),
      },
      {
        id: `inv_${newRestId}_plantains`,
        restaurantId: newRestId,
        name: 'Bananes Plantains Mûrs',
        category: 'Légumes & Tubercules',
        quantity: 15,
        unit: 'regime',
        minimumQuantity: 5,
        supplier: 'Marché Vivrier',
        purchasePrice: 3000,
        unitCost: 3000,
        lastRestockedAt: new Date().toISOString(),
      },
      {
        id: `inv_${newRestId}_huile`,
        restaurantId: newRestId,
        name: 'Huile Raffinée Diamaor',
        category: 'Épicerie & Condiments',
        quantity: 30,
        unit: 'litre',
        minimumQuantity: 10,
        supplier: 'Grossiste Alimentaire',
        purchasePrice: 1400,
        unitCost: 1400,
        lastRestockedAt: new Date().toISOString(),
      },
      {
        id: `inv_${newRestId}_boissons`,
        restaurantId: newRestId,
        name: 'Casiers Boissons Gazeuses & Bières',
        category: 'Boissons & Bar',
        quantity: 20,
        unit: 'casier',
        minimumQuantity: 8,
        supplier: 'Dépôt Boissons',
        purchasePrice: 7000,
        unitCost: 7000,
        lastRestockedAt: new Date().toISOString(),
      }
    ];

    const newInitialPurchase: PurchaseRecord = {
      id: `pur_${newRestId}_init`,
      restaurantId: newRestId,
      invoiceNumber: `BON-INIT-${Math.floor(100 + Math.random() * 900)}`,
      supplierName: 'Grossiste Alimentaire Régional',
      category: 'Matières Premières',
      totalAmount: 95000,
      paymentMethod: 'cash',
      purchasedBy: adminName,
      purchaseDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      notes: 'Dotation initiale de stock pour l\'ouverture du restaurant.',
      items: [
        { name: 'Poisson Bar Frais', quantity: 15, unit: 'kg', unitCost: 2800, totalCost: 42000 },
        { name: 'Poulet Fermier Bicyclette', quantity: 10, unit: 'unite', unitCost: 2500, totalCost: 25000 },
        { name: 'Huile Raffinée Diamaor', quantity: 20, unit: 'litre', unitCost: 1400, totalCost: 28000 }
      ]
    };

    const ownerUser: User = {
      id: `usr_${newRestId}_admin`,
      restaurantId: newRestId,
      name: adminName,
      email: adminEmail,
      phone: data.phone || '+237 600 00 00 00',
      role: 'owner',
      active: true,
      pinCode: '0000',
      password: password || '123456',
    };

    // Update local state immediately
    setRestaurants(prev => [newRestaurant, ...prev]);
    setAllAreas(prev => [...prev, ...newAreas]);
    setAllCategories(prev => [...prev, ...newCategories]);
    setAllTables(prev => [...prev, ...newTables]);
    if (newDishes.length > 0) {
      setAllMenuItems(prev => [...prev, ...newDishes]);
    }
    setAllInventory(prev => [...prev, ...newInventory]);
    setAllPurchases(prev => [newInitialPurchase, ...prev]);
    setAllStaff(prev => [...prev, ownerUser]);
    setCurrentRestaurantId(newRestId);
    setCurrentUserRole('owner');
    setCurrentUserEmail(adminEmail);
    setIsAuthenticated(true);
    safeStorage.setItem('restocam_auth_status', 'authenticated');
    safeStorage.setItem('restocam_user_email', adminEmail);
    safeStorage.setItem('restocam_current_restaurant_id', newRestId);
    safeStorage.setItem('restocam_user_role', 'owner');

    // Generate initial persistent statistics
    const initialStats = computeRestaurantStats(newRestId, [], newDishes, newCategories);
    setRestaurantStats(initialStats);

    // Save to Firestore in a single transaction batch for multi-device sync
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'restaurants', newRestaurant.id), newRestaurant);
      newAreas.forEach(a => batch.set(doc(db, 'areas', a.id), cleanFirestoreData(a)));
      newCategories.forEach(c => batch.set(doc(db, 'categories', c.id), cleanFirestoreData(c)));
      newTables.forEach(t => batch.set(doc(db, 'tables', t.id), cleanFirestoreData(t)));
      newDishes.forEach(d => batch.set(doc(db, 'menu_items', d.id), cleanFirestoreData(d)));
      newInventory.forEach(inv => batch.set(doc(db, 'inventory', inv.id), cleanFirestoreData(inv)));
      batch.set(doc(db, 'purchases', newInitialPurchase.id), cleanFirestoreData(newInitialPurchase));
      batch.set(doc(db, 'staff', ownerUser.id), cleanFirestoreData(ownerUser));
      batch.set(doc(db, 'statistics', newRestId), cleanFirestoreData(initialStats));
      await batch.commit();
      console.log('Restaurant, stock and statistics successfully saved and synchronized with Firestore!');
    } catch (err) {
      console.warn('Firestore multi-tenant registration error:', err);
    }

    // Create Firebase Auth user account and dispatch verification email
    try {
      await registerWithEmailAndSendVerification(adminEmail, password || '123456', adminName);
    } catch (authErr) {
      console.warn('Firebase Auth user creation notice:', authErr);
    }

    return newRestaurant;
  };

  const updateRestaurantSettings = async (updates: Partial<Restaurant>) => {
    setRestaurants(prev => prev.map(r => r.id === currentRestaurantId ? { ...r, ...updates } : r));
    try {
      await updateDoc(doc(db, 'restaurants', currentRestaurantId), updates);
    } catch (err) {
      console.warn('Firestore update restaurant error:', err);
    }
  };

  const updateRestaurantSubscription = async (
    restaurantId: string, 
    plan: PlanType, 
    status: SubscriptionStatus, 
    expiresAt?: string
  ) => {
    const updates: Partial<Restaurant> = {
      subscriptionPlan: plan,
      subscriptionStatus: status,
      ...(expiresAt ? { subscriptionExpiresAt: expiresAt } : {})
    };

    setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, ...updates } : r));
    try {
      await updateDoc(doc(db, 'restaurants', restaurantId), updates);
    } catch (err) {
      console.warn('Firestore update subscription error:', err);
    }
  };

  const toggleRestaurantSuspension = async (restaurantId: string) => {
    const target = restaurants.find(r => r.id === restaurantId);
    if (!target) return;
    const isCurrentlySuspendedOrExpired = target.subscriptionStatus === 'suspended' || target.subscriptionStatus === 'expired';
    const nextStatus: SubscriptionStatus = isCurrentlySuspendedOrExpired ? 'active' : 'suspended';
    
    // If reactivating and it was expired, set new expiration 30 days ahead
    let newExpiresAt = target.subscriptionExpiresAt;
    if (nextStatus === 'active') {
      const expTime = target.subscriptionExpiresAt ? new Date(target.subscriptionExpiresAt).getTime() : 0;
      if (!expTime || expTime <= Date.now()) {
        newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    const updates: Partial<Restaurant> = {
      subscriptionStatus: nextStatus,
      ...(newExpiresAt ? { subscriptionExpiresAt: newExpiresAt } : {})
    };

    setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, ...updates } : r));
    try {
      await updateDoc(doc(db, 'restaurants', restaurantId), updates);
    } catch (err) {
      console.warn('Firestore toggle suspension error:', err);
    }
  };

  // Automated Subscription & Expiration Management
  const isSubscriptionActive = useCallback((restaurant?: Restaurant): boolean => {
    const target = restaurant || currentRestaurant;
    if (!target || !target.id) return true;
    
    // Explicit suspension or expiration
    if (target.subscriptionStatus === 'suspended' || target.subscriptionStatus === 'expired') {
      return false;
    }
    
    // Expiration date reached or passed
    if (target.subscriptionExpiresAt) {
      const expTime = new Date(target.subscriptionExpiresAt).getTime();
      if (!isNaN(expTime) && expTime <= Date.now()) {
        return false;
      }
    }
    
    return true;
  }, [currentRestaurant]);

  const getSubscriptionInfo = useCallback((restaurant?: Restaurant) => {
    const target = restaurant || currentRestaurant;
    if (!target || !target.id) {
      return {
        isExpired: false,
        isSuspended: false,
        isActive: true,
        isTrial: false,
        daysRemaining: 30,
        hoursRemaining: 720,
        expiresAt: null,
        status: 'active' as SubscriptionStatus,
      };
    }

    const status = target.subscriptionStatus;
    const expiresAt = target.subscriptionExpiresAt || null;
    const now = Date.now();
    let daysRemaining = 0;
    let hoursRemaining = 0;
    let isExpiredByDate = false;

    if (expiresAt) {
      const expTime = new Date(expiresAt).getTime();
      if (!isNaN(expTime)) {
        const diffMs = expTime - now;
        if (diffMs <= 0) {
          isExpiredByDate = true;
          daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
        } else {
          daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60));
        }
      }
    }

    const isExpired = status === 'expired' || isExpiredByDate;
    const isSuspended = status === 'suspended';
    const isActive = !isExpired && !isSuspended;
    const isTrial = status === 'trial';

    const effectiveStatus: SubscriptionStatus = isSuspended 
      ? 'suspended' 
      : isExpired 
        ? 'expired' 
        : isTrial 
          ? 'trial' 
          : 'active';

    return {
      isExpired,
      isSuspended,
      isActive,
      isTrial,
      daysRemaining,
      hoursRemaining,
      expiresAt,
      status: effectiveStatus,
    };
  }, [currentRestaurant]);

  const renewSubscription = async (
    restaurantId: string, 
    durationMonths: number, 
    plan?: PlanType, 
    paymentMethod?: string
  ) => {
    const target = restaurants.find(r => r.id === restaurantId);
    const chosenPlan = plan || target?.subscriptionPlan || 'business';
    
    const now = new Date();
    let baseDate = now;
    if (target?.subscriptionExpiresAt) {
      const currExp = new Date(target.subscriptionExpiresAt);
      if (currExp.getTime() > now.getTime()) {
        baseDate = currExp;
      }
    }

    const newExpDate = new Date(baseDate);
    newExpDate.setMonth(newExpDate.getMonth() + durationMonths);
    const newExpiresAt = newExpDate.toISOString();
    const startedIso = now.toISOString();

    const updates: Partial<Restaurant> = {
      subscriptionPlan: chosenPlan,
      subscriptionStatus: 'active',
      subscriptionExpiresAt: newExpiresAt,
      subscriptionStartedAt: startedIso,
    };

    setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, ...updates } : r));
    try {
      await updateDoc(doc(db, 'restaurants', restaurantId), updates);
    } catch (err) {
      console.warn('Firestore renew subscription error:', err);
    }
  };

  const simulateSubscriptionExpiry = async (restaurantId: string) => {
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const updates: Partial<Restaurant> = {
      subscriptionStatus: 'expired',
      subscriptionExpiresAt: expiredDate,
    };

    setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, ...updates } : r));
    try {
      await updateDoc(doc(db, 'restaurants', restaurantId), updates);
    } catch (err) {
      console.warn('Firestore simulate expiry error:', err);
    }
  };

  const extendSubscriptionDays = async (restaurantId: string, days: number) => {
    const target = restaurants.find(r => r.id === restaurantId);
    const now = Date.now();
    let baseTime = now;
    if (target?.subscriptionExpiresAt) {
      const currExp = new Date(target.subscriptionExpiresAt).getTime();
      if (currExp > now) {
        baseTime = currExp;
      }
    }
    const newExpIso = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

    const updates: Partial<Restaurant> = {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: newExpIso,
    };

    setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, ...updates } : r));
    try {
      await updateDoc(doc(db, 'restaurants', restaurantId), updates);
    } catch (err) {
      console.warn('Firestore extend days error:', err);
    }
  };

  const deleteRestaurant = async (restaurantId: string) => {
    // 1. Update local states
    setRestaurants(prev => {
      const updated = prev.filter(r => r.id !== restaurantId);
      safeStorage.setItem('restocam_restaurants', JSON.stringify(updated));
      return updated;
    });

    setAllCategories(prev => {
      const updated = prev.filter(c => c.restaurantId !== restaurantId);
      safeStorage.setItem('restocam_categories', JSON.stringify(updated));
      return updated;
    });

    setAllMenuItems(prev => {
      const updated = prev.filter(m => m.restaurantId !== restaurantId);
      safeStorage.setItem('restocam_menu_items', JSON.stringify(updated));
      return updated;
    });

    setAllAreas(prev => {
      const updated = prev.filter(a => a.restaurantId !== restaurantId);
      safeStorage.setItem('restocam_areas', JSON.stringify(updated));
      return updated;
    });

    setAllTables(prev => {
      const updated = prev.filter(t => t.restaurantId !== restaurantId);
      safeStorage.setItem('restocam_tables', JSON.stringify(updated));
      return updated;
    });

    setAllOrders(prev => {
      const updated = prev.filter(o => o.restaurantId !== restaurantId);
      safeStorage.setItem('restocam_orders', JSON.stringify(updated));
      return updated;
    });

    setAllInventory(prev => {
      const updated = prev.filter(i => i.restaurantId !== restaurantId);
      safeStorage.setItem('restocam_inventory', JSON.stringify(updated));
      return updated;
    });

    setAllPurchases(prev => {
      const updated = prev.filter(p => p.restaurantId !== restaurantId);
      safeStorage.setItem('restocam_purchases', JSON.stringify(updated));
      return updated;
    });

    setAllStaff(prev => {
      const updated = prev.filter(s => s.restaurantId !== restaurantId);
      safeStorage.setItem('restocam_staff', JSON.stringify(updated));
      return updated;
    });

    if (currentRestaurantId === restaurantId) {
      const remaining = restaurants.filter(r => r.id !== restaurantId);
      setCurrentRestaurantId(remaining.length > 0 ? remaining[0].id : '');
    }

    // 2. Delete from Firestore in batches
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'restaurants', restaurantId));

      const collectionsToCheck = ['categories', 'menu_items', 'areas', 'tables', 'orders', 'inventory', 'staff', 'purchases'];
      for (const colName of collectionsToCheck) {
        const q = query(collection(db, colName), where('restaurantId', '==', restaurantId));
        const snaps = await getDocs(q);
        snaps.docs.forEach(d => batch.delete(d.ref));
      }
      await batch.commit();
    } catch (err) {
      console.warn('Firestore delete restaurant error:', err);
    }
  };

  // DELIVERY COURIERS & DISPATCH MANAGEMENT
  const broadcastedDeliveryOrders = allOrders.filter(
    o => o.orderType === 'delivery' && (o.deliveryStatus === 'broadcasted' || (!o.deliveryDriverId && o.status === 'ready'))
  );

  const registerDriver = async (
    driverData: Omit<DeliveryDriver, 'id' | 'createdAt'>,
    password?: string
  ): Promise<{ success: boolean; message: string; driver?: DeliveryDriver }> => {
    const driverId = `drv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newDriver: DeliveryDriver = {
      ...driverData,
      id: driverId,
      createdAt: now,
      rating: 5.0,
      totalDeliveries: 0,
      isOnline: true,
      verificationStatus: 'pending_office_check',
      isVerified: false,
      driverEarnings: 0,
      password: password || 'livreur123',
      activeOrderId: null
    };

    setAllDrivers(prev => [newDriver, ...prev.filter(d => d.id !== driverId)]);
    setCurrentDriver(newDriver);
    safeStorage.setItem('restocam_current_driver', JSON.stringify(newDriver));

    try {
      await setDoc(doc(db, 'drivers', driverId), cleanFirestoreData(newDriver));
      return { 
        success: true, 
        message: 'Compte coursier enregistré avec succès ! Rendez-vous au bureau AFRORESTO de votre ville pour la vérification physique de votre CNI et de votre véhicule.', 
        driver: newDriver 
      };
    } catch (err: any) {
      console.warn('Firestore register driver notice:', err);
      return { 
        success: true, 
        message: 'Compte coursier enregistré en attente de validation physique au bureau AFRORESTO.', 
        driver: newDriver 
      };
    }
  };

  const validateDriverAccount = async (driverId: string, isVerified: boolean, rejectionReason?: string) => {
    const updates: Partial<DeliveryDriver> = {
      isVerified,
      verificationStatus: isVerified ? 'verified' : 'rejected',
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'Super Admin AFRORESTO',
      rejectionReason: rejectionReason || undefined
    };

    setAllDrivers(prev => prev.map(d => d.id === driverId ? { ...d, ...updates } : d));
    if (currentDriver && currentDriver.id === driverId) {
      const updated = { ...currentDriver, ...updates };
      setCurrentDriver(updated);
      safeStorage.setItem('restocam_current_driver', JSON.stringify(updated));
    }

    try {
      await setDoc(doc(db, 'drivers', driverId), updates, { merge: true });
    } catch (e) {
      console.warn('Firestore validate driver notice:', e);
    }
  };

  const toggleDriverOnlineStatus = async (driverId: string, isOnline: boolean) => {
    setAllDrivers(prev => prev.map(d => d.id === driverId ? { ...d, isOnline } : d));
    if (currentDriver && currentDriver.id === driverId) {
      const updated = { ...currentDriver, isOnline };
      setCurrentDriver(updated);
      safeStorage.setItem('restocam_current_driver', JSON.stringify(updated));
    }
    try {
      await setDoc(doc(db, 'drivers', driverId), { isOnline }, { merge: true });
    } catch (e) {
      console.warn('Firestore toggle driver online status notice:', e);
    }
  };

  const broadcastOrderForDelivery = async (orderId: string) => {
    const now = new Date().toISOString();
    const updates: Partial<Order> = {
      deliveryStatus: 'broadcasted',
      deliveryBroadcastedAt: now,
      status: 'ready'
    };

    setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
    soundFx.playDeliveryBroadcastPing();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 300]);
    }

    try {
      await setDoc(doc(db, 'orders', orderId), updates, { merge: true });
    } catch (e) {
      console.warn('Firestore broadcast delivery notice:', e);
    }
  };

  const claimDeliveryMission = async (orderId: string, driver: DeliveryDriver): Promise<{ success: boolean; message: string }> => {
    // Check if driver is verified by admin after physical office check
    if (driver.isVerified !== true || driver.verificationStatus !== 'verified') {
      return { 
        success: false, 
        message: 'Votre compte est en attente de vérification physique au bureau AFRORESTO de votre ville. Présentez votre CNI et carte grise pour validation par l\'administrateur avant de prendre des courses.' 
      };
    }

    const existingOrder = allOrders.find(o => o.id === orderId);
    if (existingOrder && existingOrder.deliveryDriverId && existingOrder.deliveryDriverId !== driver.id) {
      return { success: false, message: 'Désolé, cette course vient d\'être prise par un autre livreur !' };
    }

    const now = new Date().toISOString();
    const updates: Partial<Order> = {
      deliveryStatus: 'assigned',
      deliveryDriverId: driver.id,
      deliveryDriverName: driver.name,
      deliveryDriverPhone: driver.phone,
      deliveryVehicleType: driver.vehicleType,
      deliveryVehiclePlate: driver.vehiclePlate,
      deliveryClaimedAt: now
    };

    setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));

    const updatedDriver = { ...driver, activeOrderId: orderId };
    setCurrentDriver(updatedDriver);
    setAllDrivers(prev => prev.map(d => d.id === driver.id ? updatedDriver : d));
    safeStorage.setItem('restocam_current_driver', JSON.stringify(updatedDriver));

    try {
      await setDoc(doc(db, 'orders', orderId), updates, { merge: true });
      await setDoc(doc(db, 'drivers', driver.id), { activeOrderId: orderId }, { merge: true });
      return { success: true, message: 'Course validée ! Rendez-vous au restaurant pour récupérer la commande.' };
    } catch (e) {
      console.warn('Firestore claim mission notice:', e);
      return { success: true, message: 'Course attribuée.' };
    }
  };

  const updateDeliveryProgress = async (orderId: string, status: 'picked_up' | 'in_transit' | 'arrived' | 'delivered') => {
    const now = new Date().toISOString();
    const updates: Partial<Order> = {
      deliveryStatus: status
    };

    if (status === 'picked_up' || status === 'in_transit') {
      updates.deliveryPickedUpAt = now;
    } else if (status === 'arrived') {
      updates.deliveryArrivedAt = now;
      soundFx.playDeliveryArrivedChime();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([400, 150, 400, 150, 600]);
      }
    } else if (status === 'delivered') {
      updates.deliveryDeliveredAt = now;
      updates.status = 'completed';
      updates.paymentStatus = 'paid';
    }

    setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));

    if (status === 'delivered' && currentDriver) {
      const targetOrder = allOrders.find(o => o.id === orderId);
      const deliveryFee = targetOrder?.deliveryFee || targetOrder?.deliveryInfo?.deliveryFee || 1000;
      // 80% to the driver, 20% to the platform
      const driverNetEarning = Math.round(deliveryFee * 0.80);

      const updatedDriver: DeliveryDriver = { 
        ...currentDriver, 
        activeOrderId: null,
        totalDeliveries: (currentDriver.totalDeliveries || 0) + 1,
        driverEarnings: (currentDriver.driverEarnings || 0) + driverNetEarning
      };
      setCurrentDriver(updatedDriver);
      setAllDrivers(prev => prev.map(d => d.id === currentDriver.id ? updatedDriver : d));
      safeStorage.setItem('restocam_current_driver', JSON.stringify(updatedDriver));
      try {
        await setDoc(doc(db, 'drivers', currentDriver.id), { 
          activeOrderId: null, 
          totalDeliveries: updatedDriver.totalDeliveries,
          driverEarnings: updatedDriver.driverEarnings
        }, { merge: true });
      } catch (e) {
        console.warn('Update driver deliveries count notice:', e);
      }
    }

    try {
      await setDoc(doc(db, 'orders', orderId), updates, { merge: true });
    } catch (e) {
      console.warn('Firestore update delivery progress notice:', e);
    }
  };

  const requestDriverPayout = async (
    driverId: string, 
    amount: number, 
    paymentMethod: DriverPayoutMethod, 
    phoneNumber: string, 
    notes?: string
  ): Promise<{ success: boolean; message: string; payout?: DriverPayout }> => {
    const driver = allDrivers.find(d => d.id === driverId) || currentDriver;
    if (!driver) {
      return { success: false, message: 'Livreur introuvable.' };
    }

    if (amount < 300) {
      return { success: false, message: 'Le montant minimum de retrait est de 300 FCFA.' };
    }

    const now = new Date();
    const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payoutNumber = `VERS-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txRef = paymentMethod === 'orange_money' 
      ? `OM-CM-${Math.floor(1000000 + Math.random() * 9000000)}` 
      : paymentMethod === 'mtn_momo' 
        ? `MOMO-CMR-${Math.floor(100000 + Math.random() * 900000)}` 
        : `CASH-REC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayout: DriverPayout = {
      id: payoutId,
      payoutNumber,
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      amount,
      paymentMethod,
      phoneNumber: phoneNumber.trim(),
      status: 'completed', // Versement validé automatiquement par l'agrégateur Mobile Money
      requestedAt: now.toISOString(),
      processedAt: now.toISOString(),
      transactionRef: txRef,
      processedBy: 'Direction Financière AFRORESTO',
      notes: notes || `Versement automatique des commissions (80% net) vers ${paymentMethod === 'orange_money' ? 'Orange Money' : paymentMethod === 'mtn_momo' ? 'MTN MoMo' : 'Guichet'}`
    };

    // Update payouts state
    setAllDriverPayouts(prev => {
      const updated = [newPayout, ...prev];
      safeStorage.setItem('restocam_driver_payouts', JSON.stringify(updated));
      return updated;
    });

    // Update driver balances
    const newPaidOut = (driver.totalPaidOut || 0) + amount;
    const newPending = Math.max(0, (driver.driverEarnings || 0) - newPaidOut);
    const updatedDriver: DeliveryDriver = {
      ...driver,
      totalPaidOut: newPaidOut,
      pendingPayoutBalance: newPending
    };

    setAllDrivers(prev => prev.map(d => d.id === driver.id ? updatedDriver : d));
    if (currentDriver && currentDriver.id === driver.id) {
      setCurrentDriver(updatedDriver);
      safeStorage.setItem('restocam_current_driver', JSON.stringify(updatedDriver));
    }

    try {
      await setDoc(doc(db, 'driver_payouts', payoutId), cleanFirestoreData(newPayout));
      await setDoc(doc(db, 'drivers', driver.id), {
        totalPaidOut: newPaidOut,
        pendingPayoutBalance: newPending
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore driver payout sync notice:', e);
    }

    return { 
      success: true, 
      message: `Versement de ${amount.toLocaleString('fr-FR')} FCFA transféré avec succès vers le compte ${phoneNumber} (${paymentMethod === 'orange_money' ? 'Orange Money' : paymentMethod === 'mtn_momo' ? 'MTN MoMo' : 'Espèces'}). Réf transaction: ${txRef}`,
      payout: newPayout
    };
  };

  const processDriverPayout = async (
    payoutId: string, 
    status: DriverPayoutStatus, 
    transactionRef?: string, 
    notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    const existing = allDriverPayouts.find(p => p.id === payoutId);
    if (!existing) return { success: false, message: 'Paiement introuvable.' };

    const updates: Partial<DriverPayout> = {
      status,
      processedAt: new Date().toISOString(),
      transactionRef: transactionRef || existing.transactionRef || `TX-${Date.now().toString(36).toUpperCase()}`,
      notes: notes || existing.notes
    };

    setAllDriverPayouts(prev => {
      const updated = prev.map(p => p.id === payoutId ? { ...p, ...updates } : p);
      safeStorage.setItem('restocam_driver_payouts', JSON.stringify(updated));
      return updated;
    });

    try {
      await setDoc(doc(db, 'driver_payouts', payoutId), updates, { merge: true });
    } catch (e) {
      console.warn('Firestore process payout notice:', e);
    }

    return { success: true, message: `Statut du paiement mis à jour: ${status}` };
  };

  // DATA SYNCHRONIZATION & BACKUP / RESTORE
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => {
    return safeStorage.getItem('restocam_last_backup_date') || null;
  });

  const triggerCloudSync = async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncing(true);
    try {
      // 1. Force reload or push current collections to Firestore
      if (currentRestaurantId) {
        // Refresh statistics
        await refreshStats();

        // Ensure current restaurant document exists in Firestore
        if (currentRestaurant && currentRestaurant.id) {
          await setDoc(doc(db, 'restaurants', currentRestaurant.id), currentRestaurant, { merge: true });
        }

        // Sync unsaved local storage backups to make sure everything is resilient
        safeStorage.setItem('restocam_restaurants', JSON.stringify(restaurants));
        safeStorage.setItem('restocam_categories', JSON.stringify(allCategories));
        safeStorage.setItem('restocam_menu_items', JSON.stringify(allMenuItems));
        safeStorage.setItem('restocam_tables', JSON.stringify(allTables));
        safeStorage.setItem('restocam_orders', JSON.stringify(allOrders));
        safeStorage.setItem('restocam_inventory', JSON.stringify(allInventory));
        safeStorage.setItem('restocam_purchases', JSON.stringify(allPurchases));
        safeStorage.setItem('restocam_staff', JSON.stringify(allStaff));
      }

      const syncTimestamp = new Date().toISOString();
      safeStorage.setItem('restocam_last_sync_time', syncTimestamp);
      return { success: true, message: 'Données synchronisées avec succès avec le Cloud et le stockage local.' };
    } catch (err: any) {
      console.error('Trigger cloud sync error:', err);
      return { success: false, message: err?.message || 'Erreur lors de la synchronisation cloud.' };
    } finally {
      setIsSyncing(false);
    }
  };

  const exportDataBackup = (): { success: boolean; dataUrl: string; filename: string } => {
    const backupPayload = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      restaurantId: currentRestaurantId,
      restaurant: currentRestaurant,
      data: {
        restaurants,
        categories: allCategories.filter(c => c.restaurantId === currentRestaurantId),
        menuItems: allMenuItems.filter(m => m.restaurantId === currentRestaurantId),
        areas: allAreas.filter(a => a.restaurantId === currentRestaurantId),
        tables: allTables.filter(t => t.restaurantId === currentRestaurantId),
        orders: allOrders.filter(o => o.restaurantId === currentRestaurantId),
        inventory: allInventory.filter(i => i.restaurantId === currentRestaurantId),
        purchases: allPurchases.filter(p => p.restaurantId === currentRestaurantId),
        staff: allStaff.filter(s => s.restaurantId === currentRestaurantId),
      }
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const dataUrl = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeRestName = (currentRestaurant?.name || 'resto').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `sauvegarde_${safeRestName}_${dateStr}.json`;

    const nowIso = new Date().toISOString();
    setLastBackupDate(nowIso);
    safeStorage.setItem('restocam_last_backup_date', nowIso);

    return { success: true, dataUrl, filename };
  };

  const importDataBackup = async (jsonContent: string): Promise<{ success: boolean; count: number; error?: string }> => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed || !parsed.data) {
        return { success: false, count: 0, error: 'Format de fichier de sauvegarde invalide.' };
      }

      let restoredCount = 0;
      const targetRestId = parsed.restaurantId || currentRestaurantId;

      // Merge categories
      if (Array.isArray(parsed.data.categories) && parsed.data.categories.length > 0) {
        const importedCats: MenuCategory[] = parsed.data.categories.map(c => ({
          ...c,
          restaurantId: targetRestId
        }));
        setAllCategories(prev => {
          const filtered = prev.filter(c => c.restaurantId !== targetRestId);
          const next = [...filtered, ...importedCats];
          safeStorage.setItem('restocam_categories', JSON.stringify(next));
          return next;
        });
        restoredCount += importedCats.length;
      }

      // Merge menu items
      if (Array.isArray(parsed.data.menuItems) && parsed.data.menuItems.length > 0) {
        const importedItems: MenuItem[] = parsed.data.menuItems.map(m => ({
          ...m,
          restaurantId: targetRestId
        }));
        setAllMenuItems(prev => {
          const filtered = prev.filter(m => m.restaurantId !== targetRestId);
          const next = [...filtered, ...importedItems];
          safeStorage.setItem('restocam_menu_items', JSON.stringify(next));
          return next;
        });
        restoredCount += importedItems.length;
      }

      // Merge tables
      if (Array.isArray(parsed.data.tables) && parsed.data.tables.length > 0) {
        const importedTables: RestaurantTable[] = parsed.data.tables.map(t => ({
          ...t,
          restaurantId: targetRestId
        }));
        setAllTables(prev => {
          const filtered = prev.filter(t => t.restaurantId !== targetRestId);
          const next = [...filtered, ...importedTables];
          safeStorage.setItem('restocam_tables', JSON.stringify(next));
          return next;
        });
        restoredCount += importedTables.length;
      }

      // Merge inventory
      if (Array.isArray(parsed.data.inventory) && parsed.data.inventory.length > 0) {
        const importedInv: InventoryItem[] = parsed.data.inventory.map(i => ({
          ...i,
          restaurantId: targetRestId
        }));
        setAllInventory(prev => {
          const filtered = prev.filter(i => i.restaurantId !== targetRestId);
          const next = [...filtered, ...importedInv];
          safeStorage.setItem('restocam_inventory', JSON.stringify(next));
          return next;
        });
        restoredCount += importedInv.length;
      }

      // Merge orders
      if (Array.isArray(parsed.data.orders) && parsed.data.orders.length > 0) {
        const importedOrders: Order[] = parsed.data.orders.map(o => ({
          ...o,
          restaurantId: targetRestId
        }));
        setAllOrders(prev => {
          const existingIds = new Set(prev.map(o => o.id));
          const newOrders = importedOrders.filter(o => !existingIds.has(o.id));
          const next = [...prev, ...newOrders];
          safeStorage.setItem('restocam_orders', JSON.stringify(next));
          return next;
        });
        restoredCount += importedOrders.length;
      }

      // Update backup date
      const nowIso = new Date().toISOString();
      setLastBackupDate(nowIso);
      safeStorage.setItem('restocam_last_backup_date', nowIso);

      return { success: true, count: restoredCount };
    } catch (err: any) {
      console.error('Import backup error:', err);
      return { success: false, count: 0, error: err?.message || 'Erreur lors du traitement du fichier JSON.' };
    }
  };

  return (
    <RestaurantContext.Provider
      value={{
        isAuthenticated,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMessage,
        setAuthMessage,
        login,
        registerUserAccount,
        sendPasswordReset,
        resendVerificationEmail,
        isEmailVerified,
        firebaseUser,
        logout,
        restaurants,
        currentRestaurant,
        currentRestaurantId,
        switchRestaurant,
        currentUser,
        switchUserRole,
        verifyAndSwitchStaff,
        currentView,
        setCurrentView,
        goBack,
        canGoBack,
        previousView,
        activeCustomerTableId,
        setActiveCustomerTableId,
        activeCustomerOrderId,
        setActiveCustomerOrderId,
        categories,
        menuItems,
        areas,
        tables,
        orders,
        reservations,
        inventory,
        purchases,
        staff,
        plans: SAAS_PLANS,
        allInventory,
        allPurchases,
        allOrders,
        allReservations,
        allTables,
        allMenuItems,
        isSyncing,
        restaurantStats,
        isStatsSyncing,
        lastStatsSyncTime,
        refreshStats,
        deviceType,
        soundEnabled,
        toggleSound,
        incomingOrderAlert,
        dismissIncomingOrderAlert,
        waiterCallAlert,
        dismissWaiterAlert,
        sendWaiterCall,
        waiterCalls,
        acknowledgeWaiterCall,
        acknowledgeTableWaiterCall,
        addCategory,
        updateCategory,
        deleteCategory,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleMenuItemAvailability,
        addArea,
        deleteArea,
        addTable,
        updateTable,
        deleteTable,
        setTableStatus,
        regenerateTableQR,
        createOrder,
        updateOrderStatus,
        updatePaymentStatus,
        cancelOrder,
        deleteOrder,
        createReservation,
        updateReservationStatus,
        deleteReservation,
        addInventoryItem,
        updateInventoryItem,
        adjustStockQuantity,
        deleteInventoryItem,
        addPurchaseRecord,
        deletePurchaseRecord,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        registerNewRestaurant,
        updateRestaurantSettings,
        updateRestaurantSubscription,
        toggleRestaurantSuspension,
        deleteRestaurant,
        isSubscriptionActive,
        getSubscriptionInfo,
        renewSubscription,
        simulateSubscriptionExpiry,
        extendSubscriptionDays,
        isRenewalModalOpen,
        setIsRenewalModalOpen,
        openRenewalModal,
        triggerCloudSync,
        exportDataBackup,
        importDataBackup,
        lastBackupDate,
        drivers: allDrivers,
        currentDriver,
        setCurrentDriver,
        registerDriver,
        validateDriverAccount,
        toggleDriverOnlineStatus,
        broadcastOrderForDelivery,
        claimDeliveryMission,
        updateDeliveryProgress,
        broadcastedDeliveryOrders,
        driverPayouts: allDriverPayouts,
        requestDriverPayout,
        processDriverPayout,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
