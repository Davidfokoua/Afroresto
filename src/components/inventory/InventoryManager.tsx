import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  AlertTriangle, 
  Search, 
  Minus, 
  Edit, 
  Trash2, 
  TrendingDown, 
  CheckCircle2, 
  X, 
  Sparkles,
  ArrowUpRight,
  ShoppingBag,
  FileSpreadsheet,
  Calendar,
  Building2,
  Phone,
  Receipt,
  Layers,
  History,
  Clock,
  Eye,
  CreditCard,
  Truck
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { InventoryItem, PurchaseRecord } from '../../types';
import { formatFCFA } from '../../utils/formatters';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { PurchaseModal } from './PurchaseModal';
import { PurchaseDetailModal } from './PurchaseDetailModal';

export const InventoryManager: React.FC = () => {
  const { 
    inventory, 
    updateInventoryItem, 
    addInventoryItem, 
    deleteInventoryItem,
    purchases,
    addPurchaseRecord,
    deletePurchaseRecord,
    currentRestaurant,
    currentUser
  } = useRestaurant();

  // Active Main SubTab
  const [activeTab, setActiveTab] = useState<'stock' | 'purchases'>('stock');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAlertOnly, setFilterAlertOnly] = useState(false);
  const [selectedPurchaseCategory, setSelectedPurchaseCategory] = useState<string>('all');
  const [selectedPurchasePaymentMethod, setSelectedPurchasePaymentMethod] = useState<string>('all');

  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Delete modal state for inventory item
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    id: '',
    name: '',
    isDeleting: false,
  });

  // Delete modal state for purchase record
  const [deletePurchaseModalConfig, setDeletePurchaseModalConfig] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    id: '',
    title: '',
    isDeleting: false,
  });

  // Inventory Item Edit/Add Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Matières Premières',
    quantity: 10,
    unit: 'kg',
    minimumQuantity: 5,
    unitCost: 1500,
    supplier: 'Grossiste Local',
  });

  // Purchase Modals State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedDetailPurchase, setSelectedDetailPurchase] = useState<PurchaseRecord | null>(null);

  // Computed Metrics for Stock
  const lowStockCount = inventory.filter(i => i.quantity <= i.minimumQuantity).length;
  const totalStockValue = inventory.reduce((sum, i) => sum + (i.unitCost ? i.unitCost * i.quantity : 0), 0);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterAlertOnly) return item.quantity <= item.minimumQuantity;
    return true;
  });

  // Computed Metrics for Purchases
  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const uniqueSuppliersCount = new Set(purchases.map(p => p.supplierName?.toLowerCase().trim())).size;

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = 
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.items.some(it => it.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedPurchaseCategory !== 'all' && p.category !== selectedPurchaseCategory) return false;
    if (selectedPurchasePaymentMethod !== 'all' && p.paymentMethod !== selectedPurchasePaymentMethod) return false;
    return true;
  });

  // Handlers for Stock Items
  const handleAdjustQty = (id: string, current: number, delta: number) => {
    const nextQty = Math.max(0, current + delta);
    updateInventoryItem(id, { quantity: nextQty });
  };

  const handleOpenNewItem = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      category: 'Matières Premières',
      quantity: 10,
      unit: 'kg',
      minimumQuantity: 5,
      unitCost: 1500,
      supplier: 'Marché Central Douala',
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      minimumQuantity: item.minimumQuantity,
      unitCost: item.unitCost || 0,
      supplier: item.supplier || '',
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.unit) return;

    if (editingItem) {
      updateInventoryItem(editingItem.id, {
        name: itemForm.name,
        category: itemForm.category,
        quantity: Number(itemForm.quantity),
        unit: itemForm.unit,
        minimumQuantity: Number(itemForm.minimumQuantity),
        purchasePrice: Number(itemForm.unitCost),
        unitCost: Number(itemForm.unitCost),
        supplier: itemForm.supplier,
      });
      setSuccessToast(`Article « ${itemForm.name} » mis à jour.`);
    } else {
      addInventoryItem({
        name: itemForm.name,
        category: itemForm.category,
        quantity: Number(itemForm.quantity),
        unit: itemForm.unit,
        minimumQuantity: Number(itemForm.minimumQuantity),
        purchasePrice: Number(itemForm.unitCost),
        unitCost: Number(itemForm.unitCost),
        supplier: itemForm.supplier,
      });
      setSuccessToast(`Article « ${itemForm.name} » ajouté à l'inventaire.`);
    }

    setTimeout(() => setSuccessToast(null), 3500);
    setIsItemModalOpen(false);
  };

  const handleExecuteDeleteItem = async () => {
    if (!deleteModalConfig.id) return;
    setDeleteModalConfig(prev => ({ ...prev, isDeleting: true }));
    try {
      await deleteInventoryItem(deleteModalConfig.id);
      setSuccessToast(`Article « ${deleteModalConfig.name} » supprimé du stock.`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error('Delete inventory item error:', err);
    } finally {
      setDeleteModalConfig({
        isOpen: false,
        id: '',
        name: '',
        isDeleting: false,
      });
    }
  };

  // Handlers for Purchases
  const handleSavePurchase = async (
    purchaseData: Omit<PurchaseRecord, 'id' | 'restaurantId' | 'createdAt'>,
    autoUpdateStock: boolean
  ) => {
    await addPurchaseRecord(purchaseData, autoUpdateStock);
    setSuccessToast(`Bon d'achat « ${purchaseData.supplierName} » de ${formatFCFA(purchaseData.totalAmount)} enregistré avec succès.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleExecuteDeletePurchase = async () => {
    if (!deletePurchaseModalConfig.id) return;
    setDeletePurchaseModalConfig(prev => ({ ...prev, isDeleting: true }));
    try {
      await deletePurchaseRecord(deletePurchaseModalConfig.id);
      setSuccessToast(`Bon d'achat supprimé manuellement.`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error('Delete purchase error:', err);
    } finally {
      setDeletePurchaseModalConfig({
        isOpen: false,
        id: '',
        title: '',
        isDeleting: false,
      });
    }
  };

  const handleExportPurchasesCSV = () => {
    const csvHeader = "ID,Numero_Facture,Fournisseur,Telephone,Categorie,Date_Achat,Mode_Reglement,Total_FCFA,Acheteur,Notes\n";
    const csvRows = purchases.map(p => 
      `"${p.id}","${p.invoiceNumber || ''}","${p.supplierName}","${p.supplierPhone || ''}","${p.category}","${p.purchaseDate}","${p.paymentMethod}",${p.totalAmount},"${p.purchasedBy || ''}","${(p.notes || '').replace(/"/g, '""')}"`
    ).join("\n");

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `journal_achats_restocam_${currentRestaurant.id}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-gray-700 flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-gray-900">Stocks, Inventaires & Achats</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300/60">
              Persisté Cloud
            </span>
          </div>
          <p className="text-xs text-gray-700 mt-0.5">
            Matières premières, gestion des seuils critiques et historique permanent des approvisionnements fournisseurs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {activeTab === 'stock' ? (
            <button
              onClick={handleOpenNewItem}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Ajouter un Article en Stock
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportPurchasesCSV}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                title="Exporter le journal d'achat en CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button
                onClick={() => setIsPurchaseModalOpen(true)}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all flex-1 sm:flex-none justify-center"
              >
                <Plus className="w-4 h-4" />
                Enregistrer un Achat / Bon
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          onClick={() => { setActiveTab('stock'); setSearchQuery(''); }}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'stock'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-gray-700 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>État des Stocks & Ingrédients</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'stock' ? 'bg-emerald-100 text-emerald-900' : 'bg-gray-100 text-gray-700'
          }`}>
            {inventory.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('purchases'); setSearchQuery(''); }}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'purchases'
              ? 'border-purple-600 text-purple-800'
              : 'border-transparent text-gray-700 hover:text-gray-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historique des Achats & Approvisionnements</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'purchases' ? 'bg-purple-100 text-purple-900' : 'bg-gray-100 text-gray-700'
          }`}>
            {purchases.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STOCK & INVENTORY ITEMS */}
      {/* ========================================================================= */}
      {activeTab === 'stock' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* KPI Cards for Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Total References */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Références Actives</span>
              <p className="text-2xl font-black text-gray-900">{inventory.length}</p>
              <p className="text-xs text-gray-700">Matières premières, viandes & boissons</p>
            </div>

            {/* Low Stock Alerts */}
            <div className={`p-5 rounded-3xl border shadow-xs space-y-1 ${
              lowStockCount > 0 ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Alertes Rupture</span>
                <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
              </div>
              <p className="text-2xl font-black text-amber-900">{lowStockCount}</p>
              <p className="text-xs text-amber-800">Articles sous le seuil critique</p>
            </div>

            {/* Estimated Stock Value */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Valeur Estimée du Stock</span>
              <p className="text-2xl font-black text-emerald-800">{formatFCFA(totalStockValue)}</p>
              <p className="text-xs text-gray-700">Coût d'achat total immobilisé</p>
            </div>

          </div>

          {/* Filter and Search Bar for Stock */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setFilterAlertOnly(false)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                  !filterAlertOnly ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Tous les articles ({inventory.length})
              </button>
              <button
                onClick={() => setFilterAlertOnly(true)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                  filterAlertOnly ? 'bg-amber-500 text-white font-bold' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Alertes Seuil ({lowStockCount})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher article, catégorie..."
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">Article</th>
                    <th className="p-4">Catégorie</th>
                    <th className="p-4 text-center">Quantité Actuelle</th>
                    <th className="p-4 text-center">Seuil Alerte</th>
                    <th className="p-4">Fournisseur</th>
                    <th className="p-4">Coût Unitaire (FCFA)</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-gray-700">Aucun article trouvé dans l'inventaire.</p>
                        <p className="text-[11px] text-gray-600 mt-0.5">Cliquez sur « Ajouter un Article en Stock » pour créer une référence.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map(item => {
                      const isCritical = item.quantity <= item.minimumQuantity;

                      return (
                        <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="p-4 font-extrabold text-gray-900 text-sm">{item.name}</td>
                          <td className="p-4 text-gray-700 font-medium">{item.category}</td>
                          
                          {/* Quick Adjust Buttons */}
                          <td className="p-4 text-center">
                            <div className="inline-flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                              <button
                                onClick={() => handleAdjustQty(item.id, item.quantity, -1)}
                                className="w-6 h-6 rounded-lg bg-white text-gray-700 flex items-center justify-center font-bold hover:bg-gray-200 active:scale-95"
                                title="Diminuer stock (-1)"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-extrabold text-gray-900 min-w-14 text-center">
                                {item.quantity} {item.unit}
                              </span>
                              <button
                                onClick={() => handleAdjustQty(item.id, item.quantity, 1)}
                                className="w-6 h-6 rounded-lg bg-white text-gray-700 flex items-center justify-center font-bold hover:bg-gray-200 active:scale-95"
                                title="Augmenter stock (+1)"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          <td className="p-4 text-center font-semibold text-gray-700">
                            {item.minimumQuantity} {item.unit}
                          </td>

                          <td className="p-4 text-gray-700">{item.supplier || '—'}</td>

                          <td className="p-4 font-bold text-gray-900">
                            {item.unitCost ? formatFCFA(item.unitCost) : '—'}
                          </td>

                          <td className="p-4">
                            {isCritical ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold">
                                <AlertTriangle className="w-3 h-3" />
                                Rupture Imminente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                Stock Conforme
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditItem(item)}
                                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Modifier l'article"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteModalConfig({
                                  isOpen: true,
                                  id: item.id,
                                  name: item.name,
                                  isDeleting: false
                                })}
                                className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Supprimer définitivement l'article"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PURCHASES & PROCUREMENT HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'purchases' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* KPI Cards for Purchases */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Total Purchases Expenditure */}
            <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white p-5 rounded-3xl shadow-md space-y-1">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Dépenses Totales d'Achats</span>
              <p className="text-2xl font-black text-white">{formatFCFA(totalPurchasesAmount)}</p>
              <p className="text-xs text-purple-200">{purchases.length} factures & bons fournisseurs enregistrés</p>
            </div>

            {/* Total Invoices / Deliveries Count */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Livraisons & Approvisionnements</span>
              <p className="text-2xl font-black text-gray-900">{purchases.length}</p>
              <p className="text-xs text-gray-700">Bons archivés dans votre compte cloud</p>
            </div>

            {/* Unique Suppliers */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Fournisseurs Référencés</span>
              <p className="text-2xl font-black text-emerald-800">{uniqueSuppliersCount}</p>
              <p className="text-xs text-gray-700">Marchés, abattoirs & grossistes partenaires</p>
            </div>

          </div>

          {/* Guarantee banner on retention */}
          <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-purple-900">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold">Historique d'achat permanent & sécurisé :</span>
              <span className="ml-1 text-purple-800">
                Vos bons d'achat, coûts matières et factures fournisseurs sont enregistrés sur votre compte. Ils restent accessibles à chaque reconnexion et ne sont jamais purgés, tant que vous ne les supprimez pas manuellement.
              </span>
            </div>
          </div>

          {/* Filter and Search Bar for Purchases */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={selectedPurchaseCategory}
                onChange={e => setSelectedPurchaseCategory(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              >
                <option value="all">Toutes les catégories</option>
                <option value="Matières Premières">Matières Premières</option>
                <option value="Poissons & Fruits de Mer">Poissons & Fruits de Mer</option>
                <option value="Volailles & Viandes">Volailles & Viandes</option>
                <option value="Boissons & Bar">Boissons & Bar</option>
                <option value="Légumes & Tubercules">Légumes & Tubercules</option>
                <option value="Épicerie & Condiments">Épicerie & Condiments</option>
              </select>

              {/* Payment Method Filter */}
              <select
                value={selectedPurchasePaymentMethod}
                onChange={e => setSelectedPurchasePaymentMethod(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              >
                <option value="all">Tous les règlements</option>
                <option value="orange_money">Orange Money</option>
                <option value="mtn_momo">MTN MoMo</option>
                <option value="cash">Espèces Cash</option>
                <option value="bank_transfer">Virement</option>
                <option value="credit">À Crédit</option>
              </select>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher fournisseur, facture..."
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Purchases History Table */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">N° Facture / Bon</th>
                    <th className="p-4">Fournisseur</th>
                    <th className="p-4">Catégorie</th>
                    <th className="p-4">Articles Achetés</th>
                    <th className="p-4">Règlement</th>
                    <th className="p-4 text-right">Montant Total</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-gray-700">Aucun bon d'achat enregistré pour ce restaurant.</p>
                        <p className="text-[11px] text-gray-600 mt-0.5">Cliquez sur « Enregistrer un Achat / Bon » pour archiver une livraison.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map(purchase => {
                      const itemCount = purchase.items?.length || 0;
                      const itemsPreview = purchase.items?.map(it => `${it.quantity}${it.unit} ${it.name}`).join(', ') || '—';

                      return (
                        <tr key={purchase.id} className="hover:bg-gray-50/70 transition-colors">
                          
                          {/* Date */}
                          <td className="p-4 font-semibold text-gray-900 whitespace-nowrap">
                            {new Date(purchase.purchaseDate).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>

                          {/* Invoice / Reference */}
                          <td className="p-4">
                            <span className="font-mono text-xs font-bold text-purple-950 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                              {purchase.invoiceNumber || 'BON SANS N°'}
                            </span>
                          </td>

                          {/* Supplier */}
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{purchase.supplierName}</div>
                            {purchase.supplierPhone && (
                              <div className="text-[11px] text-gray-700 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-gray-400" />
                                {purchase.supplierPhone}
                              </div>
                            )}
                          </td>

                          {/* Category */}
                          <td className="p-4 text-gray-700 font-medium whitespace-nowrap">
                            {purchase.category}
                          </td>

                          {/* Items summary */}
                          <td className="p-4 text-gray-600 max-w-xs truncate" title={itemsPreview}>
                            <span className="font-bold text-gray-800 mr-1.5">{itemCount} réf :</span>
                            <span>{itemsPreview}</span>
                          </td>

                          {/* Payment Method */}
                          <td className="p-4 whitespace-nowrap">
                            {purchase.paymentMethod === 'orange_money' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                                Orange Money
                              </span>
                            )}
                            {purchase.paymentMethod === 'mtn_momo' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-gray-950 text-[10px] font-bold border border-amber-300">
                                MTN MoMo
                              </span>
                            )}
                            {purchase.paymentMethod === 'cash' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-300">
                                Espèces
                              </span>
                            )}
                            {purchase.paymentMethod === 'bank_transfer' && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold border border-blue-300">
                                Virement
                              </span>
                            )}
                            {purchase.paymentMethod === 'credit' && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 text-[10px] font-bold border border-rose-300">
                                À Crédit
                              </span>
                            )}
                            {!['orange_money', 'mtn_momo', 'cash', 'bank_transfer', 'credit'].includes(purchase.paymentMethod) && (
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[10px] font-bold">
                                {purchase.paymentMethod}
                              </span>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="p-4 text-right font-extrabold text-sm text-purple-950 whitespace-nowrap">
                            {formatFCFA(purchase.totalAmount)}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setSelectedDetailPurchase(purchase)}
                                className="p-1.5 bg-gray-100 hover:bg-purple-100 text-purple-800 rounded-lg transition-colors"
                                title="Voir le bon de livraison détaillé"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletePurchaseModalConfig({
                                  isOpen: true,
                                  id: purchase.id,
                                  title: `Bon ${purchase.invoiceNumber || ''} (${purchase.supplierName})`,
                                  isDeleting: false
                                })}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Supprimer manuellement cet enregistrement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* New / Edit Stock Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base">
                {editingItem ? "Modifier l'article en stock" : "Ajouter un article en stock"}
              </h3>
              <button 
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 pt-3 text-xs">
              <div>
                <label className="font-bold text-gray-700">Désignation de l'article *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bar frais de Youpwe, Poulet bicyclette..."
                  value={itemForm.name}
                  onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700">Catégorie</label>
                  <select
                    value={itemForm.category}
                    onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Matières Premières">Matières Premières</option>
                    <option value="Poissons & Fruits de Mer">Poissons & Fruits de Mer</option>
                    <option value="Volailles & Viandes">Volailles & Viandes</option>
                    <option value="Légumes & Tubercules">Légumes & Tubercules</option>
                    <option value="Boissons & Bar">Boissons & Bar</option>
                    <option value="Épicerie & Condiments">Épicerie & Condiments</option>
                    <option value="Emballages & Fournitures">Emballages & Fournitures</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700">Unité de mesure</label>
                  <select
                    value={itemForm.unit}
                    onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="kg">kg</option>
                    <option value="unite">unité</option>
                    <option value="litre">litre</option>
                    <option value="casier">casier</option>
                    <option value="sac">sac</option>
                    <option value="carton">carton</option>
                    <option value="regime">régime</option>
                    <option value="paquet">paquet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700">Quantité en stock</label>
                  <input
                    type="number"
                    min={0}
                    value={itemForm.quantity}
                    onChange={e => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700">Seuil d'alerte critique</label>
                  <input
                    type="number"
                    min={1}
                    value={itemForm.minimumQuantity}
                    onChange={e => setItemForm({ ...itemForm, minimumQuantity: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700">Coût unitaire (FCFA)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={itemForm.unitCost}
                    onChange={e => setItemForm({ ...itemForm, unitCost: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700">Fournisseur habituel</label>
                  <input
                    type="text"
                    value={itemForm.supplier}
                    onChange={e => setItemForm({ ...itemForm, supplier: e.target.value })}
                    placeholder="Marché Mboppi, Youpwe..."
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Registration Modal */}
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onSave={handleSavePurchase}
        existingInventory={inventory}
        defaultPurchaserName={currentUser?.name || currentRestaurant.ownerName}
      />

      {/* Purchase Detail Modal */}
      <PurchaseDetailModal
        purchase={selectedDetailPurchase}
        onClose={() => setSelectedDetailPurchase(null)}
        restaurantName={currentRestaurant.name}
      />

      {/* Confirmation Delete Item Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDeleteItem}
        title="Supprimer l'article du stock"
        itemName={deleteModalConfig.name}
        itemType="cet article"
        warningMessage="Cet ingrédient ou article sera définitivement retiré de l'inventaire et des rapports de valorisation de stock."
        isDeleting={deleteModalConfig.isDeleting}
      />

      {/* Confirmation Delete Purchase Modal */}
      <ConfirmDeleteModal
        isOpen={deletePurchaseModalConfig.isOpen}
        onClose={() => setDeletePurchaseModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDeletePurchase}
        title="Supprimer définitivement ce bon d'achat"
        itemName={deletePurchaseModalConfig.title}
        itemType="ce bon d'achat"
        warningMessage="Cet enregistrement d'approvisionnement sera définitivement effacé du journal de votre compte. Cette action est irréversible."
        isDeleting={deletePurchaseModalConfig.isDeleting}
      />

    </div>
  );
};
