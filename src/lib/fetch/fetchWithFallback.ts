import { safeBrowserFetch, type SafeBrowserResult } from '@/lib/browser/safeBrowser';

export interface FetchFallbackResult {
  success: boolean;
  html?: string;
  title?: string;
  iframeCount?: number;
  finalUrl?: string;
  method: 'fetch' | 'browser' | 'none';
  error?: string;
}

const FETCH_TIMEOUT = 5000;

const ERROR_MESSAGE = [
  'Could not fetch page data.',
  'Possible reasons:',
  '- Site blocked automated requests',
  '- Requires login or authentication',
  '- Bot protection (Cloudflare, CAPTCHA)',
  '- Connection timeout',
  '- SSL/TLS error',
].join('\n');

export async function fetchWithFallback(url: string): Promise<FetchFallbackResult> {
  // Step 1: Try normal fetch
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
        const html = await response.text();

        if (html && html.trim().length > 0) {
          const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : '';

          const iframeMatches = html.match(/<iframe[\s>]/gi);
          const iframeCount = iframeMatches ? iframeMatches.length : 0;

          return {
            success: true,
            html,
            title,
            iframeCount,
            finalUrl: response.url || url,
            method: 'fetch',
          };
        }
      }
    }
  } catch (e) {
    console.log('[fetchWithFallback] Normal fetch failed:', e instanceof Error ? e.message : e);
  }

  // Step 2: Try secure browser fallback
  try {
    const browserResult: SafeBrowserResult = await safeBrowserFetch(url);

    if (browserResult.success && browserResult.html) {
      return {
        success: true,
        html: browserResult.html,
        title: browserResult.title,
        iframeCount: browserResult.iframeCount,
        finalUrl: browserResult.finalUrl,
        method: 'browser',
      };
    }

    // Browser ran but didn't get usable HTML
    return {
      success: false,
      method: 'none',
      error: browserResult.error || ERROR_MESSAGE,
    };
  } catch (e) {
    console.log('[fetchWithFallback] Browser fallback failed:', e instanceof Error ? e.message : e);
  }

  // Step 3: Both failed
  return {
    success: false,
    method: 'none',
    error: ERROR_MESSAGE,
  };
}
