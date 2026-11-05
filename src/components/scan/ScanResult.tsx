import { ShieldAlert, ShieldCheck, ShieldX, X, ChevronDown, ChevronUp, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ScanResult as ScanResultType } from '@/types';
import { useState } from 'react';

interface ScanResultProps {
  result: ScanResultType;
  onClose: () => void;
}

export function ScanResultDisplay({ result, onClose }: ScanResultProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [showConfirmationForm, setShowConfirmationForm] = useState(false);

  // Determine safety level based on score
  const isUnsafe = result.riskScore <= 50; // Score ≤ 50: Unsafe, no redirect
  const isCautious = result.riskScore > 50 && result.riskScore < 90; // Score 51-89: Cautious, requires confirmation
  const isSafe = result.riskScore >= 90; // Score ≥ 90: Safe, normal redirect

  const handleRedirect = () => {
    if (isSafe) {
      // Safe: Direct redirect
      window.open(result.url, '_blank', 'noopener,noreferrer');
      onClose();
    } else if (isCautious) {
      // Cautious: Show confirmation form
      setShowConfirmationForm(true);
    }
    // Unsafe: No redirect allowed
  };

  const handleConfirmRedirect = () => {
    if (confirmationText.trim().toUpperCase() === 'CONFIRM') {
      window.open(result.url, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  const getRiskConfig = () => {
    // Determine label based on score
    if (isUnsafe) {
      return {
        icon: ShieldX,
        color: 'text-cyber-red',
        bgColor: 'bg-cyber-red/20',
        borderColor: 'border-cyber-red/50',
        glowColor: 'shadow-glow-red',
        label: 'UNSAFE',
        description: 'This link is unsafe (score ≤ 50). Redirecting has been disabled for your protection.',
      };
    } else if (isCautious) {
      return {
        icon: ShieldAlert,
        color: 'text-cyber-yellow',
        bgColor: 'bg-cyber-yellow/20',
        borderColor: 'border-cyber-yellow/50',
        glowColor: 'shadow-glow-yellow',
        label: 'CAUTIOUS',
        description: 'This link shows suspicious characteristics (score 51-89). Confirmation required to proceed.',
      };
    } else {
      return {
        icon: ShieldCheck,
        color: 'text-cyber-green',
        bgColor: 'bg-cyber-green/20',
        borderColor: 'border-cyber-green/50',
        glowColor: 'shadow-glow-green',
        label: 'SAFE',
        description: 'This link appears to be safe to visit (score ≥ 90).',
      };
    }
  };

  const config = getRiskConfig();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`w-full max-w-lg glass-card-strong overflow-hidden animate-in`}>
        <div className={`p-6 border-b ${config.borderColor} ${config.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${config.bgColor} ${config.glowColor}`}>
                <Icon className={`h-8 w-8 ${config.color}`} />
              </div>
              <div>
                <span className={`text-sm font-bold tracking-wider ${config.color}`}>
                  {config.label}
                </span>
                <h3 className="text-xl font-bold text-white">
                  Risk Score: {result.riskScore}/100
                </h3>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="glass-card p-4">
            <p className="text-sm text-gray-400 mb-1">Scanned URL</p>
            <p className="text-white font-mono text-sm break-all">{result.url}</p>
          </div>

          <div className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
            <p className={`text-sm ${config.color}`}>{config.description}</p>
            {isUnsafe && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-cyber-red/20 border border-cyber-red/50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-cyber-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-cyber-red">Redirect Blocked</p>
                  <p className="text-xs text-gray-300 mt-1">This link is unsafe. Redirecting has been disabled for your protection.</p>
                </div>
              </div>
            )}
            {isCautious && !showConfirmationForm && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-cyber-yellow/20 border border-cyber-yellow/50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-cyber-yellow flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-cyber-yellow">Caution Required</p>
                  <p className="text-xs text-gray-300 mt-1">This link shows suspicious characteristics. Confirmation required to proceed.</p>
                </div>
              </div>
            )}
          </div>

          {/* Confirmation Form for Cautious Links */}
          {isCautious && showConfirmationForm && (
            <div className="p-4 rounded-xl bg-cyber-yellow/10 border border-cyber-yellow/50 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-cyber-yellow flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-cyber-yellow mb-1">Confirm Redirect</p>
                  <p className="text-xs text-gray-300">This link may be unsafe. Type <span className="font-mono font-bold text-white">CONFIRM</span> to proceed.</p>
                </div>
              </div>
              <Input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="Type CONFIRM to proceed"
                className="bg-white/5 border-cyber-yellow/50 text-white placeholder:text-gray-500"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleConfirmRedirect}
                  disabled={confirmationText.trim().toUpperCase() !== 'CONFIRM'}
                  className="flex-1 bg-cyber-yellow hover:bg-cyber-yellow/80 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Proceed to Link
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirmationForm(false);
                    setConfirmationText('');
                  }}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {result.details && (
            <div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="text-sm font-medium text-white">Technical Details</span>
                {showDetails ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {showDetails && (
                <div className="mt-3 space-y-2 animate-in">
                  <div className="glass-card p-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Domain:</span>
                        <span className="text-white ml-2">{result.details.domain}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">HTTPS:</span>
                        <span className={result.details.hasHttps ? 'text-cyber-green ml-2' : 'text-cyber-red ml-2'}>
                          {result.details.hasHttps ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Iframes:</span>
                        <span className="text-white ml-2">{result.details.iframeCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Suspicious Scripts:</span>
                        <span className={result.details.suspiciousScripts > 0 ? 'text-cyber-yellow ml-2' : 'text-cyber-green ml-2'}>
                          {result.details.suspiciousScripts}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Redirects:</span>
                        <span className="text-white ml-2">{result.details.redirectCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Suspicious Forms:</span>
                        <span className={result.details.hasSuspiciousForms ? 'text-cyber-yellow ml-2' : 'text-cyber-green ml-2'}>
                          {result.details.hasSuspiciousForms ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {result.details.flags.length > 0 && (
                    <div className="glass-card p-3">
                      <p className="text-sm text-gray-500 mb-2">Detected Flags:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.details.flags.map((flag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-full bg-cyber-red/20 text-cyber-red border border-cyber-red/30"
                          >
                            {flag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.details.aiAnalysis && (
                    <div className="glass-card p-3 border border-cyber-purple/30">
                      <p className="text-sm text-cyber-purple mb-1">AI Analysis</p>
                      <p className="text-sm text-gray-300">{result.details.aiAnalysis.explanation}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Confidence: {result.details.aiAnalysis.confidence}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {!isUnsafe && (
              <Button
                onClick={handleRedirect}
                className={`flex-1 ${
                  isSafe
                    ? 'bg-gradient-to-r from-cyber-blue to-cyber-purple hover:opacity-90 text-white'
                    : isCautious && !showConfirmationForm
                    ? 'bg-cyber-yellow hover:bg-cyber-yellow/80 text-black font-semibold'
                    : 'hidden'
                }`}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {isSafe ? 'Visit Link' : 'Proceed with Caution'}
              </Button>
            )}
            <Button
              onClick={onClose}
              variant={isUnsafe ? 'default' : 'outline'}
              className={`${isUnsafe ? 'w-full bg-white/10 hover:bg-white/20 text-white' : 'flex-1 border-white/20 text-white hover:bg-white/10'}`}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
