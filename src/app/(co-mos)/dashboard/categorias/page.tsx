"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Plus, Pencil, Trash2, Image as ImageIcon, Package } from "lucide-react";
import Image from "next/image";
import { useAlert } from "@/hooks/useAlert";

type Category = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  order: number;
  _count?: {
    products: number;
  };
};

export default function CategoriasPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { success, error, confirm, AlertComponent } = useAlert();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    order: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "categories");

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, imageUrl: data.url }));
        success("Imagen subida correctamente");
      } else {
        error("Error al subir la imagen");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      error("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      error("El nombre es requerido");
      return;
    }

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      
      const method = editingCategory ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCategories();
        closeModal();
        success(
          editingCategory
            ? "Categoría actualizada correctamente"
            : "Categoría creada correctamente"
        );
      } else {
        const errorData = await response.json();
        error(errorData.error || "Error al guardar categoría");
      }
    } catch (err) {
      console.error("Error saving category:", err);
      error("Error al guardar categoría");
    }
  };

  const handleDelete = async (category: Category) => {
    if (category._count && category._count.products > 0) {
      error(
        `No se puede eliminar. Hay ${category._count.products} producto(s) usando esta categoría`,
        "Categoría en uso"
      );
      return;
    }

    confirm(
      `¿Estás seguro de eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          const response = await fetch(`/api/categories/${category.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            await fetchCategories();
            success("Categoría eliminada correctamente");
          } else {
            const errorData = await response.json();
            error(errorData.error || "Error al eliminar categoría");
          }
        } catch (err) {
          console.error("Error deleting category:", err);
          error("Error al eliminar categoría");
        }
      },
      "Eliminar Categoría",
      "Eliminar",
      "Cancelar"
    );
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
        imageUrl: category.imageUrl || "",
        order: category.order,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        imageUrl: "",
        order: categories.length,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      imageUrl: "",
      order: 0,
    });
  };

  if (status === "loading" || loading) {
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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black border-b border-zinc-800">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-lg bg-zinc-900 border border-zinc-800 p-2 transition hover:border-zinc-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Image src="/Logo.svg" alt="co.mos" width={32} height={32} />
              <span className="text-lg font-semibold">Categorías</span>
            </div>
            <button
              onClick={() => openModal()}
              className="rounded-lg bg-orange-500 px-4 py-2 font-semibold transition hover:bg-orange-600 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-gray-400">Total</span>
              </div>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
              <div className="flex items-center gap-2 mb-1">
                <ImageIcon className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-gray-400">Con Imagen</span>
              </div>
              <p className="text-2xl font-bold">
                {categories.filter((c) => c.imageUrl).length}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Categories List */}
      <div className="px-4 py-4 space-y-3">
        {categories.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto text-zinc-700 mb-4" />
            <p className="text-lg font-semibold mb-2">Sin categorías</p>
            <p className="text-sm text-gray-400 mb-4">
              Crea categorías para organizar tus productos
            </p>
            <button
              onClick={() => openModal()}
              className="rounded-lg bg-orange-500 px-6 py-2 font-semibold transition hover:bg-orange-600"
            >
              Crear Primera Categoría
            </button>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 hover:border-zinc-700 transition"
            >
              <div className="flex items-start gap-4">
                {/* Image */}
                <div className="relative h-16 w-16 shrink-0 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-zinc-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-lg">{category.name}</h3>
                    <span className="shrink-0 rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs font-medium">
                      #{category.order}
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-400 mb-2">
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Package className="h-3 w-3" />
                    <span>
                      {category._count?.products || 0} producto(s)
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(category)}
                    className="rounded-lg bg-zinc-800 border border-zinc-700 p-2 transition hover:border-zinc-600"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="rounded-lg bg-zinc-800 border border-red-900/50 p-2 transition hover:bg-red-900/20 hover:border-red-800"
                    title="Eliminar"
                    disabled={category._count && category._count.products > 0}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-lg rounded-lg bg-zinc-900 border border-zinc-800 p-6">
            <h2 className="mb-4 text-xl font-bold">
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Ej: Platos Fuertes"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  placeholder="Descripción de la categoría..."
                  rows={3}
                />
              </div>

              {/* Order */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Orden
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  min="0"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Imagen
                </label>
                {formData.imageUrl ? (
                  <div className="mb-2">
                    <div className="relative h-32 w-32 rounded-lg overflow-hidden border border-zinc-700">
                      <Image
                        src={formData.imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                      className="mt-2 text-sm text-red-400 hover:text-red-300"
                    >
                      Eliminar imagen
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-white file:mr-4 file:rounded file:border-0 file:bg-orange-500 file:px-4 file:py-1 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-600 focus:outline-none"
                    />
                    {uploading && (
                      <p className="mt-2 text-sm text-gray-400">Subiendo...</p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 font-semibold transition hover:border-zinc-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-orange-500 px-4 py-2 font-semibold transition hover:bg-orange-600"
                  disabled={uploading}
                >
                  {editingCategory ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Component */}
      <AlertComponent />
    </div>
  );
}
