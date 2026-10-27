import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  KeyRound, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ChefHat, 
  Layers, 
  DollarSign, 
  Building2,
  ArrowRight
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { User, UserRole } from '../../types';
import { getRoleLabel } from '../../utils/formatters';

interface SwitchProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: UserRole | null;
}

export const SwitchProfileModal: React.FC<SwitchProfileModalProps> = ({
  isOpen,
  onClose,
  targetRole = null,
}) => {
  const { staff, currentUser, verifyAndSwitchStaff, currentRestaurant } = useRestaurant();
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    if (targetRole) {
      const match = staff.find(s => s.role === targetRole);
      return match?.id || 'owner';
    }
    return currentUser.id || 'owner';
  });
  const [pinOrPassword, setPinOrPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setPinOrPassword('');
    setErrorMsg(null);
    onClose();
  };

  const handleValidateSwitch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!pinOrPassword.trim()) {
      setErrorMsg('Veuillez entrer votre mot de passe ou code PIN à 4 chiffres.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyAndSwitchStaff(selectedStaffId, pinOrPassword.trim());
      setIsVerifying(false);
      if (res.success) {
        handleClose();
      } else {
        setErrorMsg(res.message || 'Code PIN ou mot de passe incorrect.');
      }
    } catch {
      setIsVerifying(false);
      setErrorMsg('Erreur lors de la vérification.');
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner': return ShieldCheck;
      case 'chef': return ChefHat;
      case 'waiter': return Layers;
      case 'cashier': return DollarSign;
      case 'manager': return Building2;
      case 'superadmin': return ShieldCheck;
      default: return UserCheck;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Changer de Profil</h2>
              <p className="text-[11px] text-slate-300">Connexion sécurisée par Mot de Passe ou Code PIN</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleValidateSwitch} className="p-6 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="font-semibold">{errorMsg}</p>
            </div>
          )}

          {/* Select Profile Target */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Sélectionnez le compte à activer :</label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              
              {/* Owner option */}
              <button
                type="button"
                onClick={() => {
                  setSelectedStaffId('owner');
                  setErrorMsg(null);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  selectedStaffId === 'owner'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 truncate">
                      {currentRestaurant?.ownerName || 'David Fokoua'} (Gérant)
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {currentRestaurant?.ownerEmail || 'davidfokoua143@gmail.com'}
                    </p>
                  </div>
                </div>
                {selectedStaffId === 'owner' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </button>

              {/* Staff members list */}
              {staff.filter(s => s.role !== 'owner').map(member => {
                const Icon = getRoleIcon(member.role);
                const isSelected = selectedStaffId === member.id || selectedStaffId === member.role;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setSelectedStaffId(member.id);
                      setErrorMsg(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-300 font-black flex items-center justify-center text-xs shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 truncate">{member.name}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold truncate">
                          {getRoleLabel(member.role)}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password / PIN input */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">Mot de passe ou Code PIN :</label>
              <span className="text-[10px] text-slate-400">
                {selectedStaffId === 'owner' ? 'ex: admin123' : 'ex: 1234, 2222, 3333'}
              </span>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                value={pinOrPassword}
                onChange={e => setPinOrPassword(e.target.value)}
                placeholder="Entrez votre mot de passe ou code PIN"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quick PIN Keypad helper */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <p className="text-[11px] text-slate-500 font-medium">
              Codes de démonstration : <strong>admin123</strong> (Propriétaire) • <strong>2222</strong> (Chef Cuisine) • <strong>3333</strong> (Serveur)
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <span>{isVerifying ? 'Vérification...' : 'Valider la Connexion'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
