import React, { useState } from 'react';
import { 
  Utensils, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Flame, 
  Clock, 
  Sparkles, 
  Image as ImageIcon,
  ExternalLink,
  Layers,
  CheckCircle2,
  Globe,
  QrCode
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem, MenuCategory } from '../../types';
import { formatFCFA } from '../../utils/formatters';
import { DeviceImageUploader } from '../common/DeviceImageUploader';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

export const MenuManager: React.FC = () => {
  const { 
    categories, 
    menuItems, 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem, 
    addCategory, 
    deleteCategory,
    setCurrentView,
    tables,
    setActiveCustomerTableId
  } = useRestaurant();

  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    itemType: 'menu_item' | 'category';
    id: string;
    name: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    itemType: 'menu_item',
    id: '',
    name: '',
    isDeleting: false,
  });

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'local'>('all');
  const [productForm, setProductForm] = useState<Partial<MenuItem>>({
    name: '',
    categoryId: categories[0]?.id || '',
    price: 3500,
    description: '',
    image: '',
    preparationTime: 20,
    available: true,
    isSpicy: false,
    badge: '',
    visibility: 'public',
  });

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const filteredItems = menuItems.filter(item => {
    const matchesCat = selectedCatFilter === 'all' || item.categoryId === selectedCatFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVisibility = visibilityFilter === 'all' || 
      (visibilityFilter === 'local' ? item.visibility === 'local' : item.visibility !== 'local');
    return matchesCat && matchesSearch && matchesVisibility;
  });

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      categoryId: categories[0]?.id || '',
      price: 4000,
      description: '',
      image: '',
      preparationTime: 20,
      available: true,
      isSpicy: false,
      badge: '',
      visibility: 'public',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (item: MenuItem) => {
    setEditingProduct(item);
    setProductForm({ 
      ...item,
      visibility: item.visibility || 'public'
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.categoryId) return;

    const payload = {
      ...productForm,
      visibility: productForm.visibility || 'public',
    };

    if (editingProduct) {
      updateMenuItem(editingProduct.id, payload);
      setSuccessToast(`Plat « ${productForm.name} » mis à jour.`);
    } else {
      addMenuItem({
        categoryId: productForm.categoryId,
        name: productForm.name,
        description: productForm.description || '',
        price: Number(productForm.price),
        image: productForm.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
        available: productForm.available ?? true,
        preparationTime: Number(productForm.preparationTime) || 15,
        isSpicy: productForm.isSpicy,
        badge: productForm.badge,
        visibility: productForm.visibility || 'public',
      });
      setSuccessToast(`Nouveau plat « ${productForm.name} » ajouté (${productForm.visibility === 'local' ? 'Local sur place' : 'Public en ligne'}).`);
    }

    setTimeout(() => setSuccessToast(null), 3500);
    setIsProductModalOpen(false);
  };

  const handleToggleAvailability = (item: MenuItem) => {
    updateMenuItem(item.id, { available: !item.available });
  };

  const handleToggleVisibility = (item: MenuItem) => {
    const nextVis = item.visibility === 'local' ? 'public' : 'local';
    updateMenuItem(item.id, { visibility: nextVis });
    setSuccessToast(
      nextVis === 'public'
        ? `Plat « ${item.name} » rendu PUBLIC (visible en ligne & au menu QR).`
        : `Plat « ${item.name} » passé en LOCAL (visible uniquement au scan QR sur place).`
    );
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setNewCategoryName('');
    setIsCategoryModalOpen(false);
    setSuccessToast(`Nouvelle catégorie "${newCategoryName.trim()}" créée.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleExecuteDelete = async () => {
    if (!deleteModalConfig.id) return;
    setDeleteModalConfig(prev => ({ ...prev, isDeleting: true }));
    try {
      if (deleteModalConfig.itemType === 'menu_item') {
        await deleteMenuItem(deleteModalConfig.id);
        setSuccessToast(`Plat « ${deleteModalConfig.name} » définitivement supprimé.`);
      } else if (deleteModalConfig.itemType === 'category') {
        await deleteCategory(deleteModalConfig.id);
        if (selectedCatFilter === deleteModalConfig.id) {
          setSelectedCatFilter('all');
        }
        setSuccessToast(`Catégorie « ${deleteModalConfig.name} » supprimée.`);
      }
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error('Delete menu item/category error:', err);
    } finally {
      setDeleteModalConfig({
        isOpen: false,
        itemType: 'menu_item',
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
            <h1 className="text-xl font-extrabold text-gray-900">Menu & Carte Digitale</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {menuItems.length} plats
            </span>
          </div>
          <p className="text-xs text-gray-700 mt-0.5">Gérez vos catégories, plats, prix en FCFA et disponibilités en temps réel.</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            + Catégorie
          </button>

          <button
            id="menu-add-product-btn"
            onClick={handleOpenNewProduct}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un Plat
          </button>

          <button
            onClick={() => {
              if (tables.length > 0) setActiveCustomerTableId(tables[0].id);
              setCurrentView('customer_qr');
            }}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Aperçu Client
          </button>
        </div>
      </div>

      {/* Category & Visibility Filter Pills */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
        
        {/* Visibility Scope Filter (Public vs Local) */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Visibilité du Menu :</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setVisibilityFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                visibilityFilter === 'all'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({menuItems.length})
            </button>
            <button
              onClick={() => setVisibilityFilter('public')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                visibilityFilter === 'public'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌐 Publics en Ligne ({menuItems.filter(i => i.visibility !== 'local').length})</span>
            </button>
            <button
              onClick={() => setVisibilityFilter('local')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                visibilityFilter === 'local'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>📍 Locaux sur place ({menuItems.filter(i => i.visibility === 'local').length})</span>
            </button>
          </div>
        </div>

        {/* Categories and search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Horizontal Category filter */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedCatFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCatFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Toutes les catégories ({menuItems.length})
            </button>
            {categories.map(cat => {
              const count = menuItems.filter(m => m.categoryId === cat.id).length;
              const isSelected = selectedCatFilter === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCatFilter(cat.id)}
                    className="font-semibold"
                  >
                    {cat.name} ({count})
                  </button>
                  {categories.length > 1 && (
                    <button
                      type="button"
                      title={`Supprimer la catégorie ${cat.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModalConfig({
                          isOpen: true,
                          itemType: 'category',
                          id: cat.id,
                          name: cat.name,
                          isDeleting: false,
                        });
                      }}
                      className={`ml-1 p-0.5 rounded-md transition-colors ${
                        isSelected ? 'text-emerald-100 hover:text-white hover:bg-emerald-700' : 'text-gray-400 hover:text-rose-600'
                      }`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un plat..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Dishes Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-8 sm:p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
            <Utensils className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Aucun plat dans cette catégorie</h3>
            <p className="text-xs text-gray-500 mt-1">Ajoutez vos créations culinaires et boissons pour enrichir votre carte en FCFA.</p>
          </div>
          <button
            onClick={handleOpenNewProduct}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un plat</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
          const category = categories.find(c => c.id === item.categoryId);

          return (
            <div 
              key={item.id}
              className={`bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col justify-between transition-all ${
                !item.available ? 'opacity-70 bg-gray-50' : ''
              }`}
            >
              <div>
                {/* Image Header */}
                <div className="relative h-40 bg-gray-100 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  
                  {/* Visibility Scope Pill (Clickable to quickly switch) */}
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(item)}
                    title="Cliquer pour basculer la visibilité (Public / Local)"
                    className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-black shadow-md flex items-center gap-1 transition-transform active:scale-95 cursor-pointer ${
                      item.visibility === 'local'
                        ? 'bg-emerald-600 text-white border border-emerald-700'
                        : 'bg-slate-950/85 backdrop-blur-md text-white border border-white/20'
                    }`}
                  >
                    {item.visibility === 'local' ? (
                      <>
                        <QrCode className="w-3 h-3 text-amber-300" />
                        <span>📍 Local (QR)</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3 h-3 text-emerald-400" />
                        <span>🌐 Public</span>
                      </>
                    )}
                  </button>

                  {item.badge && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-amber-500 text-gray-950 font-black text-[10px] rounded-md shadow-xs">
                      {item.badge}
                    </span>
                  )}

                  {/* Availability Badge */}
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs transition-colors ${
                      item.available 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-rose-600 text-white hover:bg-rose-700'
                    }`}
                  >
                    {item.available ? 'En Stock' : 'Épuisé'}
                  </button>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        {category?.name || 'Catégorie'}
                      </span>
                      <h3 className="text-sm font-extrabold text-gray-900">{item.name}</h3>
                    </div>
                    <span className="text-sm font-black text-emerald-800 shrink-0">
                      {formatFCFA(item.price)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">{item.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-gray-700 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" /> ~{item.preparationTime} min
                    </span>
                    {item.isSpicy && (
                      <span className="flex items-center gap-1 text-rose-600 font-semibold">
                        <Flame className="w-3.5 h-3.5" /> Épicé
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleAvailability(item)}
                  className="text-xs text-gray-700 font-medium hover:text-gray-900"
                >
                  {item.available ? 'Marquer épuisé' : 'Remettre en stock'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditProduct(item)}
                    title="Modifier le plat"
                    className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-emerald-700 hover:border-emerald-500 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteModalConfig({
                        isOpen: true,
                        itemType: 'menu_item',
                        id: item.id,
                        name: item.name,
                        isDeleting: false,
                      });
                    }}
                    title="Supprimer ce plat"
                    className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-rose-600 hover:border-rose-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
      )}

      {/* Product Add / Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-extrabold text-gray-900">
                {editingProduct ? 'Modifier le plat' : 'Ajouter un nouveau plat au menu'}
              </h2>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700">Nom du plat / boisson *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ex: Poulet DG Royal"
                  className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700">Catégorie *</label>
                  <select
                    value={productForm.categoryId}
                    onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs font-medium"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700">Prix (FCFA) *</label>
                  <input
                    type="number"
                    required
                    min={100}
                    step={100}
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">Description des ingrédients</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Ex: Poulet sauté avec plantains mûrs, carottes, haricots verts et poivrons..."
                  className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700">Temps de prépa (min)</label>
                  <input
                    type="number"
                    value={productForm.preparationTime}
                    onChange={e => setProductForm({ ...productForm, preparationTime: Number(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700">Badge spécial (facultatif)</label>
                  <input
                    type="text"
                    value={productForm.badge || ''}
                    onChange={e => setProductForm({ ...productForm, badge: e.target.value })}
                    placeholder="Ex: Spécialité, Coup de cœur"
                    className="w-full mt-1 p-2.5 rounded-xl border border-gray-300 text-xs"
                  />
                </div>
              </div>

              <DeviceImageUploader
                value={productForm.image || ''}
                onChange={(newImg) => setProductForm({ ...productForm, image: newImg })}
                label="Photo du plat"
                helperText="Prenez une photo en direct ou choisissez une image depuis votre galerie / ordinateur"
                aspectRatio="video"
                showPresets={true}
              />

              {/* Visibilité du Plat : Public (En ligne Meituan + QR) vs Local (Sur place QR uniquement) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Visibilité du Plat *</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Où rendre ce plat disponible ?</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Option 1: Public (En ligne & Menu QR) */}
                  <button
                    type="button"
                    onClick={() => setProductForm({ ...productForm, visibility: 'public' })}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      productForm.visibility !== 'local'
                        ? 'bg-amber-50 border-amber-500 text-slate-950 font-bold ring-2 ring-amber-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="font-black text-xs text-slate-900">🌐 Public (En Ligne & QR)</span>
                      </div>
                      {productForm.visibility !== 'local' && (
                        <Check className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal leading-tight">
                      Visible par tous sur le Centre de commande en ligne (Hub Meituan) et au scan du QR code.
                    </p>
                  </button>

                  {/* Option 2: Local (Sur place QR uniquement) */}
                  <button
                    type="button"
                    onClick={() => setProductForm({ ...productForm, visibility: 'local' })}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      productForm.visibility === 'local'
                        ? 'bg-emerald-50 border-emerald-600 text-slate-950 font-bold ring-2 ring-emerald-500/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-black text-xs text-slate-900">📍 Local (Scan QR Uniquement)</span>
                      </div>
                      {productForm.visibility === 'local' && (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal leading-tight">
                      Exclusif sur place : visible uniquement lorsqu'un client scanne le QR code du restaurant.
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={productForm.isSpicy}
                    onChange={e => setProductForm({ ...productForm, isSpicy: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Plat Épicé (Pimenté)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={productForm.available}
                    onChange={e => setProductForm({ ...productForm, available: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Disponible immédiatement</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                >
                  {editingProduct ? 'Enregistrer les modifications' : 'Ajouter au Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Creation Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-extrabold text-gray-900">Nouvelle Catégorie</h3>
            
            <div>
              <label className="text-xs font-bold text-gray-700">Nom de la catégorie</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Ex: Grillades au Charbon"
                className="w-full mt-1.5 p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-700 hover:bg-gray-100 font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateCategory}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title={deleteModalConfig.itemType === 'menu_item' ? 'Supprimer le plat' : 'Supprimer la catégorie'}
        itemName={deleteModalConfig.name}
        itemType={deleteModalConfig.itemType === 'menu_item' ? 'ce plat' : 'cette catégorie'}
        warningMessage={
          deleteModalConfig.itemType === 'menu_item'
            ? 'Ce plat sera définitivement retiré de la carte du restaurant et du menu QR code des clients.'
            : 'Tous les plats liés à cette catégorie seront automatiquement déplacés vers une autre catégorie disponible.'
        }
        isDeleting={deleteModalConfig.isDeleting}
      />

    </div>
  );
};
