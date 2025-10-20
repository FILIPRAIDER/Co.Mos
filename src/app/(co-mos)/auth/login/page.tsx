"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
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
      identifier,
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
    <main className="min-h-screen bg-black text-white px-4 py-6 flex items-center justify-center">
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
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium mb-2 block text-gray-300">Cédula o Correo</span>
              <input
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:outline-none transition"
                placeholder="1234567890 o email@ejemplo.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium mb-2 block text-gray-300">Contraseña</span>
              <input
                type="password"
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:outline-none transition"
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
            className="w-full rounded-xl bg-white text-black py-4 font-bold text-lg transition hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed shadow-xl"
          >
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <a className="text-gray-400 hover:text-white transition" href="/auth/register">
            ¿No tienes cuenta? Regístrate
          </a>
          <a className="text-gray-400 hover:text-white transition text-xs" href="/auth/login?worker=true">
            Soy trabajador
          </a>
        </div>
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
