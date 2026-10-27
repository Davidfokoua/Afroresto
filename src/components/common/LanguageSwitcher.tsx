import React from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Language } from '../../i18n/translations';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'pills' | 'dropdown' | 'client' | 'navbar' | 'customer';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { language, setLanguage, toggleLanguage, t } = useLanguage();

  if (variant === 'client' || variant === 'customer') {
    // High-visibility switcher designed specifically for customers scanning QR code at table
    return (
      <div className={`inline-flex items-center bg-white/95 backdrop-blur-md rounded-2xl p-1 border border-slate-200/90 shadow-soft-sm ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage('fr')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            language === 'fr'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          aria-label="Passer en Français"
        >
          <span className="text-sm leading-none">🇫🇷</span>
          <span>FR</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            language === 'en'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          aria-label="Switch to English"
        >
          <span className="text-sm leading-none">🇬🇧</span>
          <span>EN</span>
        </button>
      </div>
    );
  }

  if (variant === 'pills') {
    return (
      <div className={`inline-flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70 gap-1 ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage('fr')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            language === 'fr'
              ? 'bg-white text-slate-900 shadow-soft-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span className="text-sm">🇫🇷</span>
          <span>Français</span>
          {language === 'fr' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            language === 'en'
              ? 'bg-white text-slate-900 shadow-soft-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <span className="text-sm">🇬🇧</span>
          <span>English</span>
          {language === 'en' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
        </button>
      </div>
    );
  }

  // Default compact variant: Ideal for top Navbar
  return (
    <div 
      className={`inline-flex items-center bg-slate-100/90 hover:bg-slate-200/80 p-0.5 rounded-xl border border-slate-200/80 transition-all ${className}`}
      title={t('lang_toggle')}
    >
      <button
        type="button"
        onClick={() => setLanguage('fr')}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
          language === 'fr'
            ? 'bg-white text-emerald-800 shadow-soft-sm border border-slate-200/60'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-label="Passer en Français"
      >
        <span className="text-xs leading-none">🇫🇷</span>
        <span>FR</span>
      </button>

      <span className="text-slate-300 text-[10px] px-0.5">•</span>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
          language === 'en'
            ? 'bg-white text-emerald-800 shadow-soft-sm border border-slate-200/60'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-label="Switch to English"
      >
        <span className="text-xs leading-none">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
};
