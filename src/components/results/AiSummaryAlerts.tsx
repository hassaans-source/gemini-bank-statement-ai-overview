import React from 'react';
import { AlertItem, AppLanguage } from '../../types/finance';
import { translations } from '../../utils/i18n';
import { Sparkles, AlertTriangle, CheckCircle, TrendingUp, AlertCircle, Copy, DollarSign } from 'lucide-react';

interface AiSummaryAlertsProps {
  summaryEn: string;
  summaryUr: string;
  alerts: AlertItem[];
  language: AppLanguage;
}

export const AiSummaryAlerts: React.FC<AiSummaryAlertsProps> = ({
  summaryEn,
  summaryUr,
  alerts,
  language,
}) => {
  const t = translations[language];
  const activeSummary = language === 'ur' ? (summaryUr || summaryEn) : (summaryEn || summaryUr);

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'spending_high':
      case 'category_spike':
        return <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'large_payment':
        return <DollarSign className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'duplicate_payment':
        return <Copy className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'low_balance':
        return <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. AI Summary Card */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
          <Sparkles className="w-4 h-4" />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            {t.aiSummaryTitle}
          </h2>
        </div>
        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
          {activeSummary || 'No executive summary provided for this statement period.'}
        </p>
      </div>

      {/* 2. Alerts Card */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              {t.alertsTitle}
            </h2>
          </div>
          {alerts.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 tabular-nums">
              {alerts.length}
            </span>
          )}
        </div>

        {alerts.length === 0 ? (
          /* Friendly No Alerts State */
          <div className="p-4 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                {t.noAlertsTitle}
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                {t.noAlertsDesc}
              </p>
            </div>
          </div>
        ) : (
          /* List of Computed Alerts */
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {alerts.map((alert) => {
              const title = language === 'ur' ? (alert.title_ur || alert.title) : alert.title;
              const desc = language === 'ur' ? (alert.description_ur || alert.description) : alert.description;

              const isSeverityAlert = alert.severity === 'alert';

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-lg border flex items-start gap-3 transition-colors ${
                    isSeverityAlert
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                  }`}
                >
                  <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                  <div className="space-y-0.5">
                    <h4
                      className={`text-xs font-semibold ${
                        isSeverityAlert
                          ? 'text-rose-900 dark:text-rose-200'
                          : 'text-amber-900 dark:text-amber-200'
                      }`}
                    >
                      {title}
                    </h4>
                    <p
                      className={`text-xs leading-relaxed ${
                        isSeverityAlert
                          ? 'text-rose-700 dark:text-rose-300'
                          : 'text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
