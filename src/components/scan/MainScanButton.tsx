import { useState } from 'react';
import { Scan, Link2 } from 'lucide-react';

interface MainScanButtonProps {
  onScanQR: () => void;
  onScanLink: (url: string) => void;
  isScanning: boolean;
}

export function MainScanButton({ onScanQR, onScanLink, isScanning }: MainScanButtonProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    let normalizedUrl = url.trim();

    try {
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      new URL(normalizedUrl);
      onScanLink(url.trim());
      setUrl('');
    } catch {
      setError('Please enter a valid URL');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Tap to Scan text above logo */}
      <h2 className="text-xl font-semibold text-center" style={{ color: '#FFFFFF' }}>
        Tap to Scan
      </h2>

      {/* Logo as Tap to Scan Button */}
      <button
        onClick={onScanQR}
        className="group relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-105"
      >
        {/* Soft glow effect */}
        <div className="absolute inset-0 rounded-full bg-[#EDEDED]/20 animate-pulse-glow" />
        <div className="absolute inset-2 rounded-full bg-[#EDEDED]/15 backdrop-blur-sm" />
        <div className="absolute inset-4 rounded-full bg-[#EDEDED]/10 border border-[#EDEDED]/30" />

        {/* Main circle with soft shadow */}
        <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-[#EDEDED]/5 border border-[#EDEDED]/20 backdrop-blur-sm">
          <img
            src="/logo.png"
            alt="QRspect Logo"
            className="w-20 h-20 object-contain"
          />
        </div>

        {/* Subtle pulse ring */}
        <div className="absolute inset-0 rounded-full border border-[#EDEDED]/10 animate-ping" style={{ animationDuration: '3s' }} />
      </button>

      {/* Link Input Field */}
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="relative">
            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Enter URL to scan..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isScanning}
              className="input-cyber pl-12 pr-4 h-12 text-base w-full"
            />
          </div>

          {error && (
            <p className="text-sm text-cyber-red animate-in">{error}</p>
          )}

          <button
            type="submit"
            disabled={isScanning || !url.trim()}
            className="glow-button font-semibold h-12 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScanning ? (
              <>
                <div className="w-5 h-5 border-2 border-[#0E0E0E] border-t-transparent rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Scan className="h-5 w-5" style={{ color: '#0E0E0E' }} />
                Scan Link
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
