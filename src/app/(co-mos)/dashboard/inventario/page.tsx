"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  AlertTriangle,
  ArrowLeft,
  TrendingDown,
  Archive,
} from "lucide-react";
import Image from "next/image";
import { useAlert } from "@/hooks/useAlert";

type InventoryItem = {
  id: string;
  name: string;
  sku?: string | null;
  quantity: number;
  unit: string;
  minStock?: number | null;
  cost?: number | null;
  createdAt: string;
  updatedAt: string;
};

export default function InventarioPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const { AlertComponent, success, error, confirm } = useAlert();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    quantity: 0,
    unit: "unidad",
    minStock: 0,
    cost: 0,
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
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/inventory");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingItem ? `/api/inventory/${editingItem.id}` : "/api/inventory";
      const method = editingItem ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        success(
          editingItem ? "Artículo actualizado" : "Artículo creado",
          `El artículo "${formData.name}" ha sido ${editingItem ? "actualizado" : "creado"} exitosamente.`
        );
        setShowModal(false);
        resetForm();
        fetchInventory();
      } else {
        const data = await response.json();
        error("Error", data.error || "No se pudo guardar el artículo");
      }
    } catch (err) {
      error("Error", "Ocurrió un error al guardar el artículo");
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku || "",
      quantity: item.quantity,
      unit: item.unit,
      minStock: item.minStock || 0,
      cost: item.cost || 0,
    });
    setShowModal(true);
  };

  const handleDelete = (item: InventoryItem) => {
    confirm(
      `¿Estás seguro de que deseas eliminar "${item.name}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          const response = await fetch(`/api/inventory/${item.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            success(`"${item.name}" ha sido eliminado exitosamente.`, "Artículo eliminado");
            fetchInventory();
          } else {
            error("No se pudo eliminar el artículo");
          }
        } catch (err) {
          error("Ocurrió un error al eliminar el artículo");
        }
      },
      "Eliminar artículo"
    );
  };

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      quantity: 0,
      unit: "unidad",
      minStock: 0,
      cost: 0,
    });
    setEditingItem(null);
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = items.filter(
    (item) => item.minStock && item.quantity <= item.minStock
  );

  const totalValue = items.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 rounded-lg bg-zinc-900 border border-zinc-800 p-2 transition hover:border-zinc-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-orange-500" />
              Gestión de Inventario
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Control de stock y suministros
            </p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-medium transition hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            Nuevo Artículo
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Total Artículos</span>
            <Archive className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold">{items.length}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Stock Bajo</span>
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-yellow-400">{lowStockItems.length}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Valor Total</span>
            <TrendingDown className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold">${totalValue.toLocaleString()}</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Unidades Totales</span>
            <Package className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold">
            {items.reduce((sum, item) => sum + item.quantity, 0)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-300">
                {lowStockItems.length} artículo(s) con stock bajo
              </p>
              <p className="text-sm text-yellow-400/80 mt-1">
                {lowStockItems.map((item) => item.name).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  Artículo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                  Stock Mín.
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                  Costo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredItems.map((item) => {
                const isLowStock = item.minStock && item.quantity <= item.minStock;
                return (
                  <tr key={item.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isLowStock && (
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        )}
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {item.sku || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={isLowStock ? "text-yellow-400 font-medium" : ""}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white/60">
                      {item.minStock || "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-white/60">
                      ${item.cost?.toLocaleString() || "0"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${((item.cost || 0) * item.quantity).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="rounded-md bg-blue-500/20 p-2 text-blue-400 transition hover:bg-blue-500/30"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="rounded-md bg-red-500/20 p-2 text-red-400 transition hover:bg-red-500/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">
                {searchQuery ? "No se encontraron artículos" : "No hay artículos en el inventario"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? "Editar Artículo" : "Nuevo Artículo"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cantidad *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Unidad</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilogramo</option>
                    <option value="g">Gramo</option>
                    <option value="l">Litro</option>
                    <option value="ml">Mililitro</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Stock Mínimo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minStock}
                    onChange={(e) =>
                      setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Costo ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 rounded-lg bg-white/10 px-4 py-2 font-medium transition hover:bg-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-orange-500 px-4 py-2 font-medium transition hover:bg-orange-600"
                >
                  {editingItem ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertComponent />
    </div>
  );
}
