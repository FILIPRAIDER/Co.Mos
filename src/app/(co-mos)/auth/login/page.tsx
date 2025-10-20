"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

export default function LoginPage() {
  const [document, setDocument] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  }>({ type: "success", title: "", message: "" });
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      document,
      password,
      callbackUrl: "/dashboard",
    });
    setLoading(false);
    
    if (res?.ok) {
      setModalConfig({
        type: "success",
        title: "¡Bienvenido!",
        message: "Has iniciado sesión exitosamente",
      });
      setShowModal(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } else {
      setModalConfig({
        type: "error",
        title: "Error de autenticación",
        message: "Las credenciales ingresadas no son válidas. Por favor verifica e intenta de nuevo.",
      });
      setShowModal(true);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-red-600 text-white px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Image src="/Logo.svg" alt="co.mos" width={48} height={48} className="drop-shadow-lg" />
            <span className="text-3xl font-bold drop-shadow-lg">co.mos</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Bienvenido de vuelta</h1>
          <p className="text-white/90 text-lg">Ingresa con tus credenciales</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/30 p-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium mb-2 block">Cédula</span>
              <input
                className="w-full rounded-lg bg-white/20 border border-white/30 px-4 py-3 text-white placeholder-white/60 focus:border-white/50 focus:bg-white/30 focus:outline-none transition"
                placeholder="1234567890"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium mb-2 block">Contraseña</span>
              <input
                type="password"
                className="w-full rounded-lg bg-white/20 border border-white/30 px-4 py-3 text-white placeholder-white/60 focus:border-white/50 focus:bg-white/30 focus:outline-none transition"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white text-black py-4 font-bold text-lg transition hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed shadow-xl"
          >
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/90">
          ¿Aún no tienes acceso?{" "}
          <a className="font-semibold underline" href="/auth/register">
            Regístrate aquí
          </a>
        </p>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </main>
  );
}
