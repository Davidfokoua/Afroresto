import React, { useState, useEffect } from 'react';
import { 
  Grid3X3, 
  Plus, 
  QrCode, 
  Printer, 
  Layers, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Download, 
  Check, 
  X, 
  Sparkles,
  Smartphone,
  Eye,
  CheckCircle2,
  AlertCircle,
  Tag,
  Copy,
  BellRing
} from 'lucide-react';
import QRCode from 'qrcode';
import { useRestaurant } from '../../context/RestaurantContext';
import { Table, RestaurantArea, TableStatus } from '../../types';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { ThermalStickerModal } from './ThermalStickerModal';
import { QRGeneratorModal } from './QRGeneratorModal';
import { TableTentModal } from './TableTentModal';
import { buildTableOrderUrl } from '../../utils/qrUrl';

export const TableManager: React.FC = () => {
  const { 
    tables, 
    areas, 
    addTable, 
    updateTable, 
    deleteTable, 
    addArea, 
    deleteArea, 
    currentRestaurant,
    setCurrentView,
    setActiveCustomerTableId,
    waiterCalls,
    acknowledgeTableWaiterCall
  } = useRestaurant();

  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [qrGeneratorModalConfig, setQrGeneratorModalConfig] = useState<{
    isOpen: boolean;
    initialTable: Table | null;
    initialFormat?: '58mm' | '80mm';
  }>({
    isOpen: false,
    initialTable: null,
    initialFormat: '58mm',
  });
  
  // Delete Modal State
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    itemType: 'table' | 'area';
    id: string;
    name: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    itemType: 'table',
    id: '',
    name: '',
    isDeleting: false,
  });

  // Table Modal
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableForm, setTableForm] = useState({
    name: 'Table 01',
    areaId: areas[0]?.id || '',
    capacity: 4,
    status: 'free' as TableStatus,
    customNewArea: '',
  });

  // Area Modal
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');

  // Print Preview Modal for Table Tent
  const [isTentModalOpen, setIsTentModalOpen] = useState(false);
  const [selectedTentTable, setSelectedTentTable] = useState<Table | null>(null);

  // Generate QR code data URLs for each table
  useEffect(() => {
    const generateQRs = async () => {
      const urls: Record<string, string> = {};
      for (const t of tables) {
        try {
          const targetRestId = currentRestaurant.id || t.restaurantId;
          const tableUrl = buildTableOrderUrl(targetRestId, t.id, currentRestaurant.customDomain);
          const qrDataUrl = await QRCode.toDataURL(tableUrl, {
            width: 320,
            margin: 2,
            color: {
              dark: '#064e3b', // Deep emerald
              light: '#ffffff',
            },
          });
          urls[t.id] = qrDataUrl;
        } catch (err) {
          console.error('Error generating QR:', err);
        }
      }
      setQrCodeUrls(urls);
    };

    generateQRs();
  }, [tables, currentRestaurant.id, currentRestaurant.customDomain]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const filteredTables = tables.filter(t => {
    if (selectedAreaFilter === 'all') return true;
    return t.areaId === selectedAreaFilter;
  });

  const handleOpenNewTable = () => {
    setEditingTable(null);
    const nextNum = tables.length + 1;
    const defaultArea = (selectedAreaFilter !== 'all' ? selectedAreaFilter : areas[0]?.id) || '';
    setTableForm({
      name: `Table ${nextNum < 10 ? '0' + nextNum : nextNum}`,
      areaId: defaultArea,
      capacity: 4,
      status: 'free',
      customNewArea: '',
    });
    setIsTableModalOpen(true);
  };

  const handleOpenEditTable = (table: Table) => {
    setEditingTable(table);
    setTableForm({
      name: table.name,
      areaId: table.areaId,
      capacity: table.capacity,
      status: table.status,
      customNewArea: '',
    });
    setIsTableModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableForm.name.trim()) return;

    let targetAreaId = tableForm.areaId;
    
    // If user typed a new area inline or no area existed
    if (tableForm.customNewArea.trim()) {
      const createdArea = await addArea(tableForm.customNewArea.trim());
      targetAreaId = createdArea.id;
    } else if (!targetAreaId) {
      if (areas.length > 0) {
        targetAreaId = areas[0].id;
      } else {
        const createdArea = await addArea('Salle Principale');
        targetAreaId = createdArea.id;
      }
    }

    if (editingTable) {
      await updateTable(editingTable.id, {
        name: tableForm.name.trim(),
        areaId: targetAreaId,
        capacity: Number(tableForm.capacity) || 4,
        status: tableForm.status,
      });
      showToast(`La table "${tableForm.name.trim()}" a été mise à jour.`);
    } else {
      await addTable({
        name: tableForm.name.trim(),
        tableNumber: tableForm.name.trim(),
        areaId: targetAreaId,
        capacity: Number(tableForm.capacity) || 4,
        status: tableForm.status,
      });
      showToast(`Nouvelle table "${tableForm.name.trim()}" créée avec QR code.`);
    }

    setIsTableModalOpen(false);
  };

  const handleCreateArea = async () => {
    if (!newAreaName.trim()) return;
    await addArea(newAreaName.trim());
    showToast(`Nouvel espace "${newAreaName.trim()}" créé avec succès.`);
    setNewAreaName('');
    setIsAreaModalOpen(false);
  };

  const handleExecuteDelete = async () => {
    if (!deleteModalConfig.id) return;
    setDeleteModalConfig(prev => ({ ...prev, isDeleting: true }));
    try {
      if (deleteModalConfig.itemType === 'table') {
        await deleteTable(deleteModalConfig.id);
        showToast(`Table "${deleteModalConfig.name}" définitivement supprimée.`);
      } else if (deleteModalConfig.itemType === 'area') {
        await deleteArea(deleteModalConfig.id);
        if (selectedAreaFilter === deleteModalConfig.id) {
          setSelectedAreaFilter('all');
        }
        showToast(`Espace "${deleteModalConfig.name}" supprimé et tables réassignées.`);
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleteModalConfig({
        isOpen: false,
        itemType: 'table',
        id: '',
        name: '',
        isDeleting: false,
      });
    }
  };

  const handleOpenCustomerQR = (tableId: string) => {
    setActiveCustomerTableId(tableId);
    setCurrentView('customer_qr');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-gray-900">Espaces, Tables & QR Codes</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {tables.length} tables
            </span>
          </div>
          <p className="text-xs text-gray-700 mt-0.5">Configurez vos zones et imprimez vos QR Codes chevalets personnalisés.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full sm:w-auto">
          {/* Top Chevalet QR Button */}
          <button
            onClick={() => {
              setSelectedTentTable(null);
              setIsTentModalOpen(true);
            }}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            title="Générer et imprimer les chevalets de table avec QR code, logo et instructions"
          >
            <QrCode className="w-4 h-4 shrink-0 text-slate-950" />
            <span className="hidden sm:inline">Chevalets QR de Table</span>
            <span className="sm:hidden">Chevalets QR</span>
          </button>

          <button
            onClick={() => setQrGeneratorModalConfig({ isOpen: true, initialTable: null, initialFormat: '58mm' })}
            className="flex-1 sm:flex-initial px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            title="Imprimer des étiquettes autocollantes monochromes 58mm ou 80mm pour toutes les tables"
          >
            <Tag className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="hidden sm:inline">Badges Autocollants Thermiques</span>
            <span className="sm:hidden">Badges Thermiques</span>
          </button>

          <button
            onClick={() => setIsAreaModalOpen(true)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>+ Espace</span>
          </button>

          <button
            id="table-add-btn"
            onClick={handleOpenNewTable}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Ajouter Table</span>
          </button>
        </div>
      </div>

      {/* Area Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 bg-white p-3 sm:p-3.5 rounded-2xl border border-gray-200 shadow-2xs items-center no-scrollbar">
        <button
          onClick={() => setSelectedAreaFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedAreaFilter === 'all'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tous les espaces ({tables.length})
        </button>
        {areas.map(area => {
          const count = tables.filter(t => t.areaId === area.id).length;
          return (
            <div 
              key={area.id} 
              className={`inline-flex items-center gap-1 rounded-xl transition-all ${
                selectedAreaFilter === area.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <button
                onClick={() => setSelectedAreaFilter(area.id)}
                className="px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap"
              >
                {area.name} ({count})
              </button>
              {areas.length > 1 && (
                <button
                  title={`Supprimer l'espace ${area.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteModalConfig({
                      isOpen: true,
                      itemType: 'area',
                      id: area.id,
                      name: area.name,
                      isDeleting: false
                    });
                  }}
                  className={`p-1.5 mr-1 rounded-lg transition-colors ${
                    selectedAreaFilter === area.id 
                      ? 'text-white/80 hover:text-white hover:bg-emerald-700' 
                      : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Tables Grid with QR previews */}
      {filteredTables.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-8 sm:p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
            <Grid3X3 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Aucune table dans cet espace</h3>
            <p className="text-xs text-gray-500 mt-1">Créez des tables pour générer automatiquement les QR codes chevalets.</p>
          </div>
          <button
            onClick={handleOpenNewTable}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une table maintenant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map(table => {
            const area = areas.find(a => a.id === table.areaId);
            const qrUrl = qrCodeUrls[table.id];
            const isWaiterCalled = table.waiterCalled || waiterCalls.some(c => c.tableId === table.id && c.status === 'pending');

            return (
              <div
                key={table.id}
                className={`bg-white rounded-3xl border shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all ${
                  isWaiterCalled ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50/20' : 'border-gray-200'
                }`}
              >
                <div>
                  {isWaiterCalled && (
                    <div className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-xl font-black text-xs animate-pulse mb-3 shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <BellRing className="w-3.5 h-3.5 animate-bounce" />
                        <span>Appel Serveur !</span>
                      </div>
                      <button
                        onClick={() => acknowledgeTableWaiterCall(table.id)}
                        className="px-2 py-0.5 bg-slate-950 text-white rounded-lg text-[10px] hover:bg-slate-800 cursor-pointer shadow-xs active:scale-95"
                      >
                        Acquitter
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      {area?.name || 'Salle Principale'}
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      table.status === 'occupied' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} title={table.status === 'occupied' ? 'Occupée' : 'Libre'}></span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <h3 className="text-base font-extrabold text-gray-900">{table.name}</h3>
                    <span className="text-xs text-gray-700 font-medium">{table.capacity} places</span>
                  </div>

                  {/* QR Code Graphic Box */}
                  <div className="my-3 bg-gray-50 rounded-2xl p-3 border border-gray-100 flex flex-col items-center justify-center">
                    {qrUrl ? (
                      <img 
                        src={qrUrl} 
                        alt={`QR Code ${table.name}`} 
                        className="w-32 h-32 rounded-xl object-contain shadow-2xs bg-white p-1"
                      />
                    ) : (
                      <div className="w-32 h-32 flex items-center justify-center text-gray-400">
                        <QrCode className="w-12 h-12 animate-pulse" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        HTTPS
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = buildTableOrderUrl(currentRestaurant.id || table.restaurantId, table.id, currentRestaurant.customDomain);
                          navigator.clipboard.writeText(url);
                          showToast(`Lien direct de ${table.name} copié !`);
                        }}
                        className="text-[10px] text-gray-500 hover:text-emerald-700 font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-white"
                        title="Copier le lien direct de la table"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        Copier lien
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSelectedTentTable(table);
                        setIsTentModalOpen(true);
                      }}
                      className="py-2 px-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-transform cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Chevalet QR
                    </button>

                    <button
                      onClick={() => handleOpenCustomerQR(table.id)}
                      className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] text-emerald-800 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-transform"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      Ouvrir QR
                    </button>
                  </div>

                  {/* Thermal Sticker Direct Action */}
                  <button
                    onClick={() => setQrGeneratorModalConfig({ isOpen: true, initialTable: table, initialFormat: '58mm' })}
                    className="w-full py-1.5 px-2 bg-emerald-50/70 hover:bg-emerald-100/80 active:scale-[0.98] text-emerald-900 border border-emerald-200/80 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1.5 transition-transform shadow-2xs"
                    title="Imprimer l'autocollant thermique prêt à coller pour cette table"
                  >
                    <Tag className="w-3 h-3 text-emerald-700" />
                    <span>Autocollant Thermique (58/80mm)</span>
                  </button>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <button
                      onClick={() => handleOpenEditTable(table)}
                      className="text-gray-700 hover:text-emerald-700 font-medium flex items-center gap-1 py-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> Modifier
                    </button>
                    <button
                      onClick={() => {
                        setDeleteModalConfig({
                          isOpen: true,
                          itemType: 'table',
                          id: table.id,
                          name: table.name,
                          isDeleting: false
                        });
                      }}
                      className="text-gray-700 hover:text-rose-600 font-medium flex items-center gap-1 py-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Supprimer
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* TABLE TENT MODAL (CHEVALETS QR) */}
      <TableTentModal
        isOpen={isTentModalOpen}
        onClose={() => {
          setIsTentModalOpen(false);
          setSelectedTentTable(null);
        }}
        tables={tables}
        areas={areas}
        currentRestaurant={currentRestaurant}
        initialSelectedTable={selectedTentTable}
      />

      {/* Table Create/Edit Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900">
                {editingTable ? 'Modifier la Table' : 'Ajouter une Table'}
              </h3>
              <button onClick={() => setIsTableModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700">Nom / Numéro de table *</label>
                <input
                  type="text"
                  required
                  value={tableForm.name}
                  onChange={e => setTableForm({ ...tableForm, name: e.target.value })}
                  placeholder="Ex: Table 08, VIP-1, Terrasse 2"
                  className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700">Espace assigné *</label>
                {areas.length > 0 ? (
                  <select
                    value={tableForm.areaId}
                    onChange={e => setTableForm({ ...tableForm, areaId: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs font-medium"
                  >
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={tableForm.customNewArea}
                    onChange={e => setTableForm({ ...tableForm, customNewArea: e.target.value })}
                    placeholder="Nom du nouvel espace (ex: Salle Principale)"
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                )}
              </div>

              <div>
                <label className="font-bold text-gray-700">Nombre de places (Couverts)</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={tableForm.capacity}
                  onChange={e => setTableForm({ ...tableForm, capacity: Number(e.target.value) })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Area Create Modal */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900">Nouvel Espace de Service</h3>
              <button onClick={() => setIsAreaModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700">Nom de la zone</label>
              <input
                type="text"
                value={newAreaName}
                onChange={e => setNewAreaName(e.target.value)}
                placeholder="Ex: Rooftop Lounge, Terrasse Piscine"
                className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setIsAreaModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-700 hover:bg-gray-100 font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateArea}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                Créer l'espace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title={deleteModalConfig.itemType === 'table' ? 'Supprimer la table' : 'Supprimer l\'espace de service'}
        itemName={deleteModalConfig.name}
        itemType={deleteModalConfig.itemType === 'table' ? 'cette table' : 'cet espace'}
        warningMessage={
          deleteModalConfig.itemType === 'table'
            ? 'La table et son QR code client seront définitivement effacés. La modification est synchronisée en direct avec la base de données.'
            : 'Toutes les tables associées à cet espace seront automatiquement réaffectées à un autre espace disponible.'
        }
        isDeleting={deleteModalConfig.isDeleting}
      />

      {/* QR Generator & Thermal Sticker Modal */}
      {currentRestaurant && (
        <QRGeneratorModal
          isOpen={qrGeneratorModalConfig.isOpen}
          onClose={() => setQrGeneratorModalConfig({ isOpen: false, initialTable: null, initialFormat: '58mm' })}
          tables={tables}
          areas={areas}
          currentRestaurant={currentRestaurant}
          initialSelectedTable={qrGeneratorModalConfig.initialTable}
          initialFormat={qrGeneratorModalConfig.initialFormat}
        />
      )}

    </div>
  );
};
