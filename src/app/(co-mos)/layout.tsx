"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function CoMosLayout({ children }: { children: React.ReactNode }) {
  // Splash inicial (pantalla negra con logo centrado)
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1200); // ~1.2s
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Splash negro con logo */}
      {showSplash && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black">
          <div className="flex flex-col items-center gap-3">
            <Image src="/Logo.svg" alt="co.mos" width={64} height={64} priority />
            <span className="text-white text-2xl font-semibold tracking-wide">co.mos</span>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
