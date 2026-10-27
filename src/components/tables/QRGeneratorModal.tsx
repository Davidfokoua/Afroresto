import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  QrCode, 
  Check, 
  Sliders, 
  Tag, 
  Layers, 
  Smartphone, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Table, RestaurantArea, Restaurant } from '../../types';
import { ThermalStickerGenerator, ThermalStickerTableData } from './ThermalStickerGenerator';
import { buildTableOrderUrl } from '../../utils/qrUrl';

export interface QRGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  areas?: RestaurantArea[];
  currentRestaurant?: Restaurant | null;
  initialSelectedTable?: Table | null;
  initialFormat?: '58mm' | '80mm';
}

export const QRGeneratorModal: React.FC<QRGeneratorModalProps> = ({
  isOpen,
  onClose,
  tables,
  areas = [],
  currentRestaurant,
  initialSelectedTable = null,
  initialFormat = '58mm',
}) => {
  // Mode: single table or all tables batch
  const [selectionMode, setSelectionMode] = useState<'single' | 'batch'>(initialSelectedTable ? 'single' : 'batch');
  const [selectedTableId, setSelectedTableId] = useState<string>(initialSelectedTable?.id || tables[0]?.id || '');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all');
  const [stickerFormat, setStickerFormat] = useState<'58mm' | '80mm'>(initialFormat);
  const [customCta, setCustomCta] = useState<string>('SCANNEZ POUR COMMANDER');

  if (!isOpen) return null;

  // Filter tables to pass to the ThermalStickerGenerator
  const filteredTables: Table[] = selectionMode === 'single'
    ? tables.filter(t => t.id === selectedTableId)
    : selectedAreaId === 'all'
      ? tables
      : tables.filter(t => t.areaId === selectedAreaId);

  // Map Table[] to ThermalStickerTableData[]
  const generatorTableData: ThermalStickerTableData[] = filteredTables.map(t => {
    const area = areas.find(a => a.id === t.areaId);
    return {
      id: t.id,
      tableNumber: t.name.replace(/\D/g, '') || t.name,
      tableName: t.name,
      areaName: area?.name || 'Salle',
      capacity: t.capacity,
      restaurantName: currentRestaurant?.name || 'AFRORESTO',
      restaurantCity: currentRestaurant?.city ? `${currentRestaurant.city} • ${(currentRestaurant?.country || 'AFRIQUE').toUpperCase()}` : (currentRestaurant?.country || 'AFRIQUE').toUpperCase(),
      customUrl: buildTableOrderUrl(currentRestaurant?.id || t.restaurantId, t.id, currentRestaurant.customDomain),
    };
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      
      {/* Modal Container */}
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Générateur de QR Codes & Badges Autocollants
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  Thermique 58mm / 80mm
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sélectionnez votre table, choisissez les dimensions du papier et lancez l'impression thermique directe.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Config Toolbar */}
        <div className="bg-slate-100/90 border-b border-slate-200 p-4 px-6 flex flex-wrap items-center justify-between gap-4 shrink-0">
          
          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Cible :</span>
            <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-2xs text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectionMode('single')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectionMode === 'single'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Table Unique
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode('batch')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectionMode === 'batch'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Toutes les Tables ({tables.length})
              </button>
            </div>
          </div>

          {/* Table / Area dropdown */}
          <div className="flex items-center gap-3">
            {selectionMode === 'single' ? (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">Table :</label>
                <select
                  value={selectedTableId}
                  onChange={e => setSelectedTableId(e.target.value)}
                  className="bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {tables.map(t => {
                    const area = areas.find(a => a.id === t.areaId);
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} {area ? `(${area.name})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">Zone :</label>
                <select
                  value={selectedAreaId}
                  onChange={e => setSelectedAreaId(e.target.value)}
                  className="bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="all">Toutes les zones ({tables.length} tables)</option>
                  {areas.map(a => {
                    const count = tables.filter(t => t.areaId === a.id).length;
                    return (
                      <option key={a.id} value={a.id}>
                        {a.name} ({count} tables)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Quick Dimensions Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Format :</label>
              <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-2xs text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setStickerFormat('58mm')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    stickerFormat === '58mm'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  58mm
                </button>
                <button
                  type="button"
                  onClick={() => setStickerFormat('80mm')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    stickerFormat === '80mm'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  80mm
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Body: Embedded ThermalStickerGenerator Component */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
          <ThermalStickerGenerator
            tables={generatorTableData}
            restaurantName={currentRestaurant?.name || 'AFRORESTO'}
            restaurantCity={currentRestaurant?.city ? `${currentRestaurant.city} • ${(currentRestaurant?.country || 'AFRIQUE').toUpperCase()}` : (currentRestaurant?.country || 'AFRIQUE').toUpperCase()}
            restaurantId={currentRestaurant?.id || 'resto'}
            initialFormat={stickerFormat}
            initialCta={customCta}
            className="shadow-sm"
          />
        </div>

      </div>

    </div>
  );
};
