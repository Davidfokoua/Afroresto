import { OrderStatus, TableStatus, UserRole, PaymentStatus } from '../types';

export function formatFCFA(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 FCFA';
  }
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

export function formatDate(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getElapsedMinutes(isoString: string): number {
  if (!isoString) return 0;
  const start = new Date(isoString).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / 60000));
}

export function formatRelativeTime(isoString: string): string {
  const mins = getElapsedMinutes(isoString);
  if (mins === 0) return "À l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  return `il y a ${hours} h ${mins % 60} min`;
}

export function getOrderStatusConfig(status: OrderStatus) {
  switch (status) {
    case 'new':
      return {
        label: 'Nouvelle',
        bgColor: 'bg-rose-50 border-rose-200 text-rose-700',
        badgeColor: 'bg-rose-500 text-white',
        dotColor: 'bg-rose-500 animate-pulse',
        description: 'Commande reçue du client',
      };
    case 'accepted':
      return {
        label: 'Acceptée',
        bgColor: 'bg-blue-50 border-blue-200 text-blue-700',
        badgeColor: 'bg-blue-600 text-white',
        dotColor: 'bg-blue-500',
        description: 'Confirmée par le restaurant',
      };
    case 'preparing':
      return {
        label: 'En préparation',
        bgColor: 'bg-amber-50 border-amber-200 text-amber-800',
        badgeColor: 'bg-amber-500 text-white',
        dotColor: 'bg-amber-500 animate-spin',
        description: 'Cuisine en cours',
      };
    case 'ready':
      return {
        label: 'Prête',
        bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        badgeColor: 'bg-emerald-600 text-white',
        dotColor: 'bg-emerald-500',
        description: 'Cuisine terminée, prête à servir',
      };
    case 'in_service':
      return {
        label: 'En service',
        bgColor: 'bg-purple-50 border-purple-200 text-purple-700',
        badgeColor: 'bg-purple-600 text-white',
        dotColor: 'bg-purple-500',
        description: 'Serveur transporte la commande',
      };
    case 'served':
      return {
        label: 'Servie',
        bgColor: 'bg-teal-50 border-teal-200 text-teal-800',
        badgeColor: 'bg-teal-600 text-white',
        dotColor: 'bg-teal-500',
        description: 'Livrée à la table',
      };
    case 'completed':
      return {
        label: 'Terminée',
        bgColor: 'bg-gray-100 border-gray-200 text-gray-700',
        badgeColor: 'bg-gray-600 text-white',
        dotColor: 'bg-gray-400',
        description: 'Clôturée et réglée',
      };
    case 'cancelled':
      return {
        label: 'Annulée',
        bgColor: 'bg-red-50 border-red-200 text-red-600',
        badgeColor: 'bg-red-600 text-white',
        dotColor: 'bg-red-500',
        description: 'Commande rejetée ou annulée',
      };
  }
}

export function getTableStatusConfig(status: TableStatus) {
  switch (status) {
    case 'free':
      return {
        label: 'Libre',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'occupied':
      return {
        label: 'Occupée',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'reserved':
      return {
        label: 'Réservée',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'cleaning':
      return {
        label: 'À nettoyer',
        color: 'text-purple-700 bg-purple-50 border-purple-200',
        dot: 'bg-purple-500',
      };
  }
}

export function getPaymentStatusConfig(status: PaymentStatus) {
  switch (status) {
    case 'paid':
      return { label: 'Payée', color: 'text-emerald-700 bg-emerald-100' };
    case 'unpaid':
      return { label: 'Non payée', color: 'text-rose-700 bg-rose-100' };
    case 'refunded':
      return { label: 'Remboursée', color: 'text-gray-600 bg-gray-100' };
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'owner':
      return 'Propriétaire (Owner)';
    case 'manager':
      return 'Gérant (Manager)';
    case 'cashier':
      return 'Caissier (Cashier)';
    case 'waiter':
      return 'Serveur (Waiter)';
    case 'chef':
      return 'Chef Cuisine';
    case 'accountant':
      return 'Comptable';
    case 'superadmin':
      return 'Super Admin AFRORESTO';
  }
}

export function getViewLabel(view: string | null | undefined): string {
  if (!view) return 'Accueil';
  switch (view) {
    case 'landing':
      return 'Site Public';
    case 'dashboard':
      return 'Tableau de Bord';
    case 'menu':
      return 'Carte & Menu';
    case 'tables':
      return 'Plan de Salle & QR';
    case 'orders':
      return 'Commandes Live (Kanban)';
    case 'kitchen':
      return 'Écran Cuisine (KDS)';
    case 'waiter':
      return 'Espace Serveur';
    case 'sales':
      return 'Caisse & Encaissements';
    case 'inventory':
      return 'Gestion des Stocks';
    case 'staff':
      return 'Équipe & Accès';
    case 'analytics':
      return 'Rapports & Statistiques';
    case 'onboarding':
      return 'Nouveau Restaurant';
    case 'customer_qr':
      return 'Menu Client (QR)';
    case 'superadmin':
      return 'Super Admin SaaS';
    case 'settings':
      return 'Paramètres Resto';
    default:
      return 'Page précédente';
  }
}
