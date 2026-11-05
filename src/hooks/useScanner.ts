import { useState, useCallback } from 'react';
import { securityEngine } from '@/lib/security/engine';
import { geminiAnalyzer } from '@/lib/ai/gemini';
import { firebaseService } from '@/lib/firebase/services';
import { isDomainSafelisted } from '@/lib/security/safelist';
import type { ScanResult, ScanType, RiskLevel } from '@/types';

interface ScanState {
  isScanning: boolean;
  result: ScanResult | null;
  error: string | null;
}

export function useScanner() {
  const [state, setState] = useState<ScanState>({
    isScanning: false,
    result: null,
    error: null,
  });

  const scanUrl = useCallback(async (
    url: string,
    type: ScanType,
    userId?: string
  ): Promise<ScanResult | null> => {
    setState({ isScanning: true, result: null, error: null });

    try {
      let normalizedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        normalizedUrl = 'https://' + url;
      }

      const urlObj = new URL(normalizedUrl);
      const domain = urlObj.hostname;

      const isSafe = isDomainSafelisted(domain);

      // Try to fetch HTML content for analysis
      let htmlContent = '';
      let pageTitle = '';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(normalizedUrl, {
          method: 'GET',
          mode: 'no-cors',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          htmlContent = await response.text();
          // Extract title from HTML
          const titleMatch = htmlContent.match(/<title[^>]*>([^<]*)<\/title>/i);
          pageTitle = titleMatch ? titleMatch[1] : '';
        }
      } catch (e) {
        console.log('Could not fetch HTML content:', e);
      }

      // Run security analysis with HTML content
      const securityResult = await securityEngine.analyzeUrl(normalizedUrl, htmlContent, pageTitle);

      let finalScore = securityResult.score;
      let aiResult = null;

      // AI analysis (if available and domain not safelisted)
      if (geminiAnalyzer.isAvailable() && !isSafe) {
        aiResult = await geminiAnalyzer.analyzeUrl(
          normalizedUrl,
          domain,
          htmlContent,
          securityResult.details,
          securityResult.score
        );

        if (aiResult) {
          // Combine AI score with security score
          // AI score is 0-100 (higher = more dangerous)
          // Our score is 0-100 (higher = safer)
          // Convert AI to our scale: 100 - aiScore
          const aiConvertedScore = 100 - aiResult.score;

          // Weight: 70% security rules, 30% AI
          finalScore = Math.round((securityResult.score * 0.7) + (aiConvertedScore * 0.3));
        }
      }

      // Ensure score is within bounds
      finalScore = Math.min(100, Math.max(0, finalScore));

      // Determine risk level (0-50 = danger, 51-89 = caution, 90-100 = safe)
      let riskLevel: RiskLevel;
      if (finalScore < 50) riskLevel = 'danger';
      else if (finalScore < 90) riskLevel = 'caution';
      else riskLevel = 'safe';

      // Safelist override for low-risk domains
      if (isSafe && finalScore > 50) {
        riskLevel = 'safe';
        finalScore = Math.max(71, finalScore);
      }

      const resultText = securityResult.explanation;

      const scanResult: ScanResult = {
        id: Date.now().toString(),
        url: normalizedUrl,
        type,
        riskScore: finalScore,
        riskLevel,
        result: resultText,
        timestamp: new Date(),
        details: {
          ...securityResult.details,
          aiAnalysis: aiResult ? {
            score: aiResult.score,
            explanation: aiResult.explanation,
            category: aiResult.category,
            confidence: aiResult.confidence,
          } : undefined,
        },
      };

      // Save dangerous links to Firebase for tracking (even for guests)
      // User scans will be saved by useScans hook
      if ((riskLevel === 'danger' || riskLevel === 'caution') && !userId) {
        const saveTimeout = (promise: Promise<unknown>, ms: number) =>
          Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Save timeout')), ms))]);

        try {
          await saveTimeout(firebaseService.saveDangerousLink(
            normalizedUrl,
            resultText,
            finalScore,
            securityResult.flags
          ), 5000);
        } catch (saveError) {
          console.log('Could not save dangerous link to database:', saveError);
        }
      }

      setState({ isScanning: false, result: scanResult, error: null });
      return scanResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({ isScanning: false, result: null, error: errorMessage });
      return null;
    }
  }, []);

  const clearResult = useCallback(() => {
    setState({ isScanning: false, result: null, error: null });
  }, []);

  return {
    ...state,
    scanUrl,
    clearResult,
  };
}
