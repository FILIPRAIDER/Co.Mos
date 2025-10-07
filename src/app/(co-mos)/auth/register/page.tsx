"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Modal from "@/components/Modal";

export default function RegisterPage() {
  const [name, setName] = useState("");
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
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, document, password, role: "WORKER" }),
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
    <main className="min-h-dvh bg-neutral-950 text-white grid place-items-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <Image src="/Logo.svg" alt="co.mos" width={32} height={32} />
          <span className="text-xl font-semibold">co.mos</span>
        </div>

        <h1 className="text-center text-2xl font-semibold">Registro Al Sistema</h1>
        <p className="text-center text-neutral-400 mb-6">Ingresa Tus Datos</p>

        <form onSubmit={onSubmit} className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm">Nombre Completo</span>
            <input
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2"
              placeholder="Escribe Tu Nombre Y Apellidos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm">Cédula</span>
            <input
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2"
              placeholder="Ingresa Tu Número De Cédula"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm">Contraseña</span>
            <input
              type="password"
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2"
              placeholder="Introduce Tu Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-white text-black py-3 font-medium disabled:opacity-60"
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          ¿Ya tienes una cuenta?{" "}
          <a className="font-semibold underline" href="/auth/login">
            Inicia sesión
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
