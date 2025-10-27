"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Modal from "@/components/Modal";
import { ChevronLeft } from "lucide-react";

type Role = "ADMIN" | "MESERO" | "COCINERO";

export default function RegisterPage() {
  const [step, setStep] = useState<"role" | "form" | "restaurant">("role");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [document, setDocument] = useState("");
  const [password, setPassword] = useState("");
  
  // Restaurant data (only for ADMIN)
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

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep("form");
  };

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si es ADMIN, mostrar formulario de restaurante
    if (selectedRole === "ADMIN") {
      setStep("restaurant");
      return;
    }
    
    // Para otros roles, registrar directamente
    await submitRegistration();
  };

  async function submitRegistration() {
    if (!selectedRole) return;
    
    setLoading(true);
    
    // Upload logo if ADMIN
    let logoUrl = null;
    if (selectedRole === "ADMIN" && restaurantLogo) {
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
        email: selectedRole === "ADMIN" ? email : undefined,
        document, 
        password, 
        role: selectedRole,
        // Restaurant data (only for ADMIN)
        restaurantName: selectedRole === "ADMIN" ? restaurantName : undefined,
        restaurantDescription: selectedRole === "ADMIN" ? restaurantDescription : undefined,
        restaurantCategory: selectedRole === "ADMIN" ? restaurantCategory : undefined,
        restaurantAddress: selectedRole === "ADMIN" ? restaurantAddress : undefined,
        restaurantPhone: selectedRole === "ADMIN" ? restaurantPhone : undefined,
        restaurantLogoUrl: selectedRole === "ADMIN" ? logoUrl : undefined,
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

            <form onSubmit={handleFormSubmit} className="space-y-4">
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
                {selectedRole === "ADMIN" ? "Continuar →" : (loading ? "Creando cuenta..." : "Crear cuenta")}
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

        {/* Restaurant Information Step (Only for ADMIN) */}
        {step === "restaurant" && selectedRole === "ADMIN" && (
          <div className="animate-fadeIn">
            <div className="text-center mb-6">
              <button
                onClick={() => setStep("form")}
                className="absolute left-4 top-6 rounded-full bg-zinc-900 border border-zinc-800 p-2 transition hover:bg-zinc-800"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 mb-3 text-4xl">
                🏪
              </div>
              <h1 className="text-2xl font-bold mb-1">Información del Restaurante</h1>
              <p className="text-gray-400">Completa los datos de tu negocio</p>
            </div>

            <form onSubmit={async (e) => { e.preventDefault(); await submitRegistration(); }} className="space-y-4">
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Logo del Restaurante
                  </label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative h-20 w-20 rounded-xl overflow-hidden border-2 border-white/10">
                        <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-xl bg-zinc-800 border-2 border-dashed border-zinc-700 flex items-center justify-center">
                        <span className="text-3xl">🍽️</span>
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <span className="inline-block rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition">
                        {logoPreview ? "Cambiar logo" : "Subir logo"}
                      </span>
                    </label>
                  </div>
                </div>

                <label className="block">
                  <span className="text-sm font-medium mb-2 block text-gray-300">Nombre del Restaurante *</span>
                  <input
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:outline-none transition"
                    placeholder="El Sabor de Casa"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium mb-2 block text-gray-300">Descripción</span>
                  <textarea
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:outline-none transition resize-none"
                    placeholder="Describe tu restaurante..."
                    rows={3}
                    value={restaurantDescription}
                    onChange={(e) => setRestaurantDescription(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium mb-2 block text-gray-300">Categoría *</span>
                  <select
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white focus:border-white focus:outline-none transition"
                    value={restaurantCategory}
                    onChange={(e) => setRestaurantCategory(e.target.value)}
                    required
                  >
                    <option value="" className="bg-zinc-900">Selecciona una categoría</option>
                    <option value="Comida Rápida" className="bg-zinc-900">Comida Rápida</option>
                    <option value="Gourmet" className="bg-zinc-900">Gourmet</option>
                    <option value="Casual" className="bg-zinc-900">Casual</option>
                    <option value="Fine Dining" className="bg-zinc-900">Fine Dining</option>
                    <option value="Cafetería" className="bg-zinc-900">Cafetería</option>
                    <option value="Pizzería" className="bg-zinc-900">Pizzería</option>
                    <option value="Parrilla" className="bg-zinc-900">Parrilla</option>
                    <option value="Vegano/Vegetariano" className="bg-zinc-900">Vegano/Vegetariano</option>
                    <option value="Internacional" className="bg-zinc-900">Internacional</option>
                    <option value="Otro" className="bg-zinc-900">Otro</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium mb-2 block text-gray-300">Dirección</span>
                  <input
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:outline-none transition"
                    placeholder="Calle 123 #45-67"
                    value={restaurantAddress}
                    onChange={(e) => setRestaurantAddress(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium mb-2 block text-gray-300">Teléfono</span>
                  <input
                    type="tel"
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-white focus:outline-none transition"
                    placeholder="+57 300 123 4567"
                    value={restaurantPhone}
                    onChange={(e) => setRestaurantPhone(e.target.value)}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white text-black py-4 font-bold text-lg transition hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed shadow-xl"
              >
                {loading ? "Creando restaurante..." : "Crear cuenta"}
              </button>
            </form>
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
