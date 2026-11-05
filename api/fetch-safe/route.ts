/**
 * API Route: POST /api/fetch-safe
 *
 * Securely fetches page content with browser fallback.
 * Tries normal fetch first; if that fails, uses a sandboxed
 * Playwright browser to render the page and extract HTML.
 *
 * Request body: { url: string }
 *
 * Response:
 * {
 *   success: boolean,
 *   html?: string,
 *   title?: string,
 *   iframeCount?: number,
 *   error?: string
 * }
 *
 * NOTE: This file is designed for a Node.js server environment
 * (e.g., Next.js API routes, Express, or a standalone server).
 * It requires Playwright to be installed on the server.
 */

import { fetchWithFallback } from '../src/lib/fetch/fetchWithFallback';

// URL validation
const MAX_URL_LENGTH = 2048;
const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const BLOCKED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'];

function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required and must be a string' };
  }

  if (url.length > MAX_URL_LENGTH) {
    return { valid: false, error: `URL exceeds maximum length of ${MAX_URL_LENGTH} characters` };
  }

  try {
    const parsed = new URL(url);

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }

    if (BLOCKED_HOSTS.includes(parsed.hostname)) {
      return { valid: false, error: 'Requests to localhost are not allowed' };
    }

    // Block private IP ranges
    const ipMatch = parsed.hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number);
      if (
        a === 10 ||
        a === 127 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        a === 0
      ) {
        return { valid: false, error: 'Requests to private/internal IPs are not allowed' };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// Next.js / Edge-compatible handler
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { url } = body as { url?: string };

    const validation = validateUrl(url as string);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await fetchWithFallback(url as string);

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          html: result.html,
          title: result.title,
          iframeCount: result.iframeCount,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: result.error || 'Could not fetch page data',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
