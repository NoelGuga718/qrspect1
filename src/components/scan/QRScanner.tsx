import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Camera device shape from html5-qrcode */
type CameraDevice = { id: string; label: string };

const SCANNER_WIDTH = 300;
const SCANNER_HEIGHT = 300;

function getCameraError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/Permission|NotAllowed|denied/i.test(msg)) return 'Camera permission denied. Please allow camera access and try again.';
  if (/NotFound|no camera|no device/i.test(msg)) return 'No camera found. Connect a camera and try again.';
  if (/NotReadable|in use|already in use/i.test(msg)) return 'Camera is in use by another app. Close it and try again.';
  if (/secure|HTTPS|localhost/i.test(msg)) return 'Camera requires HTTPS or localhost. Open this page via https:// or http://localhost.';
  return msg || 'Failed to open camera. Please check permissions and try again.';
}

interface QRScannerProps {
  onScan: (url: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initScanner = async () => {
      const scannerEl = document.getElementById('qr-reader');
      if (!scannerEl) return;

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Camera not supported. Use HTTPS or localhost and a modern browser.');
          setIsInitializing(false);
          return;
        }

        // Request permission first so getCameras() returns devices with labels
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch (permErr) {
          if (cancelled) return;
          setError(getCameraError(permErr));
          setIsInitializing(false);
          return;
        }

        if (cancelled) return;

        const scannerId = 'qr-reader';
        scannerRef.current = new Html5Qrcode(scannerId);

        const cameras = await Html5Qrcode.getCameras();
        if (cancelled || !scannerRef.current) return;

        if (!cameras?.length) {
          setError('No camera found. Please ensure camera permissions are granted.');
          setIsInitializing(false);
          return;
        }

        let selected: CameraDevice;
        if (cameras.length === 1) {
          selected = cameras[0];
        } else {
          const fromDevices = await (async () => {
            try {
              const devices = await navigator.mediaDevices.enumerateDevices();
              const back = devices.find(
                (d) => d.kind === 'videoinput' && /back|rear|environment|facing\s*back/i.test((d.label || ''))
              );
              if (back) return cameras.find((c) => c.id === back.deviceId);
            } catch {
              /* ignore */
            }
            return undefined;
          })();
          const byLabel = cameras.find((c) =>
            /back|rear|environment/i.test((c.label || ''))
          );
          const notFront = cameras.find(
            (c) => !/front|selfie|user|facing\s*user/i.test((c.label || ''))
          );
          selected = fromDevices ?? byLabel ?? notFront ?? cameras[0];
        }

        if (cancelled || !scannerRef.current) return;

        const scanConfig = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        };

        const startWithConstraints = (cameraId: string, videoConstraints?: MediaTrackConstraints) => {
          const config =
            videoConstraints !== undefined
              ? { ...scanConfig, videoConstraints }
              : scanConfig;
          return scannerRef.current!.start(
            cameraId,
            config,
            (decodedText) => {
              onScan(decodedText);
              onClose();
            },
            () => {}
          );
        };

        try {
          await startWithConstraints(selected.id);
        } catch (firstErr) {
          if (cancelled) return;
          try {
            await startWithConstraints(selected.id, {});
          } catch (fallbackErr) {
            if (cancelled) return;
            setError(getCameraError(fallbackErr));
            setIsInitializing(false);
            return;
          }
        }

        if (!cancelled) setIsInitializing(false);
      } catch (err) {
        if (cancelled) return;
        console.error('Scanner initialization error:', err);
        setError(getCameraError(err));
        setIsInitializing(false);
      }
    };

    initScanner();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute -top-12 right-0 rounded-xl"
          style={{ color: '#FFFFFF' }}
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="glass-card-strong p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(237, 237, 237, 0.1)' }}>
              <ScanLine className="h-5 w-5" style={{ color: '#EDEDED' }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>Scan QR Code</h3>
              <p className="text-sm" style={{ color: '#A0A0A0' }}>Position QR code in the frame</p>
            </div>
          </div>

          <div className="qr-scanner-container aspect-square relative w-full min-h-[280px] sm:min-h-[320px]">
            <div
              id="qr-reader"
              ref={containerRef}
              className="qr-reader-box"
              style={{ width: '100%', minWidth: SCANNER_WIDTH, height: SCANNER_HEIGHT, minHeight: SCANNER_HEIGHT }}
            />

            {!isInitializing && !error && (
              <>
                <div className="qr-scanner-overlay" />
                <div className="corner-bracket corner-bracket-tl" />
                <div className="corner-bracket corner-bracket-tr" />
                <div className="corner-bracket corner-bracket-bl" />
                <div className="corner-bracket corner-bracket-br" />
                <div className="scan-line" />
              </>
            )}

            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(14, 14, 14, 0.8)' }}>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#EDEDED' }} />
                  <span className="text-sm" style={{ color: '#A0A0A0' }}>Initializing camera...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: 'rgba(14, 14, 14, 0.9)' }}>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>
                    <X className="h-6 w-6" style={{ color: '#ef4444' }} />
                  </div>
                  <p className="text-sm" style={{ color: '#A0A0A0' }}>{error}</p>
                </div>
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-center" style={{ color: '#A0A0A0' }}>
            Make sure the QR code is well-lit and clearly visible
          </p>
        </div>
      </div>
    </div>
  );
}
