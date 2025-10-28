"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Store,
  Save,
  Upload,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Tag,
} from "lucide-react";
import Modal from "@/components/Modal";
import Image from "next/image";

type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function RestaurantePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  }>({ type: "success", title: "", message: "" });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRestaurant();
    }
  }, [status]);

  const fetchRestaurant = async () => {
    try {
      const response = await fetch("/api/restaurant");
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data.restaurant);
        setName(data.restaurant.name || "");
        setDescription(data.restaurant.description || "");
        setCategory(data.restaurant.category || "");
        setAddress(data.restaurant.address || "");
        setPhone(data.restaurant.phone || "");
        setLogoPreview(data.restaurant.logoUrl);
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload logo if changed
      let newLogoUrl = restaurant?.logoUrl;
      if (logoFile) {
        setUploadingLogo(true);
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("fileName", `restaurant-${Date.now()}`);
        formData.append("folder", "/restaurants");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          newLogoUrl = uploadData.url;
        }
        setUploadingLogo(false);
      }

      // Update restaurant
      const response = await fetch("/api/restaurant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          category,
          address,
          phone,
          logoUrl: newLogoUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRestaurant(data.restaurant);
        setModalConfig({
          type: "success",
          title: "¡Cambios guardados!",
          message: "La información del restaurante ha sido actualizada correctamente.",
        });
        setShowModal(true);
        setLogoFile(null);
      } else {
        const data = await response.json();
        setModalConfig({
          type: "error",
          title: "Error al guardar",
          message: data.error || "No se pudieron guardar los cambios",
        });
        setShowModal(true);
      }
    } catch (error) {
      setModalConfig({
        type: "error",
        title: "Error",
        message: "Ocurrió un error al guardar los cambios",
      });
      setShowModal(true);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 rounded-lg bg-zinc-900 border border-zinc-800 p-2 transition hover:border-zinc-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Store className="h-5 w-5 sm:h-6 sm:w-6" />
            Información del Restaurante
          </h1>
          <p className="text-sm text-white/60">
            Administra los datos y configuración de tu restaurante
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="max-w-3xl space-y-6">
        {/* Logo Section */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Logo del Restaurante</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-xl overflow-hidden border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center flex-shrink-0">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="Logo"
                  fill
                  className="object-cover"
                />
              ) : (
                <Store className="h-12 w-12 text-white/20" />
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
                <span className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition">
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

        {/* Basic Information */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-4">Información Básica</h2>

          <label className="block">
            <span className="text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <Store className="h-4 w-4" />
              Nombre del Restaurante *
            </span>
            <input
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
              placeholder="El Sabor de Casa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-2 block text-gray-300">
              Descripción
            </span>
            <textarea
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition resize-none"
              placeholder="Describe tu restaurante..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categoría
            </span>
            <select
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white focus:border-orange-500 focus:outline-none transition"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
        </div>

        {/* Contact Information */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-4">Información de Contacto</h2>

          <label className="block">
            <span className="text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Dirección
            </span>
            <input
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
              placeholder="Calle 123 #45-67"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Teléfono
            </span>
            <input
              type="tel"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition"
              placeholder="+57 300 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
        </div>

        {/* Metadata */}
        {restaurant && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Metadatos</h2>
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <span className="text-white/40">Creado:</span>
                <p className="text-white/80 mt-1">
                  {new Date(restaurant.createdAt).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <span className="text-white/40">Última actualización:</span>
                <p className="text-white/80 mt-1">
                  {new Date(restaurant.updatedAt).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={saving || uploadingLogo}
            className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-medium transition hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving
              ? uploadingLogo
                ? "Subiendo imagen..."
                : "Guardando..."
              : "Guardar Cambios"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-6 py-3 text-sm font-medium transition hover:bg-zinc-700"
          >
            Cancelar
          </button>
        </div>
      </form>

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
