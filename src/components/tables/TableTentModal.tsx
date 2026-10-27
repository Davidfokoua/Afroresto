import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  QrCode, 
  Sparkles, 
  Copy, 
  CheckCircle2, 
  Smartphone, 
  Layers, 
  Check, 
  Sliders, 
  HelpCircle,
  Eye,
  FileText,
  ChevronDown
} from 'lucide-react';
import QRCode from 'qrcode';
import { Table, RestaurantArea, Restaurant } from '../../types';
import { buildTableOrderUrl } from '../../utils/qrUrl';

export type TentStyle = 'emerald' | 'eco_white' | 'midnight';
export type TentFormat = 'folded_tent' | 'single_card';

export interface TableTentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  areas: RestaurantArea[];
  currentRestaurant: Restaurant;
  initialSelectedTable?: Table | null;
}

export const TableTentModal: React.FC<TableTentModalProps> = ({
  isOpen,
  onClose,
  tables,
  areas,
  currentRestaurant,
  initialSelectedTable = null,
}) => {
  // Mode: single table or all tables batch
  const [selectedTableId, setSelectedTableId] = useState<string>(
    initialSelectedTable?.id || tables[0]?.id || 'all'
  );
  const [tentStyle, setTentStyle] = useState<TentStyle>('emerald');
  const [tentFormat, setTentFormat] = useState<TentFormat>('folded_tent');
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGeneratingPng, setIsGeneratingPng] = useState<boolean>(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Update selected table if initialSelectedTable changes
  useEffect(() => {
    if (initialSelectedTable) {
      setSelectedTableId(initialSelectedTable.id);
    }
  }, [initialSelectedTable]);

  // Generate high-resolution QR code data URLs for all tables
  useEffect(() => {
    let isMounted = true;
    const generateAllQrs = async () => {
      const urls: Record<string, string> = {};
      for (const t of tables) {
        try {
          const targetRestId = currentRestaurant.id || t.restaurantId;
          const tableUrl = buildTableOrderUrl(targetRestId, t.id, currentRestaurant.customDomain);
          // Dark color adapted for theme
          const darkColor = tentStyle === 'emerald' ? '#044e38' : '#0f172a';
          const qrDataUrl = await QRCode.toDataURL(tableUrl, {
            width: 480,
            margin: 2,
            errorCorrectionLevel: 'H',
            color: {
              dark: darkColor,
              light: '#ffffff',
            },
          });
          urls[t.id] = qrDataUrl;
        } catch (err) {
          console.error('Error generating high-res QR for table tent:', err);
        }
      }
      if (isMounted) {
        setQrCodeDataUrls(urls);
      }
    };

    generateAllQrs();
    return () => {
      isMounted = false;
    };
  }, [tables, currentRestaurant.id, currentRestaurant.customDomain, tentStyle]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Determine active tables to render/preview
  const activeTablesToRender = selectedTableId === 'all'
    ? tables
    : tables.filter(t => t.id === selectedTableId);

  // Single table for screen preview when in single mode, or first table of batch
  const previewTable = tables.find(t => t.id === selectedTableId) || tables[0] || null;

  // Download high-res PNG for a specific table
  const handleDownloadPng = async (table: Table) => {
    try {
      setIsGeneratingPng(true);
      const qrDataUrl = qrCodeDataUrls[table.id];
      if (!qrDataUrl) {
        showToast('Génération du QR Code en cours, veuillez patienter...');
        setIsGeneratingPng(false);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsGeneratingPng(false);
        return;
      }

      // High-resolution canvas (A5 equivalent: 1240 x 1754 px at 150 DPI)
      const isFolded = tentFormat === 'folded_tent';
      canvas.width = 1200;
      canvas.height = isFolded ? 2200 : 1700;

      // Draw background
      if (tentStyle === 'emerald') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#064e3b');
        grad.addColorStop(0.5, '#043427');
        grad.addColorStop(1, '#022c22');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Gold border accent
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.lineWidth = 14;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
      } else if (tentStyle === 'midnight') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 14;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
      } else {
        // Eco white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 8;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
      }

      const isDark = tentStyle === 'emerald' || tentStyle === 'midnight';
      const textColor = isDark ? '#ffffff' : '#0f172a';
      const subTextColor = isDark ? '#a7f3d0' : '#047857';
      const area = areas.find(a => a.id === table.areaId);

      // Helper to render one face
      const renderFace = async (startY: number, faceHeight: number) => {
        let currentY = startY + 70;

        // Restaurant Name
        ctx.fillStyle = isDark ? '#fef08a' : '#047857';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((currentRestaurant.name || 'NOTRE RESTAURANT').toUpperCase(), canvas.width / 2, currentY);

        currentY += 40;
        ctx.fillStyle = isDark ? '#93c5fd' : '#64748b';
        ctx.font = '600 24px sans-serif';
        ctx.fillText([currentRestaurant.city, currentRestaurant.country].filter(Boolean).join(' • ') || 'Afrique', canvas.width / 2, currentY);

        currentY += 60;
        // Table Pill
        ctx.fillStyle = isDark ? '#065f46' : '#ecfdf5';
        const pillWidth = 400;
        const pillHeight = 70;
        const pillX = (canvas.width - pillWidth) / 2;
        ctx.beginPath();
        ctx.roundRect(pillX, currentY, pillWidth, pillHeight, 20);
        ctx.fill();
        ctx.strokeStyle = isDark ? '#34d399' : '#059669';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = isDark ? '#ffffff' : '#065f46';
        ctx.font = 'bold 36px sans-serif';
        const areaLabel = area?.name ? ` • ${area.name}` : '';
        ctx.fillText(`${table.name.toUpperCase()}${areaLabel}`, canvas.width / 2, currentY + 48);

        currentY += pillHeight + 50;

        // QR Code Box (White Card)
        const qrBoxSize = 520;
        const qrBoxX = (canvas.width - qrBoxSize) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.roundRect(qrBoxX, currentY, qrBoxSize, qrBoxSize, 32);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Draw QR Image
        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((resolve) => {
          qrImg.onload = resolve;
          qrImg.onerror = resolve;
        });
        const qrPadding = 24;
        ctx.drawImage(qrImg, qrBoxX + qrPadding, currentY + qrPadding, qrBoxSize - (qrPadding * 2), qrBoxSize - (qrPadding * 2));

        currentY += qrBoxSize + 60;

        // Primary Instruction
        ctx.fillStyle = isDark ? '#fbbf24' : '#047857';
        ctx.font = '900 32px sans-serif';
        ctx.fillText('« OUVREZ LA CAMÉRA DE VOTRE TÉLÉPHONE,', canvas.width / 2, currentY);
        currentY += 42;
        ctx.fillText('SCANNEZ LE QR POUR PASSER VOTRE COMMANDE »', canvas.width / 2, currentY);

        currentY += 50;

        // Step by step reassurance
        ctx.fillStyle = textColor;
        ctx.font = '600 24px sans-serif';
        ctx.fillText('1. Pointez l\'appareil photo de votre smartphone vers le QR Code', canvas.width / 2, currentY);
        currentY += 34;
        ctx.fillText('2. Aucun téléchargement d\'application requis • Accès instantané', canvas.width / 2, currentY);
        currentY += 34;
        ctx.fillText('3. Choisissez vos plats et validez en direct à table', canvas.width / 2, currentY);

        currentY += 50;
        ctx.fillStyle = isDark ? '#6ee7b7' : '#059669';
        ctx.font = 'italic 20px sans-serif';
        ctx.fillText('Menu digital interactif • Service rapide à table', canvas.width / 2, currentY);
      };

      if (isFolded) {
        const halfHeight = (canvas.height - 100) / 2;
        await renderFace(0, halfHeight);

        // Fold line
        const midY = canvas.height / 2;
        ctx.strokeStyle = isDark ? '#fbbf24' : '#94a3b8';
        ctx.lineWidth = 4;
        ctx.setLineDash([16, 16]);
        ctx.beginPath();
        ctx.moveTo(60, midY);
        ctx.lineTo(canvas.width - 60, midY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = isDark ? '#fef08a' : '#64748b';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✂️ LIGNE DE PLIAGE CENTRALE (Plier pour poser sur la table)', canvas.width / 2, midY - 14);

        await renderFace(midY + 20, halfHeight);
      } else {
        await renderFace(30, canvas.height - 60);
      }

      // Convert to blob and download
      const dataUri = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      const cleanTableName = table.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      downloadLink.download = `chevalet-${currentRestaurant.slug || 'resto'}-${cleanTableName}.png`;
      downloadLink.href = dataUri;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast(`Chevalet ${table.name} téléchargé en haute définition PNG !`);
    } catch (err) {
      console.error('Error generating PNG chevalet:', err);
      showToast('Erreur lors du téléchargement. Utilisez le bouton Imprimer.');
    } finally {
      setIsGeneratingPng(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-60 bg-emerald-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-emerald-700 flex items-center gap-2 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal Dialog */}
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header (No-Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Chevalet de Table QR Code
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  Prêt à Poser & Imprimer
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Chevalet valorisant le QR Code, le logo et les instructions de scan pour vos convives à table.
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

        {/* Customization Toolbar (No-Print) */}
        <div className="bg-slate-100 border-b border-slate-200 p-4 px-6 flex flex-wrap items-center justify-between gap-4 shrink-0 no-print">
          
          {/* Target Table Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700">Table cible :</label>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="all">Toutes les tables ({tables.length} tables à imprimer)</option>
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

          {/* Model Format Toggle: Folded Tent or Single Card */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Format :</span>
            <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-2xs text-xs font-bold">
              <button
                type="button"
                onClick={() => setTentFormat('folded_tent')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  tentFormat === 'folded_tent'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Format à plier en deux au centre pour poser en triangle sur la table"
              >
                Chevalet Pliable (2 Faces)
              </button>
              <button
                type="button"
                onClick={() => setTentFormat('single_card')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  tentFormat === 'single_card'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Format carte portrait simple pour porte-menu ou support plexiglas"
              >
                Carte Simple Face
              </button>
            </div>
          </div>

          {/* Style Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Thème :</span>
            <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-2xs text-xs font-bold">
              <button
                type="button"
                onClick={() => setTentStyle('emerald')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  tentStyle === 'emerald'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Émeraude Prestige
              </button>
              <button
                type="button"
                onClick={() => setTentStyle('eco_white')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  tentStyle === 'eco_white'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Fond blanc pur économique en encre"
              >
                Blanc Éco
              </button>
            </div>
          </div>

        </div>

        {/* Modal Scrollable Body: Live Interactive Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/70 flex flex-col items-center">
          
          {selectedTableId === 'all' && (
            <div className="w-full max-w-2xl mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-emerald-950 no-print">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Mode Lot sélectionné :</strong> L'impression ou l'export générera les chevalets pour <strong>l'ensemble des {tables.length} tables</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shrink-0 shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimer les {tables.length} tables
              </button>
            </div>
          )}

          {/* Screen Presentation Preview */}
          {previewTable && (
            <div className="w-full max-w-md space-y-4 no-print">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  Aperçu en direct : {previewTable.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  {tentFormat === 'folded_tent' ? 'Pliable 2 faces' : 'Simple face'}
                </span>
              </div>

              {/* The Actual Table Tent Visual Component */}
              <SingleTableTentCard
                table={previewTable}
                area={areas.find(a => a.id === previewTable.areaId)}
                currentRestaurant={currentRestaurant}
                qrDataUrl={qrCodeDataUrls[previewTable.id]}
                tentStyle={tentStyle}
                tentFormat={tentFormat}
                isPrintMode={false}
              />
            </div>
          )}

        </div>

        {/* Technical direct link info for the manager (Outside the physical tent card!) */}
        {previewTable && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-slate-600 no-print">
            <div className="flex items-center gap-2 min-w-0">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-slate-700 shrink-0">Lien direct de test :</span>
              <span className="font-mono text-[11px] text-slate-500 truncate">
                {buildTableOrderUrl(currentRestaurant.id || previewTable.restaurantId, previewTable.id, currentRestaurant.customDomain)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const url = buildTableOrderUrl(currentRestaurant.id || previewTable.restaurantId, previewTable.id, currentRestaurant.customDomain);
                navigator.clipboard.writeText(url);
                showToast(`Lien de ${previewTable.name} copié dans le presse-papier !`);
              }}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer text-[11px]"
              title="Copier le lien direct pour le tester dans votre navigateur"
            >
              <Copy className="w-3 h-3 text-slate-500" />
              Copier lien
            </button>
          </div>
        )}

        {/* Bottom Actions Footer (No-Print) */}
        <div className="bg-white border-t border-slate-200 p-4 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
          >
            Fermer
          </button>

          <div className="flex items-center gap-3">
            {previewTable && (
              <button
                type="button"
                disabled={isGeneratingPng}
                onClick={() => handleDownloadPng(previewTable)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-slate-300 shadow-2xs"
                title="Télécharger l'image PNG haute résolution pour l'envoyer à un imprimeur"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>{isGeneratingPng ? 'Génération...' : 'Télécharger PNG HD'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                {selectedTableId === 'all'
                  ? `Imprimer les ${tables.length} Chevalets`
                  : `Imprimer le Chevalet (${previewTable?.name || ''})`}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* DEDICATED PRINT CONTAINER: Only visible during window.print() */}
      <div 
        ref={printContainerRef} 
        id="printable-tent-card" 
        className="print-chevalet-area"
        style={{ display: 'none' }}
      >
        {activeTablesToRender.map((t, index) => (
          <div 
            key={t.id} 
            className={index < activeTablesToRender.length - 1 ? 'chevalet-page-break' : ''}
            style={{ pageBreakAfter: index < activeTablesToRender.length - 1 ? 'always' : 'auto' }}
          >
            <SingleTableTentCard
              table={t}
              area={areas.find(a => a.id === t.areaId)}
              currentRestaurant={currentRestaurant}
              qrDataUrl={qrCodeDataUrls[t.id]}
              tentStyle={tentStyle}
              tentFormat={tentFormat}
              isPrintMode={true}
            />
          </div>
        ))}
      </div>

    </div>
  );
};

interface SingleTableTentCardProps {
  table: Table;
  area?: RestaurantArea;
  currentRestaurant: Restaurant;
  qrDataUrl?: string;
  tentStyle: TentStyle;
  tentFormat: TentFormat;
  isPrintMode?: boolean;
}

const SingleTableTentCard: React.FC<SingleTableTentCardProps> = ({
  table,
  area,
  currentRestaurant,
  qrDataUrl,
  tentStyle,
  tentFormat,
  isPrintMode = false,
}) => {
  const isEmerald = tentStyle === 'emerald';
  const isEcoWhite = tentStyle === 'eco_white';

  const containerBgClass = isEmerald
    ? 'bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 text-white border-4 border-amber-400/40 shadow-2xl'
    : isEcoWhite
      ? 'bg-white text-slate-900 border-2 border-emerald-700 shadow-md'
      : 'bg-slate-900 text-white border-4 border-sky-400/40 shadow-2xl';

  const renderFaceContent = (faceLabel?: string) => {
    return (
      <div className="p-6 sm:p-7 flex flex-col items-center text-center space-y-4">
        
        {/* Restaurant Header: Name + Logo */}
        <div className="flex items-center justify-center gap-3">
          {currentRestaurant.logo ? (
            <img 
              src={currentRestaurant.logo} 
              alt={currentRestaurant.name} 
              className="w-12 h-12 rounded-2xl object-cover bg-white p-1 shadow-md border border-slate-200"
              onError={(e) => {
                // Fallback to monogram if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className={`w-12 h-12 rounded-2xl font-black text-lg flex items-center justify-center shadow-md ${
              isEcoWhite ? 'bg-emerald-600 text-white' : 'bg-amber-400 text-slate-950'
            }`}>
              {currentRestaurant.name.charAt(0)}
            </div>
          )}

          <div className="text-left">
            <h3 className={`text-base sm:text-lg font-black tracking-tight leading-tight ${
              isEcoWhite ? 'text-emerald-900' : 'text-white'
            }`}>
              {currentRestaurant.name}
            </h3>
            <p className={`text-[11px] font-semibold ${
              isEcoWhite ? 'text-emerald-700' : 'text-amber-300'
            }`}>
              {[currentRestaurant.city, currentRestaurant.country].filter(Boolean).join(' • ') || 'Afrique'}
            </p>
          </div>
        </div>

        {/* Table & Area Badge */}
        <div className="py-1">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black shadow-xs ${
            isEcoWhite 
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
              : 'bg-emerald-800/80 text-emerald-200 border border-emerald-600/50'
          }`}>
            <span>{area?.name || 'Salle Principale'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span className="text-white font-extrabold uppercase">{table.name}</span>
          </div>
        </div>

        {/* CENTRAL HERO: Large Scannable QR Code (NO raw URL taking over!) */}
        <div className="relative">
          <div className="bg-white p-3.5 rounded-3xl inline-block shadow-xl border-2 border-slate-100">
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt={`QR Code ${table.name}`} 
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
              />
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl">
                <QrCode className="w-12 h-12 animate-pulse text-emerald-600" />
                <span className="text-xs font-semibold mt-2 text-slate-500">Génération du QR...</span>
              </div>
            )}
          </div>
          
          {/* Scan camera badge */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-300 text-[10px] font-black px-3 py-1 rounded-full shadow-md border border-amber-400/40 flex items-center gap-1.5 whitespace-nowrap">
            <Smartphone className="w-3 h-3 text-amber-400" />
            <span>SCAN RAPIDE SANS APPLICATION</span>
          </div>
        </div>

        {/* User Required Instructions: "Ouvrez la caméra de votre téléphone, scannez le QR pour passer votre commande" */}
        <div className="pt-2 space-y-2 max-w-sm">
          <div className={`p-3 rounded-2xl font-black text-xs sm:text-sm leading-snug uppercase tracking-wide border ${
            isEcoWhite
              ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
              : 'bg-amber-400/15 text-amber-300 border-amber-400/30'
          }`}>
            « Ouvrez la caméra de votre téléphone, scannez le QR pour passer votre commande »
          </div>

          {/* 3 Step Micro-Guide */}
          <div className={`grid grid-cols-3 gap-1.5 text-[10px] font-semibold text-center ${
            isEcoWhite ? 'text-slate-600' : 'text-emerald-100'
          }`}>
            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-1.5">
              <span className="block font-bold">1. Caméra</span>
              <span className="text-[9px] opacity-80">Ouvrez l'appareil photo</span>
            </div>
            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-1.5">
              <span className="block font-bold">2. Pointez</span>
              <span className="text-[9px] opacity-80">Visez le QR Code</span>
            </div>
            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-1.5">
              <span className="block font-bold">3. Commandez</span>
              <span className="text-[9px] opacity-80">Validez vos plats</span>
            </div>
          </div>
        </div>

        {/* Footer info: Discreet trust badge (No raw URLs) */}
        <div className={`w-full pt-3 mt-1 border-t text-[10px] flex items-center justify-between ${
          isEcoWhite ? 'border-slate-200 text-slate-500' : 'border-emerald-800/80 text-slate-300'
        }`}>
          <span className="font-semibold">Menu digital interactif • AFRORESTO</span>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
            100% SSL
          </span>
        </div>

      </div>
    );
  };

  return (
    <div 
      className={`rounded-3xl overflow-hidden transition-all ${containerBgClass}`}
      style={{
        width: '100%',
        maxWidth: isPrintMode ? '148mm' : '420px',
        margin: '0 auto',
      }}
    >
      {tentFormat === 'folded_tent' ? (
        <div className="flex flex-col">
          {/* Face 1 */}
          {renderFaceContent('Face Avant')}

          {/* Fold / Cut Line Indicator */}
          <div className="relative py-3 bg-black/20 border-y border-dashed border-amber-400/50 flex items-center justify-center">
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full ${
              isEcoWhite ? 'bg-slate-200 text-slate-700' : 'bg-slate-900 text-amber-300'
            }`}>
              ✂️ Ligne de pliage centrale (plier pour poser sur la table)
            </span>
          </div>

          {/* Face 2 */}
          {renderFaceContent('Face Arrière')}
        </div>
      ) : (
        /* Single Face Card */
        renderFaceContent()
      )}
    </div>
  );
};
