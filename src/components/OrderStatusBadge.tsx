"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OrderStatus = "PENDIENTE" | "ACEPTADA" | "PREPARANDO" | "LISTA" | "ENTREGADA" | "COMPLETADA" | "PAGADA" | "CANCELADA";

interface Order {
  id: string;
  status: OrderStatus;
  createdAt: string;
}

const statusConfig = {
  PENDIENTE: {
    icon: "✓ Recibido",
    label: "Recibido",
    color: "bg-green-500",
    textColor: "text-green-400",
    bgColor: "bg-green-500/10"
  },
  ACEPTADA: {
    icon: "👍 Aceptado",
    label: "Aceptado",
    color: "bg-blue-500",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10"
  },
  PREPARANDO: {
    icon: "🍳 Preparando",
    label: "Preparando",
    color: "bg-orange-500",
    textColor: "text-orange-400",
    bgColor: "bg-orange-500/10"
  },
  LISTA: {
    icon: "✨ Preparado",
    label: "Preparado",
    color: "bg-purple-500",
    textColor: "text-purple-400",
    bgColor: "bg-purple-500/10"
  },
  ENTREGADA: {
    icon: "✅ Entregado",
    label: "Entregado",
    color: "bg-gray-500",
    textColor: "text-gray-400",
    bgColor: "bg-gray-500/10"
  },
  COMPLETADA: {
    icon: "✅ Completado",
    label: "Completado",
    color: "bg-gray-500",
    textColor: "text-gray-400",
    bgColor: "bg-gray-500/10"
  },
  PAGADA: {
    icon: "💳 Pagado",
    label: "Pagado",
    color: "bg-green-600",
    textColor: "text-green-400",
    bgColor: "bg-green-600/10"
  },
  CANCELADA: {
    icon: "❌ Cancelado",
    label: "Cancelado",
    color: "bg-red-500",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10"
  }
};

export default function OrderStatusBadge() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const checkActiveOrder = async () => {
      const sessionCode = localStorage.getItem('sessionCode');
      if (!sessionCode) return;

      try {
        const response = await fetch(`/api/orders?sessionCode=${sessionCode}&status=active`);
        if (response.ok) {
          const orders = await response.json();
          if (orders.length > 0) {
            const activeOrder = orders[0];
            
            // Detectar cambio de estado para animar
            if (order && order.status !== activeOrder.status) {
              setIsAnimating(true);
              setTimeout(() => setIsAnimating(false), 1000);
            }
            
            setOrder(activeOrder);
          } else {
            setOrder(null);
          }
        }
      } catch (error) {
        console.error('Error fetching active order:', error);
      }
    };

    // Verificar inmediatamente
    checkActiveOrder();

    // Verificar cada 10 segundos
    const interval = setInterval(checkActiveOrder, 10000);

    return () => clearInterval(interval);
  }, [order]);

  if (!order) return null;

  const config = statusConfig[order.status];

  const handleClick = () => {
    router.push(`/pedido-enviado?orderId=${order.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={`relative rounded-md p-2 transition ${config.bgColor} hover:opacity-80 ${
        isAnimating ? 'animate-pulse' : ''
      }`}
      title={`Pedido ${config.label}`}
    >
      {/* Indicador pulsante para estados activos */}
      {(order.status === 'PENDIENTE' || order.status === 'ACEPTADA' || order.status === 'PREPARANDO') && (
        <span className="absolute top-0 right-0 flex h-3 w-3">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.color} opacity-75`}></span>
          <span className={`relative inline-flex h-3 w-3 rounded-full ${config.color}`}></span>
        </span>
      )}
      
      <span className="text-xs">{config.icon}</span>
    </button>
  );
}
