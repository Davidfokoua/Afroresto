import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  Check, 
  Layers, 
  Settings2, 
  Eye, 
  Smartphone, 
  Sparkles, 
  Sliders, 
  FileText, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Maximize2,
  Tag,
  Share2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import QRCode from 'qrcode';
import { Table, RestaurantArea, Restaurant } from '../../types';
import { printThermalStickersDirectly, openThermalStickersInNewTab, PrintableThermalItem } from '../../utils/thermalPrinter';
import { buildTableOrderUrl } from '../../utils/qrUrl';

export type ThermalFormat = '58mm' | '80mm' | 'square50' | 'round50';
export type StickerStyle = 'modern' | 'minimal' | 'bordered' | 'badge_round';

interface ThermalStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  areas: RestaurantArea[];
  currentRestaurant: Restaurant;
  initialSelectedTable?: Table | null;
}

export const ThermalStickerModal: React.FC<ThermalStickerModalProps> = ({
  isOpen,
  onClose,
  tables,
  areas,
  currentRestaurant,
  initialSelectedTable = null,
}) => {
  // Selection mode: 'single' or 'batch'
  const [selectionMode, setSelectionMode] = useState<'single' | 'batch'>(initialSelectedTable ? 'single' : 'batch');
  const [selectedTableId, setSelectedTableId] = useState<string>(initialSelectedTable?.id || tables[0]?.id || '');
  const [selectedAreaBatch, setSelectedAreaBatch] = useState<string>('all');
  
  // Customization Options
  const [thermalFormat, setThermalFormat] = useState<ThermalFormat>('58mm');
  const [stickerStyle, setStickerStyle] = useState<StickerStyle>('modern');
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [showAreaName, setShowAreaName] = useState<boolean>(true);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [showShortUrl, setShowShortUrl] = useState<boolean>(true);
  const [customCallToAction, setCustomCallToAction] = useState<string>('SCANNEZ POUR COMMANDER');
  const [qrSizeScale, setQrSizeScale] = useState<'normal' | 'large'>('large');

  // Generated QR Data URLs mapped by table ID
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // Set initial selected table if changed
  useEffect(() => {
    if (initialSelectedTable) {
      setSelectedTableId(initialSelectedTable.id);
      setSelectionMode('single');
    }
  }, [initialSelectedTable]);

  // Generate crisp black-and-white QR codes for all tables
  useEffect(() => {
    const generateAllQrs = async () => {
      setIsGenerating(true);
      const urls: Record<string, string> = {};

      for (const table of tables) {
        try {
          const targetUrl = buildTableOrderUrl(currentRestaurant.id || table.restaurantId, table.id, currentRestaurant.customDomain);
          // Generate 100% black monochrome QR code with maximum error correction (M or Q)
          const qrDataUrl = await QRCode.toDataURL(targetUrl, {
            width: 400,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: {
              dark: '#000000', // Pure monochrome black for thermal print heads
              light: '#ffffff',
            },
          });
          urls[table.id] = qrDataUrl;
        } catch (err) {
          console.error('Failed to generate QR for table:', table.name, err);
        }
      }

      setQrCodeDataUrls(urls);
      setIsGenerating(false);
    };

    if (tables.length > 0) {
      generateAllQrs();
    }
  }, [tables, currentRestaurant.id]);

  if (!isOpen) return null;

  // Filter tables to print in batch mode
  const tablesToPrint: Table[] = selectionMode === 'single'
    ? tables.filter(t => t.id === selectedTableId)
    : selectedAreaBatch === 'all'
      ? tables
      : tables.filter(t => t.areaId === selectedAreaBatch);

  const activeSingleTable = tables.find(t => t.id === selectedTableId) || tables[0];

  const handleTriggerPrint = async () => {
    const items: PrintableThermalItem[] = tablesToPrint.map((t) => {
      const area = areas.find(a => a.id === t.areaId);
      return {
        tableNumber: t.name.replace(/\D/g, '') || t.name,
        tableName: t.name,
        areaName: area?.name,
        restaurantName: currentRestaurant.name,
        restaurantCity: currentRestaurant.city ? `${currentRestaurant.city} • CAMEROUN` : 'CAMEROUN',
        qrDataUrl: qrCodeDataUrls[t.id] || '',
        callToAction: customCallToAction,
        tableUrl: buildTableOrderUrl(currentRestaurant.id || t.restaurantId, t.id, currentRestaurant.customDomain),
        id: t.id,
      };
    });

    await printThermalStickersDirectly(items, {
      format: thermalFormat,
      showArea: showAreaName,
      showInstructions,
      customCta: customCallToAction,
    });
  };

  const handleOpenNewTab = () => {
    const items: PrintableThermalItem[] = tablesToPrint.map((t) => {
      const area = areas.find(a => a.id === t.areaId);
      return {
        tableNumber: t.name.replace(/\D/g, '') || t.name,
        tableName: t.name,
        areaName: area?.name,
        restaurantName: currentRestaurant.name,
        restaurantCity: currentRestaurant.city ? `${currentRestaurant.city} • CAMEROUN` : 'CAMEROUN',
        qrDataUrl: qrCodeDataUrls[t.id] || '',
        callToAction: customCallToAction,
        tableUrl: buildTableOrderUrl(currentRestaurant.id || t.restaurantId, t.id, currentRestaurant.customDomain),
        id: t.id,
      };
    });

    openThermalStickersInNewTab(items, {
      format: thermalFormat,
      showArea: showAreaName,
      showInstructions,
      customCta: customCallToAction,
    });
  };

  const handleCopyDirectLink = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    const link = buildTableOrderUrl(currentRestaurant.id || table?.restaurantId || '', tableId, currentRestaurant.customDomain);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Download high-res PNG of sticker canvas
  const handleDownloadStickerPng = async (table: Table) => {
    const qrDataUrl = qrCodeDataUrls[table.id];
    if (!qrDataUrl) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const area = areas.find(a => a.id === table.areaId);
      const is58 = thermalFormat === '58mm';
      const isSquare = thermalFormat === 'square50';
      const isRound = thermalFormat === 'round50';

      const canvasWidth = is58 ? 420 : isSquare ? 500 : isRound ? 500 : 580;
      const canvasHeight = isSquare || isRound ? 500 : is58 ? 620 : 700;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Draw pure white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      if (isRound) {
        ctx.beginPath();
        ctx.arc(canvasWidth / 2, canvasHeight / 2, (canvasWidth / 2) - 8, 0, Math.PI * 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
      } else if (stickerStyle === 'bordered') {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(8, 8, canvasWidth - 16, canvasHeight - 16);
      }

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';

      let currentY = isRound ? 50 : 35;

      // Restaurant Name
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(currentRestaurant.name.toUpperCase(), canvasWidth / 2, currentY);
      currentY += 20;

      // City / Area
      if (showAreaName && area) {
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(`ZONE : ${area.name.toUpperCase()}`, canvasWidth / 2, currentY);
        currentY += 26;
      }

      // Table Big Title
      ctx.font = '900 36px sans-serif';
      ctx.fillText(table.name.toUpperCase(), canvasWidth / 2, currentY);
      currentY += 25;

      // Draw QR Image
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise(resolve => { qrImg.onload = resolve; });

      const qrRenderSize = is58 ? 240 : isSquare || isRound ? 220 : 280;
      const qrX = (canvasWidth - qrRenderSize) / 2;
      ctx.drawImage(qrImg, qrX, currentY, qrRenderSize, qrRenderSize);
      currentY += qrRenderSize + 28;

      // Call to action
      if (showInstructions) {
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(customCallToAction, canvasWidth / 2, currentY);
        currentY += 20;

        ctx.font = '14px sans-serif';
        ctx.fillText('MENU DIGITAL SANS CONTACT', canvasWidth / 2, currentY);
        currentY += 20;
      }

      // Footer brand
      ctx.font = 'bold 11px monospace';
      ctx.fillText('AFRORESTO • Commande Sécurisée HTTPS', canvasWidth / 2, canvasHeight - 15);

      // Download
      const link = document.createElement('a');
      link.download = `autocollant-thermique-${table.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      
      {/* Container Box */}
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Impression Thermique de Badges QR Autocollants
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  Papier Autocollant 58mm / 80mm
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Générez des étiquettes monochromes ultra-nettes prêtes à coller sur vos tables de restaurant.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Controls & Right Thermal Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* LEFT PANEL: CONFIGURATION (5 cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 space-y-6 bg-slate-50/70 overflow-y-auto">
            
            {/* Mode: Single Table vs Batch Planche */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mode d'impression :</span>
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectionMode('single')}
                  className={`py-2 rounded-xl transition-all ${
                    selectionMode === 'single'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Table Unique
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode('batch')}
                  className={`py-2 rounded-xl transition-all ${
                    selectionMode === 'batch'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Toutes les Tables ({tables.length})
                </button>
              </div>
            </div>

            {/* Selector: Table selection or Area filter */}
            {selectionMode === 'single' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Sélectionner la Table :</label>
                <select
                  value={selectedTableId}
                  onChange={e => setSelectedTableId(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {tables.map(t => {
                    const area = areas.find(a => a.id === t.areaId);
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} — {area?.name || 'Salle'} ({t.capacity} places)
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Filtrer par Espace :</label>
                <select
                  value={selectedAreaBatch}
                  onChange={e => setSelectedAreaBatch(e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="all">Tous les espaces ({tables.length} autocollants)</option>
                  {areas.map(a => {
                    const count = tables.filter(t => t.areaId === a.id).length;
                    return (
                      <option key={a.id} value={a.id}>
                        {a.name} ({count} autocollants)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Thermal Format Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-emerald-600" />
                  Format du Papier Thermique :
                </span>
                <span className="text-[10px] text-emerald-700 font-mono font-semibold">
                  {thermalFormat === '58mm' ? 'Largeur 58mm' : thermalFormat === '80mm' ? 'Largeur 80mm' : 'Étiquette découpée'}
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setThermalFormat('58mm')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    thermalFormat === '58mm'
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">58 mm (Mini POS)</span>
                    {thermalFormat === '58mm' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Imprimantes Bluetooth & portables de poche</p>
                </button>

                <button
                  type="button"
                  onClick={() => setThermalFormat('80mm')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    thermalFormat === '80mm'
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">80 mm (Standard)</span>
                    {thermalFormat === '80mm' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Imprimantes caisse (Epson, Sunmi, Xprinter)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setThermalFormat('square50')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    thermalFormat === 'square50'
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">Carré (50×50mm)</span>
                    {thermalFormat === 'square50' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Étiqueteuses de bureau & stickers pré-découpés</p>
                </button>

                <button
                  type="button"
                  onClick={() => setThermalFormat('round50')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    thermalFormat === 'round50'
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">Badge Rond (Macaron)</span>
                    {thermalFormat === 'round50' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Macaron circulaire pour centre de table</p>
                </button>
              </div>
            </div>

            {/* Visual Style Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Style du Badge :</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStickerStyle('modern')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all ${
                    stickerStyle === 'modern'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Moderne
                </button>
                <button
                  type="button"
                  onClick={() => setStickerStyle('bordered')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all ${
                    stickerStyle === 'bordered'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Cadre Découpe
                </button>
                <button
                  type="button"
                  onClick={() => setStickerStyle('minimal')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all ${
                    stickerStyle === 'minimal'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Minimaliste
                </button>
              </div>
            </div>

            {/* Custom Options Toggle */}
            <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
              <p className="font-bold text-slate-800 pb-1 border-b border-slate-100">Contenu & Mentions :</p>
              
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-600">Afficher la Zone (ex: Terrasse)</span>
                <input
                  type="checkbox"
                  checked={showAreaName}
                  onChange={e => setShowAreaName(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-600">Instructions de scan ("Scannez...")</span>
                <input
                  type="checkbox"
                  checked={showInstructions}
                  onChange={e => setShowInstructions(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </label>

              <div className="pt-2">
                <label className="text-[11px] font-bold text-slate-700">Texte d'incitation :</label>
                <input
                  type="text"
                  value={customCallToAction}
                  onChange={e => setCustomCallToAction(e.target.value)}
                  placeholder="Ex: SCANNEZ POUR COMMANDER"
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase"
                />
              </div>
            </div>

            {/* Tips for Thermal Adhesive Paper */}
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl space-y-1.5 text-xs text-emerald-950">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Conseils pour rouleaux autocollants thermiques :</span>
              </div>
              <ul className="text-[11px] text-emerald-800 space-y-1 list-disc list-inside pl-0.5">
                <li>Utilisez du **papier thermique autocollant étanche (waterproof/anti-gras)** disponible chez les revendeurs de caisses enregistreuses à Douala & Yaoundé.</li>
                <li>Le QR code généré est 100% noir monochrome sans niveaux de gris pour une gravure thermique instantanée et durable.</li>
              </ul>
            </div>

          </div>

          {/* RIGHT PANEL: LIVE THERMAL STICKER PREVIEW (7 cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between bg-slate-200/60 overflow-y-auto">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Aperçu Rendu Thermique ({selectionMode === 'single' ? '1 étiquette' : `${tablesToPrint.length} étiquettes`})
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {selectionMode === 'single' && (
                    <button
                      onClick={() => handleCopyDirectLink(activeSingleTable.id)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                      title="Copier le lien direct vers le menu de la table"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Lien copié !' : 'Copier Lien'}</span>
                    </button>
                  )}
                  {selectionMode === 'single' && (
                    <button
                      onClick={() => handleDownloadStickerPng(activeSingleTable)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                      title="Télécharger l'image PNG haute résolution de l'autocollant"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>PNG HD</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Toast Download */}
              {downloadSuccess && (
                <div className="p-2.5 bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Autocollant PNG téléchargé avec succès pour votre étiqueteuse !</span>
                </div>
              )}

              {/* Thermal Sticker Visual Card (Simulates Real Paper Receipt/Sticker) */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-300/60 rounded-3xl border border-slate-300/80">
                
                {/* Scrollable Container for Preview */}
                <div className="max-h-[460px] overflow-y-auto w-full flex flex-col items-center gap-6 py-2 no-scrollbar">
                  
                  {tablesToPrint.map((table) => {
                    const area = areas.find(a => a.id === table.areaId);
                    const qrUrl = qrCodeDataUrls[table.id];

                    const widthClass = thermalFormat === '58mm'
                      ? 'w-[220px]'
                      : thermalFormat === 'square50'
                        ? 'w-[240px] h-[240px]'
                        : thermalFormat === 'round50'
                          ? 'w-[240px] h-[240px] rounded-full'
                          : 'w-[280px]';

                    return (
                      <div
                        key={table.id}
                        className={`bg-white text-black shadow-xl border border-slate-300 p-4 flex flex-col items-center text-center select-none font-sans relative ${widthClass} ${
                          thermalFormat === 'round50' 
                            ? 'rounded-full justify-center border-4 border-dashed border-black' 
                            : stickerStyle === 'bordered' 
                              ? 'rounded-xl border-2 border-dashed border-black' 
                              : 'rounded-xl'
                        }`}
                        style={{ fontFamily: 'monospace, system-ui' }}
                      >
                        
                        {/* Thermal Paper Top Tear Line Simulation */}
                        {thermalFormat !== 'round50' && (
                          <div className="w-full flex justify-between items-center pb-2 mb-2 border-b border-dashed border-slate-400 text-[10px] text-slate-500 font-mono">
                            <span>••• DÉCOUPE AUTOCOLLANT •••</span>
                          </div>
                        )}

                        {/* Restaurant Brand Header */}
                        <div className="space-y-0.5">
                          <h4 className="font-black text-xs uppercase tracking-tight text-black leading-none">
                            {currentRestaurant.name}
                          </h4>
                          <p className="text-[9px] text-slate-700 uppercase font-semibold">
                            {currentRestaurant.city} • CAMEROUN
                          </p>
                        </div>

                        {/* Table Name & Area */}
                        <div className="my-1.5 space-y-0.5">
                          {showAreaName && area && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-800 block">
                              ZONE {area.name}
                            </span>
                          )}
                          <h2 className="text-xl sm:text-2xl font-black uppercase text-black tracking-tight leading-tight">
                            {table.name}
                          </h2>
                        </div>

                        {/* Pure Monochrome QR Code */}
                        <div className="bg-white p-1 rounded-lg border border-black inline-block my-1 shadow-2xs">
                          {qrUrl ? (
                            <img
                              src={qrUrl}
                              alt={`QR Code ${table.name}`}
                              className={thermalFormat === '58mm' ? 'w-28 h-28 object-contain' : 'w-36 h-36 object-contain'}
                            />
                          ) : (
                            <div className="w-28 h-28 bg-slate-100 flex items-center justify-center text-xs font-mono">
                              QR...
                            </div>
                          )}
                        </div>

                        {/* Call to action & instructions */}
                        {showInstructions && (
                          <div className="space-y-0.5 mt-1">
                            <p className="font-black text-[11px] uppercase tracking-tight text-black">
                              {customCallToAction}
                            </p>
                            <p className="text-[9px] text-slate-800 font-medium">
                              Ouvrez l'appareil photo du téléphone
                            </p>
                          </div>
                        )}

                        {/* Footer Short Link & Brand */}
                        <div className="w-full pt-2 mt-2 border-t border-dashed border-slate-400 text-[8px] font-mono text-slate-600 flex items-center justify-between">
                          <span>AFRORESTO</span>
                          <span>table/{table.id.slice(0, 6)}</span>
                        </div>

                      </div>
                    );
                  })}

                </div>

              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="pt-5 mt-4 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Prêt pour imprimantes thermiques <strong>{thermalFormat.toUpperCase()}</strong> (ESC/POS & USB/Bluetooth).
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors w-1/2 sm:w-auto"
                >
                  Fermer
                </button>

                <button
                  onClick={handleTriggerPrint}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all w-1/2 sm:w-auto"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer ({tablesToPrint.length})</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* PRINT-ONLY CONTAINER (Triggered on window.print()) */}
      <div id="printable-thermal-sticker" className="print-only-container">
        {tablesToPrint.map((table) => {
          const area = areas.find(a => a.id === table.areaId);
          const qrUrl = qrCodeDataUrls[table.id];

          return (
            <div
              key={table.id}
              className={`thermal-print-item ${thermalFormat === '58mm' ? 'thermal-58mm' : 'thermal-80mm'} ${
                thermalFormat === 'round50' ? 'thermal-round' : ''
              }`}
              style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
            >
              {/* Restaurant Name */}
              <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                <div style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>
                  {currentRestaurant.name}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 'bold' }}>
                  {currentRestaurant.city} • CAMEROUN
                </div>
              </div>

              {/* Area & Table */}
              <div style={{ textAlign: 'center', margin: '4px 0' }}>
                {showAreaName && area && (
                  <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    ZONE : {area.name}
                  </div>
                )}
                <div style={{ fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.1' }}>
                  {table.name}
                </div>
              </div>

              {/* QR Code */}
              <div style={{ textAlign: 'center', margin: '6px 0' }}>
                {qrUrl && (
                  <img
                    src={qrUrl}
                    alt={table.name}
                    style={{
                      width: thermalFormat === '58mm' ? '170px' : '220px',
                      height: thermalFormat === '58mm' ? '170px' : '220px',
                      margin: '0 auto',
                      display: 'block'
                    }}
                  />
                )}
              </div>

              {/* Instructions */}
              {showInstructions && (
                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>
                    {customCallToAction}
                  </div>
                  <div style={{ fontSize: '9px', marginTop: '2px' }}>
                    MENU DIGITAL SANS CONTACT
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #000', fontSize: '8px', fontFamily: 'monospace' }}>
                RESTOCAM • table/{table.id.slice(0, 6)}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
