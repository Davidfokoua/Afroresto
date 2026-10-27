import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  EyeOff, 
  FileText, 
  Smartphone, 
  Utensils, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Download, 
  Printer, 
  Building2, 
  HelpCircle,
  Database,
  Key,
  Bike,
  CreditCard
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestoCamLogo } from '../common/RestoCamLogo';

export const PrivacyPolicy: React.FC = () => {
  const { setCurrentView } = useRestaurant();
  const [activeSection, setActiveSection] = useState<'all' | 'restaurateurs' | 'clients' | 'payments' | 'admin' | 'livreurs' | 'rights'>('all');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 print:bg-white print:p-0 print:text-black">
      {/* Top Breadcrumb Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-10 px-4 sm:px-6 lg:px-8 print:hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <button
                onClick={() => setCurrentView('landing')}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-400 mb-3 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à l'accueil</span>
              </button>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-black uppercase tracking-wider border border-emerald-500/30">
                  Document Officiel & Juridique
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Mis à jour : 2026
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
                Politique de Confidentialité & Protection des Données
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                Charte d'engagement pour les Restaurateurs, le Personnel en salle/cuisine, les Clients consommateurs et la Plateforme AFRORESTO Technologies.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-all shadow-sm"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Imprimer / PDF</span>
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mt-8 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveSection('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeSection === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Vue Complète (Toutes les Parties)
            </button>
            <button
              onClick={() => setActiveSection('restaurateurs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                activeSection === 'restaurateurs'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Pour les Restaurateurs</span>
            </button>
            <button
              onClick={() => setActiveSection('clients')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                activeSection === 'clients'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pour les Clients à Table (QR)</span>
            </button>
            <button
              onClick={() => setActiveSection('payments')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                activeSection === 'payments'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Paiements OM / MoMo</span>
            </button>
            <button
              onClick={() => setActiveSection('admin')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                activeSection === 'admin'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Secret Commercial Super Admin</span>
            </button>
            <button
              onClick={() => setActiveSection('livreurs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                activeSection === 'livreurs'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Livreurs & Commissions (80/20)</span>
            </button>
            <button
              onClick={() => setActiveSection('rights')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                activeSection === 'rights'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Vos Droits & Contact</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Executive Summary Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft-sm mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-900">
                Engagement Fondamental d'AFRORESTO
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                La plateforme SaaS <strong>AFRORESTO</strong> applique une politique stricte de confidentialité, de souveraineté des données et de secret des affaires pour les établissements en Afrique. Nous ne vendons, ne louons et ne transférons <strong>aucune donnée personnelle ou commerciale</strong> à des tiers publicitaires.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Isolation Multi-Tenant Étanchée</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zéro Traçage Publicitaire Intrusif</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>PIN & Soldes Mobile Money Inviolables</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Identification & Cadre Juridique */}
        {(activeSection === 'all') && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft-sm mb-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-slate-700" />
              <h3 className="text-base font-black text-slate-900">
                1. Identification de l'Éditeur & Cadre Juridique
              </h3>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              La plateforme <strong>AFRORESTO</strong> est conçue, exploitée et déployée à l'échelle panafricaine par :
            </p>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs space-y-1.5 text-slate-700">
              <p><strong>Entité éditrice :</strong> AFRORESTO Technologies</p>
              <p><strong>Présence & Hubs régionaux :</strong> Abidjan (Côte d'Ivoire), Dakar (Sénégal), Douala (Cameroun), Lagos (Nigeria)</p>
              <p><strong>Direction Générale :</strong> David Fokoua</p>
              <p><strong>Contact d'assistance :</strong> +237 653 18 43 07 (Support WhatsApp Panafricain) • contact@afroresto.com</p>
              <p><strong>Cadre légal :</strong> Conformité stricte avec les législations africaines et régionales relatives à la protection des données à caractère personnel, la cybersécurité et le commerce électronique.</p>
            </div>
          </section>
        )}

        {/* Section 2: Pour les Restaurateurs et le Personnel */}
        {(activeSection === 'all' || activeSection === 'restaurateurs') && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft-sm mb-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <Utensils className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-black text-slate-900">
                2. Données des Établissements & du Personnel (Restaurateurs)
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Dans le cadre de la création et de l'exploitation quotidienne de votre compte restaurant sur AFRORESTO, nous collectons et sécurisons les éléments suivants :
            </p>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-900 mb-1">A. Données de profil & configuration de l'établissement :</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <li>Nom de l'établissement, slogan, ville, quartier, numéro de téléphone WhatsApp de contact et email.</li>
                  <li>Logo et photos de présentation (téléchargés depuis votre appareil).</li>
                  <li>Architecture des tables et espaces (Terrasse, VIP, Salle, Rooftop, Bar).</li>
                  <li>Carte du menu : catégories, noms des plats/boissons, descriptions d'ingrédients, allergènes et prix fixés en FCFA.</li>
                </ul>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-900 mb-1">B. Données opérationnelles, stocks et ventes :</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <li>Fiches d'inventaire : quantités en stock, seuils d'alerte de rupture, fournisseurs et coûts d'achat unitaires.</li>
                  <li>Historique des commandes prises en salle, transmises en cuisine ou traitées au comptoir.</li>
                  <li>Totaux de caisse, modes de règlement choisis (Cash, Orange Money, MTN MoMo) et ventilation du chiffre d'affaires.</li>
                </ul>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-900 mb-1">C. Gestion du personnel et contrôle d'accès (RBAC) :</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                  <li>Noms, prénoms, rôles attribués (Gérant, Serveur, Chef Cuisinier, Caissier) et codes PIN / identifiants internes.</li>
                  <li>Journal d'activité opérationnel (horodatage des commandes servies et tickets encaissés).</li>
                </ul>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Propriété exclusive :</strong> L'ensemble des recettes, cartes, photos, listes de fournisseurs et historiques de chiffre d'affaires restent la <strong>propriété exclusive et inaliénable</strong> de votre établissement.
              </span>
            </div>
          </section>
        )}

        {/* Section 3: Pour les Clients Consommateurs à Table (QR Code) */}
        {(activeSection === 'all' || activeSection === 'clients') && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft-sm mb-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-black text-slate-900">
                3. Données des Clients Consommateurs (Commande via QR Code)
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pour offrir une expérience fluide, rapide et sans friction aux clients qui scannent un chevalet QR Code à table, AFRORESTO adopte le principe de <strong>minimisation absolue des données</strong> :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Données strictement collectées :</span>
                </div>
                <ul className="space-y-1.5 text-slate-600">
                  <li>• Numéro de table identifié automatiquement via le QR Code.</li>
                  <li>• Prénom ou nom facultatif (pour appeler le convive lors du service).</li>
                  <li>• Numéro de téléphone facultatif (uniquement pour recevoir le lien de suivi de commande ou initier le push USSD Mobile Money).</li>
                  <li>• Sélection d'articles, quantités et notes de cuisson ou allergies.</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <EyeOff className="w-4 h-4 text-rose-600" />
                  <span>Données JAMAIS collectées :</span>
                </div>
                <ul className="space-y-1.5 text-slate-600">
                  <li>• <strong>Aucune création obligatoire de compte</strong> ni mot de passe exigé pour commander son repas.</li>
                  <li>• <strong>Aucune géolocalisation GPS</strong> en arrière-plan.</li>
                  <li>• <strong>Aucun accès</strong> à votre carnet d'adresses, appareil photo ou galerie photo du smartphone.</li>
                  <li>• <strong>Aucun cookie tiers</strong> de reciblage commercial ou de régie publicitaire.</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Section 4: Transactions Financières & Mobile Money */}
        {(activeSection === 'all' || activeSection === 'payments') && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft-sm mb-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-black text-slate-900">
                4. Transactions Financières & Encaissements Mobile Money (OM / MoMo)
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              La plateforme permet la saisie et le suivi des encaissements par espèces, Orange Money et MTN Mobile Money :
            </p>

            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2.5 text-xs text-amber-950">
              <div className="flex items-center gap-2 font-black text-amber-900">
                <Lock className="w-4 h-4 text-amber-700" />
                <span>Sécurité et Confidentialité Bancaire & Télécom :</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                <li><strong>Code Secret PIN :</strong> AFRORESTO ne demande et ne conserve <strong>JAMAIS</strong> le code PIN secret Orange Money, MTN MoMo, Wave ou M-Pesa d'un client ou d'un restaurateur. La validation se fait sur le prompt sécurisé de l'opérateur télécom.</li>
                <li><strong>Traçabilité :</strong> Seuls le montant dans la devise choisie, l'identifiant de commande et le statut de confirmation du paiement sont enregistrés pour la comptabilité du restaurant.</li>
                <li><strong>Paiement des Abonnements SaaS :</strong> Les règlements d'abonnements AFRORESTO (Starter, Business, Premium) sont traités via canaux certifiés avec remise de reçu officiel.</li>
              </ul>
            </div>
          </section>
        )}

        {/* Section 5: Secret Commercial & Droits Super Admin */}
        {(activeSection === 'all' || activeSection === 'admin') && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft-sm mb-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <Lock className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-black text-slate-900">
                5. Cloisonnement Multi-Tenant & Politique d'Accès Super Admin
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Afin de préserver la compétitivité et le secret commercial de chaque établissement partenaire sur le territoire national :
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                <Database className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900">Étanchéité Totale entre Restaurants :</h4>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Les bases de données sont cloisonnées par identifiant unique de restaurant. Aucun restaurant concurrent ne peut consulter vos prix de revient, vos stocks ou votre chiffre d'affaires.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200/80 flex items-start gap-3 text-rose-950">
                <Key className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-rose-900">Limitation Stricte des Privilèges Super Admin :</h4>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">
                    L'administrateur central de la plateforme SaaS n'interfère pas dans la gestion opérationnelle privée d'un restaurant (commandes en direct, fiches de recettes de cuisine, ventes internes privées). Ses prérogatives sont strictement techniques et contractuelles : gestion des abonnements SaaS, support technique sur demande expresse, suspensions et suppressions de comptes.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section 6: Livreurs Partenaires : Statut, Contrôle Physique, Droits, Devoirs & Commission 80/20 */}
        {(activeSection === 'all' || activeSection === 'livreurs') && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-300 shadow-soft-sm mb-6 space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-amber-100">
              <Bike className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Livreurs Partenaires : Vérification en Bureau, Droits, Devoirs & Répartition (80% Livreur / 20% Plateforme)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cadre contractuel régissant l'activité de coursier indépendant, la tarification libre par le client et la sécurité des livraisons de repas.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              
              {/* 1. In-person physical office verification */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/90 space-y-2">
                <h4 className="font-black text-amber-950 flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>1. Obligation de Vérification Physique au Bureau AFRORESTO de la Ville</span>
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  L'inscription sur l'application ne confère pas automatiquement le statut de livreur actif. 
                  Afin de garantir l'intégrité sanitaire des repas et la sécurité des consommateurs, 
                  <strong> tout coursier doit obligatoirement se présenter en personne au bureau local AFRORESTO de sa ville de rattachement</strong> (Douala, Yaoundé, Abidjan ou délégation régionale) avant de pouvoir accepter une course.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-semibold text-[11px] text-amber-900">
                  <div className="p-2 bg-white rounded-xl border border-amber-200">
                    • CNI ou Passeport original en cours de validité
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-amber-200">
                    • Carte grise et certificat d'immatriculation du véhicule
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-amber-200">
                    • Permis de conduire conforme à la catégorie du véhicule
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 italic">
                  Seul un administrateur accrédité peut activer le compte coursier après audit physique des documents originaux.
                </p>
              </div>

              {/* 2. Delivery pricing set by customer: 300 to 1500 FCFA & 80/20 split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-black text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>2. Budget Fixé par le Client : 300 FCFA à 1 500 FCFA</span>
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Au sein de la même ville, <strong>le client a la pleine liberté de définir son budget pour la livraison</strong>, compris entre <strong>300 FCFA et 1 500 FCFA</strong>. Ce mécanisme d'enchère vertueuse incite les livreurs les plus proches et les plus rapides à accepter prioritairement les commandes rémunératrices.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                  <h4 className="font-black text-emerald-950 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span>3. Répartition Financière : 80% Livreur / 20% Plateforme</span>
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    Sur chaque commission de livraison payée par le client :
                    <br />
                    • <strong>20% sont prélevés par la plateforme AFRORESTO</strong> (frais de service, serveurs, SMS et support technique).
                    <br />
                    • <strong>80% nets sont directement reversés sur le compte du livreur partenaire</strong>. Les pourboires remis par les clients appartiennent à 100% au livreur.
                  </p>
                </div>
              </div>

              {/* 3. Rights and Duties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-black text-slate-900">4. Devoirs & Responsabilités du Livreur</h4>
                  <ul className="text-slate-600 space-y-1.5 list-disc list-inside">
                    <li>Acheminer les commandes avec diligence et précaution sans altérer les emballages.</li>
                    <li>Conserver les plats chauds ou froids dans des sacs isothermes adaptés.</li>
                    <li>
                      <strong>Confidentialité stricte :</strong> les coordonnées des clients (adresse, téléphone) ne doivent en aucun cas être enregistrées, partagées ou réutilisées après la finalisation de la livraison.
                    </li>
                    <li>Respecter les règles du code de la route et porter un équipement de protection (casque homologué).</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-black text-slate-900">5. Droits & Protection du Livreur</h4>
                  <ul className="text-slate-600 space-y-1.5 list-disc list-inside">
                    <li><strong>Libre déconnexion :</strong> le coursier choisit librement ses créneaux de disponibilité et ses zones de travail.</li>
                    <li><strong>Transparence totale :</strong> visibilité préalable du montant de la course et des adresses avant toute acceptation.</li>
                    <li>Paiement garanti de la rémunération nette (80%) pour chaque course effectivement livrée.</li>
                    <li>Support réactif en direct avec l'administration AFRORESTO en cas d'incident client ou restaurant.</li>
                  </ul>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* Section 6: Hébergement, Sécurité & Droits des Utilisateurs */}
        {(activeSection === 'all' || activeSection === 'rights') && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft-sm mb-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-black text-slate-900">
                6. Sécurité des Systèmes, Durée de Conservation & Exercice de Vos Droits
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <h4 className="font-bold text-slate-900">Chiffrement & SSL</h4>
                <p className="text-slate-600 leading-relaxed">
                  Toutes les communications entre les terminaux (smartphones des clients, tablettes de cuisine, ordinateurs de caisse) et nos serveurs sont protégées par chiffrement fort HTTPS / TLS.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <h4 className="font-bold text-slate-900">Conservation des Données & Persistance Cloud</h4>
                <p className="text-slate-600 leading-relaxed">
                  L'ensemble des données de votre établissement (inventaires, statistiques d'activité, historiques complets de vente et d'achat) est sauvegardé de manière permanente et synchronisé dans la base de données cloud de votre compte. Ces données restent accessibles à chaque reconnexion et ne sont jamais purgées automatiquement : elles ne disparaissent que si l'utilisateur décide de les supprimer manuellement.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <h4 className="font-bold text-slate-900">Droit à l'Oubli & Suppression</h4>
                <p className="text-slate-600 leading-relaxed">
                  Tout restaurateur ou client peut exiger la rectification ou la suppression définitive de ses données sur simple demande écrite auprès de notre délégué à la protection des données.
                </p>
              </div>
            </div>

            {/* Contact Box */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-sm text-white">
                  Besoin d'une assistance ou d'exercer vos droits sur vos données ?
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Notre équipe technique et juridique vous répond sous 24h ouvrées.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://wa.me/237653184307"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Support WhatsApp Afrique</span>
                </a>
                <a
                  href="mailto:contact@afroresto.com"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>contact@afroresto.com</span>
                </a>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
