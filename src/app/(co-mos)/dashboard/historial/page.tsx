"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Receipt, Search, Calendar, X, ChevronDown, ChevronUp } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  notes?: string | null;
  product: {
    id: string;
    name: string;
    price: number;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  table: {
    number: number;
  };
}

export default function HistorialPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, filterStatus]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        // Ordenar por fecha descendente
        const sortedOrders = data.sort(
          (a: Order, b: Order) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sortedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.table.number.toString().includes(searchQuery)
      );
    }

    // Filtrar por estado
    if (filterStatus !== "ALL") {
      filtered = filtered.filter((order) => order.status === filterStatus);
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDIENTE":
        return "bg-yellow-500";
      case "PREPARANDO":
        return "bg-orange-500";
      case "LISTA":
        return "bg-green-500";
      case "ENTREGADA":
        return "bg-blue-500";
      case "COMPLETADA":
      case "PAGADA":
        return "bg-gray-500";
      case "CANCELADA":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleViewInvoice = (order: Order) => {
    setSelectedOrderForInvoice(order);
    setShowInvoiceModal(true);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Historial de Pedidos</h1>
          <p className="text-sm text-white/60">Consulta y genera facturas de pedidos anteriores</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5">
          <Receipt className="h-4 w-4" />
          <span className="text-sm font-medium">{filteredOrders.length} pedidos</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-lg border border-white/10 bg-zinc-900 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por número, cliente o mesa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-800 py-2 pl-10 pr-4 text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
            />
          </div>

          {/* Filtro por estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white focus:border-white/30 focus:outline-none"
          >
            <option value="ALL">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PREPARANDO">Preparando</option>
            <option value="LISTA">Lista</option>
            <option value="ENTREGADA">Entregada</option>
            <option value="COMPLETADA">Completada</option>
            <option value="PAGADA">Pagada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Lista de órdenes */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-zinc-900 py-12 text-center">
            <div className="mb-4 text-6xl">📋</div>
            <p className="text-lg font-semibold text-white">No se encontraron pedidos</p>
            <p className="text-sm text-white/60">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border border-white/10 bg-zinc-900 overflow-hidden"
            >
              {/* Header de la orden */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-white">{order.orderNumber}</span>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-xs font-medium text-white ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <span>🪑 Mesa {order.table.number}</span>
                      <span>•</span>
                      <span>{order.customerName || "Cliente"}</span>
                      <span>•</span>
                      <span>
                        {new Date(order.createdAt).toLocaleDateString("es-CO", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-orange-500">
                    ${order.total.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleViewInvoice(order)}
                    className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-sm font-medium text-white transition"
                  >
                    Ver Factura
                  </button>
                  <button
                    onClick={() =>
                      setExpandedOrder(expandedOrder === order.id ? null : order.id)
                    }
                    className="rounded-lg bg-white/10 hover:bg-white/20 p-2 text-white transition"
                  >
                    {expandedOrder === order.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Detalles expandidos */}
              {expandedOrder === order.id && (
                <div className="border-t border-white/10 bg-zinc-800 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white/80">Productos</h3>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-zinc-900 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500 text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <div>
                            <p className="font-medium text-white">{item.product.name}</p>
                            {item.notes && (
                              <p className="text-xs text-orange-400">📝 {item.notes}</p>
                            )}
                          </div>
                        </div>
                        <span className="font-medium text-white">
                          ${(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de Factura */}
      {showInvoiceModal && selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-md rounded-xl bg-neutral-900 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-neutral-900 p-6">
              <h2 className="text-2xl font-serif italic text-white">Factura</h2>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="rounded-full p-2 hover:bg-white/10 transition"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Info de la orden */}
              <div className="space-y-2 pb-4 border-b border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Número de Orden</span>
                  <span className="text-white font-medium">{selectedOrderForInvoice.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Mesa</span>
                  <span className="text-white font-medium">{selectedOrderForInvoice.table.number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Cliente</span>
                  <span className="text-white font-medium">{selectedOrderForInvoice.customerName || "Cliente"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Fecha</span>
                  <span className="text-white font-medium">
                    {new Date(selectedOrderForInvoice.createdAt).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium text-white/60">
                  <span>Producto</span>
                  <div className="flex items-center gap-8">
                    <span>Cantidad</span>
                    <span>Precio</span>
                  </div>
                </div>

                {selectedOrderForInvoice.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-white">{item.product.name}</span>
                    <div className="flex items-center gap-12">
                      <span className="text-white text-center w-8">{item.quantity}</span>
                      <span className="text-white w-24 text-right">
                        $ {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="pt-4 space-y-2 border-t border-white/10">
                <div className="flex justify-between">
                  <span className="font-medium text-white">Total</span>
                  <span className="font-medium text-white">
                    $ {selectedOrderForInvoice.total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Estado */}
              <div className="rounded-lg bg-white/5 border border-white/10 p-4 text-center">
                <span
                  className={`inline-block rounded-lg px-3 py-1 text-sm font-medium text-white ${getStatusColor(
                    selectedOrderForInvoice.status
                  )}`}
                >
                  {selectedOrderForInvoice.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
