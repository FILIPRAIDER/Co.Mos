"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Modal from "@/components/Modal";
import { ChevronLeft, Upload, Store, User, Mail, Lock, FileText, MapPin, Phone } from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState<"personal" | "restaurant">("personal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [document, setDocument] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Restaurant data
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantDescription, setRestaurantDescription] = useState("");
  const [restaurantCategory, setRestaurantCategory] = useState("");
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [restaurantPhone, setRestaurantPhone] = useState("");
  const [restaurantLogo, setRestaurantLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  }>({ type: "success", title: "", message: "" });
  const router = useRouter();

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestaurantLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePersonalInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setModalConfig({
        type: "error",
        title: "Error",
        message: "Las contraseñas no coinciden",
      });
      setShowModal(true);
      return;
    }
    
    if (password.length < 6) {
      setModalConfig({
        type: "error",
        title: "Error",
        message: "La contraseña debe tener al menos 6 caracteres",
      });
      setShowModal(true);
      return;
    }
    
    // Avanzar al paso de restaurante
    setStep("restaurant");
  };

  const handleRestaurantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRegistration();
  };

  async function submitRegistration() {
    setLoading(true);
    
    // Upload logo if provided
    let logoUrl = null;
    if (restaurantLogo) {
      try {
        const formData = new FormData();
        formData.append('file', restaurantLogo);
        formData.append('fileName', `restaurant-${Date.now()}`);
        formData.append('folder', '/restaurants');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          logoUrl = uploadData.url;
        }
      } catch (error) {
        console.error('Error uploading logo:', error);
      }
    }
    
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ 
        name, 
        email,
        document, 
        password, 
        role: "ADMIN",
        restaurantName,
        restaurantDescription,
        restaurantCategory,
        restaurantAddress,
        restaurantPhone,
        restaurantLogo: logoUrl,
      }),
      headers: { "Content-Type": "application/json" },
    });

    setLoading(false);

    if (res.ok) {
      setModalConfig({
        type: "success",
        title: "Registro Exitoso",
        message: "Tu cuenta y restaurante han sido creados. Serás redirigido al inicio de sesión.",
      });
      setShowModal(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } else {
      const data = await res.json();
      setModalConfig({
        type: "error",
        title: "Error en el Registro",
        message: data.error || "Hubo un problema al crear tu cuenta. Intenta de nuevo.",
      });
      setShowModal(true);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.03),transparent_50%)]" />
      
      <div className="relative w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={120}
            height={120}
            className="mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white">
            Crea tu Restaurante
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Registra tu negocio y comienza a gestionar tus operaciones
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className={`flex items-center gap-2 ${step === "personal" ? "text-orange-500" : "text-green-500"}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              step === "personal" ? "border-orange-500 bg-orange-500/10" : "border-green-500 bg-green-500/10"
            }`}>
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Datos Personales</span>
          </div>
          <div className="h-px w-12 bg-zinc-800" />
          <div className={`flex items-center gap-2 ${step === "restaurant" ? "text-orange-500" : "text-white/40"}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              step === "restaurant" ? "border-orange-500 bg-orange-500/10" : "border-zinc-700 bg-zinc-900"
            }`}>
              <Store className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Restaurante</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 backdrop-blur-sm">
          {step === "personal" && (
            <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-6">
                  Información Personal
                </h2>
                
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                      <User className="h-4 w-4" />
                      Nombre Completo *
                    </span>
                    <input
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                      placeholder="Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Mail className="h-4 w-4" />
                      Email *
                    </span>
                    <input
                      type="email"
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                      placeholder="juan@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                      <FileText className="h-4 w-4" />
                      Cédula *
                    </span>
                    <input
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                      placeholder="1234567890"
                      value={document}
                      onChange={(e) => setDocument(e.target.value)}
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Lock className="h-4 w-4" />
                      Contraseña *
                    </span>
                    <input
                      type="password"
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Lock className="h-4 w-4" />
                      Confirmar Contraseña *
                    </span>
                    <input
                      type="password"
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/auth/login")}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-orange-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-600"
                >
                  Continuar
                </button>
              </div>
            </form>
          )}

          {step === "restaurant" && (
            <form onSubmit={handleRestaurantSubmit} className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setStep("personal")}
                  className="rounded-lg bg-zinc-800 border border-zinc-700 p-2 transition hover:bg-zinc-700"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-semibold text-white">
                  Información del Restaurante
                </h2>
              </div>

              <div className="space-y-4">
                {/* Logo Upload */}
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                  <span className="mb-3 block text-sm font-medium text-gray-300">
                    Logo del Restaurante
                  </span>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative h-24 w-24 rounded-xl overflow-hidden border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      {logoPreview ? (
                        <Image
                          src={logoPreview}
                          alt="Logo preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Store className="h-10 w-10 text-white/20" />
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        <span className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 border border-zinc-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600 transition">
                          <Upload className="h-4 w-4" />
                          {logoPreview ? "Cambiar logo" : "Subir logo"}
                        </span>
                      </label>
                      <p className="mt-2 text-xs text-white/40">
                        Recomendado: 512x512px, PNG o JPG
                      </p>
                    </div>
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Store className="h-4 w-4" />
                    Nombre del Restaurante *
                  </span>
                  <input
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                    placeholder="El Sabor de Casa"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-300">
                    Descripción
                  </span>
                  <textarea
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition resize-none"
                    placeholder="Describe tu restaurante..."
                    rows={3}
                    value={restaurantDescription}
                    onChange={(e) => setRestaurantDescription(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-300">
                    Categoría
                  </span>
                  <select
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white focus:border-orange-500 focus:outline-none transition"
                    value={restaurantCategory}
                    onChange={(e) => setRestaurantCategory(e.target.value)}
                  >
                    <option value="">Selecciona una categoría</option>
                    <option value="Comida Rápida">Comida Rápida</option>
                    <option value="Gourmet">Gourmet</option>
                    <option value="Casual">Casual</option>
                    <option value="Fine Dining">Fine Dining</option>
                    <option value="Cafetería">Cafetería</option>
                    <option value="Pizzería">Pizzería</option>
                    <option value="Parrilla">Parrilla</option>
                    <option value="Vegano/Vegetariano">Vegano/Vegetariano</option>
                    <option value="Internacional">Internacional</option>
                    <option value="Otro">Otro</option>
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                      <MapPin className="h-4 w-4" />
                      Dirección
                    </span>
                    <input
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                      placeholder="Calle 123 #45-67"
                      value={restaurantAddress}
                      onChange={(e) => setRestaurantAddress(e.target.value)}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </span>
                    <input
                      type="tel"
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
                      placeholder="+57 300 123 4567"
                      value={restaurantPhone}
                      onChange={(e) => setRestaurantPhone(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("personal")}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-orange-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Creando cuenta...
                    </span>
                  ) : (
                    "Crear Restaurante"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-white/60">
          ¿Ya tienes una cuenta?{" "}
          <button
            onClick={() => router.push("/auth/login")}
            className="font-medium text-orange-500 hover:text-orange-400 transition"
          >
            Inicia sesión aquí
          </button>
        </p>
      </div>

      {/* Modal */}
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
