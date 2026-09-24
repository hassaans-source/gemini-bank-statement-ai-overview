import React from 'react';
import { ActiveTab, AppLanguage, AppTheme, WebhookStatus } from '../types/finance';
import { translations } from '../utils/i18n';
import { Globe, Moon, Sun, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface HeaderProps {
  companyName: string;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  webhookStatus: WebhookStatus;
}

export const Header: React.FC<HeaderProps> = ({
  companyName,
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  theme,
  setTheme,
  webhookStatus,
}) => {
  const t = translations[language];

  const getStatusDot = () => {
    switch (webhookStatus) {
      case 'connected':
        return {
          color: 'bg-emerald-500',
          title: `${t.connected}: n8n Webhook Active`,
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'error':
        return {
          color: 'bg-rose-500',
          title: `${t.connectionError}: Check Settings`,
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
        };
      default:
        return {
          color: 'bg-slate-400',
          title: `${t.untested}: Test in Settings`,
          icon: <HelpCircle className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  const status = getStatusDot();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-left font-bold text-lg md:text-xl tracking-tight text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            {companyName || t.portalTitle}
          </button>

          {/* Webhook Connection Indicator Dot */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 cursor-help"
            title={status.title}
          >
            <span className={`w-2 h-2 rounded-full ${status.color} animate-pulse`} />
            <span className="hidden sm:inline text-[11px] font-medium">
              {webhookStatus === 'connected' ? t.connected : webhookStatus === 'error' ? t.connectionError : t.untested}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.dashboard}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.history}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'settings'
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.settings}
          </button>
        </nav>

        {/* Zone 3: Controls (Language Switch + Theme Switch) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
            title="Toggle English / اردو"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'اردو' : 'English'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-md transition-colors"
            title={`Switch to ${theme === 'light' ? t.dark : t.light} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
