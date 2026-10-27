import React, { useState } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Printer, 
  Download, 
  Search, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  FileSpreadsheet, 
  Sparkles,
  Smartphone,
  Coins,
  X
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatFCFA, formatDateTime, formatTime, getPaymentStatusConfig } from '../../utils/formatters';
import { Order, PaymentMethod } from '../../types';
import { ThermalReceiptModal } from '../common/ThermalReceiptModal';

export const SalesPOS: React.FC = () => {
  const { orders, currentRestaurant, updatePaymentStatus } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentMethodFilter, setSelectedPaymentMethodFilter] = useState<string>('all');
  const [receiptModalOrder, setReceiptModalOrder] = useState<Order | null>(null);

  // Computed metrics
  const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
  const totalSales = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const orangeMoneySales = paidOrders.filter(o => o.paymentMethod === 'orange_money').reduce((sum, o) => sum + o.totalAmount, 0);
  const mtnMomoSales = paidOrders.filter(o => o.paymentMethod === 'mtn_momo').reduce((sum, o) => sum + o.totalAmount, 0);
  const cashSales = paidOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.totalAmount, 0);
  const cardSales = paidOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.totalAmount, 0);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedPaymentMethodFilter === 'all') return true;
    if (selectedPaymentMethodFilter === 'unpaid') return order.paymentStatus === 'unpaid';
    return order.paymentMethod === selectedPaymentMethodFilter;
  });

  const handleCollectPayment = (orderId: string, method: PaymentMethod) => {
    updatePaymentStatus(orderId, 'paid', method);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvHeader = "Numero,Table,Espace,Client,Total_FCFA,Statut_Paiement,Methode_Paiement,Date\n";
    const csvRows = orders.map(o => 
      `"${o.orderNumber}","${o.tableName}","${o.areaName}","${o.customerName || 'Anonyme'}",${o.totalAmount},"${o.paymentStatus}","${o.paymentMethod || 'Non paye'}","${o.createdAt}"`
    ).join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ventes_restocam_${currentRestaurant.id}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-gray-900">Ventes, Caisse & Encaissements</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              FCFA
            </span>
          </div>
          <p className="text-xs text-gray-700 mt-0.5">Suivi des encaissements par Orange Money, MTN MoMo, Espèces et Carte.</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          Exporter Rapport (CSV)
        </button>
      </div>

      {/* Payment Methods Breakdown KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sales */}
        <div className="bg-gradient-to-br from-emerald-900 to-gray-900 text-white p-5 rounded-3xl shadow-md space-y-1">
          <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Total Encaissé</span>
          <p className="text-2xl font-black">{formatFCFA(totalSales)}</p>
          <p className="text-xs text-gray-300">{paidOrders.length} commandes réglées</p>
        </div>

        {/* Orange Money */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Orange Money</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold">OM</span>
          </div>
          <p className="text-xl font-black text-gray-900">{formatFCFA(orangeMoneySales)}</p>
          <p className="text-xs text-gray-700">
            {paidOrders.filter(o => o.paymentMethod === 'orange_money').length} paiements
          </p>
        </div>

        {/* MTN MoMo */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">MTN MoMo</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-200 text-gray-950 text-[10px] font-extrabold">MoMo</span>
          </div>
          <p className="text-xl font-black text-gray-900">{formatFCFA(mtnMomoSales)}</p>
          <p className="text-xs text-gray-700">
            {paidOrders.filter(o => o.paymentMethod === 'mtn_momo').length} paiements
          </p>
        </div>

        {/* Cash Espèces */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Espèces (Cash)</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-extrabold">Cash</span>
          </div>
          <p className="text-xl font-black text-gray-900">{formatFCFA(cashSales)}</p>
          <p className="text-xs text-gray-700">
            {paidOrders.filter(o => o.paymentMethod === 'cash').length} paiements
          </p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setSelectedPaymentMethodFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
              selectedPaymentMethodFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Tous les règlements
          </button>
          <button
            onClick={() => setSelectedPaymentMethodFilter('unpaid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
              selectedPaymentMethodFilter === 'unpaid' ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Non payés ({orders.filter(o => o.paymentStatus === 'unpaid').length})
          </button>
          <button
            onClick={() => setSelectedPaymentMethodFilter('orange_money')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
              selectedPaymentMethodFilter === 'orange_money' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Orange Money
          </button>
          <button
            onClick={() => setSelectedPaymentMethodFilter('mtn_momo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
              selectedPaymentMethodFilter === 'mtn_momo' ? 'bg-amber-400 text-gray-950' : 'bg-gray-100 text-gray-600'
            }`}
          >
            MTN MoMo
          </button>
          <button
            onClick={() => setSelectedPaymentMethodFilter('cash')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
              selectedPaymentMethodFilter === 'cash' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Espèces
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher ticket..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Orders List / Table for Cashier */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        
        {/* Mobile View: Card List (< md) */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredOrders.map(order => {
            const payConf = getPaymentStatusConfig(order.paymentStatus);

            return (
              <div key={order.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-gray-900">{order.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/60">
                      {order.tableName}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${payConf.color}`}>
                    {payConf.label}
                  </span>
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <p className="font-medium text-gray-800 flex items-center justify-between">
                    <span>{order.customerName || 'Client sur place'}</span>
                    <span className="text-gray-400 font-normal">{order.areaName}</span>
                  </p>
                  <p className="text-gray-500 line-clamp-2 text-[11px]">
                    {order.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Montant</span>
                    <span className="font-extrabold text-emerald-800 text-base">{formatFCFA(order.totalAmount)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {order.paymentStatus === 'unpaid' ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleCollectPayment(order.id, 'orange_money')}
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-2xs transition-transform"
                          title="Encaisser par Orange Money"
                        >
                          OM
                        </button>
                        <button
                          onClick={() => handleCollectPayment(order.id, 'mtn_momo')}
                          className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-500 active:scale-95 text-gray-950 rounded-xl text-xs font-bold shadow-2xs transition-transform"
                          title="Encaisser par MTN Mobile Money"
                        >
                          MoMo
                        </button>
                        <button
                          onClick={() => handleCollectPayment(order.id, 'cash')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-2xs transition-transform"
                          title="Encaisser en Espèces Cash"
                        >
                          Cash
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-emerald-700 font-bold capitalize flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {order.paymentMethod?.replace('_', ' ')}
                      </span>
                    )}

                    <button
                      onClick={() => setReceiptModalOrder(order)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold inline-flex items-center"
                      title="Imprimer le ticket de caisse"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">N° Ticket</th>
                <th className="p-4">Table & Espace</th>
                <th className="p-4">Client</th>
                <th className="p-4">Articles</th>
                <th className="p-4">Montant (FCFA)</th>
                <th className="p-4">Statut Paiement</th>
                <th className="p-4">Action d'Encaissement</th>
                <th className="p-4 text-right">Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map(order => {
                const payConf = getPaymentStatusConfig(order.paymentStatus);

                return (
                  <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-4 font-black text-gray-900">{order.orderNumber}</td>
                    <td className="p-4">
                      <span className="font-bold text-emerald-800">{order.tableName}</span>
                      <p className="text-[11px] text-gray-700">{order.areaName}</p>
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                      {order.customerName || 'Client sur place'}
                    </td>
                    <td className="p-4 text-gray-600 max-w-xs truncate">
                      {order.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                    </td>
                    <td className="p-4 font-extrabold text-gray-900 text-sm">
                      {formatFCFA(order.totalAmount)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${payConf.color}`}>
                        {payConf.label}
                      </span>
                    </td>
                    <td className="p-4">
                      {order.paymentStatus === 'unpaid' ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleCollectPayment(order.id, 'orange_money')}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                          >
                            OM
                          </button>
                          <button
                            onClick={() => handleCollectPayment(order.id, 'mtn_momo')}
                            className="px-2 py-1 bg-amber-400 hover:bg-amber-500 text-gray-950 rounded-lg text-[10px] font-bold shadow-2xs"
                          >
                            MoMo
                          </button>
                          <button
                            onClick={() => handleCollectPayment(order.id, 'cash')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                          >
                            Cash
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-700 font-semibold capitalize flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {order.paymentMethod?.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setReceiptModalOrder(order)}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Ticket
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* THERMAL RECEIPT PRINT MODAL */}
      <ThermalReceiptModal
        isOpen={Boolean(receiptModalOrder)}
        onClose={() => setReceiptModalOrder(null)}
        order={receiptModalOrder}
        initialType="receipt"
      />

    </div>
  );
};
