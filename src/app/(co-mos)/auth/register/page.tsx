"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Modal from "@/components/Modal";
import { ChevronLeft } from "lucide-react";

type Role = "ADMIN" | "MESERO" | "COCINERO";

export default function RegisterPage() {
  const [step, setStep] = useState<"role" | "form">("role");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep("form");
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;
    
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ 
        name, 
        email: selectedRole === "ADMIN" ? email : undefined,
        document, 
        password, 
        role: selectedRole 
      }),
      headers: { "Content-Type": "application/json" },
    });
    setLoading(false);

    if (res.ok) {
      setModalConfig({
        type: "success",
        title: "¡Cuenta creada exitosamente!",
        message: "Tu cuenta ha sido creada. Ya puedes iniciar sesión con tus credenciales.",
      });
      setShowModal(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } else {
      const j = await res.json().catch(() => ({}));
      setModalConfig({
        type: "error",
        title: "Error al registrar",
        message: j?.message ?? "No se pudo completar el registro. Por favor intenta de nuevo.",
      });
      setShowModal(true);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          {step === "form" && (
            <button
              onClick={() => setStep("role")}
              className="rounded-full bg-zinc-900 border border-zinc-800 p-2 transition hover:bg-zinc-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <Image src="/Logo.svg" alt="co.mos" width={40} height={40} />
            <span className="text-2xl font-bold">co.mos</span>
          </div>
          {step === "form" && <div className="w-9" />}
        </div>

        {/* Role Selection Step */}
        {step === "role" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">Únete al equipo</h1>
              <p className="text-white/90 text-lg">¿Cuál es tu rol?</p>
            </div>

            <div className="space-y-4">
              {/* Admin Card */}
              <button
                onClick={() => handleRoleSelect("ADMIN")}
                className="w-full group relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 transition-all hover:bg-zinc-800 hover:border-white hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="relative flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-3xl">
                    👑
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-bold mb-1">Dueño del Restaurante</h3>
                    <p className="text-sm text-gray-400">Acceso completo al sistema</p>
                  </div>
                </div>
              </button>

              {/* Waiter Card */}
              <button
                onClick={() => handleRoleSelect("MESERO")}
                className="w-full group relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 transition-all hover:bg-zinc-800 hover:border-white hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="relative flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-3xl">
                    🧑‍💼
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-bold mb-1">Mesero</h3>
                    <p className="text-sm text-gray-400">Gestión de mesas y servicio</p>
                  </div>
                </div>
              </button>

              {/* Chef Card */}
              <button
                onClick={() => handleRoleSelect("COCINERO")}
                className="w-full group relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 transition-all hover:bg-zinc-800 hover:border-white hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="relative flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-3xl">
                    👨‍🍳
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-bold mb-1">Cocinero</h3>
                    <p className="text-sm text-gray-400">Preparación de pedidos</p>
                  </div>
                </div>
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-gray-400">
              ¿Ya tienes una cuenta?{" "}
              <a className="font-semibold text-white hover:text-gray-300 transition" href="/auth/login">
                Inicia sesión
              </a>
            </p>
          </div>
        )}

        {/* Registration Form Step */}
        {step === "form" && selectedRole && (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 mb-3 text-4xl">
                {selectedRole === "ADMIN" ? "👑" : selectedRole === "MESERO" ? "🧑‍💼" : "👨‍🍳"}
              </div>
              <h1 className="text-2xl font-bold mb-1">
                Registro como {selectedRole === "ADMIN" ? "Dueño" : selectedRole === "MESERO" ? "Mesero" : "Cocinero"}
              </h1>
              <p className="text-gray-400">Completa tus datos</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium mb-2 block text-gray-300">Nombre Completo</span>
                  <input
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:outline-none transition"
                    placeholder="Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </label>

                {selectedRole === "ADMIN" && (
                  <label className="block">
                    <span className="text-sm font-medium mb-2 block text-gray-300">Correo Electrónico</span>
                    <input
                      type="email"
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:outline-none transition"
                      placeholder="juan@restaurante.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>
                )}

                <label className="block">
                  <span className="text-sm font-medium mb-2 block text-gray-300">Cédula</span>
                  <input
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:outline-none transition"
                    placeholder="1234567890"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium mb-2 block text-gray-300">Contraseña</span>
                  <input
                    type="password"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:outline-none transition"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white text-black py-4 font-bold text-lg transition hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed shadow-xl"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center text-xs text-gray-500">
              Al registrarte, aceptas nuestros{" "}
              <a href="/terminos" className="ml-1 underline hover:text-gray-400">
                Términos y Condiciones
              </a>
            </div>
          </div>
        )}
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
