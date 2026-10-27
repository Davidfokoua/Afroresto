import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  ShieldCheck, 
  KeyRound, 
  Mail, 
  Phone, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Lock, 
  ChefHat, 
  Layers, 
  DollarSign, 
  X,
  Search,
  UserCheck,
  Building2,
  SlidersHorizontal
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { User, UserRole } from '../../types';
import { getRoleLabel } from '../../utils/formatters';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { SwitchProfileModal } from '../auth/SwitchProfileModal';

export const StaffManager: React.FC = () => {
  const { 
    staff, 
    addStaffMember, 
    updateStaffMember, 
    deleteStaffMember, 
    currentUser, 
    switchUserRole,
    currentRestaurant,
    sendPasswordReset,
    registerUserAccount
  } = useRestaurant();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [switchModalConfig, setSwitchModalConfig] = useState<{ isOpen: boolean; targetRole: UserRole | null }>({
    isOpen: false,
    targetRole: null,
  });

  // Delete modal state
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    id: '',
    name: '',
    isDeleting: false,
  });

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '+237 6',
    role: 'waiter' as UserRole,
    pinCode: '1234',
    active: true,
    sendInviteEmail: true,
  });

  const rolesList: { role: UserRole; label: string; desc: string; icon: React.ElementType; permissions: string[] }[] = [
    {
      role: 'owner',
      label: 'Propriétaire / Gérant',
      desc: 'Accès absolu à tous les paramètres, finances, menus et rapports.',
      icon: ShieldCheck,
      permissions: ['Gestion financière complète', 'Configuration générale', 'Gestion des rôles & prix', 'Accès toutes vues'],
    },
    {
      role: 'manager',
      label: 'Directeur d\'Exploitation',
      desc: 'Supervision des services, gestion des stocks et de la salle.',
      icon: Building2,
      permissions: ['Supervision des commandes', 'Gestion des stocks & achats', 'Planning salle & tables', 'Rapports journaliers'],
    },
    {
      role: 'chef',
      label: 'Chef de Cuisine',
      desc: 'Accès prioritaire à l\'écran cuisine KDS et aux fiches recettes.',
      icon: ChefHat,
      permissions: ['Écran Cuisine KDS', 'Validation des cuissons', 'Gestion des indisponibilités'],
    },
    {
      role: 'waiter',
      label: 'Serveur / Service en Salle',
      desc: 'Prise de commande mobile, suivi des tables et livraison.',
      icon: Layers,
      permissions: ['Prise de commandes', 'Statut des tables', 'Réception alertes plats prêts'],
    },
    {
      role: 'cashier',
      label: 'Caissier',
      desc: 'Encaissements Orange Money, MTN MoMo, Espèces et clôture de caisse.',
      icon: DollarSign,
      permissions: ['Encaissement des commandes', 'Impression tickets de caisse', 'Rapports journaliers'],
    },
  ];

  // Guarantee at least the owner is present in staff list if none exist
  const effectiveStaffList: User[] = useMemo(() => {
    const rawStaff = Array.isArray(staff) ? staff : [];
    if (rawStaff.length > 0) return rawStaff;

    // Fallback default admin if no staff records exist yet
    return [
      {
        id: `usr_owner_${currentRestaurant?.id || 'default'}`,
        restaurantId: currentRestaurant?.id || 'rest_default',
        name: currentRestaurant?.ownerName || 'Propriétaire Administrateur',
        email: currentRestaurant?.ownerEmail || 'admin@restocam.cm',
        phone: currentRestaurant?.phone || '+237 690 00 00 00',
        role: 'owner',
        active: true,
        pinCode: '1234',
      }
    ];
  }, [staff, currentRestaurant]);

  const filteredStaff = useMemo(() => {
    return effectiveStaffList.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.phone && s.phone.includes(searchQuery));
      const matchRole = selectedRoleFilter === 'all' || s.role === selectedRoleFilter;
      return matchSearch && matchRole;
    });
  }, [effectiveStaffList, searchQuery, selectedRoleFilter]);

  const handleOpenNew = () => {
    setEditingStaff(null);
    setStaffForm({
      name: '',
      email: '',
      phone: '+237 6',
      role: 'waiter',
      pinCode: `${Math.floor(1000 + Math.random() * 9000)}`,
      active: true,
      sendInviteEmail: true,
    });
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name.trim()) return;

    const emailToUse = staffForm.email.trim() || `${staffForm.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@${currentRestaurant?.slug || 'restocam'}.cm`;

    if (editingStaff) {
      await updateStaffMember(editingStaff.id, {
        name: staffForm.name.trim(),
        email: emailToUse,
        phone: staffForm.phone.trim(),
        role: staffForm.role,
        pinCode: staffForm.pinCode,
        active: staffForm.active,
      });
      setSuccessToast(`Informations de ${staffForm.name} mises à jour.`);
    } else {
      await addStaffMember({
        name: staffForm.name.trim(),
        email: emailToUse,
        phone: staffForm.phone.trim(),
        role: staffForm.role,
        pinCode: staffForm.pinCode,
        active: staffForm.active,
      });

      if (staffForm.sendInviteEmail && emailToUse.includes('@')) {
        try {
          const authRes = await registerUserAccount(emailToUse, `Staff${staffForm.pinCode}!`, staffForm.name.trim(), staffForm.role);
          if (authRes.emailSent) {
            setSuccessToast(`Collaborateur ajouté et email de vérification envoyé à ${emailToUse} !`);
          } else {
            setSuccessToast(`Collaborateur ajouté (${authRes.message}).`);
          }
        } catch {
          setSuccessToast(`Collaborateur ${staffForm.name} ajouté.`);
        }
      } else {
        setSuccessToast(`Collaborateur ${staffForm.name} ajouté avec succès.`);
      }
    }

    setTimeout(() => setSuccessToast(null), 5000);
    setIsModalOpen(false);
  };

  const handleToggleStatus = async (staffMember: User) => {
    await updateStaffMember(staffMember.id, {
      active: !staffMember.active
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteModalConfig.id) return;
    setDeleteModalConfig(prev => ({ ...prev, isDeleting: true }));
    try {
      await deleteStaffMember(deleteModalConfig.id);
      setSuccessToast(`Collaborateur "${deleteModalConfig.name}" définitivement supprimé.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('Delete staff error:', err);
    } finally {
      setDeleteModalConfig({
        isOpen: false,
        id: '',
        name: '',
        isDeleting: false,
      });
    }
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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900">Équipe, Employés & Permissions (RBAC)</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {effectiveStaffList.length} collaborateurs
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Gérez les accès sécurisés, rôles et codes PIN pour {currentRestaurant?.name || 'votre établissement'}.
          </p>
        </div>

        <button
          id="add-staff-btn"
          onClick={handleOpenNew}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Ajouter un Employé
        </button>
      </div>

      {/* Operator Role Active Switcher Simulator */}
      <div className="bg-gradient-to-r from-emerald-50 via-slate-50 to-emerald-50/40 p-4 rounded-3xl border border-emerald-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900">Poste & Profil Actif :</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[11px]">
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
            <p className="text-slate-600 text-[11px]">Basculez de rôle instantanément pour simuler ou utiliser les interfaces dédiées.</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(['owner', 'manager', 'chef', 'waiter', 'cashier'] as UserRole[]).map(r => (
            <button
              key={r}
              id={`switch-role-${r}`}
              onClick={() => {
                if (currentUser.role === r) return;
                setSwitchModalConfig({ isOpen: true, targetRole: r });
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                currentUser.role === r
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90'
              }`}
            >
              {getRoleLabel(r).split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              selectedRoleFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tous ({effectiveStaffList.length})
          </button>
          {rolesList.map(r => {
            const count = effectiveStaffList.filter(s => s.role === r.role).length;
            return (
              <button
                key={r.role}
                onClick={() => setSelectedRoleFilter(r.role)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                  selectedRoleFilter === r.role
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {r.label.split('/')[0].trim()} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Aucun collaborateur trouvé</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Aucun membre ne correspond à vos critères de recherche.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedRoleFilter('all'); }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map(staffMember => {
            const roleConfig = rolesList.find(r => r.role === staffMember.role) || rolesList[0];
            const Icon = roleConfig?.icon || Users;
            const isSelf = staffMember.email === currentUser.email;

            return (
              <div 
                key={staffMember.id} 
                className="bg-white rounded-3xl border border-slate-200/90 shadow-soft-sm hover:shadow-soft-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-black shadow-xs shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-sm text-slate-900 truncate">{staffMember.name}</h3>
                          {isSelf && (
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[9px] font-bold rounded-md">
                              Vous
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-emerald-700">{getRoleLabel(staffMember.role)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(staffMember)}
                      title={staffMember.active !== false ? 'Désactiver l\'accès' : 'Activer l\'accès'}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                        staffMember.active !== false 
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                          : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      }`}
                    >
                      {staffMember.active !== false ? 'Actif' : 'Suspendu'}
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-800 font-medium">{staffMember.email}</span>
                    </div>
                    {staffMember.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-800 font-medium">{staffMember.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-mono text-slate-700 font-bold">
                          PIN : {staffMember.pinCode || '1234'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Authentification rapide</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Permissions clés :</p>
                    <ul className="space-y-1 text-[11px] text-slate-600">
                      {roleConfig?.permissions.slice(0, 3).map((perm, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{perm}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => {
                      if (currentUser.role === staffMember.role) return;
                      setSwitchModalConfig({ isOpen: true, targetRole: staffMember.role });
                    }}
                    className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Connexion PIN à ce profil
                  </button>

                  <div className="flex items-center gap-1">
                    {staffMember.email && staffMember.email.includes('@') && (
                      <button
                        onClick={async () => {
                          const res = await sendPasswordReset(staffMember.email);
                          setSuccessToast(res.message);
                          setTimeout(() => setSuccessToast(null), 5000);
                        }}
                        title={`Envoyer un email de réinitialisation de mot de passe à ${staffMember.email}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      id={`edit-staff-${staffMember.id}`}
                      onClick={() => {
                        setEditingStaff(staffMember);
                        setStaffForm({
                          name: staffMember.name,
                          email: staffMember.email,
                          phone: staffMember.phone || '+237 6',
                          role: staffMember.role,
                          pinCode: staffMember.pinCode || '1234',
                          active: staffMember.active !== false,
                          sendInviteEmail: false,
                        });
                        setIsModalOpen(true);
                      }}
                      title="Modifier les informations"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      id={`delete-staff-${staffMember.id}`}
                      onClick={() => {
                        setDeleteModalConfig({
                          isOpen: true,
                          id: staffMember.id,
                          name: staffMember.name,
                          isDeleting: false,
                        });
                      }}
                      title="Supprimer ce collaborateur"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingStaff ? 'Modifier le Collaborateur' : 'Ajouter un Collaborateur'}
                </h3>
                <p className="text-xs text-slate-500">Droits d\'accès et authentification</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nom complet du collaborateur *</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="Ex: Paul Alain Ndongo"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Rôle & Permissions *</label>
                <select
                  value={staffForm.role}
                  onChange={e => setStaffForm({ ...staffForm, role: e.target.value as UserRole })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800"
                >
                  <option value="owner">Gérant / Propriétaire (Accès total)</option>
                  <option value="manager">Directeur d\'Exploitation (Supervision salle & stock)</option>
                  <option value="chef">Chef de Cuisine (Écran Cuisine KDS)</option>
                  <option value="waiter">Serveur (Commandes mobiles & tables)</option>
                  <option value="cashier">Caissier (Encaissements OM/MoMo/Cash)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Téléphone WhatsApp</label>
                  <input
                    type="text"
                    value={staffForm.phone}
                    onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                    placeholder="+237 6XX XX XX XX"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Code PIN de Caisse (4 chiffres)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={staffForm.pinCode}
                    onChange={e => setStaffForm({ ...staffForm, pinCode: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Email de connexion</label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="nom@restaurant.cm"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {!editingStaff && staffForm.email && staffForm.email.includes('@') && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                  <input
                    type="checkbox"
                    id="staff-invite-email-check"
                    checked={staffForm.sendInviteEmail}
                    onChange={e => setStaffForm({ ...staffForm, sendInviteEmail: e.target.checked })}
                    className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="staff-invite-email-check" className="font-semibold cursor-pointer text-[11px]">
                    ✉️ Envoyer un email de vérification et d'activation à cette adresse
                  </label>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="staff-active-check"
                  checked={staffForm.active}
                  onChange={e => setStaffForm({ ...staffForm, active: e.target.checked })}
                  className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="staff-active-check" className="font-medium text-slate-700 cursor-pointer">
                  Compte actif (autoriser la connexion et les opérations)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md active:scale-95 transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title="Supprimer le collaborateur"
        itemName={deleteModalConfig.name}
        itemType="cet employé"
        warningMessage="Le compte et les accès de ce collaborateur seront immédiatement et définitivement révoqués de la plateforme."
        isDeleting={deleteModalConfig.isDeleting}
      />

      {/* Secure Switch Profile Modal */}
      <SwitchProfileModal
        isOpen={switchModalConfig.isOpen}
        onClose={() => setSwitchModalConfig({ isOpen: false, targetRole: null })}
        targetRole={switchModalConfig.targetRole}
      />

    </div>
  );
};

