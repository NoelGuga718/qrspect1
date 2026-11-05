import { QrCode, Link2, ShieldAlert, TrendingUp } from 'lucide-react';
import type { Stats } from '@/types';

interface StatsCardsProps {
  stats: Stats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      icon: QrCode,
      label: 'QR Scans',
      value: stats.qrScans,
      color: 'text-cyber-blue',
      bgColor: 'bg-cyber-blue/20',
      glowColor: 'hover:shadow-glow',
    },
    {
      icon: Link2,
      label: 'Link Scans',
      value: stats.linkScans,
      color: 'text-cyber-purple',
      bgColor: 'bg-cyber-purple/20',
      glowColor: 'hover:shadow-glow-purple',
    },
    {
      icon: ShieldAlert,
      label: 'Threats Blocked',
      value: stats.dangerousBlocked + (stats.cautionBlocked || 0),
      color: 'text-cyber-red',
      bgColor: 'bg-cyber-red/20',
      glowColor: 'hover:shadow-glow-red',
    },
    {
      icon: TrendingUp,
      label: 'Total Scans',
      value: stats.qrScans + stats.linkScans,
      color: 'text-cyber-green',
      bgColor: 'bg-cyber-green/20',
      glowColor: 'hover:shadow-glow-green',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="stat-card transition-all duration-300"
          >
            <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(237, 237, 237, 0.1)' }}>
              <Icon className="h-6 w-6" style={{ color: '#EDEDED' }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>{card.value.toLocaleString()}</p>
            <p className="text-sm" style={{ color: '#A0A0A0' }}>{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}
