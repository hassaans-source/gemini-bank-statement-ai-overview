import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory temporary file store for seamless file downloads by n8n
interface TempFile {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  createdAt: number;
}
const tempFiles = new Map<string, TempFile>();

// Clean up files older than 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, file] of tempFiles.entries()) {
    if (now - file.createdAt > 30 * 60 * 1000) {
      tempFiles.delete(id);
    }
  }
}, 5 * 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Body parser with 50MB payload limit for bank statements & scanned files
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 1. Temporary File Upload & Retrieval API (for n8n workflows that fetch files by URL)
  app.post('/api/upload-temp', (req, res) => {
    try {
      const { base64Data, fileName, mimeType, fileId } = req.body;
      if (!base64Data || !fileName) {
        return res.status(400).json({ error: 'base64Data and fileName are required' });
      }

      const id = fileId || crypto.randomUUID();
      // Strip data url prefix if present
      const cleanBase64 = base64Data.includes('base64,')
        ? base64Data.split('base64,')[1]
        : base64Data;

      const buffer = Buffer.from(cleanBase64, 'base64');
      tempFiles.set(id, {
        buffer,
        mimeType: mimeType || 'application/octet-stream',
        fileName,
        createdAt: Date.now(),
      });

      // Construct accessible URL
      const host = req.get('host') || `localhost:${PORT}`;
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const fileUrl = `${protocol}://${host}/api/files/${id}`;

      return res.json({
        success: true,
        fileId: id,
        fileUrl,
      });
    } catch (err: any) {
      console.error('Error saving temp file:', err);
      return res.status(500).json({ error: err.message || 'Failed to save temporary file' });
    }
  });

  app.get('/api/files/:id', (req, res) => {
    const file = tempFiles.get(req.params.id);
    if (!file) {
      return res.status(404).send('File not found or expired');
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.fileName)}"`
    );
    res.setHeader('Content-Length', file.buffer.length);
    return res.end(file.buffer);
  });

  // 2. Webhook Ping Endpoint (diagnostics & active check)
  app.post('/api/ping-webhook', async (req, res) => {
    const { webhookUrl, apiKey } = req.body;

    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.trim()) {
      return res.status(400).json({ success: false, message: 'Webhook URL is required.' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Shakir-Finance-Review-Portal/1.0',
      };
      if (apiKey && typeof apiKey === 'string' && apiKey.trim()) {
        headers['x-api-key'] = apiKey.trim();
      }

      const response = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers,
        body: JSON.stringify({ ping: true, timestamp: new Date().toISOString() }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const status = response.status;
      const text = await response.text();

      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        // text wasn't JSON
      }

      if (status === 404) {
        const isN8nNotRegistered =
          text.includes('not registered') ||
          (data && typeof data.message === 'string' && data.message.includes('not registered'));

        if (isN8nNotRegistered) {
          const isTestUrl = webhookUrl.includes('/webhook-test/');
          return res.json({
            success: false,
            isN8nInactive: true,
            status: 404,
            message: isTestUrl
              ? 'n8n Test webhook is not currently listening. In your n8n canvas, click "Listen for test event".'
              : 'n8n Workflow is Inactive: In your n8n workflow editor, click the toggle switch in the top-right to "Active".',
            message_ur: isTestUrl
              ? 'اینی ٹین (n8n) کا ٹیسٹ ایونٹ فعال نہیں ہے۔ n8n ایڈیٹر میں "Listen for test event" پر کلک کریں۔'
              : 'اینی ٹین (n8n) ورک فلو غیر فعال (Inactive) ہے۔ n8n ایڈیٹر میں دائیں جانب اوپر ٹوگل کو "Active" کریں۔',
            hint: data?.hint || 'Activate workflow in n8n top-right toggle.',
          });
        }
      }

      if (response.ok) {
        return res.json({
          success: true,
          status,
          message: data?.message || 'Connection established successfully.',
          data,
        });
      }

      return res.json({
        success: false,
        status,
        message: data?.message || `HTTP ${status}: ${response.statusText}`,
        raw: text.slice(0, 300),
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return res.json({
          success: false,
          message: 'Connection timed out after 12 seconds. Endpoint is not responding.',
        });
      }
      return res.json({
        success: false,
        message: err.message || 'Failed to connect to the specified webhook endpoint.',
      });
    }
  });

  // 3. Webhook Execution Proxy (Bypasses browser CORS & formats payload)
  app.post('/api/webhook-proxy', async (req, res) => {
    const { webhookUrl, payload, apiKey } = req.body;

    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.trim()) {
      return res.status(400).json({
        success: false,
        errorMessage: 'Webhook URL is not configured.',
      });
    }

    const controller = new AbortController();
    // 140 seconds timeout for large OCR operations
    const timeoutId = setTimeout(() => controller.abort(), 140000);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Shakir-Finance-Review-Portal/1.0',
        Accept: 'application/json, text/plain, */*',
      };
      if (apiKey && typeof apiKey === 'string' && apiKey.trim()) {
        headers['x-api-key'] = apiKey.trim();
      }

      const response = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const status = response.status;
      const responseText = await response.text();

      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch {
        // Non-JSON response
      }

      // Check for n8n Inactive Workflow (HTTP 404)
      if (status === 404) {
        const isN8nNotRegistered =
          responseText.includes('not registered') ||
          (data && typeof data.message === 'string' && data.message.includes('not registered'));

        if (isN8nNotRegistered) {
          const isTestUrl = webhookUrl.includes('/webhook-test/');
          return res.json({
            success: false,
            isN8nInactive: true,
            status: 404,
            errorMessage: isTestUrl
              ? 'n8n Test webhook is not listening. In your n8n workflow, click "Listen for test event", or activate the workflow and use the Production URL.'
              : 'n8n Workflow is Inactive: In your n8n editor, switch the top-right toggle from "Inactive" to "Active", or switch to the Test URL.',
            errorMessage_ur: isTestUrl
              ? 'اینی ٹین (n8n) کا ٹیسٹ ایونٹ فعال نہیں ہے۔ n8n میں "Listen for test event" پر کلک کریں یا ورک فلو کو ایکٹو کر کے پروڈکشن یو آر ایل استعمال کریں۔'
              : 'اینی ٹین (n8n) ورک فلو غیر فعال (Inactive) ہے۔ n8n ایڈیٹر میں دائیں جانب اوپر والے ٹوگل کو آن (Active) کریں یا ٹیسٹ یو آر ایل آزمائیں۔',
            hint: data?.hint || 'Toggle workflow to Active in n8n canvas.',
          });
        }

        return res.json({
          success: false,
          status: 404,
          errorMessage: data?.message || 'Webhook URL returned 404 Not Found. Please verify the URL in Settings.',
          errorMessage_ur: 'ویب ہک یو آر ایل پر 404 Not Found موصول ہوا۔ برائے مہربانی ترتیبات میں یو آر ایل چیک کریں۔',
        });
      }

      if (!response.ok && status >= 500) {
        return res.json({
          success: false,
          status,
          errorMessage: data?.message || `n8n server error (HTTP ${status}). Check your n8n workflow execution log.`,
          errorMessage_ur: `اینی ٹین سرور پر خرابی (HTTP ${status})۔ n8n میں ایکزیکیوشن لاگ چیک کریں۔`,
        });
      }

      // Return parsed data or fallback
      if (data) {
        return res.json({
          success: true,
          status,
          data,
        });
      } else {
        return res.json({
          success: false,
          errorMessage: 'Server did not return valid JSON output.',
          raw: responseText.slice(0, 300),
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Webhook proxy error:', err);
      if (err.name === 'AbortError') {
        return res.json({
          success: false,
          errorMessage:
            'Statement analysis timed out after 140 seconds. Large scans or complex statements may take longer, or the webhook workflow is stalled.',
          errorMessage_ur:
            'اسٹیٹمنٹ اینالیسس 140 سیکنڈ کے بعد ٹائم آؤٹ ہو گیا۔ بڑی فائل یا سست انٹرنیٹ کی وجہ سے ایسا ہو سکتا ہے۔',
        });
      }
      return res.json({
        success: false,
        errorMessage: err.message || 'Failed to reach n8n webhook endpoint.',
        errorMessage_ur: 'اینی ٹین (n8n) ویب ہک اینڈ پوائنٹ تک رابطہ قائم نہیں ہو سکا۔',
      });
    }
  });

  // 4. Client SPA mounting
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shakir Finance Portal Server listening on port ${PORT}`);
  });
}

startServer();
