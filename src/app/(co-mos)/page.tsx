"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WelcomePage() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStart = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      router.push("/menu");
    }, 180);
  };

  return (
    <main
      className="
        min-h-dvh w-full text-white
        flex items-end
        px-4 pb-6
        md:px-6 md:pb-8
        relative
      "
    >
      {/* Fondo degradado (superior cálido → inferior oscuro) */}
      <div
        className="
          pointer-events-none
          absolute inset-0 -z-10
          bg-gradient-to-br from-amber-400 via-red-500 to-neutral-950
        "
      />

      {isTransitioning && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black transition-opacity duration-150 ease-out">
          <div className="flex flex-col items-center gap-3">
            <Image src="/Logo.svg" alt="co.mos" width={64} height={64} />
            <span className="text-white text-2xl font-semibold tracking-wide">co.mos</span>
          </div>
        </div>
      )}

      {/* Marca arriba a la izquierda */}
      <div className="absolute left-4 top-4 md:left-6 md:top-6 flex items-center gap-2">
        <Image src="/Logo.svg" alt="co.mos" width={28} height={28} priority />
        <span className="text-base md:text-lg font-semibold">co.mos</span>
      </div>

      {/* Contenido inferior */}
      <section className="w-full max-w-md mx-auto">
        <h1
          className="
            text-4xl leading-tight font-semibold
            md:text-5xl md:leading-tight
            drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]
          "
        >
          Disfruta más, pide fácil
          <br /> desde tu mesa.
        </h1>

        {/* CTA */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleStart}
            disabled={isTransitioning}
            className="
              block w-full text-center
              bg-white text-black font-medium
              py-3 rounded-md
              transition-opacity hover:opacity-90
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            Empezar
          </button>

          <p className="mt-3 text-center text-xs text-neutral-300">
            Al continuar aceptas nuestros <span className="underline">Términos y Condiciones</span>
          </p>
        </div>
      </section>
    </main>
  );
}
