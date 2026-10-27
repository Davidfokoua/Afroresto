import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Save, 
  CheckCircle2, 
  Sliders, 
  Sparkles, 
  Receipt, 
  ChefHat, 
  Smartphone, 
  QrCode, 
  Wifi, 
  Info,
  Check,
  Play
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { ThermalWidth, PrinterSettings, Order } from '../../types';
import { ThermalReceiptModal } from '../common/ThermalReceiptModal';

export const ThermalPrinterSettingsCard: React.FC = () => {
  const { currentRestaurant, updateRestaurantSettings } = useRestaurant();

  const currentSettings = currentRestaurant?.printerSettings;

  const [defaultWidth, setDefaultWidth] = useState<ThermalWidth>(
    currentSettings?.defaultWidth || '58mm'
  );
  const [showLogo, setShowLogo] = useState<boolean>(currentSettings?.showLogo ?? true);
  const [showQrCode, setShowQrCode] = useState<boolean>(currentSettings?.showQrCode ?? true);
  const [showTaxMention, setShowTaxMention] = useState<boolean>(currentSettings?.showTaxMention ?? true);
  const [taxMention, setTaxMention] = useState<string>(
    currentSettings?.taxMention || 'Tous nos prix sont nets en FCFA (TTC)'
  );
  const [headerCustomText, setHeaderCustomText] = useState<string>(
    currentSettings?.headerCustomText || ''
  );
  const [footerCustomText, setFooterCustomText] = useState<string>(
    currentSettings?.footerCustomText || 'Merci pour votre visite ! A très bientôt.'
  );
  const [wifiCode, setWifiCode] = useState<string>(currentSettings?.wifiCode || '');
  const [autoPrintKOTOnAccept, setAutoPrintKOTOnAccept] = useState<boolean>(
    currentSettings?.autoPrintKOTOnAccept ?? false
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  useEffect(() => {
    if (currentRestaurant?.printerSettings) {
      const ps = currentRestaurant.printerSettings;
      setDefaultWidth(ps.defaultWidth || '58mm');
      setShowLogo(ps.showLogo ?? true);
      setShowQrCode(ps.showQrCode ?? true);
      setShowTaxMention(ps.showTaxMention ?? true);
      setTaxMention(ps.taxMention || 'Tous nos prix sont nets en FCFA (TTC)');
      setHeaderCustomText(ps.headerCustomText || '');
      setFooterCustomText(ps.footerCustomText || 'Merci pour votre visite ! A très bientôt.');
      setWifiCode(ps.wifiCode || '');
      setAutoPrintKOTOnAccept(ps.autoPrintKOTOnAccept ?? false);
    }
  }, [currentRestaurant]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newSettings: PrinterSettings = {
      defaultWidth,
      showLogo,
      showQrCode,
      showTaxMention,
      taxMention: taxMention.trim(),
      headerCustomText: headerCustomText.trim(),
      footerCustomText: footerCustomText.trim(),
      wifiCode: wifiCode.trim(),
      autoPrintKOTOnAccept,
    };

    updateRestaurantSettings({
      printerSettings: newSettings,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Mock test order for testing printer
  const sampleTestOrder: Order = {
    id: 'test-order-sample',
    restaurantId: currentRestaurant?.id || 'resto-test',
    tableId: 't-1',
    tableName: 'Table 4 (VIP)',
    areaName: 'Terrasse Climatisee',
    orderNumber: 'CMD-TEST-88',
    orderType: 'dine_in',
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'orange_money',
    items: [
      {
        id: 'it-1',
        menuItemId: 'mi-1',
        name: 'Poulet Braise Special Chef',
        price: 5500,
        quantity: 2,
        notes: 'Piment separe, bien dore',
      },
      {
        id: 'it-2',
        menuItemId: 'mi-2',
        name: 'Portion Alloko croustillant',
        price: 1500,
        quantity: 2,
      },
      {
        id: 'it-3',
        menuItemId: 'mi-3',
        name: 'Cocktail Fraicheur Maison 50cl',
        price: 2000,
        quantity: 2,
      },
    ],
    totalAmount: 18000,
    customerName: 'Monsieur Paul Biya',
    customerPhone: '+237 699 00 11 22',
    serverName: 'Junior (Serveur)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-gray-900">
                Imprimante Thermique & Tickets de Caisse (ESC/POS)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                58mm / 80mm
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Paramétrez le format de vos tickets de caisse, bons de cuisine KOT et liaisons Bluetooth / USB.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsTestModalOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all"
        >
          <Play className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tester l'impression (Ticket d'essai)</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Paper Format Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Format de Papier par Défaut
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div
              onClick={() => setDefaultWidth('58mm')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                defaultWidth === '58mm'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span className="font-extrabold text-gray-900 text-sm">Format 58 mm (2 pouces)</span>
                </div>
                {defaultWidth === '58mm' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Idéal pour imprimantes portables Bluetooth (MPT-II, POS-5802, Sunmi V2, Xprinter mobile).
              </p>
              <div className="mt-2 text-[10px] font-mono text-gray-400">Largeur utile : 48mm • 384 dots</div>
            </div>

            <div
              onClick={() => setDefaultWidth('80mm')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                defaultWidth === '80mm'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-600" />
                  <span className="font-extrabold text-gray-900 text-sm">Format 80 mm (3 pouces)</span>
                </div>
                {defaultWidth === '80mm' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Idéal pour imprimantes de comptoir de caisse fixes (Epson TM-T20, Xprinter N160, Sunmi T2).
              </p>
              <div className="mt-2 text-[10px] font-mono text-gray-400">Largeur utile : 72mm • 576 dots</div>
            </div>

          </div>
        </div>

        {/* Toggles Options */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <label className="flex items-center justify-between sm:justify-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showLogo}
              onChange={(e) => setShowLogo(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500"
            />
            <span className="text-xs font-semibold text-gray-800">
              Imprimer le logo du restaurant
            </span>
          </label>

          <label className="flex items-center justify-between sm:justify-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showQrCode}
              onChange={(e) => setShowQrCode(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500"
            />
            <span className="text-xs font-semibold text-gray-800">
              Imprimer le QR code client
            </span>
          </label>

          <label className="flex items-center justify-between sm:justify-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showTaxMention}
              onChange={(e) => setShowTaxMention(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500"
            />
            <span className="text-xs font-semibold text-gray-800">
              Afficher mention Prix TTC
            </span>
          </label>

        </div>

        {/* Custom Text Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div>
            <label className="font-bold text-gray-700 block mb-1">
              En-tête supplémentaire / Slogan / Mentions légales
            </label>
            <input
              type="text"
              value={headerCustomText}
              onChange={(e) => setHeaderCustomText(e.target.value)}
              placeholder="Ex: Bar Lounge & Grillades • NIF / RC / RCCM..."
              className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">
              Message de pied de page (Remerciement)
            </label>
            <input
              type="text"
              value={footerCustomText}
              onChange={(e) => setFooterCustomText(e.target.value)}
              placeholder="Ex: Merci de votre visite et à très bientôt !"
              className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">
              Code Wi-Fi client (imprimé sur le ticket)
            </label>
            <input
              type="text"
              value={wifiCode}
              onChange={(e) => setWifiCode(e.target.value)}
              placeholder="Ex: Wi-Fi: Resto_Guest / Code: afroresto2024"
              className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">
              Mention fiscale / TVA
            </label>
            <input
              type="text"
              value={taxMention}
              onChange={(e) => setTaxMention(e.target.value)}
              placeholder="Ex: Tous nos prix sont nets en FCFA (TTC)"
              className="w-full p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {savedSuccess ? (
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Paramètres d'impression enregistrés !
            </span>
          ) : (
            <span className="text-[11px] text-gray-400">
              Prêt pour impression thermique instantanée (Bluetooth, USB, Réseau Wi-Fi).
            </span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition-all"
          >
            <Save className="w-4 h-4" />
            Enregistrer les paramètres d'impression
          </button>
        </div>

      </form>

      {/* Test Print Modal */}
      {isTestModalOpen && (
        <ThermalReceiptModal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          order={sampleTestOrder}
          initialWidth={defaultWidth}
        />
      )}

    </div>
  );
};
