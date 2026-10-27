import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  QrCode as QrCodeIcon, 
  Check, 
  Sliders, 
  Sparkles, 
  FileText, 
  Copy, 
  CheckCircle2, 
  Tag, 
  Smartphone,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { 
  printThermalStickersDirectly, 
  openThermalStickersInNewTab, 
  PrintableThermalItem 
} from '../../utils/thermalPrinter';
import { buildTableOrderUrl } from '../../utils/qrUrl';

export interface ThermalStickerTableData {
  id?: string;
  tableNumber: string | number;
  tableName?: string;
  areaName?: string;
  capacity?: number;
  restaurantName?: string;
  restaurantCity?: string;
  customUrl?: string;
}

export interface ThermalStickerGeneratorProps {
  /**
   * Table data or list of table data to generate thermal stickers for.
   */
  tables?: ThermalStickerTableData[];
  /**
   * Single table shorthand (if passing a single table).
   */
  table?: ThermalStickerTableData;
  /**
   * Restaurant name to display on the sticker header.
   */
  restaurantName?: string;
  /**
   * Restaurant city / subtitle.
   */
  restaurantCity?: string;
  /**
   * Restaurant ID used for generating table URLs if customUrl is not provided.
   */
  restaurantId?: string;
  /**
   * Initial thermal printer paper format ('58mm' or '80mm'). Defaults to '58mm'.
   */
  initialFormat?: '58mm' | '80mm';
  /**
   * Custom Call-To-Action text (e.g. 'SCANNEZ POUR COMMANDER').
   */
  initialCta?: string;
  /**
   * Optional callback triggered when the user clicks the print button.
   */
  onPrint?: () => void;
  /**
   * Optional container className.
   */
  className?: string;
}

export const ThermalStickerGenerator: React.FC<ThermalStickerGeneratorProps> = ({
  tables: initialTables,
  table: singleTable,
  restaurantName = 'AFRORESTO RESTAURANT',
  restaurantCity = 'ABIDJAN • AFRIQUE',
  restaurantId = 'resto-demo',
  initialFormat = '58mm',
  initialCta = 'SCANNEZ POUR COMMANDER',
  onPrint,
  className = '',
}) => {
  // Normalize tables array
  const tableList: ThermalStickerTableData[] = initialTables && initialTables.length > 0 
    ? initialTables 
    : singleTable 
      ? [singleTable] 
      : [
          {
            id: 'table-01',
            tableNumber: '1',
            tableName: 'Table 1',
            areaName: 'Terrasse',
            capacity: 4,
          },
        ];

  const [selectedTableIndex, setSelectedTableIndex] = useState<number>(0);
  const [thermalFormat, setThermalFormat] = useState<'58mm' | '80mm'>(initialFormat);
  const [callToAction, setCallToAction] = useState<string>(initialCta);
  const [showArea, setShowArea] = useState<boolean>(true);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [printAllBatch, setPrintAllBatch] = useState<boolean>(tableList.length > 1);

  // Map of generated QR Code Data URLs
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printStatus, setPrintStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  // Helper to build URL for a given table
  const getTableUrl = (t: ThermalStickerTableData): string => {
    if (t.customUrl) return t.customUrl;
    const tableId = t.id || `table-${t.tableNumber}`;
    return buildTableOrderUrl(restaurantId, tableId);
  };

  // Generate crisp black-and-white QR codes for all tables
  useEffect(() => {
    let isMounted = true;
    const generateQrs = async () => {
      setIsGenerating(true);
      const urlMap: Record<string, string> = {};

      for (let i = 0; i < tableList.length; i++) {
        const item = tableList[i];
        const key = item.id || `index-${i}`;
        const targetUrl = getTableUrl(item);

        try {
          // Monochrome black QR code with high contrast for thermal print heads
          const qrDataUrl = await QRCode.toDataURL(targetUrl, {
            width: 400,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          if (isMounted) {
            urlMap[key] = qrDataUrl;
          }
        } catch (err) {
          console.error('Error generating thermal QR code for table:', item.tableName || item.tableNumber, err);
        }
      }

      if (isMounted) {
        setQrCodeUrls(urlMap);
        setIsGenerating(false);
      }
    };

    generateQrs();

    return () => {
      isMounted = false;
    };
  }, [tableList, restaurantId]);

  const activeTable = tableList[selectedTableIndex] || tableList[0];
  const activeQrKey = activeTable?.id || `index-${selectedTableIndex}`;
  const activeQrUrl = qrCodeUrls[activeQrKey];

  const activeRestaurantName = activeTable?.restaurantName || restaurantName;
  const activeRestaurantCity = activeTable?.restaurantCity || restaurantCity;

  // Tables to print
  const tablesToPrint = printAllBatch ? tableList : [activeTable];

  // Helper to get structured printable items
  const getPrintableItems = (): PrintableThermalItem[] => {
    return tablesToPrint.map((t, idx) => {
      const key = t.id || `index-${tableList.indexOf(t) >= 0 ? tableList.indexOf(t) : idx}`;
      return {
        tableNumber: t.tableNumber,
        tableName: t.tableName || `Table ${t.tableNumber}`,
        areaName: t.areaName,
        restaurantName: t.restaurantName || restaurantName,
        restaurantCity: t.restaurantCity || restaurantCity,
        qrDataUrl: qrCodeUrls[key] || activeQrUrl || '',
        callToAction: callToAction,
        tableUrl: getTableUrl(t),
        id: t.id,
      };
    });
  };

  // Robust Direct Print Handler
  const handlePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    setPrintStatus({ message: 'Préparation et envoi du document à l\'imprimante...', type: 'info' });

    if (onPrint) {
      onPrint();
    }

    try {
      const items = getPrintableItems();
      const result = await printThermalStickersDirectly(items, {
        format: thermalFormat,
        showArea,
        showInstructions,
        customCta: callToAction,
      });

      if (result.success) {
        setPrintStatus({ 
          message: 'Ordre d\'impression envoyé ! Si votre navigateur bloque la fenêtre, utilisez "Ouvrir dans un onglet".', 
          type: 'success' 
        });
      } else {
        setPrintStatus({ 
          message: 'Impression directe bloquée par le navigateur. Cliquez sur "Ouvrir dans un nouvel onglet" ci-dessous.', 
          type: 'error' 
        });
      }
    } catch (err) {
      console.error('Print trigger error:', err);
      // Fallback
      window.print();
      setPrintStatus({ 
        message: 'Tentative d\'impression via le navigateur lancée.', 
        type: 'info' 
      });
    } finally {
      setIsPrinting(false);
      setTimeout(() => {
        setPrintStatus(null);
      }, 6000);
    }
  };

  // Standalone new tab fallback
  const handleOpenNewTab = () => {
    const items = getPrintableItems();
    openThermalStickersInNewTab(items, {
      format: thermalFormat,
      showArea,
      showInstructions,
      customCta: callToAction,
    });
  };

  // Copy link
  const handleCopyLink = () => {
    const link = getTableUrl(activeTable);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Download high-resolution PNG for label printer
  const handleDownloadPng = async () => {
    if (!activeQrUrl) return;
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const is58 = thermalFormat === '58mm';
      const width = is58 ? 400 : 560;
      const height = is58 ? 600 : 700;

      canvas.width = width;
      canvas.height = height;

      // Fill pure white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Border frame
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(6, 6, width - 12, height - 12);

      // Header Restaurant
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(activeRestaurantName.toUpperCase(), width / 2, 40);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(activeRestaurantCity.toUpperCase(), width / 2, 60);

      // Area tag
      let currentY = 85;
      if (showArea && activeTable.areaName) {
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`ZONE : ${activeTable.areaName.toUpperCase()}`, width / 2, currentY);
        currentY += 24;
      }

      // Table Big Heading
      ctx.font = '900 36px sans-serif';
      const displayTitle = activeTable.tableName || `TABLE ${activeTable.tableNumber}`;
      ctx.fillText(displayTitle.toUpperCase(), width / 2, currentY + 15);
      currentY += 35;

      // Draw QR Code
      const qrImg = new Image();
      qrImg.src = activeQrUrl;
      await new Promise(resolve => { qrImg.onload = resolve; });

      const qrSize = is58 ? 220 : 280;
      const qrX = (width - qrSize) / 2;
      ctx.drawImage(qrImg, qrX, currentY + 10, qrSize, qrSize);
      currentY += qrSize + 25;

      // CTA Instructions
      if (showInstructions) {
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(callToAction, width / 2, currentY + 15);
        currentY += 20;

        ctx.font = '12px sans-serif';
        ctx.fillText('MENU DIGITAL SANS CONTACT', width / 2, currentY + 15);
      }

      // Footer
      ctx.font = 'bold 10px monospace';
      ctx.fillText('AFRORESTO • Menu Digital Sécurisé HTTPS', width / 2, height - 18);

      const link = document.createElement('a');
      const cleanName = (activeTable.tableName || `table-${activeTable.tableNumber}`).toLowerCase().replace(/\s+/g, '-');
      link.download = `badge-thermique-${thermalFormat}-${cleanName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error downloading thermal sticker PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 shadow-soft-sm overflow-hidden ${className}`}>
      
      {/* Component Header */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                Générateur de Badges Autocollants Thermiques
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                {thermalFormat} ESC/POS
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Étiquettes autocollantes monochromes 58mm & 80mm prêtes à imprimer et coller sur les tables.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            title="Ouvrir les étiquettes prêtes à imprimer dans un nouvel onglet"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ouvrir dans un onglet</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting || isGenerating}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            title="Lancer l'impression thermique directe"
          >
            {isPrinting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            <span>{isPrinting ? 'Envoi...' : `Imprimer (${tablesToPrint.length})`}</span>
          </button>
        </div>
      </div>

      {/* Print Status Feedback Banner */}
      {printStatus && (
        <div className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between gap-3 border-b animate-in fade-in ${
          printStatus.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : printStatus.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {printStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {printStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {printStatus.type === 'info' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />}
            <span>{printStatus.message}</span>
          </div>

          <button
            type="button"
            onClick={handleOpenNewTab}
            className="underline hover:no-underline font-extrabold text-[11px] cursor-pointer ml-auto"
          >
            Ouvrir dans un onglet dédié →
          </button>
        </div>
      )}

      {/* Grid: Controls on Left, Live Thermal Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        
        {/* Left Control Panel (5 cols) */}
        <div className="lg:col-span-5 p-5 sm:p-6 space-y-5 bg-slate-50/60">
          
          {/* Format Selector: 58mm vs 80mm */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                Largeur du Papier Thermique :
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-700">
                {thermalFormat === '58mm' ? '58 mm (Mini)' : '80 mm (Standard)'}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setThermalFormat('58mm')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  thermalFormat === '58mm'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">58 mm</span>
                  {thermalFormat === '58mm' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Imprimantes de poche & Bluetooth</p>
              </button>

              <button
                type="button"
                onClick={() => setThermalFormat('80mm')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  thermalFormat === '80mm'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">80 mm</span>
                  {thermalFormat === '80mm' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Imprimantes caisse (Sunmi, Epson, Xprinter)</p>
              </button>
            </div>
          </div>

          {/* Table Selector (if multiple) */}
          {tableList.length > 1 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">
                Sélectionner la Table :
              </label>
              <select
                value={selectedTableIndex}
                onChange={e => setSelectedTableIndex(Number(e.target.value))}
                className="w-full p-2.5 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {tableList.map((t, idx) => (
                  <option key={t.id || idx} value={idx}>
                    {t.tableName || `Table ${t.tableNumber}`} {t.areaName ? `— (${t.areaName})` : ''}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printAllBatch}
                  onChange={e => setPrintAllBatch(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-xs text-slate-700 font-semibold">
                  Imprimer toutes les tables ({tableList.length} étiquettes) en 1 clic
                </span>
              </label>
            </div>
          )}

          {/* Options: CTA text & Area */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
            <p className="font-bold text-slate-800 pb-1 border-b border-slate-100">
              Personnalisation de l'Étiquette :
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-700">Texte d'appel à l'action :</label>
              <input
                type="text"
                value={callToAction}
                onChange={e => setCallToAction(e.target.value)}
                placeholder="Ex: SCANNEZ POUR COMMANDER"
                className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase"
              />
            </div>

            <label className="flex items-center justify-between cursor-pointer pt-1">
              <span className="text-slate-600">Afficher la Zone (ex: VIP, Terrasse)</span>
              <input
                type="checkbox"
                checked={showArea}
                onChange={e => setShowArea(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-600">Afficher les instructions de scan</span>
              <input
                type="checkbox"
                checked={showInstructions}
                onChange={e => setShowInstructions(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
            </label>
          </div>

          {/* Quick Tips */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-xs text-emerald-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Prêt pour étiqueteuses & imprimantes thermiques :</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Le QR code est généré en 100% noir pur monochrome sans dégradés pour une gravure thermique nette, rapide et résistante à l'eau/graisses.
            </p>
          </div>

        </div>

        {/* Right Live Thermal Preview (7 cols) */}
        <div className="lg:col-span-7 p-6 flex flex-col justify-between bg-slate-200/70">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Aperçu Ticket Thermique ({thermalFormat})
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  title="Copier l'URL cible de la table"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copié !' : 'Copier URL'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isDownloading}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  title="Télécharger l'image PNG haute résolution pour étiqueteuse mobile"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isDownloading ? 'Génération...' : 'PNG HD'}</span>
                </button>
              </div>
            </div>

            {/* Visual Simulated Thermal Paper */}
            <div className="flex justify-center p-4">
              <div 
                className={`bg-white text-black shadow-xl border-2 border-dashed border-black p-4 flex flex-col items-center text-center select-none ${
                  thermalFormat === '58mm' ? 'w-[220px]' : 'w-[280px]'
                } rounded-xl`}
                style={{ fontFamily: 'monospace, system-ui' }}
              >
                {/* Tear header */}
                <div className="w-full pb-2 mb-2 border-b border-dashed border-black text-[9px] text-black font-mono">
                  •••• DÉCOUPE AUTOCOLLANT ••••
                </div>

                {/* Restaurant Brand */}
                <div className="space-y-0.5">
                  <h4 className="font-black text-xs uppercase tracking-tight text-black leading-none">
                    {activeRestaurantName}
                  </h4>
                  <p className="text-[8px] text-black uppercase font-bold">
                    {activeRestaurantCity}
                  </p>
                </div>

                {/* Table Title */}
                <div className="my-2 space-y-0.5">
                  {showArea && activeTable.areaName && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-black block">
                      ZONE {activeTable.areaName}
                    </span>
                  )}
                  <h2 className="text-xl sm:text-2xl font-black uppercase text-black tracking-tight leading-tight">
                    {activeTable.tableName || `TABLE ${activeTable.tableNumber}`}
                  </h2>
                </div>

                {/* Crisp Monochrome QR */}
                <div className="bg-white p-1 rounded-md border border-black inline-block my-1">
                  {activeQrUrl ? (
                    <img
                      src={activeQrUrl}
                      alt={activeTable.tableName || `Table ${activeTable.tableNumber}`}
                      className={thermalFormat === '58mm' ? 'w-28 h-28 object-contain' : 'w-36 h-36 object-contain'}
                    />
                  ) : (
                    <div className="w-28 h-28 bg-slate-100 flex items-center justify-center text-xs font-mono">
                      QR...
                    </div>
                  )}
                </div>

                {/* Instructions CTA */}
                {showInstructions && (
                  <div className="space-y-0.5 mt-1.5">
                    <p className="font-black text-[11px] uppercase tracking-tight text-black">
                      {callToAction}
                    </p>
                    <p className="text-[8px] text-black font-medium">
                      Ouvrez l'appareil photo du téléphone
                    </p>
                  </div>
                )}

                {/* Footer Brand */}
                <div className="w-full pt-2 mt-2 border-t border-dashed border-black text-[8px] font-mono text-black flex items-center justify-between">
                  <span>AFRORESTO</span>
                  <span>table/{activeTable.id ? activeTable.id.slice(0, 6) : activeTable.tableNumber}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Print Trigger */}
          <div className="pt-4 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-600 font-medium">
              Prêt pour impression directe thermique ou standard.
            </span>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Nouvel onglet</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting || isGenerating}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                {isPrinting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                <span>Imprimer</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* PRINT VIEW: Triggered on window.print() matching index.css #printable-thermal-sticker */}
      <div id="printable-thermal-sticker" className="print-only-container">
        {tablesToPrint.map((tableItem, idx) => {
          const key = tableItem.id || `index-${idx}`;
          const qrUrl = qrCodeUrls[key];
          const rName = tableItem.restaurantName || restaurantName;
          const rCity = tableItem.restaurantCity || restaurantCity;

          return (
            <div
              key={key}
              className={`thermal-print-item ${thermalFormat === '58mm' ? 'thermal-58mm' : 'thermal-80mm'}`}
              style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
            >
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                <div style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>
                  {rName}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 'bold' }}>
                  {rCity}
                </div>
              </div>

              {/* Area & Table Number */}
              <div style={{ textAlign: 'center', margin: '4px 0' }}>
                {showArea && tableItem.areaName && (
                  <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    ZONE : {tableItem.areaName}
                  </div>
                )}
                <div style={{ fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.1' }}>
                  {tableItem.tableName || `TABLE ${tableItem.tableNumber}`}
                </div>
              </div>

              {/* QR Code */}
              <div style={{ textAlign: 'center', margin: '6px 0' }}>
                {qrUrl && (
                  <img
                    src={qrUrl}
                    alt={tableItem.tableName || `Table ${tableItem.tableNumber}`}
                    style={{
                      width: thermalFormat === '58mm' ? '170px' : '220px',
                      height: thermalFormat === '58mm' ? '170px' : '220px',
                      margin: '0 auto',
                      display: 'block',
                    }}
                  />
                )}
              </div>

              {/* CTA Instructions */}
              {showInstructions && (
                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>
                    {callToAction}
                  </div>
                  <div style={{ fontSize: '9px', marginTop: '2px' }}>
                    MENU DIGITAL SANS CONTACT
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #000', fontSize: '8px', fontFamily: 'monospace' }}>
                AFRORESTO • table/{tableItem.id ? tableItem.id.slice(0, 6) : tableItem.tableNumber}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
