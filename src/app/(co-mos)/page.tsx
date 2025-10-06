"use client";

import Image from "next/image";
import Link from "next/link";

export default function WelcomePage() {
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
          {/* Ajusta el href según tu flujo (ej. /menu, /scan, etc.) */}
          <Link
            href="/"
            className="
              block w-full text-center
              bg-white text-black font-medium
              py-3 rounded-md
              transition-opacity hover:opacity-90
            "
          >
            Empezar
          </Link>

          <p className="mt-3 text-center text-xs text-neutral-300">
            Al continuar aceptas nuestros <span className="underline">Términos y Condiciones</span>
          </p>
        </div>
      </section>
    </main>
  );
}
