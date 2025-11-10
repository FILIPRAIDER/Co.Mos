"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Lock, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Modal from "@/components/Modal";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  }>({ type: "success", title: "", message: "" });

  const isFirstTimeChange = (session?.user as any)?.mustChangePassword;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (!/[A-Z]/.test(password)) {
      return "La contraseña debe contener al menos una mayúscula";
    }
    if (!/[a-z]/.test(password)) {
      return "La contraseña debe contener al menos una minúscula";
    }
    if (!/[0-9]/.test(password)) {
      return "La contraseña debe contener al menos un número";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (newPassword !== confirmPassword) {
      setModalConfig({
        type: "error",
        title: "Error",
        message: "Las contraseñas no coinciden",
      });
      setShowModal(true);
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setModalConfig({
        type: "error",
        title: "Contraseña inválida",
        message: passwordError,
      });
      setShowModal(true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setModalConfig({
          type: "success",
          title: "¡Contraseña actualizada!",
          message: "Tu contraseña se ha cambiado exitosamente. Serás redirigido al inicio de sesión.",
        });
        setShowModal(true);
        
        // Cerrar sesión y redirigir al login después de 2 segundos
        setTimeout(async () => {
          await signOut({ 
            redirect: true,
            callbackUrl: "/auth/login?message=password-changed" 
          });
        }, 2000);
      } else {
        setModalConfig({
          type: "error",
          title: "Error",
          message: data.error || "No se pudo cambiar la contraseña",
        });
        setShowModal(true);
      }
    } catch (error) {
      setModalConfig({
        type: "error",
        title: "Error",
        message: "Ocurrió un error al cambiar la contraseña",
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Image
            src="/Logo.svg"
            alt="co.mos"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold mb-2">Cambiar Contraseña</h1>
          {isFirstTimeChange && (
            <div className="rounded-lg bg-orange-500/20 border border-orange-500/50 p-4 mb-4">
              <p className="text-sm text-orange-300">
                ⚠️ <strong>Primer inicio de sesión:</strong> Por seguridad, debes cambiar tu contraseña temporal.
              </p>
            </div>
          )}
          <p className="text-sm text-white/60">
            {isFirstTimeChange 
              ? "Crea una contraseña segura para tu cuenta"
              : "Actualiza tu contraseña de acceso"}
          </p>
        </div>

        {/* Form */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-300">
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 pr-12 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                  placeholder="Tu contraseña actual"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-300">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 pr-12 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-400">La contraseña debe contener:</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li className={newPassword.length >= 8 ? "text-green-400" : ""}>
                    {newPassword.length >= 8 ? "✓" : "○"} Mínimo 8 caracteres
                  </li>
                  <li className={/[A-Z]/.test(newPassword) ? "text-green-400" : ""}>
                    {/[A-Z]/.test(newPassword) ? "✓" : "○"} Una letra mayúscula
                  </li>
                  <li className={/[a-z]/.test(newPassword) ? "text-green-400" : ""}>
                    {/[a-z]/.test(newPassword) ? "✓" : "○"} Una letra minúscula
                  </li>
                  <li className={/[0-9]/.test(newPassword) ? "text-green-400" : ""}>
                    {/[0-9]/.test(newPassword) ? "✓" : "○"} Un número
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-300">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 pr-12 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                  placeholder="Confirma tu nueva contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-red-400">
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-medium transition hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Cambiando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Cambiar Contraseña
                  </>
                )}
              </button>
              {!isFirstTimeChange && (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-sm font-medium transition hover:bg-zinc-700"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {isFirstTimeChange && (
          <p className="mt-4 text-center text-xs text-white/40">
            No podrás acceder al sistema hasta que cambies tu contraseña
          </p>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
}
