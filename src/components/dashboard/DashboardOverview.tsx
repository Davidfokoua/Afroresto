import React from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  ChefHat, 
  CheckCircle, 
  CheckCircle2,
  TrendingUp, 
  AlertTriangle, 
  QrCode, 
  ArrowUpRight, 
  Sparkles, 
  Users, 
  Layers,
  Flame,
  ChevronRight,
  Utensils,
  RefreshCw,
  Cloud,
  Smartphone,
  Laptop
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatFCFA } from '../../utils/formatters';
import { NoRestaurantNotice } from '../common/NoRestaurantNotice';

export const DashboardOverview: React.FC = () => {
  const { 
    currentRestaurant, 
    restaurants,
    orders, 
    tables, 
    inventory, 
    setCurrentView,
    setActiveCustomerTableId,
    restaurantStats,
    isStatsSyncing,
    lastStatsSyncTime,
    refreshStats,
    deviceType
  } = useRestaurant();

  if (restaurants.length === 0 || !currentRestaurant || !currentRestaurant.id) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <NoRestaurantNotice 
          title="Bienvenue sur AFRORESTO"
          subtitle="Aucun établissement n'a encore été créé. Cliquez sur le bouton ci-dessous pour configurer votre premier restaurant, vos tables et votre carte de plats."
        />
      </div>
    );
  }

  // Use persistent statistics if synced from Firestore, otherwise compute from active orders
  const computedRevenue = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalRevenue = restaurantStats ? restaurantStats.totalRevenue : computedRevenue;
  const totalOrdersCount = restaurantStats ? restaurantStats.totalOrdersCount : orders.length;
  const avgTicket = restaurantStats 
    ? restaurantStats.avgTicket 
    : (totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0);

  const pendingCount = orders.filter(o => o.status === 'new').length;
  const preparingCount = orders.filter(o => o.status === 'accepted' || o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;
  const servedCount = orders.filter(o => o.status === 'served' || o.status === 'completed').length;
  
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const occupancyRate = tables.length > 0 ? Math.round((occupiedTables / tables.length) * 100) : 0;
  
  const lowStockItems = inventory.filter(i => i.quantity <= i.minimumQuantity);

  // Dynamic Sales by Day of the Week
  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const dayOrder = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const salesByDayMap: Record<string, { sales: number; orders: number }> = {
    'Lun': { sales: 0, orders: 0 },
    'Mar': { sales: 0, orders: 0 },
    'Mer': { sales: 0, orders: 0 },
    'Jeu': { sales: 0, orders: 0 },
    'Ven': { sales: 0, orders: 0 },
    'Sam': { sales: 0, orders: 0 },
    'Dim': { sales: 0, orders: 0 },
  };

  orders.forEach(o => {
    try {
      const d = new Date(o.createdAt);
      const dayName = daysOfWeek[d.getDay()];
      if (salesByDayMap[dayName]) {
        salesByDayMap[dayName].orders += 1;
        if (o.paymentStatus === 'paid') {
          salesByDayMap[dayName].sales += o.totalAmount;
        }
      }
    } catch {
      // ignore
    }
  });

  const salesWeeklyData = dayOrder.map(day => ({
    day,
    sales: salesByDayMap[day].sales,
    orders: salesByDayMap[day].orders,
  }));

  // Dynamic Hourly orders distribution
  const hoursList = ['11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h', '22h'];
  const hourlyCountMap: Record<string, number> = {};
  hoursList.forEach(h => { hourlyCountMap[h] = 0; });

  orders.forEach(o => {
    try {
      const d = new Date(o.createdAt);
      const h = `${d.getHours()}h`;
      if (hourlyCountMap[h] !== undefined) {
        hourlyCountMap[h] += 1;
      }
    } catch {
      // ignore
    }
  });

  const hourlyData = hoursList.map(hour => ({
    hour,
    orders: hourlyCountMap[hour] || 0,
  }));

  // Top products computed dynamically from actual orders
  const dishSalesMap: Record<string, { name: string; count: number; revenue: number }> = {};
  orders.forEach(o => {
    o.items.forEach(it => {
      if (!dishSalesMap[it.name]) {
        dishSalesMap[it.name] = { name: it.name, count: 0, revenue: 0 };
      }
      dishSalesMap[it.name].count += it.quantity;
      dishSalesMap[it.name].revenue += it.price * it.quantity;
    });
  });

  const topDishes = Object.values(dishSalesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-soft-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              Espace Resto • {currentRestaurant.city}
            </span>
            <span className="text-xs text-slate-400 font-medium">| Plan {currentRestaurant.subscriptionPlan.toUpperCase()}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold border border-amber-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Boost Premium Actif (100% Inclus)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1.5 text-white tracking-tight">{currentRestaurant.name}</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-normal leading-relaxed">
            Gérez vos commandes en temps réel, suivez les encaissements en FCFA et optimisez les flux entre salle et cuisine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="dash-view-orders-btn"
            onClick={() => setCurrentView('orders')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-soft flex items-center gap-2 transition-all active:scale-[0.98] border border-slate-700"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            Suivi des Commandes ({orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length})
          </button>

          <button
            onClick={() => {
              if (tables.length > 0) setActiveCustomerTableId(tables[0].id);
              setCurrentView('customer_qr');
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-soft flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <QrCode className="w-4 h-4" />
            Ouvrir Menu Client (QR)
          </button>
        </div>
      </div>

      {/* Cloud Cross-Device Synchronization Status Banner */}
      <div className="bg-slate-900/95 text-white rounded-2xl p-4 sm:p-5 border border-slate-700/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-sm font-bold text-white">Statistiques Synchronisées sur Cloud Firestore</p>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700 flex items-center gap-1">
                {deviceType === 'mobile' ? <Smartphone className="w-3 h-3 text-sky-400" /> : <Laptop className="w-3 h-3 text-emerald-400" />}
                {deviceType === 'mobile' ? 'Mobile Connecté' : 'Desktop Connecté'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Sauvegarde permanente sur votre compte : vos recettes, commandes et graphiques restent intacts et accessibles entre mobile et ordinateur.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          {lastStatsSyncTime && (
            <span className="text-[11px] text-slate-400 font-medium">
              Synchro : {lastStatsSyncTime}
            </span>
          )}
          <button
            onClick={() => refreshStats()}
            disabled={isStatsSyncing}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
            title="Rafraîchir les statistiques depuis Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isStatsSyncing ? 'animate-spin' : ''}`} />
            <span>{isStatsSyncing ? 'Synchronisation...' : 'Actualiser'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        
        {/* Card 1: Revenue */}
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Chiffre d'Affaires</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl lg:text-2xl font-extrabold text-slate-900 mt-2 sm:mt-3 tracking-tight truncate">{formatFCFA(totalRevenue)}</p>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-700 font-semibold mt-1 sm:mt-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Persisté sur le Cloud</span>
          </div>
        </div>

        {/* Card 2: Orders Total */}
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Commandes</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100 shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl lg:text-2xl font-extrabold text-slate-900 mt-2 sm:mt-3 tracking-tight">{totalOrdersCount}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5 font-medium truncate">
            Ticket moyen: <span className="font-bold text-slate-700">{formatFCFA(avgTicket)}</span>
          </p>
        </div>

        {/* Card 3: Kitchen Activity */}
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Flux Cuisine</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 shrink-0">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2 sm:mt-3">
            <span className="text-base sm:text-xl lg:text-2xl font-extrabold text-amber-700 tracking-tight">{preparingCount}</span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">en cours</span>
          </div>
          <p className="text-[10px] sm:text-xs text-emerald-700 font-semibold mt-1 sm:mt-1.5 truncate">
            {readyCount} prêtes à servir
          </p>
        </div>

        {/* Card 4: Table Occupancy */}
        <div className="bg-white p-3.5 sm:p-5 lg:p-6 rounded-2xl border border-slate-200/80 shadow-soft-sm hover:shadow-soft transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Occupation</span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl lg:text-2xl font-extrabold text-slate-900 mt-2 sm:mt-3 tracking-tight">{occupancyRate}%</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5 font-medium truncate">
            {occupiedTables} sur {tables.length} tables
          </p>
        </div>

      </div>

      {/* Critical Alerts Banner if low stock */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-soft-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-soft-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">Alerte Stock ({lowStockItems.length} article(s) sous le seuil d'alerte)</h4>
              <p className="text-xs text-amber-800 mt-0.5 font-medium">
                {lowStockItems.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('inventory')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shrink-0 transition-colors shadow-soft-sm"
          >
            Gérer les stocks
          </button>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Evolution Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Évolution des Ventes Hebdomadaires</h3>
              <p className="text-xs text-slate-500 font-medium">Chiffre d'affaires en FCFA</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-xl">
              Semaine en cours
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesWeeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={val => `${val / 1000}k`} />
                <Tooltip 
                  formatter={(val: number) => [formatFCFA(val), 'Chiffre d\'Affaires']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours Chart (1 col) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Affluence par Heure</h3>
              <p className="text-xs text-slate-500 font-medium">Nombre de commandes</p>
            </div>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val: number) => [val, 'Commandes']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="orders" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom Row: Top Selling Dishes + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top 5 Products */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Plats & Boissons les Plus Populaires</h3>
            <button 
              onClick={() => setCurrentView('menu')}
              className="text-xs text-emerald-700 font-bold hover:underline flex items-center"
            >
              Gérer la carte <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {topDishes.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                <Utensils className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Aucune vente enregistrée pour le moment</p>
                <p className="text-[11px] text-slate-500 mt-1">Le classement des plats les plus commandés s'affichera ici dès les premières commandes.</p>
              </div>
            ) : (
              topDishes.map((dish, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold flex items-center justify-center text-slate-800 shadow-soft-sm">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{dish.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{dish.count} portions vendues</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-extrabold text-emerald-700 text-sm">{formatFCFA(dish.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Operations Shortcuts */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Raccourcis Opérationnels</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Accédez aux modules clés en 1 clic.</p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => setCurrentView('orders')}
              className="w-full p-3 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-950 border border-emerald-200/60 rounded-xl flex items-center justify-between text-xs font-bold transition-colors"
            >
              <span className="flex items-center gap-2.5"><ShoppingBag className="w-4 h-4 text-emerald-700" /> Commandes Live Kanban</span>
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[10px]">{pendingCount}</span>
            </button>

            <button
              onClick={() => setCurrentView('kitchen')}
              className="w-full p-3 bg-purple-50/80 hover:bg-purple-100 text-purple-950 border border-purple-200/60 rounded-xl flex items-center justify-between text-xs font-bold transition-colors"
            >
              <span className="flex items-center gap-2.5"><ChefHat className="w-4 h-4 text-purple-700" /> Écran Cuisine KDS</span>
              <span className="px-2 py-0.5 bg-purple-600 text-white rounded-full text-[10px]">{preparingCount}</span>
            </button>

            <button
              onClick={() => setCurrentView('tables')}
              className="w-full p-3 bg-amber-50/80 hover:bg-amber-100 text-amber-950 border border-amber-200/60 rounded-xl flex items-center justify-between text-xs font-bold transition-colors"
            >
              <span className="flex items-center gap-2.5"><QrCode className="w-4 h-4 text-amber-700" /> Imprimer Chevalets QR</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
            </button>

            <button
              onClick={() => setCurrentView('sales')}
              className="w-full p-3 bg-sky-50/80 hover:bg-sky-100 text-sky-950 border border-sky-200/60 rounded-xl flex items-center justify-between text-xs font-bold transition-colors"
            >
              <span className="flex items-center gap-2.5"><DollarSign className="w-4 h-4 text-sky-700" /> Caisse & Encaissements OM/MoMo</span>
              <ChevronRight className="w-3.5 h-3.5 text-sky-700" />
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium text-center flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Synchronisation temps réel WebSockets active
          </div>
        </div>

      </div>

    </div>
  );
};
