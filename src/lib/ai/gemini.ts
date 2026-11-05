import type { AIAnalysisResult, ScanDetails } from '@/types';

/**
 * Gemini Analyzer - Uses Backend Proxy for Security
 *
 * This class makes requests to our backend API proxy instead of
 * directly calling the Gemini API. This keeps the API key secure
 * on the server side.
 */
export class GeminiAnalyzer {
  private apiUrl: string;

  constructor() {
    // Use backend proxy URL (Vite will proxy /api/gemini to backend server)
    this.apiUrl = '/api/gemini/analyze';
  }

  isAvailable(): boolean {
    return import.meta.env.VITE_GEMINI_ENABLED === 'true';
  }

  async analyzeUrl(
    url: string,
    domain: string,
    htmlSnippet: string,
    details: Partial<ScanDetails>,
    hardRulesScore: number
  ): Promise<AIAnalysisResult | null> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          domain,
          htmlSnippet,
          details: {
            hasHttps: details.hasHttps,
            iframeCount: details.iframeCount,
            suspiciousScripts: details.suspiciousScripts,
            redirectCount: details.redirectCount,
            hasSuspiciousForms: details.hasSuspiciousForms,
            hasDownloadTriggers: details.hasDownloadTriggers,
          },
          hardRulesScore,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Gemini proxy error:', error);
        return null;
      }

      const result: AIAnalysisResult = await response.json();
      return result;
    } catch (error) {
      console.error('Gemini analysis error:', error);
      return null;
    }
  }
}

export const geminiAnalyzer = new GeminiAnalyzer();
