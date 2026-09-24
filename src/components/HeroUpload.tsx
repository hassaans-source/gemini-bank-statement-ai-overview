import React, { useState, useRef, useEffect } from 'react';
import { AppLanguage, WebhookStatus } from '../types/finance';
import { translations } from '../utils/i18n';
import { testWebhookPing } from '../services/webhookService';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  Cpu,
  Clock,
  ChevronDown,
  X,
  AlertCircle,
  FileSpreadsheet,
  FileImage,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';

interface HeroUploadProps {
  language: AppLanguage;
  webhookUrl: string;
  apiKey?: string;
  webhookStatus: WebhookStatus;
  onStartAnalysis: (file: File) => void;
  onGoToSettings: () => void;
  onToggleWebhookMode: () => void;
  onLoadDemoStatement: () => void;
  onUpdateWebhookStatus: (status: WebhookStatus) => void;
}

export const HeroUpload: React.FC<HeroUploadProps> = ({
  language,
  webhookUrl,
  apiKey,
  webhookStatus,
  onStartAnalysis,
  onGoToSettings,
  onToggleWebhookMode,
  onLoadDemoStatement,
  onUpdateWebhookStatus,
}) => {
  const t = translations[language];
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{
    success: boolean;
    message: string;
    isN8nInactive?: boolean;
  } | null>(null);
  const [showN8nGuide, setShowN8nGuide] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const isTestMode = webhookUrl.includes('/webhook-test/');
  const acceptedExtensions = ['.pdf', '.txt', '.csv', '.xlsx', '.xls', '.jpg', '.jpeg', '.png'];
  const maxSizeBytes = 15 * 1024 * 1024; // 15MB

  const handleQuickPing = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await testWebhookPing(webhookUrl, apiKey);
      setPingResult(res);
      if (res.success) {
        onUpdateWebhookStatus('connected');
        setShowN8nGuide(false);
      } else {
        onUpdateWebhookStatus('error');
        if (res.isN8nInactive) {
          setShowN8nGuide(true);
        }
      }
    } catch {
      onUpdateWebhookStatus('error');
    } finally {
      setIsPinging(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setFileError(null);
    const fileName = file.name.toLowerCase();
    const hasValidExt = acceptedExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      setFileError(
        language === 'ur'
          ? 'غیر تعاون یافتہ فائل فارمیٹ۔ برائے مہربانی PDF, Excel, CSV, TXT یا تصاویر (JPG, PNG) استعمال کریں۔'
          : 'Unsupported file type. Please upload PDF, Excel, CSV, TXT, or Image/Scan files.'
      );
      return;
    }

    if (file.size > maxSizeBytes) {
      setFileError(
        language === 'ur'
          ? 'فائل کا سائز 15MB سے زیادہ ہے۔ برائے مہربانی چھوٹی یا کمپریس شدہ فائل اپ لوڈ کریں۔'
          : 'File exceeds 15 MB limit. Please select a smaller or compressed file.'
      );
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) {
      return <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    }
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
      return <FileImage className="w-8 h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />;
    }
    return <FileText className="w-8 h-8 text-teal-600 dark:text-teal-400 shrink-0" />;
  };

  const isWebhookConfigured = Boolean(webhookUrl && webhookUrl.trim());

  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
  ];

  return (
    <div className="space-y-14 py-6">
      {/* Hero Section (Split Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Headline, Trust Markers & Quick Sample CTA */}
        <div className="lg:col-span-6 space-y-6 pt-2">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.2]">
              {t.heroHeadline}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {t.heroSubheadline}
            </p>
          </div>

          {/* Quick Demo Statement Ingestion Button */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{language === 'ur' ? 'فوری ڈیمو دیکھیں' : 'Instant 1-Click Demo'}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {language === 'ur'
                  ? 'اگر ابھی اسٹیٹمنٹ موجود نہیں ہے تو تیار شدہ رپورٹ سے پورٹل کا جائزہ لیں۔'
                  : 'No statement file on hand? Explore the entire portal with pre-loaded statements.'}
              </p>
            </div>
            <button
              onClick={onLoadDemoStatement}
              className="py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-sm cursor-pointer whitespace-nowrap"
            >
              {t.tryDemoStatement}
            </button>
          </div>

          {/* Three Trust Markers */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                {t.trustPrivate}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                {t.trustAi}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                {t.trustSpeed}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Webhook Integration Bar + Upload Card */}
        <div className="lg:col-span-6 space-y-4">
          {/* Webhook Connection & Quick Mode Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    webhookStatus === 'connected'
                      ? 'bg-emerald-500'
                      : webhookStatus === 'error'
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
                  }`}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  n8n Webhook:
                </span>
                <span className="text-slate-500 dark:text-slate-400 truncate font-mono text-[11px] max-w-[180px] sm:max-w-[260px]">
                  {webhookUrl || 'Not configured'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* 1-Click URL Mode Switcher */}
                <button
                  type="button"
                  onClick={onToggleWebhookMode}
                  title={isTestMode ? t.switchToProd : t.switchToTest}
                  className="px-2 py-1 rounded text-[11px] font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  {isTestMode ? t.webhookTest : t.webhookProduction}
                </button>

                {/* Quick Ping Test Button */}
                <button
                  type="button"
                  disabled={isPinging || !webhookUrl.trim()}
                  onClick={handleQuickPing}
                  className="px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>{isPinging ? t.checkingPing : t.quickPingCheck}</span>
                </button>
              </div>
            </div>

            {/* Quick Ping Result */}
            {pingResult && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                  pingResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {pingResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <p className="font-semibold leading-snug">{pingResult.message}</p>
                  {pingResult.isN8nInactive && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
                      <p>{t.n8nInactiveHint}</p>
                      <button
                        type="button"
                        onClick={onToggleWebhookMode}
                        className="underline font-bold hover:text-amber-900 dark:hover:text-white cursor-pointer"
                      >
                        {isTestMode ? t.switchToProd : t.switchToTest}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Upload Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t.uploadTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t.uploadFormats}
              </p>
            </div>

            {!selectedFile ? (
              /* Drag & Drop Area */
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-colors duration-150 ${
                  dragActive
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt,.csv,.xlsx,.xls,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                      {t.uploadSubtitle}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    PDF, XLSX, CSV, JPG, PNG up to 15MB
                  </span>
                </div>
              </div>
            ) : (
              /* Selected File View */
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {getFileIcon(selectedFile.name)}
                    <div className="truncate">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatFileSize(selectedFile.size)} · {t.fileReadyToAnalyze}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title={t.removeFile}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Primary Action Button */}
                <div>
                  <button
                    disabled={!isWebhookConfigured}
                    onClick={() => selectedFile && onStartAnalysis(selectedFile)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-sm text-white transition-all shadow-sm ${
                      isWebhookConfigured
                        ? 'bg-[#0B1F44] hover:bg-[#16336e] active:scale-[0.99] cursor-pointer'
                        : 'bg-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {t.analyzeButton}
                  </button>

                  {!isWebhookConfigured && (
                    <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span>{t.noWebhookHint}</span>{' '}
                        <button
                          onClick={onGoToSettings}
                          className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-100 cursor-pointer"
                        >
                          {t.settings}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500">
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 underline cursor-pointer"
                  >
                    {t.removeFile}
                  </button>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    {t.selectAnotherFile}
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.csv,.xlsx,.xls,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            )}

            {fileError && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 rounded text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* How it works Section (3 numbered cards) */}
      <section className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t.howItWorksTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
            <span className="text-sm font-bold text-teal-600 dark:text-teal-400">01</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.step1Title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.step1Desc}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
            <span className="text-sm font-bold text-teal-600 dark:text-teal-400">02</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.step2Title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.step2Desc}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
            <span className="text-sm font-bold text-teal-600 dark:text-teal-400">03</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.step3Title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.step3Desc}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section (4 questions) */}
      <section className="space-y-6 pt-2">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t.faqTitle}
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 text-slate-900 dark:text-white font-semibold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-teal-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
