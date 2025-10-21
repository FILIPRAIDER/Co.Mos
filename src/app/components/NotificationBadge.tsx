"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

type LowStockData = {
  count: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    minStock: number | null;
  }>;
};

export default function NotificationBadge() {
  const { data: session } = useSession();
  const [lowStock, setLowStock] = useState<LowStockData | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchLowStock();
      // Refresh every 5 minutes
      const interval = setInterval(fetchLowStock, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchLowStock = async () => {
    try {
      const response = await fetch("/api/inventory/low-stock");
      if (response.ok) {
        const data = await response.json();
        setLowStock(data);
      }
    } catch (error) {
      console.error("Error fetching low stock:", error);
    }
  };

  if (!session?.user || session.user.role !== "ADMIN" || !lowStock || lowStock.count === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-2 transition hover:bg-yellow-500/20"
      >
        <AlertTriangle className="h-5 w-5 text-yellow-400" />
        {lowStock.count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {lowStock.count > 9 ? "9+" : lowStock.count}
          </span>
        )}
      </button>

      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50">
          <div className="rounded-lg border border-yellow-500/30 bg-zinc-900 p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <h3 className="font-semibold text-yellow-400">
                Stock Bajo ({lowStock.count})
              </h3>
            </div>
            
            <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
              {lowStock.items.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="rounded-md bg-white/5 p-2 text-sm"
                >
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-xs text-white/60">
                    Stock: {item.quantity} / Mínimo: {item.minStock}
                  </p>
                </div>
              ))}
              {lowStock.count > 5 && (
                <p className="text-xs text-white/40 text-center pt-1">
                  +{lowStock.count - 5} más...
                </p>
              )}
            </div>

            <Link
              href="/dashboard/inventario"
              className="block w-full rounded-md bg-yellow-500 px-3 py-2 text-center text-sm font-medium text-black transition hover:bg-yellow-400"
            >
              Ir a Inventario
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
