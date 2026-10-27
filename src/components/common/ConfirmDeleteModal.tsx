import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  itemName: string;
  itemType?: string;
  warningMessage?: string;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType = 'élément',
  warningMessage = 'Cette action supprimera définitivement cet élément de votre restaurant et synchronisera la base de données en direct.',
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 border border-gray-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500 font-medium capitalize">Suppression de {itemType}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 pt-1">
          <div className="p-3.5 bg-rose-50/70 border border-rose-100 rounded-2xl">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900">
                Êtes-vous sûr de vouloir supprimer définitivement :
                <p className="font-extrabold text-sm text-gray-900 mt-1 break-words">
                  « {itemName} »
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed">
            {warningMessage}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-xs text-gray-700 hover:bg-gray-100 font-semibold transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirm();
            }}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Suppression en cours...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer définitivement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
