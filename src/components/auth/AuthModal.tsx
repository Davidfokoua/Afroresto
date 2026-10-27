import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  KeyRound, 
  ArrowLeft,
  Send,
  User as UserIcon,
  Sparkles,
  RefreshCw,
  Bike,
  Building2,
  Phone,
  MapPin,
  FileText,
  CreditCard
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestoCamLogo } from '../common/RestoCamLogo';
import { getRoleLabel } from '../../utils/formatters';
import { VehicleType } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { 
    login, 
    authMessage, 
    setAuthMessage, 
    setCurrentView, 
    restaurants, 
    staff,
    drivers,
    registerDriver,
    sendPasswordReset,
    registerUserAccount,
    resendVerificationEmail,
    isEmailVerified,
    currentUser,
    isAuthenticated
  } = useRestaurant();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);
  const [authTab, setAuthTab] = useState<'owner' | 'staff' | 'driver'>('owner');
  const [registerAccountType, setRegisterAccountType] = useState<'restaurant' | 'driver'>('restaurant');
  
  // Login & Register Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Courier/Driver specific registration fields
  const [driverPhone, setDriverPhone] = useState('');
  const [driverCity, setDriverCity] = useState('Douala');
  const [driverZones, setDriverZones] = useState('Akwa, Bonanjo, Deido, Bali');
  const [driverCni, setDriverCni] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('moto');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [driverRegistrationSuccess, setDriverRegistrationSuccess] = useState<boolean>(false);
  
  // Status & Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingVerif, setIsResendingVerif] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
    setDriverRegistrationSuccess(false);

    if (restaurants.length > 0) {
      setEmail(restaurants[0].ownerEmail || '');
    } else {
      setEmail('');
    }
  }, [initialMode, isOpen, restaurants]);

  if (!isOpen) return null;

  const handleClose = () => {
    setAuthMessage(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
    setDriverRegistrationSuccess(false);
    onClose();
  };

  const handleSelectAccount = (selectedEmail: string, tab: 'owner' | 'staff' | 'driver' = 'owner') => {
    setEmail(selectedEmail);
    setAuthTab(tab);
    setPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 100);
  };

  // Submit Login (supports owner, staff, and driver)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Veuillez entrer une adresse email ou un numéro de téléphone valide.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Veuillez saisir votre mot de passe ou code PIN.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email.trim(), password.trim());
      setIsLoading(false);
      if (res.success) {
        handleClose();
      } else {
        setErrorMsg(res.message || 'Identifiant ou mot de passe incorrect.');
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('Une erreur inattendue est survenue.');
    }
  };

  // Submit Registration (Restaurant vs Driver)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Veuillez renseigner votre nom complet.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Veuillez renseigner une adresse email valide.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe saisis ne correspondent pas.');
      return;
    }

    // Branch A: Courier / Livreur Account Registration
    if (registerAccountType === 'driver') {
      if (!driverPhone.trim()) {
        setErrorMsg('Veuillez renseigner un numéro de téléphone (WhatsApp / Mobile Money).');
        return;
      }
      if (!driverCni.trim()) {
        setErrorMsg('Veuillez saisir votre numéro de CNI ou Passeport.');
        return;
      }
      if (!vehiclePlate.trim()) {
        setErrorMsg('Veuillez indiquer le numéro d\'immatriculation ou matricule de votre véhicule.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await registerDriver({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: driverPhone.trim(),
          cniNumber: driverCni.trim(),
          address: `${driverCity} - ${driverZones}`,
          vehicleType,
          vehiclePlate: vehiclePlate.trim(),
          serviceZones: driverZones.split(',').map(s => s.trim()).filter(Boolean),
          serviceCity: driverCity,
          isOnline: true,
          verificationStatus: 'pending_office_check',
          isVerified: false,
          driverEarnings: 0
        }, password);

        setIsLoading(false);
        if (res.success) {
          setDriverRegistrationSuccess(true);
        } else {
          setErrorMsg(res.message || 'Impossible d\'enregistrer le compte livreur.');
        }
      } catch (err: any) {
        setIsLoading(false);
        setErrorMsg('Une erreur est survenue lors de l\'enregistrement de votre compte livreur.');
      }
      return;
    }

    // Branch B: Restaurant Owner Account Registration
    setIsLoading(true);
    try {
      const res = await registerUserAccount(email.trim(), password, fullName.trim(), 'owner');
      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          handleClose();
          if (restaurants.length === 0) {
            setCurrentView('onboarding');
          } else {
            setCurrentView('dashboard');
          }
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg('Une erreur est survenue lors de la création du compte.');
    }
  };

  // Submit Password Reset
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Veuillez saisir une adresse email valide.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendPasswordReset(email.trim());
      setIsLoading(false);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setIsLoading(false);
      setErrorMsg('Une erreur est survenue lors de l\'envoi du lien de réinitialisation.');
    }
  };

  // Resend Verification Email
  const handleResendVerification = async () => {
    setIsResendingVerif(true);
    try {
      const res = await resendVerificationEmail();
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg('Impossible de renvoyer l\'email pour le moment.');
    } finally {
      setIsResendingVerif(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-5 sm:p-7 space-y-4 animate-in zoom-in-95 relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="w-13 h-13 rounded-2xl bg-white p-1 border border-slate-200 flex items-center justify-center mx-auto shadow-md mb-2 overflow-hidden">
            <RestoCamLogo size={48} />
          </div>
          <h2 className="text-xl font-black text-gray-900">
            {mode === 'login' && 'Connexion Sécurisée AFRORESTO'}
            {mode === 'register' && (
              registerAccountType === 'driver' ? 'Création de Compte Livreur Partenaire' : 'Création de Compte Restaurant'
            )}
            {mode === 'forgot_password' && 'Mot de Passe Oublié'}
          </h2>
          <p className="text-xs text-gray-600">
            {mode === 'login' && 'Accédez à votre espace restaurant, caisse, cuisine ou courses'}
            {mode === 'register' && 'Rejoignez le réseau panafricain de restaurants et de livraison'}
            {mode === 'forgot_password' && 'Réinitialisez votre mot de passe par email sécurisé'}
          </p>
        </div>

        {/* Global Notifications / Errors */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* DRIVER REGISTRATION SUCCESS & PHYSICAL OFFICE NOTICE CARD */}
        {/* ========================================================= */}
        {driverRegistrationSuccess ? (
          <div className="space-y-4 text-left py-2">
            <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl text-slate-900 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-900 font-black text-sm">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span>Compte Livreur Enregistré avec Succès !</span>
              </div>

              <div className="p-3 bg-white/90 rounded-2xl border border-amber-200 text-xs text-slate-800 space-y-2">
                <p className="font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Étape Obligatoire : Rendez-vous au Bureau AFRORESTO</span>
                </p>
                <p className="text-[11px] leading-relaxed text-slate-700">
                  Votre compte a été créé avec le statut <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">En attente de vérification physique</span>. 
                  Pour des raisons strictes de sécurité et de confiance client, vous devez vous présenter au bureau AFRORESTO de votre ville (<strong>{driverCity}</strong>) avec les pièces suivantes :
                </p>
                <ul className="text-[11px] text-slate-700 list-disc list-inside space-y-1 font-medium pl-1">
                  <li>Original de votre pièce d'identité (<strong>CNI ou Passeport</strong>)</li>
                  <li>Carte grise / certificat d'immatriculation du véhicule (<strong>{vehiclePlate}</strong>)</li>
                  <li>Permis de conduire valide (si véhicule motorisé)</li>
                </ul>
              </div>

              {/* Office location reminder */}
              <div className="p-3 bg-slate-900 text-white rounded-2xl text-xs space-y-1">
                <p className="font-bold text-amber-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Adresse Bureau AFRORESTO — {driverCity} :</span>
                </p>
                <p className="text-[11px] text-slate-300">
                  {driverCity === 'Douala' && 'Rue Pau / Boulevard de la Liberté, Akwa (Face Hôtel Douala Bercy) — Tél: +237 653 18 43 07'}
                  {driverCity === 'Yaoundé' && 'Carrefour Bastos (Immeuble Le Balafon, 2e étage) — Tél: +237 653 18 43 07'}
                  {driverCity === 'Abidjan' && 'Cocody Angré 8ème Tranche, Résidence Palmier — Tél: +225 07 00 00 00 00'}
                  {!['Douala', 'Yaoundé', 'Abidjan'].includes(driverCity) && `Délégation Régionale AFRORESTO (${driverCity}) — Tél: +237 653 18 43 07`}
                </p>
                <p className="text-[10px] text-emerald-400 font-semibold pt-1">
                  ✅ Dès validation de vos documents par l'administrateur, votre compte sera immédiatement activé et vous recevrez les alertes de commandes en direct avec 80% de commission nette !
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  setCurrentView('driver');
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bike className="w-4 h-4 text-slate-950" />
                <span>Accéder à mon Espace Livreur</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="https://wa.me/237653184307?text=Bonjour%20AFRORESTO,%20je%20viens%20de%20créer%20mon%20compte%20livreur%20et%20souhaite%20prendre%20rendez-vous%20au%20bureau%20pour%20la%20vérification."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 text-center"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Contacter l'Agence AFRORESTO sur WhatsApp</span>
              </a>
            </div>
          </div>
        ) : null}

        {/* ========================================================= */}
        {/* MODE 1: LOGIN (SUPPORTS OWNER, STAFF, AND COURIER)         */}
        {/* ========================================================= */}
        {mode === 'login' && !driverRegistrationSuccess && (
          <>
            {/* Auth Tab Switcher */}
            <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('owner');
                  if (restaurants[0]?.ownerEmail) setEmail(restaurants[0].ownerEmail);
                  setPassword('');
                }}
                className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] ${
                  authTab === 'owner'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">Propriétaire</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('staff');
                  if (staff[0]?.email) setEmail(staff[0].email);
                  setPassword('');
                }}
                className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] ${
                  authTab === 'staff'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <KeyRound className="w-3 h-3 shrink-0" />
                <span className="truncate">Staff PIN</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('driver');
                  if (drivers.length > 0) setEmail(drivers[0].email || drivers[0].phone);
                  setPassword('');
                }}
                className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] ${
                  authTab === 'driver'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bike className="w-3 h-3 shrink-0" />
                <span className="truncate">Livreur</span>
              </button>
            </div>

            {/* Quick Picker for Demo / Quick login */}
            {authTab === 'driver' && drivers.length > 0 && (
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs space-y-1.5">
                <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                  Livreurs enregistrés ({drivers.length}) :
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {drivers.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleSelectAccount(d.email || d.phone, 'driver')}
                      className={`w-full p-2 rounded-xl font-bold text-[11px] text-left transition-colors flex items-center justify-between gap-2 cursor-pointer border ${
                        email.toLowerCase() === (d.email || d.phone).toLowerCase()
                          ? 'bg-amber-100 border-amber-300 text-amber-950'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Bike className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{d.name} ({d.vehicleType})</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        d.isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {d.isVerified ? 'Vérifié' : 'En attente bureau'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {authTab === 'owner' && restaurants.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                    Comptes Propriétaires :
                  </span>
                  <span className="text-[10px] text-slate-400">Cliquez pour pré-remplir</span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {restaurants.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectAccount(r.ownerEmail, 'owner')}
                      className={`w-full p-2 rounded-xl font-bold text-[11px] text-left transition-colors flex items-center justify-between gap-2 cursor-pointer border ${
                        email.toLowerCase() === r.ownerEmail.toLowerCase()
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img src={r.logo} alt={r.name} className="w-5 h-5 rounded-md object-cover border border-slate-200 shrink-0" />
                        <span className="truncate">{r.name}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold shrink-0">{r.ownerEmail}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-700">
                  {authTab === 'staff' && 'Identifiant ou Email Employé *'}
                  {authTab === 'owner' && 'Email du Restaurant *'}
                  {authTab === 'driver' && 'Email ou Téléphone Livreur *'}
                </label>
                <input
                  type={authTab === 'staff' ? 'text' : 'email'}
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={
                    authTab === 'staff' 
                      ? 'service@paradise.cm ou Danielle' 
                      : authTab === 'driver' 
                        ? 'coursier@afroresto.cm ou 653184307' 
                        : 'contact@votre-restaurant.cm'
                  }
                  className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-slate-800"
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="font-bold text-gray-700">
                    {authTab === 'staff' ? 'Code PIN de l\'employé (4 chiffres) *' : 'Mot de passe *'}
                  </label>
                  {authTab === 'owner' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative mt-1">
                  <input
                    ref={passwordInputRef}
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={authTab === 'staff' ? 'Code PIN à 4 chiffres' : '••••••••'}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-slate-900 pr-9"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{isLoading ? 'Vérification...' : 'Valider et Se Connecter'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {/* ========================================================= */}
        {/* MODE 2: REGISTER (RESTAURANT VS COURIER)                   */}
        {/* ========================================================= */}
        {mode === 'register' && !driverRegistrationSuccess && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            
            {/* Account Type Selector: Restaurant vs Courier */}
            <div>
              <label className="font-black text-slate-900 text-xs block mb-1.5">
                Quel type de compte souhaitez-vous créer ?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterAccountType('restaurant');
                    setErrorMsg(null);
                  }}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                    registerAccountType === 'restaurant'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Building2 className={`w-5 h-5 ${registerAccountType === 'restaurant' ? 'text-emerald-700' : 'text-slate-400'}`} />
                    {registerAccountType === 'restaurant' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    )}
                  </div>
                  <div>
                    <span className="font-black text-xs block">Compte Restaurant</span>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight block mt-0.5">
                      Gérant, menu QR, cuisine KDS & caisse
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRegisterAccountType('driver');
                    setErrorMsg(null);
                  }}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                    registerAccountType === 'driver'
                      ? 'border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Bike className={`w-5 h-5 ${registerAccountType === 'driver' ? 'text-amber-600' : 'text-slate-400'}`} />
                    {registerAccountType === 'driver' && (
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    )}
                  </div>
                  <div>
                    <span className="font-black text-xs block">Compte Livreur</span>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight block mt-0.5">
                      Courses en direct, 80% commission nette
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* MANDATORY NOTICE FOR COURIER */}
            {registerAccountType === 'driver' ? (
              <div className="p-3 bg-amber-500/10 border border-amber-300 rounded-2xl text-amber-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-black text-[11px] text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Vérification Physique Obligatoire en Agence :</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700">
                  Pour valider votre compte, vous devrez <strong>vous rendre physiquement au bureau AFRORESTO de votre ville</strong> avec votre <strong>CNI/Passeport original</strong> et la <strong>carte grise / matricule de votre véhicule</strong>. Une fois vos pièces vérifiées, l'administrateur confirmera votre profil et vous pourrez accepter les courses.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-emerald-900 flex items-start gap-2.5 text-[11px]">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Créez votre compte gérant pour configurer votre établissement, imprimer vos chevalets QR codes et recevoir les commandes de vos clients.
                </p>
              </div>
            )}

            {/* Common fields: Name & Email */}
            <div>
              <label className="font-bold text-gray-700">
                {registerAccountType === 'driver' ? 'Nom et prénom du livreur *' : 'Nom et prénom du responsable *'}
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={registerAccountType === 'driver' ? 'Ex: Paul Mbarga' : 'Ex: Alain Fokoua'}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-slate-900 pl-8"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700">Adresse email de connexion *</label>
              <div className="relative mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={registerAccountType === 'driver' ? 'paul.coursier@afroresto.cm' : 'gerant@mon-restaurant.cm'}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-slate-900 pl-8"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Courier specific fields */}
            {registerAccountType === 'driver' && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-gray-700">Téléphone (WhatsApp/MoMo) *</label>
                    <div className="relative mt-1">
                      <input
                        type="tel"
                        required
                        value={driverPhone}
                        onChange={e => setDriverPhone(e.target.value)}
                        placeholder="653 18 43 07"
                        className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold text-slate-900 pl-8"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700">N° CNI ou Passeport *</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        required
                        value={driverCni}
                        onChange={e => setDriverCni(e.target.value)}
                        placeholder="Ex: 108420958"
                        className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold text-slate-900 pl-8"
                      />
                      <FileText className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-gray-700">Ville d'activité *</label>
                    <select
                      value={driverCity}
                      onChange={e => setDriverCity(e.target.value)}
                      className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold text-slate-900 bg-white"
                    >
                      <option value="Douala">Douala (Cameroun)</option>
                      <option value="Yaoundé">Yaoundé (Cameroun)</option>
                      <option value="Bafoussam">Bafoussam (Cameroun)</option>
                      <option value="Garoua">Garoua (Cameroun)</option>
                      <option value="Kribi">Kribi (Cameroun)</option>
                      <option value="Abidjan">Abidjan (Côte d'Ivoire)</option>
                      <option value="Autre">Autre métropole</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700">Type de véhicule *</label>
                    <select
                      value={vehicleType}
                      onChange={e => setVehicleType(e.target.value as VehicleType)}
                      className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold text-slate-900 bg-white"
                    >
                      <option value="moto">🏍️ Moto</option>
                      <option value="scooter">🛵 Scooter</option>
                      <option value="velo">🚲 Vélo</option>
                      <option value="voiture">🚗 Voiture</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-gray-700">Immatriculation / Plaque *</label>
                    <input
                      type="text"
                      required
                      value={vehiclePlate}
                      onChange={e => setVehiclePlate(e.target.value)}
                      placeholder="Ex: LT-482-AB"
                      className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700">Quartiers / Secteurs</label>
                    <input
                      type="text"
                      value={driverZones}
                      onChange={e => setDriverZones(e.target.value)}
                      placeholder="Akwa, Bonanjo, Deido"
                      className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold text-slate-900"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password and confirmation */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-gray-700">Mot de passe *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 car."
                  className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700">Confirmation *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Identique"
                  className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 text-white font-black text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                registerAccountType === 'driver'
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {registerAccountType === 'driver' ? (
                <>
                  <Bike className="w-4 h-4 text-slate-950" />
                  <span>{isLoading ? 'Enregistrement en cours...' : 'Créer mon Compte Livreur Partenaire'}</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>{isLoading ? 'Création et envoi de l\'email...' : 'Créer mon Compte Restaurant'}</span>
                </>
              )}
            </button>

            {registerAccountType === 'restaurant' && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    setCurrentView('onboarding');
                  }}
                  className="text-[11px] text-slate-600 hover:text-emerald-700 font-bold underline cursor-pointer"
                >
                  Configurer plutôt un restaurant complet (Assistant Onboarding) &rarr;
                </button>
              </div>
            )}
          </form>
        )}

        {/* ========================================================= */}
        {/* MODE 3: FORGOT PASSWORD                                    */}
        {/* ========================================================= */}
        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 flex items-start gap-2.5 text-[11px]">
              <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Indiquez l'adresse email associée à votre compte restaurant ou livreur. Nous vous enverrons immédiatement un lien direct pour réinitialiser votre mot de passe en toute sécurité.
              </p>
            </div>

            <div>
              <label className="font-bold text-gray-700">Votre adresse email enregistrée *</label>
              <div className="relative mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="gerant@mon-restaurant.cm"
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-slate-900 pl-8"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>{isLoading ? 'Envoi en cours...' : 'Envoyer le Lien de Réinitialisation'}</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-slate-700 hover:text-slate-900 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour à la connexion</span>
              </button>
            </div>
          </form>
        )}

        {/* Bottom Switcher: Login / Register */}
        {!driverRegistrationSuccess && (
          <div className="text-center pt-2 border-t border-slate-100 text-xs text-gray-700">
            {mode === 'login' ? (
              <p>
                Pas encore de compte ?{' '}
                <button 
                  type="button" 
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }} 
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Créer un compte (Restaurant ou Livreur)
                </button>
              </p>
            ) : (
              mode !== 'forgot_password' && (
                <p>
                  Déjà un compte ?{' '}
                  <button 
                    type="button" 
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }} 
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Se connecter
                  </button>
                </p>
              )
            )}
          </div>
        )}

      </div>
    </div>
  );
};
