import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { getViewLabel } from '../../utils/formatters';

interface BackDotButtonProps {
  variant?: 'navbar' | 'floating' | 'inline';
  className?: string;
  showLabel?: boolean;
}

export const BackDotButton: React.FC<BackDotButtonProps> = ({
  variant = 'navbar',
  className = '',
  showLabel = true
}) => {
  const { goBack, canGoBack, previousView } = useRestaurant();
  const [isHovered, setIsHovered] = useState(false);

  const prevLabel = getViewLabel(previousView);

  // Floating variant is disabled to prevent persistent floating elements on screen
  if (variant === 'floating') {
    return null;
  }

  if (variant === 'inline') {
    if (!canGoBack) return null;

    return (
      <button
        id="inline-back-button"
        onClick={goBack}
        title={`Page précédente : ${prevLabel}`}
        aria-label={`Retourner à la page précédente (${prevLabel})`}
        className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/90 text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer shadow-xs ${className}`}
      >
        <ArrowLeft className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-900 group-hover:-translate-x-0.5 transition-transform" />
        {showLabel && <span>Retour ({prevLabel})</span>}
      </button>
    );
  }

  // Default 'navbar' variant
  if (!canGoBack) return null;

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        id="navbar-back-button"
        onClick={goBack}
        title={`Page précédente : ${prevLabel}`}
        aria-label={`Retourner à la page précédente (${prevLabel})`}
        className={`group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-all duration-150 text-xs font-bold active:scale-95 cursor-pointer shadow-xs ${className}`}
      >
        <ArrowLeft className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-900 group-hover:-translate-x-0.5 transition-transform" />
        {showLabel && (
          <span className="font-bold text-slate-700 group-hover:text-slate-900">
            Retour
          </span>
        )}
      </button>

      {/* Floating tooltip on hover in navbar */}
      {isHovered && canGoBack && (
        <div className="absolute top-full left-0 mt-2 z-50 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-medium shadow-soft-lg whitespace-nowrap pointer-events-none animate-in fade-in slide-in-from-top-1">
          <span>Revenir à : <strong>{prevLabel}</strong></span>
        </div>
      )}
    </div>
  );
};
