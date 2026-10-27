import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  Calendar, 
  FileText, 
  Building2, 
  Phone, 
  CreditCard, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PurchaseRecord, PurchaseItemDetail, InventoryItem } from '../../types';
import { formatFCFA } from '../../utils/formatters';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    purchaseData: Omit<PurchaseRecord, 'id' | 'restaurantId' | 'createdAt'>,
    autoUpdateStock: boolean
  ) => Promise<void>;
  existingInventory: InventoryItem[];
  defaultPurchaserName?: string;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingInventory,
  defaultPurchaserName = 'Gérant / Direction',
}) => {
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(() => `BON-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('Matières Premières');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'orange_money' | 'mtn_momo' | 'bank_transfer' | 'credit'>('orange_money');
  const [purchasedBy, setPurchasedBy] = useState(defaultPurchaserName);
  const [notes, setNotes] = useState('');
  const [autoUpdateStock, setAutoUpdateStock] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Line items
  const [items, setItems] = useState<PurchaseItemDetail[]>([
    { name: '', quantity: 10, unit: 'kg', unitCost: 2500, totalCost: 25000 }
  ]);

  if (!isOpen) return null;

  const handleItemChange = (index: number, field: keyof PurchaseItemDetail, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      
      // Auto-recalculate line total
      const qty = field === 'quantity' ? Number(value) : item.quantity;
      const cost = field === 'unitCost' ? Number(value) : item.unitCost;
      item.totalCost = (qty || 0) * (cost || 0);

      // If user selected an existing inventory item
      if (field === 'name') {
        const matched = existingInventory.find(i => i.name.toLowerCase() === String(value).toLowerCase());
        if (matched) {
          item.inventoryItemId = matched.id;
          item.unit = matched.unit;
          if (matched.unitCost) {
            item.unitCost = matched.unitCost;
            item.totalCost = (item.quantity || 1) * matched.unitCost;
          }
        }
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleAddItemRow = () => {
    setItems(prev => [
      ...prev,
      { name: '', quantity: 5, unit: 'kg', unitCost: 1500, totalCost: 7500 }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const totalPurchaseAmount = items.reduce((sum, it) => sum + (it.totalCost || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      setErrorMsg('Veuillez renseigner le nom du fournisseur ou du marché.');
      return;
    }

    const validItems = items.filter(it => it.name.trim() !== '' && it.quantity > 0);
    if (validItems.length === 0) {
      setErrorMsg('Veuillez renseigner au moins un article avec une quantité valide.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onSave({
        supplierName: supplierName.trim(),
        supplierPhone: supplierPhone.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        purchaseDate,
        category,
        paymentMethod,
        purchasedBy: purchasedBy.trim() || defaultPurchaserName,
        notes: notes.trim() || undefined,
        items: validItems,
        totalAmount: totalPurchaseAmount,
      }, autoUpdateStock);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShoppingBag className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Enregistrer un Bon d'Achat & Approvisionnement</h2>
              <p className="text-xs text-purple-200">Factures fournisseurs, livraisons de stock et achats en FCFA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[calc(85vh-8rem)] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Supplier & General Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Fournisseur ou Marché *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="Ex: Marché Poissonnerie Youpwe, Dépôt Boissons..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Téléphone Fournisseur
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={supplierPhone}
                  onChange={e => setSupplierPhone(e.target.value)}
                  placeholder="Ex: +237 699 00 11 22"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                N° Facture / Bon de livraison
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Date de l'Achat *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Catégorie d'Approvisionnement
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
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
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mode de Règlement
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              >
                <option value="orange_money">Orange Money (OM)</option>
                <option value="mtn_momo">MTN Mobile Money (MoMo)</option>
                <option value="cash">Espèces Cash</option>
                <option value="bank_transfer">Virement Bancaire</option>
                <option value="credit">À Crédit (Règlement différé)</option>
              </select>
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="space-y-2.5 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                Articles & Ingrédients Achetés
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter une ligne
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50/80 border border-gray-200/70 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                  
                  {/* Article Name / Search */}
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      placeholder="Nom de l'article (ex: Bar Frais, Poulet...)"
                      value={item.name}
                      onChange={e => handleItemChange(index, 'name', e.target.value)}
                      list="inventory-suggestions"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="w-24">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      required
                      placeholder="Qté"
                      value={item.quantity}
                      onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-center focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Unit */}
                  <div className="w-24">
                    <select
                      value={item.unit}
                      onChange={e => handleItemChange(index, 'unit', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
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

                  {/* Unit Cost */}
                  <div className="w-28">
                    <input
                      type="number"
                      min="0"
                      step="50"
                      required
                      placeholder="P.U. FCFA"
                      value={item.unitCost}
                      onChange={e => handleItemChange(index, 'unitCost', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-right focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="min-w-24 text-right font-extrabold text-gray-900 self-center">
                    {formatFCFA(item.totalCost || 0)}
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(index)}
                    disabled={items.length <= 1}
                    className="p-1.5 text-gray-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <datalist id="inventory-suggestions">
              {existingInventory.map(i => (
                <option key={i.id} value={i.name} />
              ))}
            </datalist>
          </div>

          {/* Auto stock update toggle */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  Mise à jour automatique des stocks
                </p>
                <p className="text-[11px] text-emerald-800">
                  Augmente immédiatement les quantités en stock et actualise le dernier prix d'achat.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoUpdateStock}
                onChange={e => setAutoUpdateStock(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Notes / Comments */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Notes / Remarques sur la livraison
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Reçu en bon état, facture visée par le chef de cuisine..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            />
          </div>

          {/* Total & Submit */}
          <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-gray-600 block">Total Facture Fournisseur</span>
              <span className="text-2xl font-black text-purple-900">{formatFCFA(totalPurchaseAmount)}</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Enregistrement...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Valider & Enregistrer l'Achat</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
