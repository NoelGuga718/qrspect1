import { useState } from 'react';
import { QrCode, Link2, Shield, ShieldAlert, ShieldX, ChevronDown, Clock, ExternalLink } from 'lucide-react';
import type { ScanResult, FilterType } from '@/types';

interface HistoryListProps {
  scans: ScanResult[];
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function HistoryList({ scans, activeFilter, onFilterChange }: HistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'qr', label: 'QR Codes' },
    { value: 'link', label: 'Links' },
  ];

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'safe':
        return <Shield className="h-4 w-4 text-cyber-green" />;
      case 'caution':
        return <ShieldAlert className="h-4 w-4 text-cyber-yellow" />;
      case 'danger':
        return <ShieldX className="h-4 w-4 text-cyber-red" />;
      default:
        return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'safe':
        return 'text-cyber-green bg-cyber-green/10 border-cyber-green/30';
      case 'caution':
        return 'text-cyber-yellow bg-cyber-yellow/10 border-cyber-yellow/30';
      case 'danger':
        return 'text-cyber-red bg-cyber-red/10 border-cyber-red/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>Scan History</h3>
        <div className="flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={`filter-button ${activeFilter === filter.value ? 'active' : ''}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(26, 26, 26, 0.8)' }}>
            <Clock className="h-8 w-8" style={{ color: '#A0A0A0' }} />
          </div>
          <p style={{ color: '#A0A0A0' }}>No scans yet</p>
          <p className="text-sm mt-1" style={{ color: '#A0A0A0' }}>
            Start scanning QR codes or links to see your history
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {scans.map((scan, index) => (
            <div
              key={scan.id}
              className="history-item animate-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className="flex items-center justify-between"
                onClick={() => setExpandedId(expandedId === scan.id ? null : scan.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(26, 26, 26, 0.8)' }}>
                    {scan.type === 'qr' ? (
                      <QrCode className="h-4 w-4" style={{ color: '#EDEDED' }} />
                    ) : (
                      <Link2 className="h-4 w-4" style={{ color: '#EDEDED' }} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-mono" style={{ color: '#FFFFFF' }}>
                      {truncateUrl(scan.url)}
                    </p>
                    <p className="text-xs" style={{ color: '#A0A0A0' }}>{formatDate(scan.timestamp)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full border flex items-center gap-1 ${getRiskColor(
                      scan.riskLevel
                    )}`}
                  >
                    {getRiskIcon(scan.riskLevel)}
                    {scan.riskLevel.toUpperCase()}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expandedId === scan.id ? 'rotate-180' : ''
                    }`}
                    style={{ color: '#A0A0A0' }}
                  />
                </div>
              </div>

              {expandedId === scan.id && (
                <div className="mt-4 pt-4 animate-in" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs mb-1" style={{ color: '#A0A0A0' }}>Full URL</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono break-all flex-1" style={{ color: '#FFFFFF' }}>
                          {scan.url}
                        </p>
                        <a
                          href={scan.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-colors"
                          style={{ color: '#EDEDED' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-card p-3">
                        <p className="text-xs" style={{ color: '#A0A0A0' }}>Risk Score</p>
                        <p
                          className="text-lg font-bold"
                          style={{
                            color: scan.riskScore >= 70
                              ? '#ef4444'
                              : scan.riskScore >= 40
                              ? '#eab308'
                              : '#22c55e'
                          }}
                        >
                          {scan.riskScore}/100
                        </p>
                      </div>
                      <div className="glass-card p-3">
                        <p className="text-xs" style={{ color: '#A0A0A0' }}>Scan Type</p>
                        <p className="text-lg font-bold" style={{ color: '#FFFFFF' }}>
                          {scan.type === 'qr' ? 'QR Code' : 'Link'}
                        </p>
                      </div>
                    </div>

                    {scan.details?.flags && scan.details.flags.length > 0 && (
                      <div>
                        <p className="text-xs mb-2" style={{ color: '#A0A0A0' }}>Flags Detected</p>
                        <div className="flex flex-wrap gap-2">
                          {scan.details.flags.map((flag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs rounded-full border"
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#ef4444',
                                borderColor: 'rgba(239, 68, 68, 0.3)'
                              }}
                            >
                              {flag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-sm" style={{ color: '#A0A0A0' }}>{scan.result}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
