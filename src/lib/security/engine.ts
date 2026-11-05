import { parse } from 'tldts';
import { SUSPICIOUS_TLDS, URL_SHORTENERS, isDomainSafelisted, isIpLoggerDomain } from './safelist';
import type { SecurityCheck, ScanDetails, RiskLevel } from '@/types';

export interface SecurityAnalysisResult {
  score: number;
  riskLevel: RiskLevel;
  checks: SecurityCheck[];
  details: ScanDetails;
  flags: string[];
  triggeredRules: string[];
  explanation: string;
}

// Extended suspicious TLDs
const HIGH_RISK_TLDS = new Set([
  'zip', 'mov', 'exe', 'app', 'dev', 'io', 'tk', 'ml', 'ga', 'cf', 'gq',
  'xyz', 'top', 'click', 'download', 'work', 'date', 'racing', 'win',
  'country', 'stream', 'gdn', 'men', 'bid', 'download', 'link', 'party',
  'racing', 'review', 'science', 'trade', 'webcam', 'accountant', 'cricket',
  'date', 'faith', 'loan', 'men', 'review', 'science', 'trade', 'webcam',
  'win', 'download', 'link', 'party', 'racing', 'review', 'science', 'trade',
  'webcam', 'accountant', 'cricket', 'date', 'faith', 'loan', 'men', 'review',
  'science', 'trade', 'webcam', 'win', 'download', 'link', 'party', 'racing',
  'review', 'science', 'trade', 'webcam', 'accountant', 'cricket', 'date',
  'faith', 'loan', 'men', 'review', 'science', 'trade', 'webcam', 'win',
]);

// Free hosting domains
const FREE_HOSTING_DOMAINS = new Set([
  '000webhost.com', 'freehosting.com', 'infinityfree.com', 'byet.host',
  'freehostia.com', 'awardspace.com', 'x10hosting.com', 'freehostingeu.com',
  'profreehost.com', 'googiehost.com', 'freehostingnoads.net', 'biz.nf',
  'netlify.app', 'vercel.app', 'github.io', 'gitlab.io', 'herokuapp.com',
  'firebaseapp.com', 'surge.sh', 'glitch.me', 'repl.co', 'codeanyapp.com',
]);

// Suspicious ports
const SUSPICIOUS_PORTS = new Set([
  '8080', '8443', '3128', '1080', '4145', '5678', '6666', '6667', '6668', '6669',
  '31337', '12345', '54321', '27017', '27018', '27019', '28017', '3306', '1433',
  '1521', '5432', '6379', '9200', '9300', '11211', '27015', '28960', '25565',
]);

// Urgency keywords
const URGENCY_KEYWORDS = [
  'urgent', 'immediate', 'act now', 'limited time', 'expires soon',
  'last chance', 'don\'t miss', 'hurry', 'critical', 'emergency',
  'warning', 'alert', 'attention', 'important', 'verify now',
  'confirm now', 'update now', 'login now', 'click now',
];

// Fake update messages
const FAKE_UPDATE_PATTERNS = [
  'update required', 'system update', 'software update', 'browser update',
  'flash update', 'plugin update', 'your system is outdated',
  'critical update', 'security update required', 'install update',
];

export class SecurityEngine {
  private checks: SecurityCheck[] = [];
  private riskScore: number = 100;
  private flags: string[] = [];
  private triggeredRules: string[] = [];

  async analyzeUrl(url: string, htmlContent?: string, pageTitle?: string): Promise<SecurityAnalysisResult> {
    this.checks = [];
    this.riskScore = 100;
    this.flags = [];
    this.triggeredRules = [];

    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;

    const details: ScanDetails = {
      domain,
      hasHttps: parsedUrl.protocol === 'https:',
      iframeCount: 0,
      suspiciousScripts: 0,
      redirectCount: 0,
      hasSuspiciousForms: false,
      hasDownloadTriggers: false,
      flags: [],
    };

    // Run all security checks
    this.checkUrlHeuristics(url, domain);
    this.checkDomainSecurity(domain);
    this.checkNetworkSecurity(url, parsedUrl);
    this.checkRedirectBehavior(url);
    this.checkTyposquatting(domain);
    this.checkIpLoggerDomain(domain);

    if (htmlContent) {
      this.checkContentSignals(htmlContent, domain, pageTitle);
      this.checkIframeAndScripts(htmlContent);
    }

    const isSafe = isDomainSafelisted(domain);

    // Safelist domains get risk reduction
    if (isSafe) {
      this.riskScore = Math.max(0, this.riskScore - 30);
      this.triggeredRules.push('Domain in safelist');
    }

    const riskLevel = this.calculateRiskLevel();
    details.flags = this.flags;

    const explanation = this.generateExplanation(riskLevel);

    return {
      score: Math.min(100, Math.max(0, this.riskScore)),
      riskLevel,
      checks: this.checks,
      details,
      flags: this.flags,
      triggeredRules: this.triggeredRules,
      explanation,
    };
  }

  // ========== URL + DOMAIN HEURISTICS ==========
  private checkUrlHeuristics(url: string, domain: string): void {
    // Excessive URL length
    if (url.length > 150) {
      this.riskScore -= 15;
      this.flags.push('excessive_url_length');
      this.triggeredRules.push(`URL length ${url.length} chars (>150)`);
    }

    // Many subdomains (3+)
    const subdomainCount = domain.split('.').length - 2;
    if (subdomainCount >= 3) {
      this.riskScore -= 10 * subdomainCount;
      this.flags.push('excessive_subdomains');
      this.triggeredRules.push(`${subdomainCount} subdomains detected`);
    }

    // Random character domains
    const domainName = domain.split('.')[0];
    if (domainName.length > 15 && this.isRandomString(domainName)) {
      this.riskScore -= 25;
      this.flags.push('random_domain_name');
      this.triggeredRules.push('Random character domain detected');
    }

    // Mixed unicode characters
    if (/[^\x00-\x7F]/.test(domain)) {
      this.riskScore -= 30;
      this.flags.push('unicode_domain');
      this.triggeredRules.push('Unicode characters in domain (homograph attack risk)');
    }

    // Punycode domains
    if (domain.startsWith('xn--') || url.includes('xn--')) {
      this.riskScore -= 35;
      this.flags.push('punycode_domain');
      this.triggeredRules.push('Punycode domain detected');
    }

    // Data URLs
    if (url.startsWith('data:')) {
      this.riskScore -= 50;
      this.flags.push('data_url');
      this.triggeredRules.push('Data URL blocked');
    }

    // Blob URLs
    if (url.startsWith('blob:')) {
      this.riskScore -= 40;
      this.flags.push('blob_url');
      this.triggeredRules.push('Blob URL detected');
    }
  }

  // ========== DOMAIN SECURITY ==========
  private checkDomainSecurity(domain: string): void {
    const parsed = parse(domain);

    if (!parsed.domain) {
      this.riskScore -= 15;
      this.flags.push('unparseable_domain');
      this.triggeredRules.push('Unable to parse domain');
      return;
    }

    // Suspicious TLDs
    if (parsed.publicSuffix) {
      if (HIGH_RISK_TLDS.has(parsed.publicSuffix)) {
        this.riskScore -= 30;
        this.flags.push('high_risk_tld');
        this.triggeredRules.push(`High-risk TLD: .${parsed.publicSuffix}`);
      } else if (SUSPICIOUS_TLDS.has(parsed.publicSuffix)) {
        this.riskScore -= 20;
        this.flags.push('suspicious_tld');
        this.triggeredRules.push(`Suspicious TLD: .${parsed.publicSuffix}`);
      }
    }

    // Free hosting domains
    const baseDomain = parsed.domain.toLowerCase();
    for (const hostingDomain of FREE_HOSTING_DOMAINS) {
      if (baseDomain.includes(hostingDomain)) {
        this.riskScore -= 15;
        this.flags.push('free_hosting');
        this.triggeredRules.push('Free hosting domain detected');
        break;
      }
    }

    // Long subdomain parts
    const parts = domain.split('.');
    for (const part of parts) {
      if (part.length > 30) {
        this.riskScore -= 10;
        this.flags.push('long_subdomain');
        this.triggeredRules.push('Suspiciously long subdomain part');
        break;
      }
    }

    // Numbers replacing letters
    const letterReplacements = [
      { pattern: /g00gle/i, original: 'google' },
      { pattern: /faceb00k/i, original: 'facebook' },
      { pattern: /amaz0n/i, original: 'amazon' },
      { pattern: /paypa1/i, original: 'paypal' },
      { pattern: /micr0soft/i, original: 'microsoft' },
      { pattern: /app1e/i, original: 'apple' },
      { pattern: /tw1tter/i, original: 'twitter' },
      { pattern: /1nstagram/i, original: 'instagram' },
      { pattern: /l1nkedin/i, original: 'linkedin' },
      { pattern: /netf1ix/i, original: 'netflix' },
      { pattern: /gma1l/i, original: 'gmail' },
      { pattern: /yah00/i, original: 'yahoo' },
    ];

    for (const { pattern, original } of letterReplacements) {
      if (pattern.test(domain)) {
        this.riskScore -= 40;
        this.flags.push(`typosquatting_${original}`);
        this.triggeredRules.push(`Number-letter substitution: ${original}`);
      }
    }
  }

  // ========== NETWORK SECURITY ==========
  private checkNetworkSecurity(url: string, parsedUrl: URL): void {
    // IP-based URLs
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsedUrl.hostname)) {
      this.riskScore -= 35;
      this.flags.push('ip_based_url');
      this.triggeredRules.push('IP-based URL detected');
    }

    // Localhost
    if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname.endsWith('.localhost')) {
      this.riskScore -= 50;
      this.flags.push('localhost_reference');
      this.triggeredRules.push('Localhost reference blocked');
    }

    // Suspicious ports
    const port = parsedUrl.port;
    if (port && SUSPICIOUS_PORTS.has(port)) {
      this.riskScore -= 25;
      this.flags.push('suspicious_port');
      this.triggeredRules.push(`Suspicious port: ${port}`);
    }

    // HTTPS check
    if (parsedUrl.protocol !== 'https:') {
      this.riskScore -= 15;
      this.flags.push('no_https');
      this.triggeredRules.push('No HTTPS encryption');
    }

    // Open redirect patterns
    const openRedirectParams = ['url=', 'redirect=', 'return=', 'next=', 'goto=', 'returnUrl='];
    const urlLower = url.toLowerCase();
    for (const param of openRedirectParams) {
      if (urlLower.includes(param)) {
        this.riskScore -= 10;
        this.flags.push('open_redirect_param');
        this.triggeredRules.push('Open redirect parameter detected');
        break;
      }
    }
  }

  // ========== REDIRECT BEHAVIOR ==========
  private checkRedirectBehavior(url: string): void {
    // URL shorteners
    const domain = new URL(url).hostname.toLowerCase();
    if (URL_SHORTENERS.has(domain)) {
      this.riskScore -= 20;
      this.flags.push('url_shortener');
      this.triggeredRules.push('URL shortener detected');
    }

    // Suspicious patterns in URL
    const suspiciousPatterns = [
      /@(?!.*@)/,  // @ symbol (credential stuffing)
      /\\x[0-9a-f]{2}/i,  // Hex encoding
      /%[0-9a-f]{2}%[0-9a-f]{2}/i,  // Double encoding
      /\.{3,}/,  // Multiple dots
      /-{3,}/,  // Multiple dashes
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        this.riskScore -= 15;
        this.flags.push('suspicious_url_pattern');
        this.triggeredRules.push('Suspicious URL encoding pattern');
        break;
      }
    }
  }

  // ========== CONTENT SIGNALS ==========
  private checkContentSignals(html: string, domain: string, pageTitle?: string): void {
    const htmlLower = html.toLowerCase();

    // Login forms on unknown domains
    const hasLoginForm = htmlLower.includes('type="password"') &&
                        (htmlLower.includes('login') || htmlLower.includes('sign in'));

    if (hasLoginForm && !isDomainSafelisted(domain)) {
      this.riskScore -= 20;
      this.flags.push('login_form_unknown_domain');
      this.triggeredRules.push('Login form on non-safelisted domain');
    }

    // Password input fields
    const passwordFields = (html.match(/type="password"/gi) || []).length;
    if (passwordFields > 0) {
      this.riskScore -= 5 * passwordFields;
      this.flags.push('password_field_detected');
      this.triggeredRules.push(`${passwordFields} password field(s) detected`);
    }

    // Credit card fields
    const ccPatterns = ['card number', 'credit card', 'cvv', 'expiry', 'expiration'];
    for (const pattern of ccPatterns) {
      if (htmlLower.includes(pattern)) {
        this.riskScore -= 25;
        this.flags.push('credit_card_field');
        this.triggeredRules.push('Credit card field detected');
        break;
      }
    }

    // Download buttons/triggers
    const downloadPatterns = ['download now', 'click to download', 'free download', 'download file'];
    for (const pattern of downloadPatterns) {
      if (htmlLower.includes(pattern)) {
        this.riskScore -= 15;
        this.flags.push('download_trigger');
        this.triggeredRules.push('Download trigger detected');
        break;
      }
    }

    // Fake update messages
    for (const pattern of FAKE_UPDATE_PATTERNS) {
      if (htmlLower.includes(pattern)) {
        this.riskScore -= 30;
        this.flags.push('fake_update_message');
        this.triggeredRules.push('Fake update message detected');
        break;
      }
    }

    // Urgency keywords
    for (const keyword of URGENCY_KEYWORDS) {
      if (htmlLower.includes(keyword)) {
        this.riskScore -= 10;
        this.flags.push('urgency_language');
        this.triggeredRules.push('Urgency/pressure language detected');
        break;
      }
    }

    // Verify account text
    const verifyPatterns = ['verify your account', 'confirm your identity', 'validate your account', 'account verification'];
    for (const pattern of verifyPatterns) {
      if (htmlLower.includes(pattern)) {
        this.riskScore -= 20;
        this.flags.push('account_verification_text');
        this.triggeredRules.push('Account verification request detected');
        break;
      }
    }

    // Invisible text blocks
    const invisiblePatterns = [
      /style\s*=\s*["'][^"']*display\s*:\s*none/i,
      /style\s*=\s*["'][^"']*visibility\s*:\s*hidden/i,
      /style\s*=\s*["'][^"']*opacity\s*:\s*0/i,
    ];

    let invisibleCount = 0;
    for (const pattern of invisiblePatterns) {
      const matches = html.match(pattern);
      if (matches) invisibleCount += matches.length;
    }

    if (invisibleCount > 5) {
      this.riskScore -= 15;
      this.flags.push('invisible_elements');
      this.triggeredRules.push(`${invisibleCount} invisible elements detected`);
    }

    // Base64 encoded scripts
    const base64Pattern = /atob\s*\(|btoa\s*\(|fromCharCode|base64/i;
    if (base64Pattern.test(html)) {
      this.riskScore -= 15;
      this.flags.push('base64_encoding');
      this.triggeredRules.push('Base64 encoding detected');
    }

    // Domain mismatch vs page title
    if (pageTitle) {
      const titleLower = pageTitle.toLowerCase();
      const brandNames = ['google', 'facebook', 'amazon', 'paypal', 'apple', 'microsoft', 'netflix'];

      for (const brand of brandNames) {
        if (titleLower.includes(brand) && !domain.toLowerCase().includes(brand)) {
          this.riskScore -= 35;
          this.flags.push(`brand_mismatch_${brand}`);
          this.triggeredRules.push(`Page title claims ${brand} but domain doesn't match`);
          break;
        }
      }
    }
  }

  // ========== IFRAME + SCRIPT RULES ==========
  private checkIframeAndScripts(html: string): void {
    // Hidden iframes
    const hiddenIframePattern = /<iframe[^>]*style\s*=\s*["'][^"']*(display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0|width\s*:\s*0|height\s*:\s*0)[^"']*["'][^>]*>/gi;
    const hiddenIframes = (html.match(hiddenIframePattern) || []).length;

    if (hiddenIframes > 0) {
      this.riskScore -= 25 * hiddenIframes;
      this.flags.push('hidden_iframe');
      this.triggeredRules.push(`${hiddenIframes} hidden iframe(s) detected`);
    }

    // Multiple iframes
    const iframeCount = (html.match(/<iframe/gi) || []).length;
    if (iframeCount > 3) {
      this.riskScore -= 10 * iframeCount;
      this.flags.push('multiple_iframes');
      this.triggeredRules.push(`${iframeCount} iframes detected`);
    }

    // External script injection
    const externalScripts = (html.match(/<script[^>]+src\s*=\s*["']https?:\/\//gi) || []).length;
    if (externalScripts > 5) {
      this.riskScore -= 5 * externalScripts;
      this.flags.push('external_scripts');
      this.triggeredRules.push(`${externalScripts} external scripts`);
    }

    // Obfuscated JavaScript patterns
    const obfuscationPatterns = [
      /eval\s*\(/i,
      /Function\s*\(\s*["']return/i,
      /unescape\s*\(/i,
      /String\.fromCharCode/i,
      /parseInt\s*\([^,]+,\s*(8|16|32|36)\s*\)/i,
      /\\x[0-9a-f]{2}/i,
      /\\u[0-9a-f]{4}/i,
      /\[\s*\]\s*\[\s*['"](constructor|prototype)['"]\s*\]/i,
    ];

    for (const pattern of obfuscationPatterns) {
      if (pattern.test(html)) {
        this.riskScore -= 20;
        this.flags.push('obfuscated_javascript');
        this.triggeredRules.push('Obfuscated JavaScript detected');
        break;
      }
    }

    // Inline script heavy pages
    const inlineScripts = (html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || []).length;
    if (inlineScripts > 10) {
      this.riskScore -= 10;
      this.flags.push('heavy_inline_scripts');
      this.triggeredRules.push('Heavy inline script usage');
    }
  }

  // ========== TYPOSQUATTING ==========
  private checkTyposquatting(domain: string): void {
    // Character repetition
    const charRepetition = /(.)(\1{3,})/;
    if (charRepetition.test(domain)) {
      this.riskScore -= 10;
      this.flags.push('char_repetition');
      this.triggeredRules.push('Suspicious character repetition');
    }

    // Double letter typosquatting (gooogle, facebok, etc)
    const doubleLetterPattern = /([a-z])\1{2,}/i;
    if (doubleLetterPattern.test(domain)) {
      this.riskScore -= 15;
      this.flags.push('double_letter_typosquatting');
      this.triggeredRules.push('Double letter typosquatting pattern');
    }
  }

  // ========== IP LOGGER / TRACKING LINKS ==========
  private checkIpLoggerDomain(domain: string): void {
    if (isIpLoggerDomain(domain)) {
      this.riskScore -= 70;
      this.flags.push('ip_logger');
      this.triggeredRules.push('Known IP logger/tracking service detected (Grabify or similar)');
    }
  }

  // ========== HELPER METHODS ==========
  private isRandomString(str: string): boolean {
    // Check for random-looking strings (high entropy, mixed case/numbers)
    const hasLetters = /[a-z]/i.test(str);
    const hasNumbers = /\d/.test(str);
    const uniqueChars = new Set(str).size;
    const ratio = uniqueChars / str.length;

    // High unique char ratio + mixed content = likely random
    return ratio > 0.7 && hasLetters && hasNumbers;
  }

  private calculateRiskLevel(): RiskLevel {
    // Start from 100, subtract for risks
    // 0-30 = Danger (unsafe), 31-70 = Caution, 71-100 = Safe
    if (this.riskScore <= 30) return 'danger';
    if (this.riskScore <= 70) return 'caution';
    return 'safe';
  }

  private generateExplanation(riskLevel: RiskLevel): string {
    const ruleCount = this.triggeredRules.length;

    if (riskLevel === 'danger') {
      return `CRITICAL: ${ruleCount} high-risk indicators detected. This link is potentially malicious. DO NOT PROCEED.`;
    } else if (riskLevel === 'caution') {
      return `WARNING: ${ruleCount} suspicious indicators detected. Proceed with caution and verify the source.`;
    } else {
      return ruleCount > 0
        ? `This link appears safe. ${ruleCount} minor checks triggered but overall risk is low.`
        : 'This link appears to be safe. No suspicious indicators detected.';
    }
  }
}

export const securityEngine = new SecurityEngine();
