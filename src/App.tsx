import { useState, useEffect, useCallback } from 'react';
import {
  ActiveTab,
  AppLanguage,
  AppSettings,
  AppTheme,
  BudgetOverride,
  DashboardMode,
  SavedStatement,
  WebhookStatus,
} from './types/finance';
import {
  DEFAULT_SETTINGS,
  deleteStatement,
  loadBudgetOverrides,
  loadDemoDataIntoPortal,
  loadSettings,
  loadStatements,
  resetAllData,
  saveBudgetOverride,
  saveSettings,
  saveStatement,
  uploadStatementFileAndGetSignedUrl,
} from './services/storageService';
import { executeStatementAnalysis, testWebhookPing } from './services/webhookService';

import { Header } from './components/Header';
import { HeroUpload } from './components/HeroUpload';
import { ProcessingCard } from './components/ProcessingCard';
import { ErrorCard } from './components/ErrorCard';
import { ResultsView } from './components/ResultsView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';

const LANGUAGE_STORAGE_KEY = 'shakir_portal_language';
const THEME_STORAGE_KEY = 'shakir_portal_theme';

export default function App() {
  // Global Preferences (stored in localStorage)
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved === 'ur' || saved === 'en' ? saved : 'en';
  });

  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });

  // Navigation & State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>('results');
  const [processingFileName, setProcessingFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isN8nInactive, setIsN8nInactive] = useState(false);

  // Data State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [statements, setStatements] = useState<SavedStatement[]>([]);
  const [activeStatement, setActiveStatement] = useState<SavedStatement | null>(null);
  const [budgetOverrides, setBudgetOverrides] = useState<BudgetOverride[]>([]);
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>('untested');

  // Sync Language and Direction
  const setLanguage = useCallback((newLang: AppLanguage) => {
    setLanguageState(newLang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    document.documentElement.dir = newLang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  }, []);

  // Sync Theme
  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Initial Load
  useEffect(() => {
    // Apply initial direction and class
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    async function initData() {
      try {
        const loadedSet = await loadSettings();
        setSettings(loadedSet);

        // Check initial webhook connectivity silently
        if (loadedSet.webhook_url) {
          testWebhookPing(loadedSet.webhook_url, loadedSet.api_key)
            .then((res) => {
              setWebhookStatus(res.success ? 'connected' : 'error');
            })
            .catch(() => setWebhookStatus('error'));
        }

        const loadedStatements = await loadStatements(loadedSet);
        setStatements(loadedStatements);

        if (loadedStatements.length > 0) {
          setActiveStatement(loadedStatements[0]);
          setDashboardMode('results');
        } else {
          setDashboardMode('upload');
        }

        const loadedOverrides = await loadBudgetOverrides(loadedSet);
        setBudgetOverrides(loadedOverrides);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }

    initData();
  }, []);

  // Handler: 1-Click Toggle between Production and Test URL
  const handleToggleWebhookMode = async () => {
    let newUrl = settings.webhook_url;
    if (newUrl.includes('/webhook-test/')) {
      newUrl = newUrl.replace('/webhook-test/', '/webhook/');
    } else if (newUrl.includes('/webhook/')) {
      newUrl = newUrl.replace('/webhook/', '/webhook-test/');
    }
    const updated = { ...settings, webhook_url: newUrl };
    setSettings(updated);
    await saveSettings(updated);

    // Test ping new URL
    const res = await testWebhookPing(newUrl, settings.api_key);
    setWebhookStatus(res.success ? 'connected' : 'error');
  };

  // Handler: Start Analysis with Webhook
  const handleStartAnalysis = async (file: File) => {
    setProcessingFileName(file.name);
    setDashboardMode('processing');
    setErrorMessage(undefined);
    setIsN8nInactive(false);

    try {
      // 1. Upload file and obtain valid signed URL, clean base64, mimeType, etc.
      const { fileUrl, referenceId, fileBase64, mimeType, fileSize } =
        await uploadStatementFileAndGetSignedUrl(file, settings);

      // 2. Call external n8n analysis webhook via robust server proxy
      const analysisResponse = await executeStatementAnalysis(
        settings.webhook_url,
        {
          file_url: fileUrl,
          file_name: file.name,
          reference_id: referenceId,
          file_base64: fileBase64,
          file_mime: mimeType,
          file_size: fileSize,
          currency: 'PKR',
        },
        settings.api_key
      );

      if (!analysisResponse.success || !analysisResponse.result) {
        setWebhookStatus('error');
        setIsN8nInactive(Boolean(analysisResponse.isN8nInactive));
        setErrorMessage(analysisResponse.errorMessage);
        setDashboardMode('error');
        return;
      }

      // 3. Webhook succeeded
      setWebhookStatus('connected');
      const result = analysisResponse.result;

      // 4. Construct saved statement object
      const newStatement: SavedStatement = {
        id: result.reference_id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        file_name: file.name,
        period_label: result.period_label || 'Current Period',
        currency: result.currency || 'PKR',
        closing_balance: result.closing_balance,
        total_debit: result.total_debit,
        total_credit: result.total_credit,
        result: result,
      };

      // 5. Persist to storage and local state
      await saveStatement(newStatement, settings);
      const updatedList = await loadStatements(settings);
      setStatements(updatedList);
      setActiveStatement(newStatement);
      setDashboardMode('results');
    } catch (err: any) {
      console.error('Analysis workflow error:', err);
      setWebhookStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred during statement processing.');
      setDashboardMode('error');
    }
  };

  // Handler: Save Budget Override
  const handleSaveBudgetOverride = async (category: string, amount: number) => {
    const updated = await saveBudgetOverride(category, amount, settings);
    setBudgetOverrides(updated);
  };

  // Handler: Delete Statement
  const handleDeleteStatement = async (id: string) => {
    const updated = await deleteStatement(id, settings);
    setStatements(updated);

    if (activeStatement?.id === id) {
      if (updated.length > 0) {
        setActiveStatement(updated[0]);
      } else {
        setActiveStatement(null);
        setDashboardMode('upload');
      }
    }
  };

  // Handler: Load Demo Data & jump straight to results
  const handleLoadDemoData = async () => {
    const updated = await loadDemoDataIntoPortal(settings);
    setStatements(updated);
    if (updated.length > 0) {
      setActiveStatement(updated[0]);
      setDashboardMode('results');
    }
    return updated;
  };

  // Handler: Clear All Data
  const handleClearAllData = async () => {
    await resetAllData(settings);
    setStatements([]);
    setBudgetOverrides([]);
    setActiveStatement(null);
    setDashboardMode('upload');
  };

  // Handler: Save Settings
  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 ${
        language === 'ur' ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* Sticky Header with 3-Zone Contract */}
      <Header
        companyName={settings.company_name}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        webhookStatus={webhookStatus}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            {dashboardMode === 'upload' && (
              <HeroUpload
                language={language}
                webhookUrl={settings.webhook_url}
                apiKey={settings.api_key}
                webhookStatus={webhookStatus}
                onStartAnalysis={handleStartAnalysis}
                onGoToSettings={() => setActiveTab('settings')}
                onToggleWebhookMode={handleToggleWebhookMode}
                onLoadDemoStatement={handleLoadDemoData}
                onUpdateWebhookStatus={setWebhookStatus}
              />
            )}

            {dashboardMode === 'processing' && (
              <ProcessingCard
                language={language}
                fileName={processingFileName}
              />
            )}

            {dashboardMode === 'error' && (
              <ErrorCard
                language={language}
                errorMessage={errorMessage}
                isN8nInactive={isN8nInactive}
                webhookUrl={settings.webhook_url}
                onTryAgain={() => setDashboardMode('upload')}
                onToggleWebhookMode={handleToggleWebhookMode}
                onLoadDemoStatement={handleLoadDemoData}
                onGoToSettings={() => setActiveTab('settings')}
              />
            )}

            {dashboardMode === 'results' && activeStatement && (
              <ResultsView
                currentStatement={activeStatement}
                allStatements={statements}
                budgetOverrides={budgetOverrides}
                lowBalanceThreshold={settings.low_balance_threshold}
                companyName={settings.company_name}
                language={language}
                onNewAnalysis={() => setDashboardMode('upload')}
                onSaveBudgetOverride={handleSaveBudgetOverride}
                onSelectStatement={setActiveStatement}
              />
            )}

            {dashboardMode === 'results' && !activeStatement && (
              <HeroUpload
                language={language}
                webhookUrl={settings.webhook_url}
                apiKey={settings.api_key}
                webhookStatus={webhookStatus}
                onStartAnalysis={handleStartAnalysis}
                onGoToSettings={() => setActiveTab('settings')}
                onToggleWebhookMode={handleToggleWebhookMode}
                onLoadDemoStatement={handleLoadDemoData}
                onUpdateWebhookStatus={setWebhookStatus}
              />
            )}
          </div>
        )}

        {/* Tab 2: History */}
        {activeTab === 'history' && (
          <HistoryView
            statements={statements}
            language={language}
            onSelectStatement={(st) => {
              setActiveStatement(st);
              setDashboardMode('results');
              setActiveTab('dashboard');
            }}
            onDeleteStatement={handleDeleteStatement}
          />
        )}

        {/* Tab 3: Settings */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            webhookStatus={webhookStatus}
            setWebhookStatus={setWebhookStatus}
            language={language}
            onSaveSettings={handleSaveSettings}
            onLoadDemoData={handleLoadDemoData}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>

      {/* Minimalist Professional Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {settings.company_name} — Private Financial Intelligence
          </span>
          <span className="text-[11px] text-slate-400">
            Automated n8n Webhook Architecture · All Rights Reserved
          </span>
        </div>
      </footer>
    </div>
  );
}
