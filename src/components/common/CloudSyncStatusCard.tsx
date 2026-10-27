import React, { useState, useRef } from 'react';
import { 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  Download, 
  Upload, 
  ShieldCheck, 
  Clock, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  HardDriveDownload,
  HardDriveUpload,
  Lock
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useLanguage } from '../../context/LanguageContext';

export const CloudSyncStatusCard: React.FC = () => {
  const { 
    isSyncing, 
    lastStatsSyncTime, 
    triggerCloudSync, 
    exportDataBackup, 
    importDataBackup, 
    lastBackupDate,
    currentRestaurant
  } = useRestaurant();
  const { t, language } = useLanguage();

  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualSync = async () => {
    setSyncStatusMsg(null);
    const res = await triggerCloudSync();
    if (res.success) {
      setSyncStatusMsg({
        type: 'success',
        text: language === 'fr' 
          ? 'Synchronisation cloud effectuée avec succès !' 
          : 'Cloud sync completed successfully!'
      });
    } else {
      setSyncStatusMsg({
        type: 'error',
        text: res.message || (language === 'fr' ? 'Échec de synchronisation' : 'Sync failed')
      });
    }

    setTimeout(() => {
      setSyncStatusMsg(null);
    }, 4500);
  };

  const handleExportBackup = () => {
    try {
      setIsExporting(true);
      const res = exportDataBackup();
      if (res.success) {
        // Trigger download
        const a = document.createElement('a');
        a.href = res.dataUrl;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(res.dataUrl);

        setSyncStatusMsg({
          type: 'success',
          text: t('exportBackupSuccess')
        });
      }
    } catch (e: any) {
      setSyncStatusMsg({
        type: 'error',
        text: language === 'fr' ? 'Erreur lors du téléchargement' : 'Download error'
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const res = await importDataBackup(text);
      if (res.success) {
        setSyncStatusMsg({
          type: 'success',
          text: t('importBackupSuccess', { count: res.count })
        });
      } else {
        setSyncStatusMsg({
          type: 'error',
          text: res.error || (language === 'fr' ? 'Erreur de restauration' : 'Restore error')
        });
      }
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: language === 'fr' ? 'Fichier illisible' : 'Unreadable file'
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  const formattedLastBackup = lastBackupDate
    ? new Date(lastBackupDate).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : t('neverBackup');

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft-sm p-6 sm:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shadow-soft-sm shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{t('cloudSyncTitle')}</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full">
                Cloud Live
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {t('cloudSyncSubtitle')}
            </p>
          </div>
        </div>

        {/* Sync trigger button */}
        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? t('cloudStatusSyncing') : t('syncNow')}</span>
        </button>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200 ${
          syncStatusMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {syncStatusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{syncStatusMsg.text}</span>
        </div>
      )}

      {/* Grid of indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Realtime Live State */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">{t('cloudStatusSynced')}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>En ligne & sécurisé</span>
          </p>
          <p className="text-[11px] text-slate-400">
            {lastStatsSyncTime ? `Dernier ping: ${lastStatsSyncTime}` : 'Connecté en continu'}
          </p>
        </div>

        {/* Local & Cloud Storage Multi-persistence */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Résilience Hors-ligne</span>
            <Lock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-sm font-black text-slate-900">
            Stockage Hybride Double
          </p>
          <p className="text-[11px] text-slate-400">
            IndexedDB / Cache Local + Firestore
          </p>
        </div>

        {/* Last backup export timestamp */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">{t('lastBackup')}</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-xs font-black text-slate-900 truncate">
            {formattedLastBackup}
          </p>
          <p className="text-[11px] text-slate-400">
            Format sécurisé JSON
          </p>
        </div>
      </div>

      {/* Backup and restore actions */}
      <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
        <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
          Sauvegarde & Restauration Locale Immédiate
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Exportez un fichier complet contenant tous vos menus, tables, commandes, stocks et paramètres de l'établissement <strong className="text-slate-900">{currentRestaurant.name}</strong> pour une conservation physique indépendante.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Export JSON Button */}
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={isExporting}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <HardDriveDownload className="w-4 h-4 text-emerald-600" />
            <span>{isExporting ? 'Génération...' : t('exportBackup')}</span>
          </button>

          {/* Import JSON Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
            id="backup-file-importer"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <HardDriveUpload className="w-4 h-4 text-amber-600" />
            <span>{isImporting ? 'Traitement...' : t('importBackup')}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
