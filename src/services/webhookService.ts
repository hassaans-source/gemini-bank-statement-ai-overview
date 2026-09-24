import { BankStatementResult } from '../types/finance';

export interface PingTestResult {
  success: boolean;
  message: string;
  isN8nInactive?: boolean;
}

export async function testWebhookPing(
  webhookUrl: string,
  apiKey?: string
): Promise<PingTestResult> {
  if (!webhookUrl || !webhookUrl.trim()) {
    return { success: false, message: 'Webhook URL cannot be empty.' };
  }

  // 1. First attempt: Use server proxy (/api/ping-webhook) to avoid CORS issues and get deep n8n status
  try {
    const res = await fetch('/api/ping-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl: webhookUrl.trim(),
        apiKey: apiKey?.trim() || '',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: Boolean(data.success),
        message: data.message || (data.success ? 'Connected successfully' : 'Connection failed'),
        isN8nInactive: Boolean(data.isN8nInactive),
      };
    }
  } catch (err) {
    console.warn('Proxy ping failed, attempting direct fetch...', err);
  }

  // 2. Direct fetch fallback
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey && apiKey.trim()) {
      headers['x-api-key'] = apiKey.trim();
    }

    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers,
      body: JSON.stringify({ ping: true, timestamp: new Date().toISOString() }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      const isTestUrl = webhookUrl.includes('/webhook-test/');
      return {
        success: false,
        isN8nInactive: true,
        message: isTestUrl
          ? 'n8n Test webhook is not listening. In your n8n canvas, click "Listen for test event".'
          : 'n8n Workflow is Inactive: In your n8n workflow editor, click the toggle in the top-right to "Active".',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText || 'Endpoint returned an error'}`,
      };
    }

    const data = await response.json();
    if (data && (data.status === 'success' || data.success === true || data.message)) {
      return {
        success: true,
        message: data.message || 'Connection established successfully.',
      };
    } else {
      return {
        success: false,
        message: data?.message || 'Server replied with unexpected payload format.',
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { success: false, message: 'Connection timed out after 12 seconds.' };
    }
    return {
      success: false,
      message: err.message || 'Failed to connect to the specified webhook endpoint (CORS or network error).',
    };
  }
}

export interface StatementPayload {
  file_url: string;
  file_name: string;
  reference_id: string;
  file_base64?: string;
  file_mime?: string;
  file_size?: number;
  currency?: string;
}

export async function executeStatementAnalysis(
  webhookUrl: string,
  payload: StatementPayload,
  apiKey?: string
): Promise<{
  success: boolean;
  result?: BankStatementResult;
  errorMessage?: string;
  isN8nInactive?: boolean;
}> {
  if (!webhookUrl || !webhookUrl.trim()) {
    return { success: false, errorMessage: 'Webhook URL is not configured in Settings.' };
  }

  // 1. Primary Route: Server-Side Webhook Proxy
  // Bypasses browser CORS, provides 140s timeout, and captures n8n workflow state accurately
  try {
    const proxyResponse = await fetch('/api/webhook-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookUrl: webhookUrl.trim(),
        payload: {
          file_url: payload.file_url,
          file_name: payload.file_name,
          reference_id: payload.reference_id,
          file_base64: payload.file_base64 || '',
          file_mime: payload.file_mime || 'application/pdf',
          file_size: payload.file_size || 0,
          currency: payload.currency || 'PKR',
        },
        apiKey: apiKey?.trim() || '',
      }),
    });

    if (proxyResponse.ok) {
      const proxyResult = await proxyResponse.json();

      if (proxyResult.isN8nInactive) {
        return {
          success: false,
          isN8nInactive: true,
          errorMessage: proxyResult.errorMessage || 'n8n Workflow is Inactive.',
        };
      }

      if (!proxyResult.success) {
        return {
          success: false,
          errorMessage: proxyResult.errorMessage || 'Webhook endpoint returned an error.',
        };
      }

      if (proxyResult.data) {
        const parsed = parseBankStatementPayload(proxyResult.data, payload.reference_id);
        return parsed;
      }
    }
  } catch (proxyErr) {
    console.warn('Proxy execution failed, attempting direct browser fetch...', proxyErr);
  }

  // 2. Direct Browser Fetch Fallback (if server proxy is unreachable)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 140000);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey && apiKey.trim()) {
      headers['x-api-key'] = apiKey.trim();
    }

    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      const isTestUrl = webhookUrl.includes('/webhook-test/');
      return {
        success: false,
        isN8nInactive: true,
        errorMessage: isTestUrl
          ? 'n8n Test webhook is not listening. In your n8n workflow canvas, click "Listen for test event".'
          : 'n8n Workflow is Inactive: In your n8n editor, switch the top-right toggle from Inactive to Active.',
      };
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      return {
        success: false,
        errorMessage: 'Invalid JSON response received from webhook endpoint.',
      };
    }

    return parseBankStatementPayload(data, payload.reference_id);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        errorMessage:
          'Analysis timed out after 140 seconds. The file may be very large or the webhook workflow took too long.',
      };
    }
    return {
      success: false,
      errorMessage: err.message || 'Network connection failed while calling analysis webhook.',
    };
  }
}

function parseBankStatementPayload(
  data: any,
  fallbackReferenceId: string
): { success: boolean; result?: BankStatementResult; errorMessage?: string } {
  // Check for status error flag
  if (data.status === 'error') {
    return {
      success: false,
      errorMessage: data.message || 'The server reported an error processing this statement.',
    };
  }

  const hasTransactions = Array.isArray(data.transactions) && data.transactions.length > 0;
  const allBalancesZero =
    Number(data.opening_balance || 0) === 0 &&
    Number(data.closing_balance || 0) === 0 &&
    Number(data.total_credit || 0) === 0 &&
    Number(data.total_debit || 0) === 0;

  if (!hasTransactions && allBalancesZero) {
    return {
      success: false,
      errorMessage:
        'We could not read any transactions from this file. Please upload a clearer statement.',
    };
  }

  const statementResult: BankStatementResult = {
    status: 'success',
    reference_id: data.reference_id || fallbackReferenceId,
    period_label: data.period_label || 'Current Period',
    currency: data.currency || 'PKR',
    opening_balance: Number(data.opening_balance || 0),
    closing_balance: Number(data.closing_balance || 0),
    total_credit: Number(data.total_credit || 0),
    total_debit: Number(data.total_debit || 0),
    summary: data.summary || '',
    summary_ur: data.summary_ur || data.summary || '',
    categories: Array.isArray(data.categories)
      ? data.categories.map((c: any) => ({
          name: c.name || 'Uncategorized',
          amount: Number(c.amount || 0),
          percentage: Number(c.percentage || 0),
          transaction_count: Number(c.transaction_count || 0),
        }))
      : [],
    transactions: Array.isArray(data.transactions)
      ? data.transactions.map((tx: any) => ({
          date: tx.date || new Date().toISOString().split('T')[0],
          description: tx.description || 'Transaction',
          category: tx.category || 'General',
          type: tx.type === 'credit' ? 'credit' : 'debit',
          amount: Math.abs(Number(tx.amount || 0)),
        }))
      : [],
  };

  return {
    success: true,
    result: statementResult,
  };
}
