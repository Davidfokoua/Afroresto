import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Trash2, 
  Camera, 
  RefreshCw, 
  Sparkles, 
  Link as LinkIcon,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';
import { fileToOptimizedDataUrl, DISH_PRESET_IMAGES } from '../../utils/imageUtils';

interface DeviceImageUploaderProps {
  value: string;
  onChange: (dataUrlOrUrl: string) => void;
  label?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
  showPresets?: boolean;
}

export const DeviceImageUploader: React.FC<DeviceImageUploaderProps> = ({
  value,
  onChange,
  label = "Photo du plat",
  helperText = "Téléversez depuis votre téléphone (Galerie / Caméra) ou votre PC (PNG, JPG, WebP)",
  aspectRatio = 'video',
  showPresets = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [showPresetsTab, setShowPresetsTab] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ sizeKb?: number; dimensions?: string } | null>(null);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const { dataUrl, sizeKb, width, height } = await fileToOptimizedDataUrl(file, 900, 900, 0.82);
      onChange(dataUrl);
      setFileDetails({ sizeKb, dimensions: `${width}×${height}px` });
    } catch (err: any) {
      setErrorMessage(err?.message || "Erreur lors du traitement de l'image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = () => {
    onChange('');
    setFileDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const aspectClass = aspectRatio === 'square' 
    ? 'aspect-square max-h-48' 
    : aspectRatio === 'wide' 
      ? 'aspect-[21/9] max-h-44' 
      : 'aspect-[16/10] max-h-48';

  return (
    <div className="space-y-2">
      {/* Label and Helper */}
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>{label}</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md font-semibold">
            Stockage Local / Appareil
          </span>
        </label>

        {showPresets && (
          <button
            type="button"
            onClick={() => setShowPresetsTab(!showPresetsTab)}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            {showPresetsTab ? 'Masquer modèles' : 'Modèles photos'}
          </button>
        )}
      </div>

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        id="device-image-input"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Preset dishes gallery drawer */}
      {showPresetsTab && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-700">Sélection rapide de photos gastronomiques :</span>
            <span className="text-[10px] text-slate-500">Cliquez pour appliquer</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {DISH_PRESET_IMAGES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(preset.url);
                  setShowPresetsTab(false);
                }}
                className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 transition-all text-left"
                title={preset.name}
              >
                <img 
                  src={preset.url} 
                  alt={preset.name} 
                  className="w-full h-14 object-cover group-hover:scale-105 transition-transform" 
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[9px] text-white font-medium truncate">
                  {preset.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Upload / Preview Container */}
      {value ? (
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden group shadow-soft-xs">
          <div className={`w-full ${aspectClass} overflow-hidden bg-slate-900/5 flex items-center justify-center`}>
            <img
              src={value}
              alt="Aperçu du plat"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80');
              }}
            />
          </div>

          {/* Action Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-slate-100 transition-all active:scale-95"
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
              Changer l'image
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-rose-700 transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer
            </button>
          </div>

          {/* Bottom Bar Info */}
          <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 text-emerald-700 font-bold truncate">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Image chargée depuis votre appareil</span>
            </div>
            {fileDetails && (
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                {fileDetails.dimensions} • {fileDetails.sizeKb} Ko
              </span>
            )}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold px-2 py-1 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                Remplacer
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all flex flex-col items-center justify-center gap-2.5 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 bg-slate-50/60'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
            {isProcessing ? (
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            ) : (
              <UploadCloud className="w-6 h-6 text-emerald-700" />
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-800">
              {isProcessing ? "Compression & optimisation en cours..." : "Cliquez ou glissez une photo ici"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
              {helperText}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 hover:bg-emerald-700 transition-colors">
              <Camera className="w-3.5 h-3.5" />
              Parcourir l'appareil / Caméra
            </span>
          </div>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <p className="text-[11px] text-rose-600 font-semibold bg-rose-50 p-2 rounded-xl border border-rose-200">
          {errorMessage}
        </p>
      )}

      {/* Optional fallback URL input */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowUrlFallback(!showUrlFallback)}
          className="text-[11px] text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          {showUrlFallback ? "Masquer le champ URL" : "Ou coller une URL d'image externe"}
        </button>

        {showUrlFallback && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 p-2 text-xs bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
};
