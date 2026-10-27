import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Order, MenuItem, MenuCategory, RestaurantStatistics } from '../types';
import { cleanFirestoreData } from './firestoreUtils';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export function detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Computes unified persistent statistics from all recorded orders.
 */
export function computeRestaurantStats(
  restaurantId: string,
  orders: Order[],
  menuItems: MenuItem[] = [],
  categories: MenuCategory[] = [],
  existingStats?: RestaurantStatistics | null
): RestaurantStatistics {
  const restOrders = orders.filter(o => o.restaurantId === restaurantId);

  // Revenue & Counts
  const paidOrders = restOrders.filter(o => o.paymentStatus === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const paidOrdersCount = paidOrders.length;
  const totalOrdersCount = restOrders.length;
  const unpaidOrdersCount = restOrders.filter(o => o.paymentStatus === 'unpaid').length;

  const pendingOrdersCount = restOrders.filter(o => o.status === 'new').length;
  const preparingOrdersCount = restOrders.filter(o => o.status === 'accepted' || o.status === 'preparing').length;
  const readyOrdersCount = restOrders.filter(o => o.status === 'ready').length;
  const servedOrdersCount = restOrders.filter(o => o.status === 'in_service' || o.status === 'served').length;
  const completedOrdersCount = restOrders.filter(o => o.status === 'completed').length;
  const cancelledOrdersCount = restOrders.filter(o => o.status === 'cancelled').length;

  const avgTicket = paidOrdersCount > 0 
    ? Math.round(totalRevenue / paidOrdersCount) 
    : (totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0);

  // Payment Breakdown
  const salesByPaymentMethod = {
    cash: paidOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.totalAmount, 0),
    orange_money: paidOrders.filter(o => o.paymentMethod === 'orange_money').reduce((sum, o) => sum + o.totalAmount, 0),
    mtn_momo: paidOrders.filter(o => o.paymentMethod === 'mtn_momo').reduce((sum, o) => sum + o.totalAmount, 0),
    card: paidOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.totalAmount, 0),
    pending: restOrders.filter(o => o.paymentStatus === 'unpaid').reduce((sum, o) => sum + o.totalAmount, 0),
  };

  // Day of week breakdown
  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const salesByDayOfWeek: Record<string, { sales: number; orders: number; cost: number }> = {
    'Lun': { sales: 0, orders: 0, cost: 0 },
    'Mar': { sales: 0, orders: 0, cost: 0 },
    'Mer': { sales: 0, orders: 0, cost: 0 },
    'Jeu': { sales: 0, orders: 0, cost: 0 },
    'Ven': { sales: 0, orders: 0, cost: 0 },
    'Sam': { sales: 0, orders: 0, cost: 0 },
    'Dim': { sales: 0, orders: 0, cost: 0 },
  };

  // Hourly distribution
  const hourlyDistribution: Record<string, number> = {
    '11h': 0, '12h': 0, '13h': 0, '14h': 0, '15h': 0,
    '16h': 0, '17h': 0, '18h': 0, '19h': 0, '20h': 0,
    '21h': 0, '22h': 0, '23h': 0
  };

  // Daily History Map (date -> metrics)
  const dailyHistory: Record<string, { date: string; revenue: number; ordersCount: number; avgTicket: number }> = {
    ...(existingStats?.dailyHistory || {})
  };

  restOrders.forEach(o => {
    try {
      const d = new Date(o.createdAt);
      if (!isNaN(d.getTime())) {
        // Day of week
        const dayName = daysOfWeek[d.getDay()];
        if (salesByDayOfWeek[dayName]) {
          salesByDayOfWeek[dayName].orders += 1;
          if (o.paymentStatus === 'paid') {
            salesByDayOfWeek[dayName].sales += o.totalAmount;
            salesByDayOfWeek[dayName].cost += Math.round(o.totalAmount * 0.38);
          }
        }

        // Hourly
        const hour = d.getHours();
        const hourKey = `${hour}h`;
        if (hourlyDistribution[hourKey] !== undefined) {
          hourlyDistribution[hourKey] += 1;
        }

        // Daily history entry
        const dateStr = d.toISOString().slice(0, 10);
        if (!dailyHistory[dateStr]) {
          dailyHistory[dateStr] = { date: dateStr, revenue: 0, ordersCount: 0, avgTicket: 0 };
        }
        dailyHistory[dateStr].ordersCount += 1;
        if (o.paymentStatus === 'paid') {
          dailyHistory[dateStr].revenue += o.totalAmount;
        }
        dailyHistory[dateStr].avgTicket = Math.round(dailyHistory[dateStr].revenue / Math.max(1, dailyHistory[dateStr].ordersCount));
      }
    } catch {
      // ignore invalid date
    }
  });

  // Category sales breakdown
  const salesByCategory: Record<string, number> = {};
  restOrders.forEach(o => {
    o.items.forEach(it => {
      const itemDef = menuItems.find(m => m.id === it.menuItemId);
      const catDef = categories.find(c => c.id === itemDef?.categoryId);
      const catName = catDef ? catDef.name : 'Plats Authentiques';
      salesByCategory[catName] = (salesByCategory[catName] || 0) + (it.price * it.quantity);
    });
  });

  return {
    id: `stats_${restaurantId}`,
    restaurantId,
    totalRevenue,
    totalOrdersCount,
    paidOrdersCount,
    unpaidOrdersCount,
    pendingOrdersCount,
    preparingOrdersCount,
    readyOrdersCount,
    servedOrdersCount,
    completedOrdersCount,
    cancelledOrdersCount,
    avgTicket,
    salesByPaymentMethod,
    salesByCategory,
    salesByDayOfWeek,
    hourlyDistribution,
    dailyHistory,
    lastUpdated: new Date().toISOString(),
    lastSyncDevice: detectDeviceType(),
  };
}

/**
 * Persists calculated statistics to the Firestore 'statistics' collection.
 */
export async function saveRestaurantStatsToFirestore(stats: RestaurantStatistics): Promise<void> {
  if (!stats || !stats.restaurantId) return;
  const path = `statistics/${stats.restaurantId}`;
  try {
    const cleaned = cleanFirestoreData(stats);
    await setDoc(doc(db, 'statistics', stats.restaurantId), cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Loads the persistent statistics document for a restaurant from Firestore.
 */
export async function fetchRestaurantStatsFromFirestore(restaurantId: string): Promise<RestaurantStatistics | null> {
  if (!restaurantId) return null;
  const path = `statistics/${restaurantId}`;
  try {
    const snap = await getDoc(doc(db, 'statistics', restaurantId));
    if (snap.exists()) {
      return snap.data() as RestaurantStatistics;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}
