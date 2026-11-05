import { chromium, type Browser, type BrowserContext } from 'playwright';

export interface SafeBrowserResult {
  success: boolean;
  html?: string;
  title?: string;
  iframeCount?: number;
  finalUrl?: string;
  error?: string;
}

const BROWSER_TIMEOUT = 7000;
const MAX_REDIRECTS = 5;

const BLOCKED_PROTOCOLS = ['file:', 'ftp:', 'data:', 'blob:', 'javascript:'];

export async function safeBrowserFetch(url: string): Promise<SafeBrowserResult> {
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    const parsedUrl = new URL(url);

    // Block dangerous protocols
    if (BLOCKED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return { success: false, error: 'Blocked protocol: ' + parsedUrl.protocol };
    }

    // Only allow http/https
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return { success: false, error: 'Only HTTP/HTTPS URLs are allowed' };
    }

    const originalHost = parsedUrl.hostname;

    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--disable-file-system',
        '--disable-notifications',
        '--disable-popup-blocking',
        '--no-first-run',
        '--no-default-browser-check',
        '--autoplay-policy=no-user-gesture-required',
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
        '--deny-permission-prompts',
      ],
    });

    context = await browser.newContext({
      // Incognito by default (newContext creates isolated session)
      javaScriptEnabled: true,
      ignoreHTTPSErrors: false,
      acceptDownloads: false,
      permissions: [],
      serviceWorkers: 'block',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    // Block downloads at context level
    context.on('page', (page) => {
      page.on('download', (download) => {
        download.cancel();
      });
    });

    const page = await context.newPage();

    // Disable service workers via route interception
    await page.route('**/*', (route) => {
      const request = route.request();
      const requestUrl = request.url();

      // Block file:// and other dangerous protocols
      for (const protocol of BLOCKED_PROTOCOLS) {
        if (requestUrl.startsWith(protocol)) {
          return route.abort('blockedbyclient');
        }
      }

      // Block automatic downloads by content type
      const resourceType = request.resourceType();
      if (resourceType === 'media' || resourceType === 'other') {
        const lowerUrl = requestUrl.toLowerCase();
        const downloadExtensions = [
          '.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm',
          '.zip', '.rar', '.7z', '.tar', '.gz',
          '.bat', '.cmd', '.sh', '.ps1',
          '.apk', '.ipa',
        ];
        if (downloadExtensions.some((ext) => lowerUrl.includes(ext))) {
          return route.abort('blockedbyclient');
        }
      }

      return route.continue();
    });

    // Block navigation outside original domain
    let redirectCount = 0;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        redirectCount++;
        if (redirectCount > MAX_REDIRECTS) {
          page.close().catch(() => {});
        }
        try {
          const navUrl = new URL(frame.url());
          if (navUrl.hostname !== originalHost && navUrl.protocol !== 'about:') {
            page.close().catch(() => {});
          }
        } catch {
          // ignore invalid URL during navigation
        }
      }
    });

    // Block popups
    page.on('popup', async (popup) => {
      await popup.close().catch(() => {});
    });

    // Block dialogs (alert, confirm, prompt)
    page.on('dialog', async (dialog) => {
      await dialog.dismiss().catch(() => {});
    });

    // Navigate with timeout
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: BROWSER_TIMEOUT,
    });

    // Wait briefly for dynamic content
    await page.waitForTimeout(1000);

    // Extract data
    const html = await page.content();
    const title = await page.title();
    const finalUrl = page.url();

    const iframeCount = await page.evaluate(() => {
      return document.querySelectorAll('iframe').length;
    });

    return {
      success: true,
      html,
      title,
      iframeCount,
      finalUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Browser fetch failed';
    return {
      success: false,
      error: message,
    };
  } finally {
    // Always close browser immediately
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
