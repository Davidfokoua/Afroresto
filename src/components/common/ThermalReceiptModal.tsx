import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, 
  X, 
  Check, 
  Copy, 
  Share2, 
  ExternalLink, 
  ChefHat, 
  Receipt, 
  SlidersHorizontal, 
  Sparkles, 
  Smartphone, 
  CheckCircle2, 
  QrCode as QrCodeIcon,
  Wifi,
  FileText,
  AlertCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, ThermalWidth, TicketType } from '../../types';
import { 
  printOrderThermalDirectly, 
  openOrderThermalInNewTab, 
  generateReceiptPlainText, 
  generateKitchenPlainText, 
  shareReceiptViaWhatsApp, 
  OrderThermalPrintOptions 
} from '../../utils/thermalPrinter';
import { formatFCFA, formatDateTime, formatTime } from '../../utils/formatters';

interface ThermalReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  initialType?: TicketType;
  initialWidth?: ThermalWidth;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  initialType = 'receipt',
  initialWidth
}) => {
  const { currentRestaurant } = useRestaurant();

  const savedSettings = currentRestaurant?.printerSettings;

  const [ticketType, setTicketType] = useState<TicketType>(initialType);
  const [format, setFormat] = useState<ThermalWidth>(
    initialWidth || savedSettings?.defaultWidth || '58mm'
  );
  const [showLogo, setShowLogo] = useState<boolean>(savedSettings?.showLogo ?? true);
  const [showQrCode, setShowQrCode] = useState<boolean>(savedSettings?.showQrCode ?? true);
  const [showTaxMention, setShowTaxMention] = useState<boolean>(savedSettings?.showTaxMention ?? true);
  const [customHeader, setCustomHeader] = useState<string>(savedSettings?.headerCustomText || '');
  const [customFooter, setCustomFooter] = useState<string>(
    savedSettings?.footerCustomText || 'Merci pour votre visite ! A très bientôt.'
  );
  const [wifiCode, setWifiCode] = useState<string>(savedSettings?.wifiCode || '');

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  // Generate QR code for restaurant URL or online order
  useEffect(() => {
    if (!order || !currentRestaurant) return;
    
    // Create verification URL or restaurant storefront link
    const receiptUrl = typeof window !== 'undefined'
      ? `${window.location.origin}?resto=${currentRestaurant.id}&order=${order.orderNumber}`
      : `https://restocam.app/${currentRestaurant.slug || currentRestaurant.id}`;

    QRCode.toDataURL(receiptUrl, {
      margin: 1,
      width: 140,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR Code generation error:', err));
  }, [order, currentRestaurant]);

  // Sync with prop when opened
  useEffect(() => {
    if (isOpen) {
      if (initialType) setTicketType(initialType);
      if (initialWidth) setFormat(initialWidth);
      else if (savedSettings?.defaultWidth) setFormat(savedSettings.defaultWidth);
    }
  }, [isOpen, initialType, initialWidth, savedSettings]);

  if (!isOpen || !order || !currentRestaurant) return null;

  const printOptions: OrderThermalPrintOptions = {
    ticketType,
    format,
    showLogo,
    showQrCode,
    qrDataUrl,
    customHeader: customHeader.trim() || undefined,
    customFooter: customFooter.trim() || undefined,
    wifiCode: wifiCode.trim() || undefined,
    taxMention: showTaxMention ? (savedSettings?.taxMention || 'Tous nos prix sont nets en FCFA (TTC)') : undefined,
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printOrderThermalDirectly(order, currentRestaurant, printOptions);
    } catch (err) {
      console.error('Print failed:', err);
    } finally {
      setTimeout(() => setIsPrinting(false), 800);
    }
  };

  const handleOpenTab = () => {
    openOrderThermalInNewTab(order, currentRestaurant, printOptions);
  };

  const handleCopyText = () => {
    const text = ticketType === 'kitchen'
      ? generateKitchenPlainText(order, currentRestaurant)
      : generateReceiptPlainText(order, currentRestaurant, printOptions);

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleShareWhatsApp = () => {
    shareReceiptViaWhatsApp(order, currentRestaurant);
  };

  const is58 = format === '58mm';
  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  Impression Ticket Thermique
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-bold">
                  #{order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentRestaurant.name} • {order.tableName} • {formatFCFA(order.totalAmount)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left Controls, Right Real Thermal Paper Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/90">
          
          {/* Controls Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Ticket Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                Type de Document
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTicketType('receipt')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    ticketType === 'receipt'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Addition</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTicketType('kitchen')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    ticketType === 'kitchen'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Cuisine KOT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTicketType('both')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    ticketType === 'both'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Les 2</span>
                </button>
              </div>
            </div>

            {/* Paper Roll Width Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Largeur Rouleau Papier</span>
                <span className="text-[10px] text-slate-500 font-normal">Compatible ESC/POS</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('58mm')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    format === '58mm'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-inner'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">58 mm</span>
                    {format === '58mm' && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Imprimante mobile Bluetooth & ticket de poche (384 dots).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('80mm')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    format === '80mm'
                      ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-inner'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">80 mm</span>
                    {format === '80mm' && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Imprimante caisse standard POS de comptoir (576 dots).
                  </p>
                </button>
              </div>
            </div>

            {/* Quick Toggle Settings */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Logo de l'établissement
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-2">
                  <QrCodeIcon className="w-3.5 h-3.5 text-slate-400" />
                  QR Code au bas du ticket
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showQrCode}
                    onChange={(e) => setShowQrCode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Mention Prix TTC
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTaxMention}
                    onChange={(e) => setShowTaxMention(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            {/* Advanced Customizations Dropdown */}
            <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/40">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-300 hover:text-white flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  Personnaliser les textes du ticket
                </span>
                <span className="text-[10px] text-slate-500">
                  {showAdvancedOptions ? 'Masquer' : 'Modifier'}
                </span>
              </button>

              {showAdvancedOptions && (
                <div className="p-4 pt-1 border-t border-slate-800 space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Sous-titre / En-tête (Ex: Slogan ou NIF/RCCM)
                    </label>
                    <input
                      type="text"
                      value={customHeader}
                      onChange={(e) => setCustomHeader(e.target.value)}
                      placeholder="Ex: Bar Lounge & Grillades • NIF: M051..."
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Pied de page (Message de remerciement)
                    </label>
                    <input
                      type="text"
                      value={customFooter}
                      onChange={(e) => setCustomFooter(e.target.value)}
                      placeholder="Ex: Merci pour votre visite ! A très bientôt."
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Code Wi-Fi client (optionnel)
                    </label>
                    <input
                      type="text"
                      value={wifiCode}
                      onChange={(e) => setWifiCode(e.target.value)}
                      placeholder="Ex: Wi-Fi: Resto_Guest / Code: afroresto2024"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Customer Details Recap */}
            <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Client :</span>
                <span className="font-bold text-slate-200">{order.customerName || 'Sur place'}</span>
              </div>
              {order.customerPhone && (
                <div className="flex justify-between">
                  <span>Téléphone :</span>
                  <span className="font-mono text-emerald-400">{order.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Règlement :</span>
                <span className={`font-bold uppercase ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {order.paymentMethod || 'ESPÈCES'} ({isPaid ? 'Payé' : 'Non réglé'})
                </span>
              </div>
            </div>

          </div>

          {/* Right Preview Column (7 cols): Realistic Paper Thermal Slip */}
          <div className="lg:col-span-7 flex flex-col items-center justify-start bg-slate-950/60 p-4 sm:p-6 rounded-3xl border border-slate-800 overflow-hidden">
            
            <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-400 px-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Aperçu ticket réel ({format})
              </span>
              <button
                type="button"
                onClick={handleOpenTab}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors"
                title="Ouvrir dans un nouvel onglet pour impression"
              >
                <span>Plein écran</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Paper ticket container with authentic thermal receipt design */}
            <div 
              className={`w-full overflow-y-auto max-h-[58vh] bg-white text-black p-4 sm:p-5 font-mono shadow-2xl rounded-xs transition-all duration-300 border border-gray-300 select-none ${
                is58 ? 'max-w-[280px] text-[11px]' : 'max-w-[360px] text-[12px]'
              }`}
              style={{
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
              }}
            >
              
              {/* Top Jagged Edge Mock */}
              <div className="text-center text-gray-400 text-[10px] tracking-widest pb-1 -mt-2">
                - - - - - - - - - - - - - - - -
              </div>

              {ticketType === 'kitchen' ? (
                /* KOT PREVIEW */
                <div className="space-y-2">
                  <div className="bg-black text-white text-center font-black py-1 px-2 text-xs tracking-wider">
                    *** BON DE CUISINE (KOT) ***
                  </div>
                  <div className="text-center font-black text-sm">
                    CMD #{order.orderNumber}
                  </div>
                  <div className="text-center font-black text-lg py-1 border-y border-dashed border-black">
                    {order.orderType === 'delivery' 
                      ? '🛵 LIVRAISON'
                      : order.orderType === 'takeaway'
                      ? '🛍️ A EMPORTER'
                      : `🍽️ TABLE ${order.tableName.toUpperCase()}`}
                  </div>
                  <div className="text-[10px] space-y-0.5 border-b border-dashed border-black pb-1.5">
                    <div className="flex justify-between">
                      <span>HEURE: {formatTime(order.createdAt)}</span>
                      <span>DATE: {formatDateTime(order.createdAt).slice(0, 10)}</span>
                    </div>
                    <div>ZONE : {order.areaName || 'Salle'}</div>
                    {order.customerName && <div>CLIENT : {order.customerName}</div>}
                    {order.serverName && <div>SERVEUR : {order.serverName}</div>}
                  </div>

                  <div className="font-bold text-xs pt-1">ARTICLES A PREPARER :</div>
                  <div className="space-y-2 pt-1 border-b border-black pb-2">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="border-b border-gray-200 pb-1.5 last:border-b-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono text-sm">[ ]</span>
                          <span className="font-black text-sm">{it.quantity}x</span>
                          <span className="font-bold uppercase">{it.name}</span>
                        </div>
                        {it.notes && (
                          <div className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-xs mt-1 ml-4">
                            {'>>> NOTE: ' + it.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] font-bold pt-1">
                    <span>TOTAL ARTICLES: {order.items.reduce((s, i) => s + i.quantity, 0)}</span>
                    <span>KDS DIRECT</span>
                  </div>
                  <div className="text-center text-[9px] text-gray-500 pt-2">
                    ✂ - - - - - - - - - - - - - - - -
                  </div>
                </div>
              ) : (
                /* RECEIPT PREVIEW */
                <div className="space-y-2">
                  {/* Header */}
                  <div className="text-center space-y-0.5">
                    {showLogo && currentRestaurant.logo && (
                      <img 
                        src={currentRestaurant.logo} 
                        alt="Logo" 
                        className="h-10 mx-auto object-contain filter grayscale mb-1" 
                      />
                    )}
                    <h3 className="font-black text-sm uppercase tracking-wide">
                      {currentRestaurant.name}
                    </h3>
                    <p className="text-[10px] uppercase font-bold text-gray-700">
                      {currentRestaurant.restaurantType}
                    </p>
                    {customHeader && (
                      <p className="text-[9px] text-gray-600">{customHeader}</p>
                    )}
                    <p className="text-[9px] text-gray-600">
                      {currentRestaurant.address}, {currentRestaurant.city}
                    </p>
                    <p className="text-[9px] text-gray-600">
                      Tél: {currentRestaurant.phone}
                    </p>
                  </div>

                  <div className="text-center font-bold text-xs tracking-tighter">
                    ================================
                  </div>

                  {/* Meta */}
                  <div className="space-y-0.5 text-[10px]">
                    <div className="flex justify-between">
                      <span>TICKET : <strong>#{order.orderNumber}</strong></span>
                      <span>{formatTime(order.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DATE : {formatDateTime(order.createdAt).slice(0, 10)}</span>
                      <span>{order.areaName}</span>
                    </div>
                    <div className="bg-black text-white font-bold text-center py-0.5 my-1 text-[10px]">
                      {order.orderType === 'delivery'
                        ? 'LIVRAISON A DOMICILE'
                        : order.orderType === 'takeaway'
                        ? 'COMMANDE A EMPORTER'
                        : `SUR PLACE - ${order.tableName.toUpperCase()}`}
                    </div>
                    {order.customerName && (
                      <div className="flex justify-between">
                        <span>CLIENT: <strong>{order.customerName}</strong></span>
                        <span>{order.customerPhone || ''}</span>
                      </div>
                    )}
                    {order.deliveryInfo?.address && (
                      <div className="bg-gray-100 p-1 text-[9px] font-bold">
                        DEST: {order.deliveryInfo.address}
                      </div>
                    )}
                  </div>

                  <div className="text-center text-xs tracking-tighter text-gray-500">
                    --------------------------------
                  </div>

                  {/* Items Table */}
                  <div className="flex justify-between text-[10px] font-bold pb-1">
                    <span>ARTICLE</span>
                    <span>TOTAL</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] border-y border-dashed border-gray-300 py-1.5">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between items-baseline">
                          <span className="font-semibold">
                            <strong>{it.quantity}x</strong> {it.name}
                          </span>
                          <span className="font-bold whitespace-nowrap">
                            {formatFCFA(it.price * it.quantity)}
                          </span>
                        </div>
                        {it.notes && (
                          <div className="text-[9px] text-gray-600 pl-2">
                            {'>> ' + it.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-1 pt-1 text-[11px]">
                    {order.deliveryInfo?.deliveryFee ? (
                      <>
                        <div className="flex justify-between text-[10px]">
                          <span>Sous-total plats :</span>
                          <span>{formatFCFA(order.totalAmount - order.deliveryInfo.deliveryFee)}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span>Frais livraison :</span>
                          <span>{formatFCFA(order.deliveryInfo.deliveryFee)}</span>
                        </div>
                      </>
                    ) : null}

                    <div className="flex justify-between items-baseline font-black text-sm pt-1 border-t border-black">
                      <span>TOTAL A PAYER :</span>
                      <span>{formatFCFA(order.totalAmount)}</span>
                    </div>

                    <div className="flex justify-between text-[10px] pt-1">
                      <span>MODE REGLEMENT :</span>
                      <strong className="uppercase">{order.paymentMethod || 'ESPÈCES'}</strong>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>STATUT :</span>
                      <strong className={isPaid ? 'text-black' : 'underline'}>
                        {isPaid ? '[ PAYE - ENCAISSE ]' : '[ A REGLER ]'}
                      </strong>
                    </div>

                    {showTaxMention && (
                      <div className="text-[8px] text-center text-gray-600 pt-1">
                        Tous nos prix sont nets en FCFA (TTC)
                      </div>
                    )}
                  </div>

                  {/* QR Code */}
                  {showQrCode && qrDataUrl && (
                    <div className="text-center pt-2">
                      <img 
                        src={qrDataUrl} 
                        alt="QR Code" 
                        className="w-20 h-20 mx-auto border border-gray-200 p-0.5" 
                      />
                      <p className="text-[8px] text-gray-500 mt-0.5">
                        Scannez pour menu digital & fidélité
                      </p>
                    </div>
                  )}

                  {/* Footer message */}
                  <div className="text-center pt-2 border-t border-dashed border-gray-300 text-[9px] space-y-1">
                    <p className="font-bold">{customFooter}</p>
                    {wifiCode && (
                      <p className="font-mono border border-dashed border-black px-1 py-0.5 inline-block">
                        {wifiCode}
                      </p>
                    )}
                    <p className="text-[8px] text-gray-400 pt-1">
                      Système de caisse AFRORESTO POS
                    </p>
                  </div>

                  <div className="text-center text-[9px] text-gray-400 pt-1">
                    ✂ - - - - - - - - - - - - - - - -
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2 transition-colors"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Texte copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier (Raw Text)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-2 transition-colors"
              title="Envoyer le récapitulatif du ticket par WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Client</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 text-xs font-bold transition-colors"
            >
              Fermer
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Impression en cours...' : 'Imprimer Directement'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
