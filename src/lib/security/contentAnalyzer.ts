import * as cheerio from 'cheerio';

export interface ContentAnalysisResult {
  iframeCount: number;
  hiddenIframes: number;
  suspiciousScripts: number;
  invisibleElements: number;
  hasAutoRedirect: boolean;
  hasSuspiciousForms: boolean;
  hasDownloadTriggers: boolean;
  suspiciousPatterns: string[];
  riskAddition: number;
}

export class ContentAnalyzer {
  async analyzeHTML(html: string, _baseUrl: string): Promise<ContentAnalysisResult> {
    const $ = cheerio.load(html);
    const result: ContentAnalysisResult = {
      iframeCount: 0,
      hiddenIframes: 0,
      suspiciousScripts: 0,
      invisibleElements: 0,
      hasAutoRedirect: false,
      hasSuspiciousForms: false,
      hasDownloadTriggers: false,
      suspiciousPatterns: [],
      riskAddition: 0,
    };

    this.analyzeIframes($, result);
    this.analyzeScripts($, result);
    this.analyzeForms($, result);
    this.analyzeRedirects($, result);
    this.analyzeInvisibleElements($, result);
    this.analyzeDownloadTriggers($, result);
    this.analyzePhishingPatterns($, result);

    return result;
  }

  private analyzeIframes($: cheerio.CheerioAPI, result: ContentAnalysisResult): void {
    const iframes = $('iframe');
    result.iframeCount = iframes.length;

    if (result.iframeCount > 5) {
      result.suspiciousPatterns.push('excessive_iframes');
      result.riskAddition += 20;
    }

    iframes.each((_, elem) => {
      const $iframe = $(elem);
      const style = $iframe.attr('style') || '';
      const width = $iframe.attr('width');
      const height = $iframe.attr('height');

      if (style.includes('display:none') ||
          style.includes('visibility:hidden') ||
          style.includes('opacity:0') ||
          width === '0' ||
          height === '0') {
        result.hiddenIframes++;
        result.suspiciousPatterns.push('hidden_iframe');
        result.riskAddition += 25;
      }
    });

    if (result.hiddenIframes > 0) {
      result.riskAddition += 15;
    }
  }

  private analyzeScripts($: cheerio.CheerioAPI, result: ContentAnalysisResult): void {
    const scripts = $('script');

    scripts.each((_, elem) => {
      const $script = $(elem);
      const content = $script.html() || '';
      const src = $script.attr('src') || '';

      const suspiciousPatterns = [
        'eval(',
        'document.write',
        'escape(',
        'unescape(',
        'fromCharCode',
        'atob(',
        'btoa(',
        'String.fromCharCode',
        '\\x',
        '\\u',
      ];

      for (const pattern of suspiciousPatterns) {
        if (content.includes(pattern) || src.includes(pattern)) {
          result.suspiciousScripts++;
          result.suspiciousPatterns.push('obfuscated_script');
          result.riskAddition += 10;
          break;
        }
      }

      if (content.includes('keylogger') ||
          content.includes('password') && content.includes('send')) {
        result.suspiciousPatterns.push('potential_keylogger');
        result.riskAddition += 50;
      }
    });

    if (result.suspiciousScripts > 3) {
      result.riskAddition += 15;
    }
  }

  private analyzeForms($: cheerio.CheerioAPI, result: ContentAnalysisResult): void {
    const forms = $('form');

    forms.each((_, elem) => {
      const $form = $(elem);
      const action = $form.attr('action') || '';
      const hasPassword = $form.find('input[type="password"]').length > 0;
      const hasCreditCard = $form.find('input[name*="card"], input[name*="credit"]').length > 0;

      if (hasPassword || hasCreditCard) {
        const isSecure = action.startsWith('https://') ||
                        (action === '' && result.suspiciousPatterns.includes('https'));

        if (!isSecure && action !== '') {
          result.hasSuspiciousForms = true;
          result.suspiciousPatterns.push('insecure_form');
          result.riskAddition += 30;
        }
      }

      const visibleInputs = $form.find('input:visible').length;
      const hiddenInputs = $form.find('input[type="hidden"]').length;

      if (hiddenInputs > visibleInputs * 2) {
        result.suspiciousPatterns.push('excessive_hidden_inputs');
        result.riskAddition += 20;
      }
    });
  }

  private analyzeRedirects($: cheerio.CheerioAPI, result: ContentAnalysisResult): void {
    const metaRefresh = $('meta[http-equiv="refresh"]');

    if (metaRefresh.length > 0) {
      const content = metaRefresh.attr('content') || '';
      if (content.includes('url=')) {
        result.hasAutoRedirect = true;
        result.suspiciousPatterns.push('meta_redirect');
        result.riskAddition += 15;
      }
    }

    const scripts = $('script');
    scripts.each((_, elem) => {
      const content = $(elem).html() || '';
      if (content.includes('window.location') ||
          content.includes('location.href') ||
          content.includes('location.replace')) {
        result.hasAutoRedirect = true;
        result.suspiciousPatterns.push('javascript_redirect');
        result.riskAddition += 20;
      }
    });
  }

  private analyzeInvisibleElements($: cheerio.CheerioAPI, result: ContentAnalysisResult): void {
    const invisibleSelectors = [
      '[style*="display:none"]',
      '[style*="visibility:hidden"]',
      '[style*="opacity:0"]',
      '[style*="position:absolute"][style*="left:-"]',
      '[style*="position:fixed"][style*="left:-"]',
      '[style*="z-index:-"]',
      '.hidden',
      '[hidden]',
    ];

    invisibleSelectors.forEach(selector => {
      const elements = $(selector);
      result.invisibleElements += elements.length;
    });

    if (result.invisibleElements > 10) {
      result.suspiciousPatterns.push('excessive_invisible_elements');
      result.riskAddition += 15;
    }
  }

  private analyzeDownloadTriggers($: cheerio.CheerioAPI, result: ContentAnalysisResult): void {
    const downloadLinks = $('a[download], a[href$=".exe"], a[href$=".dmg"], a[href$=".apk"], a[href$=".msi"]');

    if (downloadLinks.length > 0) {
      result.hasDownloadTriggers = true;
      result.suspiciousPatterns.push('download_triggers');
      result.riskAddition += 10;
    }

    const scripts = $('script');
    scripts.each((_, elem) => {
      const content = $(elem).html() || '';
      if (content.includes('download') &&
          (content.includes('.exe') || content.includes('.dmg') || content.includes('.apk'))) {
        result.hasDownloadTriggers = true;
        result.suspiciousPatterns.push('forced_download');
        result.riskAddition += 25;
      }
    });
  }

  private analyzePhishingPatterns($: cheerio.CheerioAPI, result: ContentAnalysisResult): void {
    const title = $('title').text().toLowerCase();
    const bodyText = $('body').text().toLowerCase();

    const phishingKeywords = [
      'verify your account',
      'confirm your identity',
      'update your information',
      'suspended',
      'unusual activity',
      'security alert',
      'login attempt',
      'password expired',
    ];

    for (const keyword of phishingKeywords) {
      if (title.includes(keyword) || bodyText.includes(keyword)) {
        result.suspiciousPatterns.push('phishing_language');
        result.riskAddition += 15;
        break;
      }
    }

    const passwordFields = $('input[type="password"]').length;
    const loginButtons = $('button:contains("Login"), button:contains("Sign in"), input[value*="Login"], input[value*="Sign in"]').length;

    if (passwordFields > 0 && loginButtons > 0) {
      const brandNames = ['paypal', 'apple', 'microsoft', 'google', 'facebook', 'amazon', 'netflix'];
      for (const brand of brandNames) {
        if (title.includes(brand) || bodyText.includes(brand)) {
          const logoImages = $(`img[alt*="${brand}"], img[src*="${brand}"]`).length;
          if (logoImages > 0) {
            result.suspiciousPatterns.push(`possible_${brand}_phishing`);
            result.riskAddition += 30;
          }
        }
      }
    }
  }
}

export const contentAnalyzer = new ContentAnalyzer();
