export type RiskLevel = 'safe' | 'caution' | 'danger';
export type ScanType = 'qr' | 'link';
export type FilterType = 'all' | 'qr' | 'link';

export interface ScanResult {
  id: string;
  url: string;
  type: ScanType;
  riskScore: number;
  riskLevel: RiskLevel;
  result: string;
  timestamp: Date;
  details?: ScanDetails;
  userId?: string;
}

export interface ScanDetails {
  domain: string;
  hasHttps: boolean;
  iframeCount: number;
  suspiciousScripts: number;
  redirectCount: number;
  hasSuspiciousForms: boolean;
  hasDownloadTriggers: boolean;
  aiAnalysis?: AIAnalysisResult;
  flags: string[];
}

export interface AIAnalysisResult {
  score: number;
  explanation: string;
  category: RiskLevel;
  confidence: number;
}

export interface SecurityCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export interface Stats {
  qrScans: number;
  linkScans: number;
  dangerousBlocked: number;
  cautionBlocked: number;
}
