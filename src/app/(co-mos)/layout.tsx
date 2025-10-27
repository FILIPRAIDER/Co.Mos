"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initContextExpirationCheck } from "@/lib/restaurant-context";

export default function CoMosLayout({ children }: { children: React.ReactNode }) {
  // Splash inicial (pantalla negra con logo centrado)
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1200); // ~1.2s
    return () => clearTimeout(t);
  }, []);

  // Inicializar verificación de expiración del contexto
  useEffect(() => {
    const cleanup = initContextExpirationCheck(() => {
      // Cuando la sesión expira, redirigir al inicio
      console.log('Sesión expirada, redirigiendo al inicio...');
      router.push('/');
    });

    return cleanup;
  }, [router]);

  return (
    <>
      {/* Splash negro con logo */}
      {showSplash && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black">
          <div className="flex flex-col items-center gap-3">
            <Image 
              src="/Logo.svg" 
              alt="co.mos" 
              width={64} 
              height={64} 
              style={{ width: 'auto', height: 'auto' }}
              priority 
            />
            <span className="text-white text-2xl font-semibold tracking-wide">co.mos</span>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
