import { 
  Restaurant, 
  User, 
  MenuCategory, 
  MenuItem, 
  RestaurantArea, 
  RestaurantTable, 
  Order, 
  InventoryItem, 
  PurchaseRecord,
  SubscriptionPlan,
  DeliveryDriver 
} from '../types';

export const DEFAULT_RESTAURANT_ID = '';

export const INITIAL_RESTAURANTS: Restaurant[] = [];

export const INITIAL_AREAS: RestaurantArea[] = [];

export const INITIAL_TABLES: RestaurantTable[] = [];

export const INITIAL_CATEGORIES: MenuCategory[] = [];

export const INITIAL_MENU_ITEMS: MenuItem[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_INVENTORY: InventoryItem[] = [];

export const INITIAL_PURCHASES: PurchaseRecord[] = [];

export const INITIAL_STAFF: User[] = [];

export const INITIAL_DRIVERS: DeliveryDriver[] = [];

export const SAAS_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'STARTER',
    tagline: 'Idéal pour démarrer votre restaurant, snack, bar ou maquis',
    priceMonthly: 5000,
    priceYearly: 50000,
    maxTables: null,
    isPopular: false,
    popular: false,
    launchOfferBadge: '🎁 BOOST PREMIUM OFFERT',
    launchBonusNotice: 'Offre de lancement : 100% des fonctionnalités PREMIUM incluses sans surcoût pour fidéliser vos clients dès vos premiers mois !',
    features: [
      '🔥 Boost de Lancement : Toutes les options PREMIUM débloquées',
      'Menu digital QR Code sécurisé & personnalisé',
      'Tables & Espaces ILLIMITÉS (Offert pour le lancement)',
      'Écran Cuisine KDS en direct & alertes sonores',
      'Module Serveurs, Caisse & Ventes (OM / MoMo / Cash)',
      'Gestion des Stocks avec alertes de rupture',
      'Gestion du Personnel & Rôles illimités (RBAC)',
      'Statistiques & Rapports financiers complets',
      'Support réactif WhatsApp 7j/7',
    ],
  },
  {
    id: 'business',
    name: 'BUSINESS',
    tagline: 'Pour restaurants en forte croissance, grills & lounges',
    priceMonthly: 10000,
    priceYearly: 100000,
    maxTables: null,
    isPopular: true,
    popular: true,
    launchOfferBadge: '🎁 BOOST PREMIUM INCLUS',
    launchBonusNotice: 'Toutes les fonctionnalités avancées et support VIP inclus.',
    features: [
      'Tables et Espaces ILLIMITÉS',
      'Menu digital QR Code avec personnalisation poussée',
      'Écran Cuisine KDS en direct & chronométrage',
      'Interface Serveurs & Assignation instantanée',
      'Gestion des ventes & caisse (OM, MoMo, Espèces)',
      'Gestion complète des stocks & ingrédients',
      'Gestion d\'équipe avec rôles sécurisés (RBAC)',
      'Statistiques des ventes & top produits',
      'Génération & Impression des chevalets de table',
      'Support prioritaire WhatsApp 7j/7',
    ],
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    tagline: 'Pour grands restaurants, chaînes & complexes gastronomiques',
    priceMonthly: 25000,
    priceYearly: 250000,
    maxTables: null,
    isPopular: false,
    popular: false,
    launchOfferBadge: '👑 PACK COMPLET',
    launchBonusNotice: 'Le forfait de référence pour l\'excellence opérationnelle.',
    features: [
      'Toutes les fonctionnalités BUSINESS en illimité',
      'Gestion des Stocks avancée & alertes seuil automatiques',
      'Multi-espaces illimités (Terrasse, VIP, Rooftop, Bar, Jardin)',
      'Analytics & rapports financiers exportables (Excel / PDF)',
      'Paiements intégrés OM / MoMo & traçabilité caisse',
      'Comptes employés & caissiers illimités',
      'Accompagnement & formation sur site (Douala / Yaoundé)',
      'Manager de compte dédié disponible 24/7',
    ],
  },
];
