import React from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  Calendar, 
  Building2, 
  Phone, 
  User, 
  CheckCircle2, 
  CreditCard,
  Layers,
  Sparkles
} from 'lucide-react';
import { PurchaseRecord } from '../../types';
import { formatFCFA } from '../../utils/formatters';

interface PurchaseDetailModalProps {
  purchase: PurchaseRecord | null;
  onClose: () => void;
  restaurantName: string;
}

export const PurchaseDetailModal: React.FC<PurchaseDetailModalProps> = ({
  purchase,
  onClose,
  restaurantName,
}) => {
  if (!purchase) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'orange_money':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">Orange Money (OM)</span>;
      case 'mtn_momo':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-gray-950 text-xs font-bold border border-amber-300">MTN MoMo</span>;
      case 'cash':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300">Espèces Cash</span>;
      case 'bank_transfer':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-bold border border-blue-300">Virement Bancaire</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs font-bold border border-gray-300">{method}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-gray-900 via-purple-950 to-gray-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Bon d'Approvisionnement</span>
                {purchase.invoiceNumber && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200 text-[10px] font-mono border border-purple-400/30">
                    {purchase.invoiceNumber}
                  </span>
                )}
              </div>
              <h2 className="text-sm font-extrabold text-white truncate max-w-xs">{purchase.supplierName}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Imprimer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice / Receipt Body */}
        <div className="p-6 space-y-5 text-xs text-gray-700">
          
          {/* Restaurant & Supplier Overview */}
          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-2.5">
            <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
              <span className="font-semibold text-gray-500">Établissement</span>
              <span className="font-extrabold text-gray-900">{restaurantName}</span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
              <span className="font-semibold text-gray-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                Fournisseur
              </span>
              <span className="font-bold text-gray-900">{purchase.supplierName}</span>
            </div>

            {purchase.supplierPhone && (
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                <span className="font-semibold text-gray-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  Contact
                </span>
                <span className="font-bold text-gray-800">{purchase.supplierPhone}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
              <span className="font-semibold text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Date d'Achat
              </span>
              <span className="font-bold text-gray-900">
                {new Date(purchase.purchaseDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
              <span className="font-semibold text-gray-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                Réceptionné par
              </span>
              <span className="font-bold text-gray-900">{purchase.purchasedBy || 'Gérant'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                Mode de règlement
              </span>
              <div>{getPaymentMethodBadge(purchase.paymentMethod)}</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wider block">
              Détail des Articles Livrés
            </span>
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100/80 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">Article</th>
                    <th className="p-3 text-center">Qté</th>
                    <th className="p-3 text-right">P.U.</th>
                    <th className="p-3 text-right">Total FCFA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchase.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-gray-900">{item.name}</td>
                      <td className="p-3 text-center text-gray-700 font-semibold">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-3 text-right text-gray-600 font-medium">
                        {formatFCFA(item.unitCost)}
                      </td>
                      <td className="p-3 text-right font-extrabold text-gray-900">
                        {formatFCFA(item.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {purchase.notes && (
            <div className="p-3 bg-purple-50/80 border border-purple-200/80 rounded-2xl">
              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block mb-0.5">Remarque / Visa</span>
              <p className="text-xs text-purple-900 font-medium">{purchase.notes}</p>
            </div>
          )}

          {/* Total Bar */}
          <div className="bg-gray-900 text-white p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-300 font-semibold block uppercase">Montant Total Réglé</span>
              <span className="text-xl font-black text-emerald-400">{formatFCFA(purchase.totalAmount)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              <CheckCircle2 className="w-4 h-4" />
              <span>Enregistré & Validé</span>
            </div>
          </div>

          {/* Persistence badge */}
          <p className="text-[11px] text-center text-gray-600">
            Ce bon d'achat est conservé de manière permanente dans la base cloud de votre compte et ne peut être supprimé que manuellement par le gérant.
          </p>

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
