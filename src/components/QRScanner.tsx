"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ScanLine, Camera, XCircle, AlertCircle } from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setError(null);
      
      // Verificar permisos de cámara
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          // Prevenir múltiples escaneos
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;
          
          console.log("QR Code scanned:", decodedText);
          setIsScanning(false);
          
          // Detener scanner primero
          if (scannerRef.current) {
            scannerRef.current.stop().catch(() => {
              // Ignorar errores al detener
            });
          }
          
          // Luego llamar callback
          setTimeout(() => {
            onScanSuccess(decodedText);
          }, 100);
        },
        (errorMessage) => {
          // Ignorar errores de escaneo continuo
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setHasPermission(false);
      setError("No se pudo acceder a la cámara. Por favor, permite el acceso a la cámara en la configuración de tu navegador.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = await scannerRef.current.getState();
        if (state === 2) { // Scanner is running (2 = SCANNING)
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        // Ignorar errores si el scanner ya está detenido
        console.log("Scanner already stopped or cleared");
      }
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute -top-14 right-0 rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20 z-10"
        >
          <XCircle className="h-6 w-6" />
        </button>

        {/* Scanner Container */}
        <div className="rounded-2xl bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Escanear QR</h2>
                <p className="text-sm text-white/80">Apunta la cámara al código QR de tu mesa</p>
              </div>
            </div>
          </div>

          {/* Scanner Area */}
          <div className="p-6">
            <div className="relative mx-auto" style={{ maxWidth: '400px' }}>
              {/* QR Scanner */}
              <div 
                id="qr-reader" 
                className="rounded-xl overflow-hidden border-4 border-orange-500/50 qr-scanner-container w-full"
              />

              {/* Scanning Animation Overlay */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-orange-500 rounded-lg animate-pulse" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[250px]">
                    <div className="h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-scan" />
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="mt-4 rounded-lg bg-red-500/20 border border-red-500/50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-300">Error de Cámara</p>
                      <p className="text-xs text-red-400 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {!error && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-white/60">
                    <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-orange-400">1</span>
                    </div>
                    <p className="text-sm">Permite el acceso a la cámara</p>
                  </div>
                  <div className="flex items-center gap-3 text-white/60">
                    <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-orange-400">2</span>
                    </div>
                    <p className="text-sm">Apunta al código QR de tu mesa</p>
                  </div>
                  <div className="flex items-center gap-3 text-white/60">
                    <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-orange-400">3</span>
                    </div>
                    <p className="text-sm">El escaneo es automático</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-zinc-900/50 px-6 py-4 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>co.mos</span>
              <span className="flex items-center gap-1">
                {isScanning ? (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    Escaneando...
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
                    Inactivo
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        
        /* Ocultar elementos duplicados del scanner */
        :global(#qr-reader__dashboard_section) {
          display: none !important;
        }
        :global(#qr-reader__dashboard_section_csr) {
          display: none !important;
        }
        
        /* Asegurar que solo se muestre un video centrado */
        :global(.qr-scanner-container) {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        :global(.qr-scanner-container video) {
          width: 100% !important;
          height: auto !important;
          display: block !important;
          margin: 0 auto !important;
        }
        
        :global(.qr-scanner-container video + video) {
          display: none !important;
        }
        
        :global(.qr-scanner-container canvas) {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
