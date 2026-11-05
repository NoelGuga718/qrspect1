import { useState } from 'react';
import { Link, Scan, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LinkScannerProps {
  onScan: (url: string) => void;
  isScanning: boolean;
}

export function LinkScanner({ onScan, isScanning }: LinkScannerProps) {
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
      onScan(url.trim());
      setUrl('');
    } catch {
      setError('Please enter a valid URL');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input
            type="text"
            placeholder="Enter URL to scan (e.g., example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isScanning}
            className="input-cyber pl-12 pr-4 h-14 text-base"
          />
        </div>

        {error && (
          <p className="text-sm text-cyber-red animate-in">{error}</p>
        )}

        <Button
          type="submit"
          disabled={isScanning || !url.trim()}
          className="glow-button bg-gradient-to-r from-cyber-blue to-cyber-purple hover:opacity-90 text-white font-semibold h-14 text-lg"
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Scan className="mr-2 h-5 w-5" />
              Scan Link
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
