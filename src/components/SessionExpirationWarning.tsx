"use client";

import { useEffect, useState } from "react";
import { isContextNearExpiration, getContextTimeRemaining } from "@/lib/restaurant-context";

interface SessionExpirationWarningProps {
  onExtendSession?: () => void;
}

export default function SessionExpirationWarning({ onExtendSession }: SessionExpirationWarningProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const checkExpiration = () => {
      const isNearExpiration = isContextNearExpiration();
      setShowWarning(isNearExpiration);

      if (isNearExpiration) {
        const remaining = getContextTimeRemaining();
        if (remaining) {
          const minutes = Math.floor(remaining / (60 * 1000));
          setTimeRemaining(`${minutes} minutos`);
        }
      }
    };

    // Verificar cada minuto
    checkExpiration();
    const interval = setInterval(checkExpiration, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-slideUp">
      <div className="bg-orange-500 text-white rounded-2xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⏰</div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Sesión por expirar</h3>
            <p className="text-sm text-white/90">
              Tu sesión expirará en aproximadamente {timeRemaining}. 
              {onExtendSession && " Escanea el QR nuevamente para continuar."}
            </p>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
        {onExtendSession && (
          <button
            onClick={onExtendSession}
            className="mt-3 w-full bg-white text-orange-500 rounded-xl py-2 font-semibold hover:bg-white/90 transition"
          >
            Extender sesión
          </button>
        )}
      </div>
    </div>
  );
}
