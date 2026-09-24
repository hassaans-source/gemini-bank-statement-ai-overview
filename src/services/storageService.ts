import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppSettings, BudgetOverride, SavedStatement } from '../types/finance';
import { DEMO_AUGUST_2026, DEMO_SEPTEMBER_2026 } from '../utils/demoData';

const SETTINGS_KEY = 'shakir_portal_settings';
const STATEMENTS_KEY = 'shakir_portal_statements';
const BUDGET_OVERRIDES_KEY = 'shakir_portal_budget_overrides';

export const DEFAULT_SETTINGS: AppSettings = {
  webhook_url: 'https://testing9184.app.n8n.cloud/webhook/analyze-bank-statement',
  api_key: '',
  company_name: 'Finance Overview',
  low_balance_threshold: 200000,
  supabase_url: (import.meta as any).env?.VITE_SUPABASE_URL || '',
  supabase_anon_key: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '',
};

let cachedClient: SupabaseClient | null = null;
let cachedClientUrl = '';
let cachedClientKey = '';

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const targetUrl = url || DEFAULT_SETTINGS.supabase_url;
  const targetKey = anonKey || DEFAULT_SETTINGS.supabase_anon_key;

  if (!targetUrl || !targetKey) {
    return null;
  }

  if (cachedClient && cachedClientUrl === targetUrl && cachedClientKey === targetKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(targetUrl, targetKey);
    cachedClientUrl = targetUrl;
    cachedClientKey = targetKey;
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

// 1. Settings
export async function loadSettings(): Promise<AppSettings> {
  let settings = { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      settings = { ...settings, ...parsed };
    }
  } catch (e) {
    console.error('Error reading settings from localStorage:', e);
  }

  // Attempt Supabase fetch if configured
  const supabase = getSupabaseClient(settings.supabase_url, settings.supabase_anon_key);
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        settings.webhook_url = data.webhook_url || settings.webhook_url;
        settings.company_name = data.company_name || settings.company_name;
        settings.low_balance_threshold = data.low_balance_threshold ?? settings.low_balance_threshold;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      }
    } catch (e) {
      console.warn('Supabase settings fetch failed, using local settings:', e);
    }
  }

  return settings;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

  const supabase = getSupabaseClient(settings.supabase_url, settings.supabase_anon_key);
  if (supabase) {
    try {
      await supabase.from('settings').upsert({
        id: 1,
        webhook_url: settings.webhook_url,
        company_name: settings.company_name,
        low_balance_threshold: settings.low_balance_threshold,
      });
    } catch (e) {
      console.warn('Could not sync settings to Supabase:', e);
    }
  }
}

// 2. Statements
export async function loadStatements(settings?: AppSettings): Promise<SavedStatement[]> {
  let localStatements: SavedStatement[] = [];
  try {
    const raw = localStorage.getItem(STATEMENTS_KEY);
    if (raw) {
      localStatements = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading statements from localStorage:', e);
  }

  // If no statements in localStorage, seed with demo data so the dashboard is immediately ready
  if (localStatements.length === 0) {
    localStatements = [DEMO_SEPTEMBER_2026, DEMO_AUGUST_2026];
    localStorage.setItem(STATEMENTS_KEY, JSON.stringify(localStatements));
  }

  const supabase = getSupabaseClient(settings?.supabase_url, settings?.supabase_anon_key);
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('statements')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const cloudStatements: SavedStatement[] = data.map((d: any) => ({
          id: d.id,
          created_at: d.created_at,
          file_name: d.file_name,
          period_label: d.period_label,
          currency: d.currency,
          closing_balance: Number(d.closing_balance),
          total_debit: Number(d.total_debit),
          total_credit: Number(d.total_credit),
          result: d.result,
        }));
        localStorage.setItem(STATEMENTS_KEY, JSON.stringify(cloudStatements));
        return cloudStatements;
      }
    } catch (e) {
      console.warn('Supabase statements fetch error, returning local:', e);
    }
  }

  return localStatements;
}

export async function saveStatement(statement: SavedStatement, settings?: AppSettings): Promise<void> {
  const current = await loadStatements(settings);
  // Remove any statement with identical ID
  const filtered = current.filter((s) => s.id !== statement.id);
  const updated = [statement, ...filtered];
  localStorage.setItem(STATEMENTS_KEY, JSON.stringify(updated));

  const supabase = getSupabaseClient(settings?.supabase_url, settings?.supabase_anon_key);
  if (supabase) {
    try {
      await supabase.from('statements').upsert({
        id: statement.id,
        created_at: statement.created_at,
        file_name: statement.file_name,
        period_label: statement.period_label,
        currency: statement.currency,
        closing_balance: statement.closing_balance,
        total_debit: statement.total_debit,
        total_credit: statement.total_credit,
        result: statement.result,
      });
    } catch (e) {
      console.warn('Could not sync statement to Supabase:', e);
    }
  }
}

export async function deleteStatement(id: string, settings?: AppSettings): Promise<SavedStatement[]> {
  const current = await loadStatements(settings);
  const updated = current.filter((s) => s.id !== id);
  localStorage.setItem(STATEMENTS_KEY, JSON.stringify(updated));

  const supabase = getSupabaseClient(settings?.supabase_url, settings?.supabase_anon_key);
  if (supabase) {
    try {
      await supabase.from('statements').delete().eq('id', id);
    } catch (e) {
      console.warn('Could not delete statement from Supabase:', e);
    }
  }

  return updated;
}

// 3. Budget Overrides
export async function loadBudgetOverrides(settings?: AppSettings): Promise<BudgetOverride[]> {
  let overrides: BudgetOverride[] = [];
  try {
    const raw = localStorage.getItem(BUDGET_OVERRIDES_KEY);
    if (raw) {
      overrides = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading budget overrides:', e);
  }

  const supabase = getSupabaseClient(settings?.supabase_url, settings?.supabase_anon_key);
  if (supabase) {
    try {
      const { data, error } = await supabase.from('budget_overrides').select('*');
      if (!error && data) {
        overrides = data.map((d: any) => ({
          category: d.category,
          amount: Number(d.amount),
        }));
        localStorage.setItem(BUDGET_OVERRIDES_KEY, JSON.stringify(overrides));
      }
    } catch (e) {
      console.warn('Supabase budget overrides load failed:', e);
    }
  }

  return overrides;
}

export async function saveBudgetOverride(
  category: string,
  amount: number,
  settings?: AppSettings
): Promise<BudgetOverride[]> {
  const current = await loadBudgetOverrides(settings);
  const filtered = current.filter(
    (o) => o.category.toLowerCase().trim() !== category.toLowerCase().trim()
  );
  const updated = [...filtered, { category: category.trim(), amount }];
  localStorage.setItem(BUDGET_OVERRIDES_KEY, JSON.stringify(updated));

  const supabase = getSupabaseClient(settings?.supabase_url, settings?.supabase_anon_key);
  if (supabase) {
    try {
      await supabase.from('budget_overrides').upsert({
        category: category.trim(),
        amount,
      });
    } catch (e) {
      console.warn('Could not sync budget override to Supabase:', e);
    }
  }

  return updated;
}

// 4. File Upload & Signed URL
export async function uploadStatementFileAndGetSignedUrl(
  file: File,
  settings: AppSettings
): Promise<{
  fileUrl: string;
  referenceId: string;
  fileBase64: string;
  mimeType: string;
  fileSize: number;
}> {
  const referenceId = crypto.randomUUID();
  const fileExt = file.name.split('.').pop() || 'dat';
  const filePath = `statements/${referenceId}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const mimeType = file.type || 'application/octet-stream';
  const fileSize = file.size;

  // Convert to Base64 in memory
  const base64Data: string = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = (reader.result as string) || '';
      resolve(res);
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });

  const cleanBase64 = base64Data.includes('base64,')
    ? base64Data.split('base64,')[1]
    : base64Data;

  const supabase = getSupabaseClient(settings.supabase_url, settings.supabase_anon_key);
  if (supabase) {
    try {
      // 1. Upload to Supabase bucket 'statements'
      const { error: uploadError } = await supabase.storage
        .from('statements')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!uploadError) {
        // 2. Create signed URL valid for 15 minutes (900 seconds)
        const { data: signedData, error: signedError } = await supabase.storage
          .from('statements')
          .createSignedUrl(filePath, 900);

        if (!signedError && signedData?.signedUrl) {
          return {
            fileUrl: signedData.signedUrl,
            referenceId,
            fileBase64: cleanBase64,
            mimeType,
            fileSize,
          };
        }
      } else {
        console.warn('Supabase storage upload error:', uploadError);
      }
    } catch (err) {
      console.warn('Supabase upload exception:', err);
    }
  }

  // If Supabase is not configured, register temporary accessible file on the server
  try {
    const resp = await fetch('/api/upload-temp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Data: cleanBase64,
        fileName: file.name,
        mimeType,
        fileId: referenceId,
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data && data.fileUrl) {
        return {
          fileUrl: data.fileUrl,
          referenceId,
          fileBase64: cleanBase64,
          mimeType,
          fileSize,
        };
      }
    }
  } catch (apiErr) {
    console.warn('Local temp file upload failed, falling back to data URL:', apiErr);
  }

  // Ultimate fallback: data URL
  return {
    fileUrl: base64Data || URL.createObjectURL(file),
    referenceId,
    fileBase64: cleanBase64,
    mimeType,
    fileSize,
  };
}

// Reset / Demo
export async function resetAllData(settings?: AppSettings): Promise<void> {
  localStorage.removeItem(STATEMENTS_KEY);
  localStorage.removeItem(BUDGET_OVERRIDES_KEY);

  const supabase = getSupabaseClient(settings?.supabase_url, settings?.supabase_anon_key);
  if (supabase) {
    try {
      await supabase.from('statements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('budget_overrides').delete().neq('category', '');
    } catch (e) {
      console.warn('Could not clear Supabase tables:', e);
    }
  }
}

export async function loadDemoDataIntoPortal(settings?: AppSettings): Promise<SavedStatement[]> {
  const statements = [DEMO_SEPTEMBER_2026, DEMO_AUGUST_2026];
  localStorage.setItem(STATEMENTS_KEY, JSON.stringify(statements));

  const supabase = getSupabaseClient(settings?.supabase_url, settings?.supabase_anon_key);
  if (supabase) {
    try {
      for (const st of statements) {
        await supabase.from('statements').upsert({
          id: st.id,
          created_at: st.created_at,
          file_name: st.file_name,
          period_label: st.period_label,
          currency: st.currency,
          closing_balance: st.closing_balance,
          total_debit: st.total_debit,
          total_credit: st.total_credit,
          result: st.result,
        });
      }
    } catch (e) {
      console.warn('Could not insert demo data to Supabase:', e);
    }
  }

  return statements;
}
