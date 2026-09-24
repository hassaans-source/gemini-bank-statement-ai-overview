import React from 'react';
import { AppLanguage } from '../types/finance';
import { translations } from '../utils/i18n';
import {
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Settings,
  ToggleRight,
  Info,
} from 'lucide-react';

interface ErrorCardProps {
  language: AppLanguage;
  errorMessage?: string;
  isN8nInactive?: boolean;
  webhookUrl?: string;
  onTryAgain: () => void;
  onToggleWebhookMode?: () => void;
  onLoadDemoStatement?: () => void;
  onGoToSettings?: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  language,
  errorMessage,
  isN8nInactive,
  webhookUrl,
  onTryAgain,
  onToggleWebhookMode,
  onLoadDemoStatement,
  onGoToSettings,
}) => {
  const t = translations[language];
  const isUrdu = language === 'ur';

  const isTestUrl = webhookUrl?.includes('/webhook-test/');
  const detectedInactive =
    isN8nInactive ||
    (errorMessage &&
      (errorMessage.toLowerCase().includes('inactive') ||
        errorMessage.toLowerCase().includes('not registered') ||
        errorMessage.includes('غیر فعال')));

  return (
    <div className="py-12 flex justify-center items-center">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
        {/* Icon & Title */}
        <div className="text-center space-y-3">
          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
              detectedInactive
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
            }`}
          >
            {detectedInactive ? (
              <ToggleRight className="w-7 h-7" />
            ) : (
              <AlertTriangle className="w-7 h-7" />
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {detectedInactive
                ? isUrdu
                  ? 'اینی ٹین (n8n) ورک فلو غیر فعال ہے'
                  : 'n8n Workflow is Inactive'
                : t.friendlyErrorTitle}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {detectedInactive
                ? isUrdu
                  ? 'آپ کا n8n ویب ہک اینڈ پوائنٹ فی الحال غیر فعال ہے۔ پروڈکشن میں ویب ہک کالز وصول کرنے کے لیے ورک فلو کو Active کرنا ضروری ہے۔'
                  : 'Your n8n workflow is currently turned off. To accept production webhook requests, the workflow must be switched to Active in n8n.'
                : t.friendlyErrorDesc}
            </p>
          </div>
        </div>

        {/* Actionable n8n Activation Guide (if detected inactive) */}
        {detectedInactive && (
          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <Info className="w-4 h-4" />
              <span>{t.learnHowToActivate}:</span>
            </div>
            <ol className="space-y-1.5 list-none">
              <li>{t.n8nStep1}</li>
              <li>
                <strong>{t.n8nStep2}</strong>
              </li>
              <li>{t.n8nStep3}</li>
            </ol>
          </div>
        )}

        {/* Detailed technical error (if present) */}
        {errorMessage && errorMessage !== t.friendlyErrorDesc && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-500 dark:text-slate-400 font-mono break-all text-left">
            <span className="font-semibold block mb-0.5 text-slate-700 dark:text-slate-300">
              {t.errorDetails}:
            </span>
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* 1. Try Again button */}
          <button
            onClick={onTryAgain}
            className="w-full py-2.5 px-4 rounded-lg bg-[#0B1F44] hover:bg-[#16336e] text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t.tryAgain}</span>
          </button>

          {/* 2. Switch URL mode (Test <-> Production) */}
          {onToggleWebhookMode && (
            <button
              onClick={onToggleWebhookMode}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ToggleRight className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isTestUrl ? t.switchToProd : t.switchToTest}</span>
            </button>
          )}

          {/* 3. Try Sample Statement (Instant fallback demo) */}
          {onLoadDemoStatement && (
            <button
              onClick={onLoadDemoStatement}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t.tryDemoStatement}</span>
            </button>
          )}

          {/* 4. Settings link */}
          {onGoToSettings && (
            <div className="text-center pt-2">
              <button
                onClick={onGoToSettings}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{t.settings}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
