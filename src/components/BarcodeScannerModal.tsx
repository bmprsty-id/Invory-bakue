import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, Zap, Keyboard, AlertCircle, Sparkles } from 'lucide-react';
import { scannerFeedback } from '../utils/audio';
import { db } from '../services/storage';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (barcode: string) => void;
  title?: string;
  subtitle?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult,
  title = 'Scan Product Barcode',
  subtitle = 'Align barcode within the target box',
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraIndex, setSelectedCameraIndex] = useState(0);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'barcode-scanner-viewfinder';

  // Handle successful detection
  const handleDecoded = useCallback((decodedText: string) => {
    const clean = decodedText.trim();
    if (!clean) return;

    scannerFeedback.playSuccessBeep();
    stopScanner();
    onScanResult(clean);
  }, [onScanResult]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanner = async (cameraIdOrFacing?: string | { facingMode: string }) => {
    setCameraError(null);
    try {
      await stopScanner();

      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      // Enumerate cameras if not done
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setCameras(devices);
        }
      } catch {
        // Ignore enumeration failure
      }

      const cameraConfig = cameraIdOrFacing || { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.floor(minEdge * 0.75);
            return { width: edge, height: Math.floor(edge * 0.6) };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecoded(decodedText);
        },
        () => {
          // Frame scan error / no barcode in frame
        }
      );

      setIsScanning(true);

      // Check flashlight capability
      try {
        const anyScanner = html5QrCode as unknown as { getRunningTrackCameraCapabilities?: () => { torchFeature?: () => { isSupported: () => boolean } } };
        const track = anyScanner.getRunningTrackCameraCapabilities?.();
        if (track && track.torchFeature && track.torchFeature().isSupported()) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: unknown) {
      console.error('Camera startup error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setCameraError('Camera permission was denied. Please allow camera access in browser settings or use manual entry below.');
      } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
        setCameraError('No camera found on this device. You can type the barcode number below.');
      } else {
        setCameraError('Unable to start camera scanner. You can enter or select a barcode below.');
      }
      setShowManualInput(true);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Delay slightly for modal DOM mount
      const timer = setTimeout(() => {
        startScanner();
      }, 250);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const anyScanner = scannerRef.current as unknown as { applyVideoConstraints: (constraints: unknown) => Promise<void> };
      await anyScanner.applyVideoConstraints({
        advanced: [{ torch: !isTorchOn }],
      });
      setIsTorchOn(!isTorchOn);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const nextIdx = (selectedCameraIndex + 1) % cameras.length;
    setSelectedCameraIndex(nextIdx);
    startScanner(cameras[nextIdx].id);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDecoded(manualCode.trim());
  };

  if (!isOpen) return null;

  const quickSamples = [
    { label: 'Tepung Cakra (Stok: 100)', code: '8991234567890' },
    { label: 'Wijsman Butter (Stok: 30)', code: '8991234567891' },
    { label: 'Colatta Cokelat (Stok: 50)', code: '8991234567892' },
    { label: 'Ragi Saf-Instant (Low Stock!)', code: '8991234567893' },
    { label: 'Barcode Baru Acak', code: `899${Math.floor(1000000000 + Math.random() * 9000000000)}` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-100">{title}</h3>
              <p className="text-xs text-neutral-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative bg-black flex-1 min-h-[280px] max-h-[380px] flex items-center justify-center overflow-hidden">
          <div id={containerId} className="w-full h-full min-h-[280px]" />

          {/* Scanner Overlay Graphics */}
          {isScanning && !cameraError && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative w-[75%] max-w-[280px] h-[160px] border-2 border-amber-400/80 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1 rounded-tl" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1 rounded-br" />

                {/* Laser animation */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_#f59e0b] animate-bounce" />

                <span className="text-[11px] font-medium tracking-wider text-amber-200 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                  AIM AT BARCODE
                </span>
              </div>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div className="absolute inset-0 bg-neutral-900/95 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm text-neutral-200 font-medium mb-1">Camera Feed Unavailable</p>
              <p className="text-xs text-neutral-400 mb-4 max-w-xs">{cameraError}</p>
              <button
                onClick={() => startScanner()}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Camera Again
              </button>
            </div>
          )}

          {/* Quick Scanner Controls Bar */}
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2">
              {cameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-neutral-700 text-xs font-medium text-white hover:bg-black/80 flex items-center gap-1.5"
                  title="Switch camera"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Flip
                </button>
              )}
              {hasTorch && (
                <button
                  onClick={toggleTorch}
                  className={`px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-medium flex items-center gap-1.5 ${
                    isTorchOn
                      ? 'bg-amber-500 text-black border-amber-400 font-bold'
                      : 'bg-black/60 text-white border-neutral-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Flash
                </button>
              )}
            </div>

            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-neutral-700 text-xs font-medium text-amber-300 hover:bg-black/80 flex items-center gap-1.5"
            >
              <Keyboard className="w-3.5 h-3.5" />
              {showManualInput ? 'Hide Keypad' : 'Manual Entry'}
            </button>
          </div>
        </div>

        {/* Manual Input & Quick Test Panel */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 overflow-y-auto space-y-3">
          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Type or paste barcode (e.g. 8991234567890)"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-400 font-mono tracking-wider"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-neutral-950 font-bold text-sm rounded-xl transition-colors whitespace-nowrap active:scale-95"
            >
              Find
            </button>
          </form>

          {/* Quick Test Barcodes (helpful for testing on laptop/desktop or demo without printouts) */}
          <div className="pt-1">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-neutral-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tap to test sample barcodes:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickSamples.map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => handleDecoded(sample.code)}
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/80 rounded-lg text-left transition-colors flex items-center gap-1.5 group active:scale-95"
                >
                  <span className="text-[11px] font-medium text-neutral-300 group-hover:text-amber-300">
                    {sample.label}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    ({sample.code.slice(-4)})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
