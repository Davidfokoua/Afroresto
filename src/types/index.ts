export type UserRole = 
  | 'owner' 
  | 'manager' 
  | 'cashier' 
  | 'waiter' 
  | 'chef' 
  | 'accountant' 
  | 'superadmin'
  | 'delivery';

export type PlanType = 'starter' | 'business' | 'premium';
export type SubscriptionStatus = 'active' | 'trial' | 'suspended' | 'expired';

export type ThermalWidth = '58mm' | '80mm';
export type TicketType = 'receipt' | 'kitchen' | 'both';

export interface PrinterSettings {
  defaultWidth: ThermalWidth;
  showLogo: boolean;
  showQrCode: boolean;
  showTaxMention: boolean;
  taxMention?: string; // e.g. "Tous nos prix sont nets en FCFA (TTC)"
  headerCustomText?: string; // Slogan, mention RCCM / NIF
  footerCustomText?: string; // e.g. "Merci de votre visite et à très bientôt !"
  wifiCode?: string; // e.g. "WiFi: RestoGuest / pass: 2024"
  autoPrintKOTOnAccept?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  coverImage: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  country: string;
  restaurantType: string;
  description: string;
  currency: string; // e.g. "FCFA"
  subscriptionPlan: PlanType;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: string; // ISO date string when subscription expires
  subscriptionStartedAt?: string; // ISO date string when subscription started/renewed
  autoRenew?: boolean;
  createdAt: string;
  soundAlertsEnabled: boolean;
  autoAcceptOrders: boolean;
  adminPassword?: string;
  customDomain?: string;
  printerSettings?: PrinterSettings;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewsCount?: number;
  deliveryMinMinutes?: number;
  deliveryMaxMinutes?: number;
  deliveryFeeBase?: number;
  freeDeliveryThreshold?: number;
  cuisineTypes?: string[];
  neighborhood?: string;
  isOpenNow?: boolean;
  minOrderAmount?: number;
  distanceKm?: number;
}

export interface User {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  isActive?: boolean;
  avatarUrl?: string;
  pinCode?: string;
  password?: string;
  emailVerified?: boolean;
  firebaseUid?: string;
  createdAt?: string;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  active: boolean;
}

export type MenuItemVisibility = 'public' | 'local';

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  image: string;
  price: number; // in FCFA
  available: boolean;
  preparationTime: number; // in minutes
  isPopular?: boolean;
  isSpicy?: boolean;
  badge?: string;
  visibility?: MenuItemVisibility; // 'public' (visible par tous en ligne Meituan + QR) ou 'local' (visible uniquement au scan du QR du restaurant)
}

export interface RestaurantArea {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
}

export type TableStatus = 'free' | 'occupied' | 'reserved' | 'cleaning';

export interface RestaurantTable {
  id: string;
  restaurantId: string;
  areaId: string;
  tableNumber: string;
  name: string;
  capacity: number;
  qrToken: string;
  status: TableStatus;
  currentOrderId?: string;
  waiterCalled?: boolean;
  lastWaiterCall?: string;
}

export interface WaiterCall {
  id: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  areaName?: string;
  status: 'pending' | 'acknowledged' | 'completed';
  createdAt: string;
  notes?: string;
}

export type Table = RestaurantTable;

export type OrderStatus = 
  | 'new'          // Nouvelle
  | 'accepted'     // Acceptée
  | 'preparing'    // En préparation
  | 'ready'        // Prête
  | 'in_service'   // En service
  | 'served'       // Servie
  | 'completed'    // Terminée
  | 'cancelled';   // Annulée

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'orange_money' | 'mtn_momo' | 'card' | 'pending';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface DeliveryInfo {
  address: string;
  city?: string;
  neighborhood?: string; // Quartier / Repère
  notes?: string;
  deliveryFee?: number;
}

export type DeliveryStatus = 
  | 'pending_broadcast' 
  | 'broadcasted' 
  | 'assigned' 
  | 'picked_up' 
  | 'in_transit' 
  | 'arrived' 
  | 'delivered';

export type VehicleType = 'moto' | 'scooter' | 'velo' | 'voiture';

export type DriverVerificationStatus = 'pending_office_check' | 'verified' | 'rejected' | 'suspended';

export interface DeliveryDriver {
  id: string; // e.g. "drv_..."
  name: string;
  email: string;
  phone: string;
  cniNumber: string; // Carte Nationale d'Identité / Passeport
  cniPhotoUrl?: string;
  address: string;
  vehicleType: VehicleType;
  vehiclePlate: string; // Matricule du véhicule (e.g. "LT-842-AB")
  serviceZones: string[]; // e.g. ["Akwa", "Bonanjo", "Deido", "Bastos"]
  serviceCity: string; // e.g. "Douala" | "Yaoundé" | "Abidjan"
  isOnline: boolean; // En ligne / Disponible pour les courses
  verificationStatus?: DriverVerificationStatus; // 'pending_office_check' -> doit passer au bureau AFRORESTO
  isVerified?: boolean; // Confirmé par l'admin après vérification physique
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  driverEarnings?: number; // Total gains nets livreur accumulés (80% des commissions de livraison)
  totalPaidOut?: number; // Total montants déjà versés par la plateforme
  pendingPayoutBalance?: number; // Solde net restant disponible pour retrait
  rating?: number;
  totalDeliveries?: number;
  activeOrderId?: string | null;
  createdAt: string;
  password?: string;
}

export type DriverPayoutMethod = 'orange_money' | 'mtn_momo' | 'cash_office';
export type DriverPayoutStatus = 'pending' | 'completed' | 'rejected';

export interface DriverPayout {
  id: string; // e.g. "payout_..."
  payoutNumber: string; // e.g. "VERS-2025-0042"
  driverId: string;
  driverName: string;
  driverPhone: string;
  amount: number; // in FCFA
  paymentMethod: DriverPayoutMethod;
  phoneNumber: string; // Numéro Mobile Money pour le versement
  status: DriverPayoutStatus;
  requestedAt: string;
  processedAt?: string;
  transactionRef?: string; // ex: "OM-TX-9842104" ou "MOMO-REF-772183"
  processedBy?: string;
  notes?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  tableId: string;
  tableName: string;
  areaName: string;
  orderNumber: string; // e.g. "CMD-000125"
  orderType?: OrderType; // 'dine_in' (sur place), 'takeaway' (à emporter), 'delivery' (livraison à domicile/bureau)
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  totalAmount: number; // FCFA
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryInfo?: DeliveryInfo;
  deliveryStatus?: DeliveryStatus;
  deliveryDriverId?: string;
  deliveryDriverName?: string;
  deliveryDriverPhone?: string;
  deliveryVehicleType?: VehicleType | string;
  deliveryVehiclePlate?: string;
  deliveryBroadcastedAt?: string;
  deliveryClaimedAt?: string;
  deliveryPickedUpAt?: string;
  deliveryArrivedAt?: string;
  deliveryDeliveredAt?: string;
  deliveryFee?: number; // Total commission payée par le client (300 à 1500 FCFA)
  platformFee?: number; // Prélèvement plateforme 20%
  driverFee?: number; // Rémunération nette livreur 80%
  estimatedDeliveryMinutes?: number;
  notes?: string;
  serverName?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'seated' | 'completed';

export interface TableReservation {
  id: string;
  restaurantId: string;
  tableId?: string;
  tableName?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  guestsCount: number;
  reservationDate: string; // YYYY-MM-DD
  reservationTime: string; // HH:mm
  status: ReservationStatus;
  specialRequests?: string;
  preOrderedItems?: OrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface RestaurantStatistics {
  id: string; // e.g. "stats_" + restaurantId
  restaurantId: string;
  totalRevenue: number; // Chiffre d'affaires total payé en FCFA
  totalOrdersCount: number; // Nombre total de commandes reçues
  paidOrdersCount: number; // Commandes encaissées
  unpaidOrdersCount: number; // Commandes non réglées
  pendingOrdersCount: number; // Commandes en attente de validation
  preparingOrdersCount: number; // Commandes en cuisine
  readyOrdersCount: number; // Commandes prêtes
  servedOrdersCount: number; // Commandes servies à table
  completedOrdersCount: number; // Commandes terminées
  cancelledOrdersCount: number; // Commandes annulées
  avgTicket: number; // Panier moyen en FCFA
  salesByPaymentMethod: {
    cash: number;
    orange_money: number;
    mtn_momo: number;
    card: number;
    pending?: number;
  };
  salesByCategory: Record<string, number>;
  salesByDayOfWeek: Record<string, { sales: number; orders: number; cost: number }>;
  hourlyDistribution: Record<string, number>;
  dailyHistory: Record<string, { date: string; revenue: number; ordersCount: number; avgTicket: number }>;
  lastUpdated: string;
  lastSyncDevice?: string;
}

export type InventoryUnit = 'kg' | 'litre' | 'unite' | 'carton' | 'sac' | 'casier';

export interface InventoryItem {
  id: string;
  restaurantId: string;
  name: string;
  category: string;
  quantity: number;
  unit: InventoryUnit | string;
  minimumQuantity: number;
  supplier: string;
  purchasePrice: number; // FCFA
  unitCost?: number; // alias
  lastRestockedAt: string;
}

export interface PurchaseItemDetail {
  inventoryItemId?: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number; // in FCFA
  totalCost: number; // in FCFA
}

export interface PurchaseRecord {
  id: string;
  restaurantId: string;
  invoiceNumber?: string;
  supplierName: string;
  supplierPhone?: string;
  category: string;
  items: PurchaseItemDetail[];
  totalAmount: number; // in FCFA
  paymentMethod: 'cash' | 'orange_money' | 'mtn_momo' | 'bank_transfer' | 'credit' | string;
  purchasedBy?: string;
  notes?: string;
  purchaseDate: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  tagline: string;
  priceMonthly: number; // in FCFA
  priceYearly: number; // in FCFA
  features: string[];
  maxTables: number | null; // null for unlimited
  isPopular?: boolean;
  popular?: boolean;
  launchOfferBadge?: string;
  launchBonusNotice?: string;
}

export type ActiveAppView = 
  | 'landing'
  | 'dashboard'
  | 'menu'
  | 'tables'
  | 'orders'
  | 'kitchen'
  | 'waiter'
  | 'reservations'
  | 'sales'
  | 'inventory'
  | 'staff'
  | 'analytics'
  | 'onboarding'
  | 'customer_qr'
  | 'market'
  | 'superadmin'
  | 'settings'
  | 'driver'
  | 'privacy';
