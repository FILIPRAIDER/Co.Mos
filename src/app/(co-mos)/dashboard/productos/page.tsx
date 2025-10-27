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
  categoryId: string | null;
  categoryRef?: {
    id: string;
    name: string;
  } | null;
  imageUrl: string | null;
  available: boolean;
  createdAt: string;
};

type Category = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  _count?: {
    products: number;
  };
};

export default function AdminProductosPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
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
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
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
      categoryId: product.categoryId || (categories.length > 0 ? categories[0].id : ""),
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
      categoryId: categories.length > 0 ? categories[0].id : "",
      available: true,
    });
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openCategoryModal = (category: Category) => {
    setSelectedCategoryForModal(category);
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setSelectedCategoryForModal(null);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "ALL" || product.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const productsByCategory = categories.map(cat => ({
    ...cat,
    count: products.filter(p => p.categoryId === cat.id).length,
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
      <header className="sticky top-0 z-40 bg-black border-b border-zinc-800">
        <div className="px-3 sm:px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-full bg-zinc-900 border border-zinc-800 p-2 transition hover:bg-zinc-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Image src="/Logo.svg" alt="co.mos" width={32} height={32} />
              <span className="text-base sm:text-lg font-semibold">Productos</span>
            </div>
            <button
              onClick={openCreateModal}
              className="rounded-full bg-orange-500 p-2 transition hover:bg-orange-600"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-10 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:border-zinc-700"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 sm:-mx-4 px-3 sm:px-4">
            <button
              onClick={() => setFilterCategory("ALL")}
              className={`rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition whitespace-nowrap shrink-0 ${
                filterCategory === "ALL"
                  ? "bg-white text-orange-500"
                  : "bg-white/10 border border-white/30"
              }`}
            >
              Todos ({products.length})
            </button>
            {productsByCategory.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                onDoubleClick={() => openCategoryModal(cat)}
                className={`rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition whitespace-nowrap shrink-0 ${
                  filterCategory === cat.id
                    ? "bg-white text-orange-500"
                    : "bg-white/10 border border-white/30 hover:bg-white/20"
                }`}
                title="Doble click para ver todos los productos"
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <div className="px-3 sm:px-4 mt-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 text-sm sm:text-base">
              {searchTerm || filterCategory !== "ALL" 
                ? "No se encontraron productos" 
                : "No hay productos aún"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden"
              >
                {/* Product Image */}
                <div className="relative h-40 sm:h-48 bg-black/30">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white/20" />
                    </div>
                  )}
                  {!product.available && (
                    <div className="absolute top-2 right-2 rounded-full bg-red-500 px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-bold">
                      No Disponible
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-base sm:text-lg truncate">{product.name}</h3>
                      <span className="inline-block mt-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                        {product.categoryRef?.name || categories.find(c => c.id === product.categoryId)?.name || 'Sin categoría'}
                      </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-orange-400 shrink-0">
                      ${product.price.toLocaleString()}
                    </p>
                  </div>
                  
                  {product.description && (
                    <p className="text-xs sm:text-sm text-white/60 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="flex-1 rounded-lg bg-white/10 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition hover:bg-white/20 flex items-center justify-center gap-1 sm:gap-2"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="rounded-lg bg-white/10 px-2 sm:px-3 py-2 transition hover:bg-red-500/30"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Precio *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  required
                >
                  {categories.length === 0 && (
                    <option value="" className="bg-zinc-900 text-white/60">
                      No hay categorías disponibles
                    </option>
                  )}
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-zinc-900 text-white">
                      {cat.name}
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

      {/* Category Products Modal */}
      {showCategoryModal && selectedCategoryForModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 animate-fadeIn">
          <div className="w-full sm:max-w-4xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl bg-[#1a1a24] border-t sm:border border-white/10 overflow-hidden flex flex-col animate-slideUp sm:animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-orange-500/10 to-red-500/10">
              <div className="flex items-center gap-3">
                {selectedCategoryForModal.imageUrl && (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                    <Image
                      src={selectedCategoryForModal.imageUrl}
                      alt={selectedCategoryForModal.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {selectedCategoryForModal.name}
                  </h2>
                  {selectedCategoryForModal.description && (
                    <p className="text-sm text-white/60 mt-1">
                      {selectedCategoryForModal.description}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={closeCategoryModal}
                className="rounded-full bg-white/10 p-2 transition hover:bg-white/20 shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {(() => {
                const categoryProducts = products.filter(
                  (p) => p.categoryId === selectedCategoryForModal.id
                );
                
                if (categoryProducts.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12">
                      <ImageIcon className="h-16 w-16 text-white/20 mb-4" />
                      <p className="text-white/60 text-center">
                        No hay productos en esta categoría
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryProducts.map((product) => (
                      <div
                        key={product.id}
                        className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden hover:border-orange-500/50 transition-all group"
                      >
                        {/* Product Image */}
                        <div className="relative h-40 sm:h-48 bg-black/30 overflow-hidden">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-base sm:text-lg text-white flex-1 min-w-0 pr-2">
                              {product.name}
                            </h3>
                            <p className="text-xl sm:text-2xl font-bold text-orange-400 shrink-0">
                              ${product.price.toLocaleString()}
                            </p>
                          </div>
                          
                          {product.description && (
                            <p className="text-xs sm:text-sm text-white/60 line-clamp-2">
                              {product.description}
                            </p>
                          )}

                          {/* Quick Actions */}
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => {
                                closeCategoryModal();
                                openEditModal(product);
                              }}
                              className="flex-1 rounded-lg bg-orange-500/20 border border-orange-500/50 px-3 py-2 text-xs sm:text-sm font-medium text-orange-400 transition hover:bg-orange-500/30 flex items-center justify-center gap-2"
                            >
                              <Edit2 className="h-3 w-3" />
                              Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-white/10 bg-[#1a1a24]">
              <button
                onClick={closeCategoryModal}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 font-medium text-white transition hover:bg-white/20"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
