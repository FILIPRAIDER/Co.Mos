"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  ArrowLeft,
} from "lucide-react";

type OrderStats = {
  totalOrders: number;
  totalRevenue: number;
  totalTips: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  ordersByStatus: Record<string, number>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
};

export default function ReportesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month">("today");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/reports?range=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!stats) return;

    const csvContent = [
      ["Métrica", "Valor"],
      ["Total Órdenes", stats.totalOrders],
      ["Ingresos Totales", `$${stats.totalRevenue}`],
      ["Propinas Totales", `$${stats.totalTips}`],
      ["Ticket Promedio", `$${stats.averageOrderValue}`],
      [],
      ["Top Productos"],
      ["Producto", "Cantidad", "Ingresos"],
      ...stats.topProducts.map((p) => [p.productName, p.quantity, `$${p.revenue}`]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${dateRange}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-white/60">Cargando reportes...</p>
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
            <h1 className="text-2xl font-bold">📊 Reportes y Análisis</h1>
            <p className="mt-1 text-sm text-white/60">
              Visualiza el rendimiento de tu restaurante
            </p>
          </div>

          <div className="flex gap-2">
            {/* Date Range Selector */}
            <div className="flex rounded-lg bg-zinc-900 border border-zinc-800 p-1">
              <button
                onClick={() => setDateRange("today")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  dateRange === "today"
                    ? "bg-orange-500 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setDateRange("week")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  dateRange === "week"
                    ? "bg-orange-500 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setDateRange("month")}
                className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                  dateRange === "month"
                    ? "bg-orange-500 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Mes
              </button>
            </div>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium transition hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Total Órdenes</span>
            <ShoppingBag className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold">{stats?.totalOrders || 0}</p>
          <p className="mt-1 text-xs text-green-400">↑ vs período anterior</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Ingresos</span>
            <DollarSign className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold">${stats?.totalRevenue?.toLocaleString() || 0}</p>
          <p className="mt-1 text-xs text-green-400">+{stats?.totalTips || 0} en propinas</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Ticket Promedio</span>
            <TrendingUp className="h-5 w-5 text-orange-400" />
          </div>
          <p className="text-3xl font-bold">
            ${stats?.averageOrderValue?.toLocaleString() || 0}
          </p>
          <p className="mt-1 text-xs text-white/40">Por orden</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Propinas</span>
            <Users className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold">${stats?.totalTips?.toLocaleString() || 0}</p>
          <p className="mt-1 text-xs text-white/40">Total recibido</p>
        </div>
      </div>

      {/* Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Productos Más Vendidos</h2>
          </div>
          <div className="space-y-3">
            {stats?.topProducts?.slice(0, 5).map((product, index) => (
              <div
                key={product.productId}
                className="flex items-center justify-between rounded-lg bg-white/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 text-sm font-bold text-orange-400">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{product.productName}</p>
                    <p className="text-xs text-white/40">{product.quantity} vendidos</p>
                  </div>
                </div>
                <p className="font-semibold text-green-400">
                  ${product.revenue.toLocaleString()}
                </p>
              </div>
            )) || (
              <p className="text-center text-sm text-white/40 py-8">
                No hay datos disponibles
              </p>
            )}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Órdenes por Estado</h2>
          </div>
          <div className="space-y-3">
            {stats?.ordersByStatus && Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-lg bg-white/5 p-3"
              >
                <span className="font-medium capitalize">
                  {status === "PENDING" ? "🟡 Pendiente" :
                   status === "PREPARING" ? "🔵 Preparando" :
                   status === "READY" ? "🟢 Lista" :
                   status === "DELIVERED" ? "✅ Entregada" :
                   status === "PAID" ? "💰 Pagada" :
                   status === "CANCELLED" ? "❌ Cancelada" : status}
                </span>
                <span className="text-2xl font-bold">{count}</span>
              </div>
            )) || (
              <p className="text-center text-sm text-white/40 py-8">
                No hay datos disponibles
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Future: Charts and graphs can be added here */}
      <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-center text-sm text-white/40">
          📈 Gráficos de tendencias próximamente...
        </p>
      </div>
    </div>
  );
}
