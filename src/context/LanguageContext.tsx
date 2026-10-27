import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeStorage } from '../utils/safeStorage';
import { Globe, Check } from 'lucide-react';

export type Language = 'fr' | 'en';

export interface Translations {
  [key: string]: {
    fr: string;
    en: string;
  };
}

export const DICTIONARY: Translations = {
  // Brand & Top micro banner
  platformTagline: {
    fr: '🌍 AFRORESTO — SaaS Restaurant & QR Code Panafricain',
    en: '🌍 AFRORESTO — Pan-African Restaurant & QR Code SaaS'
  },
  platformSubtitle: {
    fr: 'Gestion & Menu QR Panafricain',
    en: 'Pan-African Restaurant Management & QR Menu'
  },
  platformBilingualNotice: {
    fr: 'Plateforme Bilingue (FR / EN)',
    en: 'Bilingual Platform (FR / EN)'
  },
  switchLanguage: {
    fr: 'Changer de langue',
    en: 'Change language'
  },
  french: {
    fr: 'Français',
    en: 'French'
  },
  english: {
    fr: 'Anglais',
    en: 'English'
  },

  // Common UI actions
  back: {
    fr: 'Retour',
    en: 'Back'
  },
  save: {
    fr: 'Enregistrer',
    en: 'Save'
  },
  cancel: {
    fr: 'Annuler',
    en: 'Cancel'
  },
  delete: {
    fr: 'Supprimer',
    en: 'Delete'
  },
  edit: {
    fr: 'Modifier',
    en: 'Edit'
  },
  add: {
    fr: 'Ajouter',
    en: 'Add'
  },
  search: {
    fr: 'Rechercher',
    en: 'Search'
  },
  filter: {
    fr: 'Filtrer',
    en: 'Filter'
  },
  confirm: {
    fr: 'Confirmer',
    en: 'Confirm'
  },
  loading: {
    fr: 'Chargement en cours...',
    en: 'Loading...'
  },
  close: {
    fr: 'Fermer',
    en: 'Close'
  },
  login: {
    fr: 'Connexion',
    en: 'Sign In'
  },
  logout: {
    fr: 'Déconnexion',
    en: 'Sign Out'
  },
  createRestaurant: {
    fr: 'Créer mon Restaurant',
    en: 'Create Restaurant'
  },
  all: {
    fr: 'Tous',
    en: 'All'
  },
  actions: {
    fr: 'Actions',
    en: 'Actions'
  },
  status: {
    fr: 'Statut',
    en: 'Status'
  },
  date: {
    fr: 'Date',
    en: 'Date'
  },
  total: {
    fr: 'Total',
    en: 'Total'
  },
  price: {
    fr: 'Prix',
    en: 'Price'
  },
  quantity: {
    fr: 'Quantité',
    en: 'Quantity'
  },
  notes: {
    fr: 'Notes',
    en: 'Notes'
  },

  // Roles
  role_owner: {
    fr: 'Propriétaire & Gérant',
    en: 'Owner & Manager'
  },
  role_manager: {
    fr: 'Gérant d\'Exploitation',
    en: 'Operations Manager'
  },
  role_cashier: {
    fr: 'Caissier / Caisse POS',
    en: 'Cashier / POS'
  },
  role_waiter: {
    fr: 'Serveur de Salle',
    en: 'Floor Waiter'
  },
  role_chef: {
    fr: 'Chef Cuisinier (KDS)',
    en: 'Head Chef (KDS)'
  },
  role_accountant: {
    fr: 'Comptable',
    en: 'Accountant'
  },
  role_superadmin: {
    fr: 'Super Administrateur',
    en: 'Super Admin'
  },
  activeProfile: {
    fr: 'Profil Actif',
    en: 'Active Profile'
  },

  // Modules & Views
  view_dashboard: {
    fr: 'Tableau de bord',
    en: 'Dashboard'
  },
  view_dashboard_sub: {
    fr: 'Vue générale & CA',
    en: 'Overview & Revenue'
  },
  view_orders: {
    fr: 'Commandes Live',
    en: 'Live Orders'
  },
  view_orders_sub: {
    fr: 'Temps réel',
    en: 'Real-time'
  },
  view_kitchen: {
    fr: 'Écran Cuisine',
    en: 'Kitchen Display'
  },
  view_kitchen_sub: {
    fr: 'Préparation KDS',
    en: 'KDS Prep'
  },
  view_waiter: {
    fr: 'Serveurs & Service',
    en: 'Waiters & Floor'
  },
  view_waiter_sub: {
    fr: 'Prise de commande',
    en: 'Table Ordering'
  },
  view_tables: {
    fr: 'Tables & QR Codes',
    en: 'Tables & QR Codes'
  },
  view_tables_sub: {
    fr: 'Stickers & plans',
    en: 'Stickers & Layout'
  },
  view_menu: {
    fr: 'Menu & Produits',
    en: 'Menu & Products'
  },
  view_menu_sub: {
    fr: 'Plats & tarifs',
    en: 'Dishes & Prices'
  },
  view_sales: {
    fr: 'Caisse & Ventes',
    en: 'POS & Sales'
  },
  view_sales_sub: {
    fr: 'OM, MoMo, Espèces',
    en: 'Orange Money, MoMo, Cash'
  },
  view_inventory: {
    fr: 'Stocks & Inventaire',
    en: 'Stock & Inventory'
  },
  view_inventory_sub: {
    fr: 'Ingrédients & Achats',
    en: 'Ingredients & Purchases'
  },
  view_staff: {
    fr: 'Équipe & Rôles',
    en: 'Staff & Roles'
  },
  view_staff_sub: {
    fr: 'Personnel & accès',
    en: 'Staff & Access'
  },
  view_analytics: {
    fr: 'Statistiques',
    en: 'Analytics & Reports'
  },
  view_analytics_sub: {
    fr: 'Rapports & bilans',
    en: 'Reports & Audit'
  },
  view_settings: {
    fr: 'Paramètres',
    en: 'Settings'
  },
  view_settings_sub: {
    fr: 'Profil & Forfait',
    en: 'Profile & Plan'
  },
  view_customer_qr: {
    fr: 'Menu Client QR',
    en: 'Customer QR Menu'
  },
  view_privacy: {
    fr: 'Confidentialité',
    en: 'Privacy Policy'
  },

  // Customer QR Storefront
  digitalMenuSub: {
    fr: 'Menu Digital & Commande à table',
    en: 'Digital Menu & Table Ordering'
  },
  callWaiter: {
    fr: 'Appeler Serveur',
    en: 'Call Waiter'
  },
  callWaiterSending: {
    fr: 'Envoi...',
    en: 'Calling...'
  },
  waiterCalledSuccess: {
    fr: 'Serveur appelé ✓',
    en: 'Waiter Called ✓'
  },
  waiterCallDescription: {
    fr: 'Service & commande à table',
    en: 'Table service & order assistance'
  },
  waiterNotifiedBanner: {
    fr: '🔔 Votre serveur a bien été notifié par un carillon sonore et arrive à votre table !',
    en: '🔔 Your waiter has been notified with a sound chime and is arriving at your table!'
  },
  searchPlaceholder: {
    fr: 'Rechercher un plat, grillade, boisson...',
    en: 'Search dish, grill, drink...'
  },
  allDishes: {
    fr: 'Tous les plats',
    en: 'All Dishes'
  },
  addToCart: {
    fr: 'Ajouter',
    en: 'Add to Cart'
  },
  myCart: {
    fr: 'Mon Panier',
    en: 'My Cart'
  },
  emptyCart: {
    fr: 'Votre panier est vide',
    en: 'Your cart is empty'
  },
  emptyCartSub: {
    fr: 'Ajoutez des plats savoureux depuis la carte pour passer commande.',
    en: 'Add tasty dishes from the menu to place your order.'
  },
  specialInstructions: {
    fr: 'Instructions pour la cuisine (ex: sans piment, bien cuit)',
    en: 'Kitchen notes (e.g. no pepper, well done)'
  },
  customerNameOptional: {
    fr: 'Votre Nom ou Prénom (facultatif)',
    en: 'Your Name (optional)'
  },
  customerPhoneOptional: {
    fr: 'Téléphone (facultatif)',
    en: 'Phone (optional)'
  },
  orderGeneralNotes: {
    fr: 'Note générale pour la commande (facultatif)',
    en: 'General order notes (optional)'
  },
  totalToPayOnSite: {
    fr: 'Total à régler sur place :',
    en: 'Total to pay on site:'
  },
  confirmAndSendOrder: {
    fr: 'CONFIRMER ET ENVOYER EN CUISINE',
    en: 'CONFIRM AND SEND TO KITCHEN'
  },
  sendingToKitchen: {
    fr: 'Transmission à la cuisine...',
    en: 'Sending to kitchen...'
  },
  ordersUnavailable: {
    fr: 'COMMANDES INDISPONIBLES',
    en: 'ORDERS CURRENTLY UNAVAILABLE'
  },
  secureDigitalMenu: {
    fr: 'Menu digital sécurisé',
    en: 'Secure digital menu'
  },
  staffAndOwnerAccess: {
    fr: 'Accès Personnel & Gérant',
    en: 'Staff & Owner Access'
  },
  trackLive: {
    fr: 'Suivre en direct →',
    en: 'Track live →'
  },
  dishesReadyBanner: {
    fr: '🎉 VOS PLATS SONT PRÊTS !',
    en: '🎉 YOUR DISHES ARE READY!'
  },
  dishesReadySub: {
    fr: 'Le serveur vous les apporte à votre table dans un instant.',
    en: 'The waiter is bringing them to your table in a moment.'
  },
  orderServedBanner: {
    fr: '🍽️ COMMANDE SERVIE !',
    en: '🍽️ ORDER SERVED!'
  },
  orderServedSub: {
    fr: 'Toute l\'équipe vous souhaite un excellent appétit.',
    en: 'Our whole team wishes you bon appétit!'
  },
  chefPreparing: {
    fr: 'Le chef prépare actuellement vos délicieux plats en cuisine.',
    en: 'The chef is preparing your delicious dishes in the kitchen.'
  },

  // Customer Order Tracker
  orderTrackingTitle: {
    fr: 'Suivi de Commande en Direct',
    en: 'Live Order Tracking'
  },
  orderNumber: {
    fr: 'Numéro de commande',
    en: 'Order number'
  },
  placedAt: {
    fr: 'Passée à',
    en: 'Placed at'
  },
  minutesElapsed: {
    fr: 'min écoulées',
    en: 'min elapsed'
  },
  realtimeStatus: {
    fr: 'Statut en Temps Réel',
    en: 'Real-Time Status'
  },
  stepReceived: {
    fr: 'Reçue',
    en: 'Received'
  },
  stepConfirmed: {
    fr: 'Confirmée',
    en: 'Confirmed'
  },
  stepCooking: {
    fr: 'En cuisine',
    en: 'In Kitchen'
  },
  stepReady: {
    fr: 'Prête',
    en: 'Ready'
  },
  stepInService: {
    fr: 'En service',
    en: 'In Service'
  },
  stepServed: {
    fr: 'Servie à table',
    en: 'Served'
  },
  orderMoreItems: {
    fr: 'Commander d\'autres articles',
    en: 'Order more items'
  },
  orderSummary: {
    fr: 'Récapitulatif de la commande',
    en: 'Order Summary'
  },

  // Security guard & authentication
  protectedAreaTitle: {
    fr: 'Espace Personnel Protégé',
    en: 'Protected Staff Area'
  },
  protectedAreaDescription: {
    fr: 'Cette section (tableau de bord, cuisine, serveurs, caisse, stocks) est strictement réservée au personnel et au gérant du restaurant.',
    en: 'This section (dashboard, kitchen, waiters, POS, inventory) is strictly restricted to authorized restaurant staff and management.'
  },
  protectedAreaInstruction: {
    fr: 'Veuillez vous connecter avec votre mot de passe ou code PIN pour déverrouiller vos accès.',
    en: 'Please sign in with your password or staff PIN code to unlock access.'
  },
  signInWithPassword: {
    fr: 'Se connecter avec mot de passe',
    en: 'Sign in with password'
  },
  returnToCustomerMenu: {
    fr: 'Retourner au Menu Client (QR)',
    en: 'Return to Customer QR Menu'
  },
  customerModeRestrictionNotice: {
    fr: 'Le mode Client protège l\'ensemble des données de gestion, d\'inventaire et de chiffre d\'affaires du restaurant.',
    en: 'Customer mode completely protects restaurant management data, inventory, and revenue figures.'
  },

  // Orders Kanban & POS
  newOrders: {
    fr: 'Nouvelles commandes',
    en: 'New Orders'
  },
  acceptedOrders: {
    fr: 'Confirmées',
    en: 'Accepted'
  },
  preparingOrders: {
    fr: 'En cuisine',
    en: 'Cooking'
  },
  readyOrders: {
    fr: 'Prêtes',
    en: 'Ready'
  },
  servedOrders: {
    fr: 'Servies',
    en: 'Served'
  },
  payOrder: {
    fr: 'Encaisser',
    en: 'Pay'
  },
  cancelOrder: {
    fr: 'Annuler',
    en: 'Cancel'
  },
  printReceipt: {
    fr: 'Imprimer Ticket',
    en: 'Print Ticket'
  },
  paymentMethod: {
    fr: 'Moyen de paiement',
    en: 'Payment Method'
  },
  orangeMoney: {
    fr: 'Orange Money',
    en: 'Orange Money'
  },
  mtnMoMo: {
    fr: 'MTN Mobile Money',
    en: 'MTN Mobile Money'
  },
  cash: {
    fr: 'Espèces',
    en: 'Cash'
  },
  card: {
    fr: 'Carte Bancaire',
    en: 'Credit Card'
  },

  // Inventory & Purchases
  inventoryTitle: {
    fr: 'Gestion des Stocks & Inventaire',
    en: 'Stock & Inventory Management'
  },
  purchasesHistoryTab: {
    fr: 'Historique des Achats & Approvisionnements',
    en: 'Purchases & Restocking History'
  },
  stockItemsTab: {
    fr: 'Articles & Stock en Réserve',
    en: 'Stock Items in Storage'
  },
  recordNewPurchase: {
    fr: 'Enregistrer un Achat / Facture',
    en: 'Record Purchase / Invoice'
  },
  supplier: {
    fr: 'Fournisseur',
    en: 'Supplier'
  },
  minimumStock: {
    fr: 'Stock Minimum',
    en: 'Minimum Stock'
  },
  currentStock: {
    fr: 'Stock Actuel',
    en: 'Current Stock'
  },
  unitCost: {
    fr: 'Prix Unitaire',
    en: 'Unit Cost'
  },

  // Tables & QR
  tableManagerTitle: {
    fr: 'Gestion des Tables & QR Codes',
    en: 'Table & QR Code Management'
  },
  generateTableQr: {
    fr: 'Générer QR Code',
    en: 'Generate QR Code'
  },
  thermalSticker: {
    fr: 'Sticker Thermique 80mm',
    en: '80mm Thermal Sticker'
  },
  tableTent: {
    fr: 'Chevalet de Table A6',
    en: 'A6 Table Tent'
  },
  print: {
    fr: 'Imprimer',
    en: 'Print'
  },
  download: {
    fr: 'Télécharger',
    en: 'Download'
  },

  // Kitchen & Waiter
  kitchenDisplayTitle: {
    fr: 'Écran de Cuisine (KDS)',
    en: 'Kitchen Display System (KDS)'
  },
  waiterCallsActive: {
    fr: 'Appels Serveurs Actifs',
    en: 'Active Waiter Calls'
  },
  markDone: {
    fr: 'Marquer Prêt',
    en: 'Mark Ready'
  },
  attendCall: {
    fr: 'Prendre en charge',
    en: 'Attend Table'
  },

  // Sound toggle
  soundOn: {
    fr: 'Son activé',
    en: 'Sound On'
  },
  soundOff: {
    fr: 'Son coupé',
    en: 'Sound Muted'
  },

  // Subscription & Suspension
  subscriptionSuspendedTitle: {
    fr: 'Accès au service suspendu — Abonnement Expiré',
    en: 'Service Access Suspended — Subscription Expired'
  },
  subscriptionSuspendedSubtitle: {
    fr: "L'abonnement de votre établissement est arrivé à expiration. L'accès aux outils de gestion et au menu QR est temporairement suspendu.",
    en: 'Your restaurant subscription has expired. Access to management tools and QR menu is temporarily suspended.'
  },
  subscriptionExpiredBadge: {
    fr: 'Abonnement Expiré',
    en: 'Subscription Expired'
  },
  subscriptionSuspendedBadge: {
    fr: 'Service Suspendu',
    en: 'Service Suspended'
  },
  subscriptionActiveBadge: {
    fr: 'Abonnement Actif',
    en: 'Active Subscription'
  },
  subscriptionTrialBadge: {
    fr: "Période d'Essai",
    en: 'Trial Period'
  },
  renewSubscriptionNow: {
    fr: 'Renouveler immédiatement',
    en: 'Renew Subscription Now'
  },
  renewSubscriptionSubtitle: {
    fr: 'Réactivation instantanée de tous les modules de votre restaurant',
    en: 'Instant reactivation of all restaurant modules'
  },
  subscriptionExpiresInDays: {
    fr: 'Votre abonnement expire dans {days} jour(s)',
    en: 'Your subscription expires in {days} day(s)'
  },
  subscriptionExpiredSinceDays: {
    fr: 'Abonnement expiré depuis {days} jour(s)',
    en: 'Subscription expired {days} day(s) ago'
  },
  frozenServicesNotice: {
    fr: 'Services temporairement bloqués :',
    en: 'Temporarily blocked services:'
  },
  frozenServiceOrders: {
    fr: 'Prise de commandes & Ventes en caisse',
    en: 'Order taking & POS Cashiering'
  },
  frozenServiceQr: {
    fr: 'Menu digital QR Code pour vos clients',
    en: 'Digital QR Code Menu for customers'
  },
  frozenServiceKitchen: {
    fr: 'Écran Cuisine KDS & Module Serveurs',
    en: 'Kitchen KDS Display & Waiter Module'
  },
  frozenServiceStock: {
    fr: 'Gestion des stocks & Rapports comptables',
    en: 'Inventory Management & Accounting reports'
  },
  dataPreservedNotice: {
    fr: 'Vos données (recettes, cartes, historique financier, tables) restent 100% conservées en sécurité.',
    en: 'Your data (recipes, menus, financial history, tables) remain 100% securely preserved.'
  },
  customerSuspendedTitle: {
    fr: 'Service en ligne temporairement indisponible',
    en: 'Online service temporarily unavailable'
  },
  customerSuspendedMessage: {
    fr: "Le menu digital et la commande en ligne de cet établissement sont momentanément suspendus. Veuillez vous adresser directement au personnel en salle.",
    en: 'The digital menu and online ordering for this establishment are currently suspended. Please speak directly with the on-site staff.'
  },
  callRestaurant: {
    fr: 'Appeler le restaurant',
    en: 'Call restaurant'
  },
  managerAccess: {
    fr: 'Espace Gérant / Se connecter',
    en: 'Manager Area / Sign In'
  },
  chooseDuration: {
    fr: "Durée de l'abonnement",
    en: 'Subscription Duration'
  },
  oneMonth: {
    fr: '1 Mois',
    en: '1 Month'
  },
  threeMonths: {
    fr: '3 Mois (-5%)',
    en: '3 Months (-5%)'
  },
  sixMonths: {
    fr: '6 Mois (-10%)',
    en: '6 Months (-10%)'
  },
  twelveMonths: {
    fr: '1 An (-20% + 1 mois offert)',
    en: '1 Year (-20% + 1 month free)'
  },
  selectPaymentMethod: {
    fr: 'Moyen de paiement mobile ou carte',
    en: 'Mobile payment or card'
  },
  confirmAndReactivate: {
    fr: 'Confirmer & Réactiver mon service',
    en: 'Confirm & Reactivate Service'
  },
  demoReactivate30Days: {
    fr: 'Mode Démo : Réactiver pour 30 jours',
    en: 'Demo Mode: Reactivate for 30 days'
  },
  simulateExpiryTest: {
    fr: "Simuler l'expiration immédiate (Tester la suspension)",
    en: 'Simulate immediate expiration (Test suspension)'
  },

  // Synchronization & Data Backup translations
  cloudSyncTitle: {
    fr: 'Synchronisation Cloud & Sauvegarde',
    en: 'Cloud Sync & Data Backup'
  },
  cloudSyncSubtitle: {
    fr: 'Sauvegarde automatique et synchronisation multi-appareils sécurisée',
    en: 'Automatic backup and secure multi-device synchronization'
  },
  cloudStatusSynced: {
    fr: 'Données synchronisées Cloud',
    en: 'Data Cloud Synchronized'
  },
  cloudStatusSyncing: {
    fr: 'Synchronisation en cours...',
    en: 'Synchronizing...'
  },
  syncNow: {
    fr: 'Synchroniser maintenant',
    en: 'Sync Now'
  },
  exportBackup: {
    fr: 'Télécharger la sauvegarde (JSON)',
    en: 'Download Backup (JSON)'
  },
  importBackup: {
    fr: 'Restaurer une sauvegarde',
    en: 'Restore Backup'
  },
  lastBackup: {
    fr: 'Dernière sauvegarde',
    en: 'Last Backup'
  },
  neverBackup: {
    fr: 'Jamais effectuée',
    en: 'Never performed'
  },
  dataSafetyBadge: {
    fr: 'Protection continue & Chiffrement',
    en: 'Continuous Protection & Encryption'
  },
  exportBackupSuccess: {
    fr: 'Fichier de sauvegarde généré avec succès !',
    en: 'Backup file generated successfully!'
  },
  importBackupSuccess: {
    fr: 'Sauvegarde restaurée avec succès ({count} éléments rétablis)',
    en: 'Backup restored successfully ({count} items restored)'
  },
  bilingualNotice: {
    fr: 'Français / English',
    en: 'Français / English'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = safeStorage.getItem('afroresto_lang') || safeStorage.getItem('restocam_lang');
    if (saved === 'en' || saved === 'fr') return saved;
    // Default to French, with smart browser detection for pan-African bilingual environments (FR/EN)
    if (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('en')) {
      return 'en';
    }
    return 'fr';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    safeStorage.setItem('afroresto_lang', lang);
    safeStorage.setItem('restocam_lang', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const entry = DICTIONARY[key];
    let text = entry ? (entry[language] || entry.fr || key) : key;
    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      language: 'fr',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: string, params?: Record<string, string | number>) => {
        const entry = DICTIONARY[key];
        let text = entry ? entry.fr : key;
        if (params) {
          Object.entries(params).forEach(([paramKey, val]) => {
            text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
          });
        }
        return text;
      }
    };
  }
  return ctx;
};

interface LanguageSwitcherProps {
  variant?: 'navbar' | 'compact' | 'customer' | 'minimal';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'navbar',
  className = '' 
}) => {
  const { language, setLanguage, toggleLanguage } = useLanguage();

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/90 text-xs font-bold ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage('fr')}
          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
            language === 'fr' 
              ? 'bg-white text-emerald-800 shadow-xs font-extrabold' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Passer en Français"
        >
          <span>🇫🇷</span>
          <span>FR</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
            language === 'en' 
              ? 'bg-white text-emerald-800 shadow-xs font-extrabold' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
          title="Switch to English"
        >
          <span>🇬🇧</span>
          <span>EN</span>
        </button>
      </div>
    );
  }

  if (variant === 'customer') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`px-2 py-1 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700/80 text-[11px] font-extrabold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${className}`}
        title={language === 'fr' ? 'Switch to English' : 'Passer en Français'}
      >
        <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>{language === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}</span>
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1 cursor-pointer ${className}`}
      >
        <span>{language === 'fr' ? '🇬🇧 English' : '🇫🇷 Français'}</span>
      </button>
    );
  }

  // Default navbar variant
  return (
    <div className={`inline-flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/80 text-xs font-semibold ${className}`}>
      <button
        type="button"
        onClick={() => setLanguage('fr')}
        className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
          language === 'fr'
            ? 'bg-white text-emerald-800 shadow-soft-sm font-bold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Passer en Français"
      >
        <span>🇫🇷</span>
        <span className="hidden sm:inline">FR</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
          language === 'en'
            ? 'bg-white text-emerald-800 shadow-soft-sm font-bold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title="Switch to English"
      >
        <span>🇬🇧</span>
        <span className="hidden sm:inline">EN</span>
      </button>
    </div>
  );
};
