"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  X,
  Search
} from "lucide-react";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  available: boolean;
  createdAt: string;
};

type Category = "ENTRADA" | "PLATO_PRINCIPAL" | "POSTRE" | "BEBIDA" | "OTRO";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "ENTRADA", label: "Entrada" },
  { value: "PLATO_PRINCIPAL", label: "Plato Principal" },
  { value: "POSTRE", label: "Postre" },
  { value: "BEBIDA", label: "Bebida" },
  { value: "OTRO", label: "Otro" },
];

export default function AdminProductosPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "ALL">("ALL");
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "PLATO_PRINCIPAL" as Category,
    available: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', `product-${Date.now()}`);
      formData.append('folder', '/productos');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      alert("Por favor completa los campos requeridos");
      return;
    }

    let imageUrl = editingProduct?.imageUrl || null;

    // Si hay una nueva imagen, subirla
    if (selectedFile) {
      imageUrl = await uploadImage(selectedFile);
      if (!imageUrl) {
        alert("Error al subir la imagen");
        return;
      }
    }

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      imageUrl,
    };

    try {
      const url = editingProduct 
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      
      const method = editingProduct ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        setShowModal(false);
        resetForm();
        await fetchProducts();
      } else {
        const error = await response.json();
        alert(error.error || "Error al guardar producto");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error al guardar producto");
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchProducts();
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category as Category,
      available: product.available,
    });
    setPreviewUrl(product.imageUrl);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "PLATO_PRINCIPAL",
      available: true,
    });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "ALL" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const productsByCategory = CATEGORIES.map(cat => ({
    ...cat,
    count: products.filter(p => p.category === cat.value).length,
  }));

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
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-orange-500 to-red-500 border-b border-white/10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-full bg-white/20 p-2 transition hover:bg-white/30"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Image src="/Logo.svg" alt="co.mos" width={32} height={32} />
              <span className="text-lg font-semibold">Productos</span>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="rounded-full bg-white/20 p-2 transition hover:bg-white/30"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 px-10 py-2.5 text-sm placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilterCategory("ALL")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition whitespace-nowrap ${
                filterCategory === "ALL"
                  ? "bg-white text-orange-500"
                  : "bg-white/10 border border-white/30"
              }`}
            >
              Todos ({products.length})
            </button>
            {productsByCategory.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(cat.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition whitespace-nowrap ${
                  filterCategory === cat.value
                    ? "bg-white text-orange-500"
                    : "bg-white/10 border border-white/30"
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <div className="px-4 mt-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">
              {searchTerm || filterCategory !== "ALL" 
                ? "No se encontraron productos" 
                : "No hay productos aún"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-black/30">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-white/20" />
                    </div>
                  )}
                  {!product.available && (
                    <div className="absolute top-2 right-2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold">
                      No Disponible
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <span className="inline-block mt-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                        {CATEGORIES.find(c => c.value === product.category)?.label}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-orange-400">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                  
                  {product.description && (
                    <p className="text-sm text-white/60 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/20 flex items-center justify-center gap-2"
                    >
                      <Edit2 className="h-3 w-3" />
                      Editar
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="rounded-lg bg-white/10 px-3 py-2 transition hover:bg-red-500/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1a24] border border-white/10 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Imagen del Producto
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-48 rounded-xl bg-white/5 border-2 border-dashed border-white/20 cursor-pointer hover:border-white/40 transition overflow-hidden"
                >
                  {previewUrl ? (
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                      <Upload className="h-8 w-8 text-white/40 mb-2" />
                      <p className="text-sm text-white/60">Click para subir imagen</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Precio *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Available */}
              <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                <span className="text-sm font-medium">Disponible</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, available: !formData.available })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    formData.available ? "bg-orange-500" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      formData.available ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 font-bold transition hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              >
                {uploading ? "Subiendo imagen..." : editingProduct ? "Actualizar Producto" : "Crear Producto"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
