import type { ScanResult, Stats } from '@/types';

const GUEST_SCANS_KEY = 'qrspect_guest_scans';

export class LocalScansService {
  private getScans(): ScanResult[] {
    const scans = localStorage.getItem(GUEST_SCANS_KEY);
    if (!scans) return [];

    const parsed = JSON.parse(scans);
    // Convert timestamp strings back to Date objects
    return parsed.map((scan: any) => ({
      ...scan,
      timestamp: scan.timestamp ? new Date(scan.timestamp) : new Date(),
    }));
  }

  private saveScans(scans: ScanResult[]): void {
    // Convert Date objects to ISO strings for storage
    const serialized = scans.map(scan => ({
      ...scan,
      timestamp: scan.timestamp instanceof Date ? scan.timestamp.toISOString() : scan.timestamp,
    }));
    localStorage.setItem(GUEST_SCANS_KEY, JSON.stringify(serialized));
  }

  saveScan(scan: ScanResult): void {
    const scans = this.getScans();
    scans.unshift(scan);
    // Keep only last 100 scans for guests
    const limitedScans = scans.slice(0, 100);
    this.saveScans(limitedScans);
  }

  getScansList(): ScanResult[] {
    return this.getScans();
  }

  getStats(): Stats {
    const scans = this.getScans();
    let qrScans = 0;
    let linkScans = 0;
    let dangerousBlocked = 0;
    let cautionBlocked = 0;

    scans.forEach((scan) => {
      if (scan.type === 'qr') qrScans++;
      if (scan.type === 'link') linkScans++;
      if (scan.riskLevel === 'danger') dangerousBlocked++;
      if (scan.riskLevel === 'caution') cautionBlocked++;
    });

    return { qrScans, linkScans, dangerousBlocked, cautionBlocked };
  }

  clearScans(): void {
    localStorage.removeItem(GUEST_SCANS_KEY);
  }
}

export const localScansService = new LocalScansService();
