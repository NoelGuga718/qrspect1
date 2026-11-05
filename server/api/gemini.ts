/**
 * Backend API Proxy for Gemini AI
 *
 * This server-side endpoint protects your Gemini API key by keeping it
 * on the server. The frontend makes requests to this proxy instead of
 * directly calling the Gemini API.
 *
 * IMPORTANT: Never expose this file or your API keys to the client!
 */

import type { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiRequest {
  url: string;
  domain: string;
  htmlSnippet: string;
  details: {
    hasHttps?: boolean;
    iframeCount?: number;
    suspiciousScripts?: number;
    redirectCount?: number;
    hasSuspiciousForms?: boolean;
    hasDownloadTriggers?: boolean;
  };
  hardRulesScore: number;
}

export async function analyzeUrlProxy(req: Request, res: Response) {
  // Security: Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(503).json({
      error: 'AI analysis is not enabled',
      available: false
    });
  }

  try {
    const { url, domain, htmlSnippet, details, hardRulesScore }: GeminiRequest = req.body;

    // Validate input
    if (!url || !domain) {
      return res.status(400).json({ error: 'Missing required fields: url, domain' });
    }

    // Rate limiting: Basic check (you can enhance this with Redis/rate-limit library)
    // For now, we'll rely on Gemini's own rate limits

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash',
    });

    // Build prompt
    const prompt = `
You are a cybersecurity expert analyzing a URL for phishing and malware threats.

URL: ${url}
Domain: ${domain}
Hard Security Rules Score: ${hardRulesScore}/100 (higher = more dangerous)

Technical Analysis:
- HTTPS: ${details.hasHttps ? 'Yes' : 'No'}
- Iframe Count: ${details.iframeCount || 0}
- Suspicious Scripts: ${details.suspiciousScripts || 0}
- Redirects: ${details.redirectCount || 0}
- Suspicious Forms: ${details.hasSuspiciousForms ? 'Yes' : 'No'}
- Download Triggers: ${details.hasDownloadTriggers ? 'Yes' : 'No'}

HTML Snippet (first 2000 chars):
${htmlSnippet.substring(0, 2000)}

IMPORTANT RULES:
1. If Hard Rules Score >= 70, you MUST return "danger" category
2. If Hard Rules Score >= 40, you MUST return at least "caution" category
3. Hard security rules ALWAYS override AI analysis
4. Be conservative - false positives are better than missed threats

Analyze and respond ONLY in this JSON format:
{
  "score": 0-100,
  "category": "safe" | "suspicious" | "danger",
  "explanation": "Brief explanation of findings",
  "confidence": 0-100
}

Consider:
- URL structure and domain legitimacy
- HTML content patterns
- Presence of suspicious elements
- Brand impersonation attempts
- Phishing indicators
`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate category
      let category = parsed.category;
      if (category === 'suspicious') category = 'caution';
      if (!['safe', 'caution', 'danger'].includes(category)) {
        category = 'caution';
      }

      return res.json({
        score: Math.min(100, Math.max(0, parsed.score || 50)),
        category,
        explanation: parsed.explanation || 'No explanation provided',
        confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
      });
    }

    // Fallback response
    return res.json({
      score: 50,
      category: 'caution',
      explanation: 'Unable to parse AI analysis',
      confidence: 0,
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({
      error: 'AI analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
