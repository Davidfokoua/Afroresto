import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { RestoCamLogo } from './RestoCamLogo';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RESTOCAM Uncaught Application Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    // Clear URL search params that might have caused a crash and reload
    if (typeof window !== 'undefined') {
      window.location.href = window.location.origin;
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700 text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-2 flex items-center justify-center mx-auto">
              <RestoCamLogo size={48} />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Interruption temporaire</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {this.props.fallbackTitle || 'Affichage du menu en cours de rétablissement'}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Une interruption d'affichage est survenue lors du chargement des données. Cliquez ci-dessous pour relancer l'application en toute sécurité.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 max-h-24 overflow-y-auto text-[10px] font-mono text-slate-400 break-all">
                {this.state.error.message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recharger</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Accueil</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
