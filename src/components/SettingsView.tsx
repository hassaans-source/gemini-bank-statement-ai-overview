import React, { useState } from 'react';
import { AppSettings, WebhookStatus, AppLanguage, SavedStatement } from '../types/finance';
import { translations } from '../utils/i18n';
import { testWebhookPing } from '../services/webhookService';
import {
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  Database,
  Key,
  Building,
  DollarSign,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  webhookStatus: WebhookStatus;
  setWebhookStatus: (status: WebhookStatus) => void;
  language: AppLanguage;
  onSaveSettings: (newSettings: AppSettings) => Promise<void>;
  onLoadDemoData: () => Promise<SavedStatement[]>;
  onClearAllData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  webhookStatus,
  setWebhookStatus,
  language,
  onSaveSettings,
  onLoadDemoData,
  onClearAllData,
}) => {
  const t = translations[language];

  const [webhookUrl, setWebhookUrl] = useState(settings.webhook_url);
  const [apiKey, setApiKey] = useState(settings.api_key || '');
  const [companyName, setCompanyName] = useState(settings.company_name);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState<string>(
    settings.low_balance_threshold !== null && settings.low_balance_threshold !== undefined
      ? String(settings.low_balance_threshold)
      : ''
  );
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabase_url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabase_anon_key || '');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    isN8nInactive?: boolean;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Clear data double confirmation states
  const [showClearConfirmStep1, setShowClearConfirmStep1] = useState(false);
  const [showClearConfirmStep2, setShowClearConfirmStep2] = useState(false);
  const [demoLoadedMsg, setDemoLoadedMsg] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const res = await testWebhookPing(webhookUrl, apiKey);
    setTestResult(res);
    setWebhookStatus(res.success ? 'connected' : 'error');
    setIsTesting(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const parsedThreshold = lowBalanceThreshold.trim() ? parseFloat(lowBalanceThreshold) : null;

    const newSettings: AppSettings = {
      webhook_url: webhookUrl.trim(),
      api_key: apiKey.trim(),
      company_name: companyName.trim() || 'Finance Overview',
      low_balance_threshold: parsedThreshold !== null && !isNaN(parsedThreshold) ? parsedThreshold : null,
      supabase_url: supabaseUrl.trim(),
      supabase_anon_key: supabaseAnonKey.trim(),
    };

    await onSaveSettings(newSettings);
    setIsSaving(false);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 3000);
  };

  const handleLoadDemo = async () => {
    await onLoadDemoData();
    setDemoLoadedMsg(true);
    setTimeout(() => setDemoLoadedMsg(false), 4000);
  };

  const handleExecuteClear = async () => {
    await onClearAllData();
    setShowClearConfirmStep1(false);
    setShowClearConfirmStep2(false);
  };

  const sqlSchemaScript = `-- Supabase SQL Setup for Shakir AI Finance Portal
-- Run this in your Supabase SQL Editor to prepare all tables and storage

-- 1. Statements Table
create table if not exists statements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  file_name text not null,
  period_label text not null,
  currency text not null,
  closing_balance numeric not null,
  total_debit numeric not null,
  total_credit numeric not null,
  result jsonb not null
);

-- 2. Budget Overrides Table
create table if not exists budget_overrides (
  category text primary key,
  amount numeric not null
);

-- 3. Settings Table
create table if not exists settings (
  id int primary key default 1,
  webhook_url text not null,
  company_name text not null,
  low_balance_threshold numeric
);

-- 4. Enable Row Level Security (RLS) & Grant Anon Access
alter table statements enable row level security;
alter table budget_overrides enable row level security;
alter table settings enable row level security;

create policy "Anon full access statements" on statements for all using (true) with check (true);
create policy "Anon full access budget_overrides" on budget_overrides for all using (true) with check (true);
create policy "Anon full access settings" on settings for all using (true) with check (true);

-- 5. Storage Bucket 'statements'
insert into storage.buckets (id, name, public) 
values ('statements', 'statements', false)
on conflict (id) do nothing;

create policy "Anon full access to statements bucket" on storage.objects 
for all using (bucket_id = 'statements') with check (bucket_id = 'statements');
`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchemaScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-8 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-xs uppercase tracking-wider">
          <SettingsIcon className="w-4 h-4" />
          <span>{t.settings}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t.settingsTitle}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t.settingsSubtitle}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: n8n Webhook Connection Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.webhookCardTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {t.webhookCardDesc}
              </p>
            </div>

            {/* Status Badge */}
            <div className="shrink-0">
              {webhookStatus === 'connected' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.connected}</span>
                </span>
              ) : webhookStatus === 'error' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{t.connectionError}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <span>{t.untested}</span>
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Webhook URL Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.webhookUrlLabel}
                </label>
                {/* 1-Click URL mode switcher */}
                <button
                  type="button"
                  onClick={() => {
                    if (webhookUrl.includes('/webhook-test/')) {
                      setWebhookUrl(webhookUrl.replace('/webhook-test/', '/webhook/'));
                    } else if (webhookUrl.includes('/webhook/')) {
                      setWebhookUrl(webhookUrl.replace('/webhook/', '/webhook-test/'));
                    }
                  }}
                  className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  {webhookUrl.includes('/webhook-test/') ? t.switchToProd : t.switchToTest}
                </button>
              </div>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://.../webhook/analyze-bank-statement"
                required
                className="w-full py-2.5 px-3 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            {/* Optional API Key / Secret Input */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.webhookApiKeyLabel}</span>
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Optional x-api-key authentication token"
                className="w-full py-2.5 px-3 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">{t.webhookApiKeyHelp}</p>
            </div>

            {/* Test Connection Button & Result */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                disabled={isTesting || !webhookUrl.trim()}
                onClick={handleTestConnection}
                className="py-2 px-4 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isTesting ? t.testingConnection : t.testConnectionBtn}
              </button>

              {testResult && (
                <div
                  className={`text-xs font-medium flex items-start gap-1.5 p-2.5 rounded-lg ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  )}
                  <div className="space-y-1">
                    <p>{testResult.message}</p>
                    {testResult.isN8nInactive && (
                      <p className="text-[11px] font-normal text-amber-700 dark:text-amber-300">
                        {t.n8nInactiveHint}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Business & Alert Configurations */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.generalSettingsTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Company Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.companyNameLabel}</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Finance Overview"
                className="w-full py-2.5 px-3 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-[11px] text-slate-400">{t.companyNameHelp}</p>
            </div>

            {/* Low Balance Alert Threshold */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.lowBalanceLabel}</span>
              </label>
              <input
                type="number"
                value={lowBalanceThreshold}
                onChange={(e) => setLowBalanceThreshold(e.target.value)}
                placeholder="e.g. 200000"
                className="w-full py-2.5 px-3 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 tabular-nums"
              />
              <p className="text-[11px] text-slate-400">{t.lowBalanceHelp}</p>
            </div>
          </div>
        </div>

        {/* Card 3: Supabase Cloud Persistence (Optional Direct Config) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.supabaseCardTitle}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                {t.supabaseCardDesc}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSqlModal(true)}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline shrink-0"
            >
              {t.viewSqlSchemaBtn}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t.supabaseUrlLabel}
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full py-2 px-3 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t.supabaseKeyLabel}
              </label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOi..."
                className="w-full py-2 px-3 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="py-2.5 px-6 rounded-lg bg-[#0B1F44] hover:bg-[#16336e] text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm cursor-pointer"
          >
            {isSaving ? 'Saving...' : t.saveSettingsBtn}
          </button>
          {saveFeedback && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>{t.settingsSavedNotice}</span>
            </span>
          )}
        </div>
      </form>

      {/* Demo Data & Danger Actions */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Load Demo Data */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.demoDataTitle}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Instant Sample Data
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.demoDataDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadDemo}
            className="py-2 px-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.loadDemoDataBtn}</span>
          </button>

          {demoLoadedMsg && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {t.demoLoadedNotice}
            </p>
          )}
        </div>

        {/* Danger Zone: Clear Data */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/40 p-6 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t.dangerZoneTitle}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.clearAllDataBtn}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.confirmClearMsg}
            </p>
          </div>

          {!showClearConfirmStep1 ? (
            <button
              type="button"
              onClick={() => setShowClearConfirmStep1(true)}
              className="py-2 px-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              {t.clearAllDataBtn}
            </button>
          ) : !showClearConfirmStep2 ? (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-lg space-y-2 text-xs">
              <p className="font-semibold text-rose-900 dark:text-rose-200">
                Confirmation Step 1: Are you sure you want to proceed?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirmStep2(true)}
                  className="py-1 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium cursor-pointer"
                >
                  Yes, proceed
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirmStep1(false)}
                  className="py-1 px-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium cursor-pointer"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-rose-100 dark:bg-rose-950 rounded-lg space-y-2 text-xs border border-rose-300 dark:border-rose-800">
              <p className="font-bold text-rose-900 dark:text-rose-100">
                Final Confirmation (Step 2): This will permanently wipe all history!
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExecuteClear}
                  className="py-1.5 px-3 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold cursor-pointer"
                >
                  {t.clearConfirmBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowClearConfirmStep1(false);
                    setShowClearConfirmStep2(false);
                  }}
                  className="py-1.5 px-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium cursor-pointer"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Supabase SQL Setup Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Supabase SQL Setup Script
              </h3>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Copy and execute this script inside your Supabase project's SQL Editor to automatically configure the tables, RLS policies, and storage bucket.
            </p>
            <div className="relative">
              <pre className="p-4 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto max-h-80">
                {sqlSchemaScript}
              </pre>
              <button
                type="button"
                onClick={copySql}
                className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center gap-1"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSqlModal(false)}
                className="py-2 px-4 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
