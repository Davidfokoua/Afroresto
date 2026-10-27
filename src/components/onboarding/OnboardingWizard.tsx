import React, { useState } from 'react';
import { 
  Building2, 
  Utensils, 
  Plus, 
  Layers, 
  Grid3X3, 
  QrCode, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Trash2, 
  Sparkles, 
  ExternalLink,
  Store,
  ChefHat,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { PlanType } from '../../types';
import { formatFCFA } from '../../utils/formatters';
import { BackDotButton } from '../layout/BackDotButton';
import { DeviceImageUploader } from '../common/DeviceImageUploader';

const AFRICAN_COUNTRIES = [
  { name: "Côte d'Ivoire", code: '+225', currency: 'FCFA', defaultCity: 'Abidjan', defaultRegion: 'Lagunes' },
  { name: 'Sénégal', code: '+221', currency: 'FCFA', defaultCity: 'Dakar', defaultRegion: 'Dakar' },
  { name: 'Cameroun', code: '+237', currency: 'FCFA', defaultCity: 'Douala', defaultRegion: 'Littoral' },
  { name: 'Nigeria', code: '+234', currency: 'NGN', defaultCity: 'Lagos', defaultRegion: 'Lagos' },
  { name: 'Ghana', code: '+233', currency: 'GHS', defaultCity: 'Accra', defaultRegion: 'Greater Accra' },
  { name: 'République Démocratique du Congo', code: '+243', currency: 'USD', defaultCity: 'Kinshasa', defaultRegion: 'Kinshasa' },
  { name: 'Gabon', code: '+241', currency: 'FCFA', defaultCity: 'Libreville', defaultRegion: 'Estuaire' },
  { name: 'Bénin', code: '+229', currency: 'FCFA', defaultCity: 'Cotonou', defaultRegion: 'Littoral' },
  { name: 'Togo', code: '+228', currency: 'FCFA', defaultCity: 'Lomé', defaultRegion: 'Maritime' },
  { name: 'Mali', code: '+223', currency: 'FCFA', defaultCity: 'Bamako', defaultRegion: 'Bamako' },
  { name: 'Guinée', code: '+224', currency: 'GNF', defaultCity: 'Conakry', defaultRegion: 'Conakry' },
  { name: 'Kenya', code: '+254', currency: 'KES', defaultCity: 'Nairobi', defaultRegion: 'Nairobi' },
  { name: 'Rwanda', code: '+250', currency: 'RWF', defaultCity: 'Kigali', defaultRegion: 'Kigali' },
  { name: 'Burkina Faso', code: '+226', currency: 'FCFA', defaultCity: 'Ouagadougou', defaultRegion: 'Centre' },
  { name: 'Autre pays d\'Afrique', code: '+', currency: 'FCFA', defaultCity: '', defaultRegion: '' },
];

export const OnboardingWizard: React.FC = () => {
  const { registerNewRestaurant, setCurrentView, setActiveCustomerTableId, tables, plans } = useRestaurant();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('business');

  // Step 1 State - Clean starting state for real restaurant creation
  const [formData, setFormData] = useState({
    name: '',
    restaurantType: 'Restaurant & Grillades',
    ownerName: '',
    ownerEmail: '',
    password: '',
    phone: '+225 ',
    address: '',
    city: 'Abidjan',
    region: 'Lagunes',
    country: "Côte d'Ivoire",
    description: '',
    logo: '/logo.svg',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
  });

  // Step 2 State (Categories)
  const [categories, setCategories] = useState<string[]>([
    'Plats Chauds',
    'Grillades & Braisés',
    'Boissons & Jus Frais',
  ]);
  const [newCatInput, setNewCatInput] = useState('');

  // Step 3 State (Sample Dishes)
  const [products, setProducts] = useState<{ name: string; category: string; price: number; prepTime: number; desc: string; image: string }[]>([]);
  const [newProd, setNewProd] = useState({ name: '', category: 'Plats Chauds', price: 3000, prepTime: 20, desc: '', image: '' });

  // Step 4 State (Areas)
  const [areas, setAreas] = useState<string[]>([
    'Salle Principale',
    'Terrasse',
  ]);
  const [newAreaInput, setNewAreaInput] = useState('');

  // Step 5 State (Tables)
  const [wizardTables, setWizardTables] = useState([
    { number: '01', area: 'Salle Principale', capacity: 4 },
    { number: '02', area: 'Salle Principale', capacity: 4 },
    { number: '03', area: 'Terrasse', capacity: 2 },
  ]);

  const totalSteps = 7;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  const handleAddCategory = () => {
    if (newCatInput.trim()) {
      setCategories([...categories, newCatInput.trim()]);
      setNewCatInput('');
    }
  };

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleAddProduct = () => {
    if (newProd.name.trim()) {
      setProducts([...products, { ...newProd }]);
      setNewProd({ name: '', category: categories[0] || 'Plats', price: 3500, prepTime: 15, desc: '', image: '' });
    }
  };

  const handleAddArea = () => {
    if (newAreaInput.trim()) {
      setAreas([...areas, newAreaInput.trim()]);
      setNewAreaInput('');
    }
  };

  const handleFinishOnboarding = () => {
    // Register to context with custom onboarding data
    registerNewRestaurant(
      {
        name: formData.name,
        restaurantType: formData.restaurantType,
        address: formData.address,
        city: formData.city,
        region: formData.region,
        country: formData.country,
        description: formData.description,
        phone: formData.phone,
        logo: formData.logo,
        coverImage: formData.coverImage,
        subscriptionPlan: selectedPlan,
      },
      formData.ownerName,
      formData.ownerEmail,
      formData.password,
      {
        categories,
        products,
        areas,
        tables: wizardTables,
      }
    );
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Progress Bar & Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <BackDotButton variant="inline" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Onboarding Restaurant</span>
                <h1 className="text-xl font-extrabold text-slate-900">Configuration de votre espace AFRORESTO</h1>
              </div>
            </div>
            <div className="sm:text-right">
              <span className="text-sm font-bold text-slate-900">Étape {currentStep} / {totalSteps}</span>
              <p className="text-xs text-slate-500">{progressPercent}% complété</p>
            </div>
          </div>

          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs">
          
          {/* STEP 1: INFORMATIONS DU RESTAURANT */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Étape 1 : Informations Générales</h2>
                  <p className="text-xs text-gray-700">Renseignez les coordonnées de votre établissement en Afrique.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-gray-700">Nom du Restaurant *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    placeholder="Ex: Le Grill Panafricain"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700">Type d'Établissement</label>
                  <input
                    type="text"
                    value={formData.restaurantType}
                    onChange={e => setFormData({ ...formData, restaurantType: e.target.value })}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    placeholder="Ex: Restaurant, Lounge, Grillades, Maquis"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700">Nom du Propriétaire / Gérant *</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700">Pays d'Implantation *</label>
                  <select
                    value={formData.country}
                    onChange={e => {
                      const selected = AFRICAN_COUNTRIES.find(c => c.name === e.target.value);
                      setFormData({ 
                        ...formData, 
                        country: e.target.value,
                        phone: selected ? `${selected.code} ` : formData.phone,
                        city: selected?.defaultCity || formData.city,
                        region: selected?.defaultRegion || formData.region,
                      });
                    }}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                  >
                    {AFRICAN_COUNTRIES.map(c => (
                      <option key={c.name} value={c.name}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700">Numéro de Téléphone (WhatsApp) *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    placeholder="Numéro WhatsApp avec indicatif"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700">Email Administratif *</label>
                  <input
                    type="email"
                    required
                    value={formData.ownerEmail}
                    onChange={e => setFormData({ ...formData, ownerEmail: e.target.value })}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700">Mot de Passe Administrateur *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    placeholder="Pour vous connecter sur mobile et PC"
                  />
                  <p className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                    <span>✉️</span>
                    <span>Un email de vérification vous sera automatiquement envoyé à l'adresse ci-dessus.</span>
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-gray-700">Ville & Région</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <input
                      type="text"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      placeholder="Ville"
                    />
                    <input
                      type="text"
                      value={formData.region}
                      onChange={e => setFormData({ ...formData, region: e.target.value })}
                      className="p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      placeholder="Région"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-gray-700">Adresse / Quartier</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="Ex: Boulevard de la Liberté, Akwa"
                  />
                </div>

                <div>
                  <DeviceImageUploader
                    value={formData.logo}
                    onChange={(newLogo) => setFormData({ ...formData, logo: newLogo })}
                    label="Logo de votre Restaurant"
                    helperText="Chargez votre logo depuis votre téléphone ou ordinateur"
                    aspectRatio="square"
                    showPresets={false}
                  />
                </div>

                <div>
                  <DeviceImageUploader
                    value={formData.coverImage}
                    onChange={(newCover) => setFormData({ ...formData, coverImage: newCover })}
                    label="Photo de Couverture / Salle"
                    helperText="Chargez une belle photo pour l'en-tête de votre menu"
                    aspectRatio="wide"
                    showPresets={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MENU CATEGORIES */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Étape 2 : Catégories du Menu</h2>
                  <p className="text-xs text-gray-700">Définissez la structure de votre carte (Entrées, Plats, Grillades, Boissons...).</p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Ajouter une catégorie (ex: Cocktails, Poissons braisés...)"
                  className="flex-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {categories.map((cat, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800">{cat}</span>
                    <button
                      onClick={() => handleRemoveCategory(idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: ADD STARTER PRODUCTS */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Étape 3 : Vos Premiers Produits</h2>
                  <p className="text-xs text-gray-700">Ajoutez quelques plats ou boissons avec leur prix en FCFA.</p>
                </div>
              </div>

              {/* Add form */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 text-xs">
                <h3 className="font-bold text-gray-900">Ajouter un article</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="font-medium text-gray-700">Nom du plat / boisson</label>
                    <input
                      type="text"
                      value={newProd.name}
                      onChange={e => setNewProd({ ...newProd, name: e.target.value })}
                      placeholder="Ex: Ndolè Royal aux Crevettes"
                      className="w-full mt-1 p-2 rounded-lg border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Prix (FCFA)</label>
                    <input
                      type="number"
                      value={newProd.price}
                      onChange={e => setNewProd({ ...newProd, price: Number(e.target.value) })}
                      className="w-full mt-1 p-2 rounded-lg border border-gray-300"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <DeviceImageUploader
                    value={newProd.image}
                    onChange={(newImg) => setNewProd({ ...newProd, image: newImg })}
                    label="Photo du plat"
                    helperText="Chargez la photo du plat depuis votre appareil"
                    aspectRatio="video"
                    showPresets={true}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleAddProduct}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 text-xs shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter ce plat
                  </button>
                </div>
              </div>

              {/* Products list */}
              <div className="space-y-2">
                {products.map((p, i) => (
                  <div key={i} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900">{p.name}</p>
                        <p className="text-[11px] text-gray-700">{p.category} • ~{p.prepTime} min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-emerald-700">{formatFCFA(p.price)}</span>
                      <button onClick={() => setProducts(products.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: AREAS */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Étape 4 : Espaces de Restauration</h2>
                  <p className="text-xs text-gray-700">Créez les zones de votre restaurant (Terrasse, Salle VIP, Bar...).</p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAreaInput}
                  onChange={e => setNewAreaInput(e.target.value)}
                  placeholder="Nouvel espace (ex: Rooftop, Jardin...)"
                  className="flex-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  onClick={handleAddArea}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {areas.map((ar, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800">{ar}</span>
                    <button
                      onClick={() => setAreas(areas.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: TABLES */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Grid3X3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Étape 5 : Création des Tables</h2>
                  <p className="text-xs text-gray-700">Attribuez des numéros et capacités pour chaque espace.</p>
                </div>
              </div>

              <div className="space-y-2">
                {wizardTables.map((tbl, i) => (
                  <div key={i} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                        {tbl.number}
                      </span>
                      <div>
                        <p className="font-bold text-gray-900">Table {tbl.number}</p>
                        <p className="text-[11px] text-gray-700">{tbl.area} • {tbl.capacity} places</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      QR prêt
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: SUBSCRIPTION PLAN */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Étape 6 : Choisissez votre Forfait AFRORESTO</h2>
                  <p className="text-xs text-gray-600">Tarifs clairs et transparents • Sans engagement.</p>
                </div>
              </div>

              {/* Special Launch Offer Alert */}
              <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-300 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-sm mt-0.5">
                  🎁
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">
                    Offre Spéciale de Lancement Panafricaine : 100% des Fonctions PREMIUM Débloquées !
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                    Même si vous choisissez le forfait <strong>STARTER</strong>, vous profitez immédiatement de tous les avantages du forfait <strong>PREMIUM offerts</strong> (tables illimitées, KDS cuisine, stocks, multi-espaces et statistiques complètes) pendant vos premiers mois pour fidéliser vos clients dès le premier jour.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {plans.map(plan => {
                  const isSelected = selectedPlan === plan.id;
                  const isStarter = plan.id === 'starter';

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id as PlanType)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-gray-900">{plan.name}</span>
                          {isStarter ? (
                            <span className="text-[9px] font-black bg-gradient-to-r from-amber-500 to-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                              Boost Premium Offert
                            </span>
                          ) : plan.isPopular ? (
                            <span className="text-[9px] font-extrabold bg-amber-400 text-gray-950 px-1.5 py-0.5 rounded-full">
                              Populaire
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2">
                          <p className="text-xl font-black text-slate-900">{formatFCFA(plan.priceMonthly)}</p>
                          <p className="text-[10px] text-slate-500 font-medium">/ mois (OM, MoMo)</p>
                        </div>

                        <p className="text-[11px] text-slate-600 mt-2 font-medium leading-relaxed">{plan.tagline}</p>

                        <ul className="mt-3 space-y-1.5 text-[11px] border-t border-slate-100 pt-2.5">
                          {plan.features.slice(0, 4).map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-slate-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? '✓ Plan Sélectionné' : 'Choisir ce plan'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 7: READY TO SERVE */}
          {currentStep === 7 && (
            <div className="text-center py-6 space-y-6 animate-in zoom-in-95 duration-400">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600 animate-spin" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Félicitations !</span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
                  {formData.name} est prêt !
                </h2>
                <p className="text-xs text-gray-600 max-w-lg mx-auto mt-2">
                  Votre menu digital, vos espaces, vos QR codes et votre abonnement <strong className="text-emerald-700 uppercase">Plan {selectedPlan}</strong> sont prêts.
                </p>
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs max-w-md mx-auto flex items-center justify-center gap-2">
                  <span>✉️</span>
                  <span>Un <strong>email de vérification</strong> a été expédié à <strong>{formData.ownerEmail}</strong>.</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  id="onboarding-finish-dashboard-btn"
                  onClick={handleFinishOnboarding}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  <Store className="w-4 h-4" />
                  Accéder à mon Tableau de Bord
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 7 && (
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
              <button
                disabled={currentStep === 1}
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                  currentStep === 1 ? 'opacity-40 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Précédent
              </button>

              <button
                onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
                className="px-5 sm:px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
              >
                {currentStep === 6 ? 'Confirmer & Finaliser' : 'Suivant'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
