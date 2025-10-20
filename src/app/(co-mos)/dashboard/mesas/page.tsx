"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Plus, 
  Download, 
  Edit2, 
  Trash2, 
  QrCode, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Wifi,
  WifiOff
} from "lucide-react";
import Image from "next/image";
import { useSocket, emitEvent } from "@/lib/socket";
import { useAlert } from "@/hooks/useAlert";

type Session = {
  id: string;
  sessionCode: string;
  customerName?: string | null;
  active: boolean;
  createdAt: string;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
  }>;
};

type Table = {
  id: string;
  number: number;
  available: boolean;
  qrCode: string;
  qrImageUrl: string;
  createdAt: string;
  sessions: Session[];
};

export default function AdminMesasPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { socket, isConnected } = useSocket();
  const { success, error, confirm, AlertComponent } = useAlert();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [view, setView] = useState<"all" | "active" | "available">("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Configurar Socket.io
  useEffect(() => {
    if (socket) {
      // Unirse al canal de admin
      socket.emit('join:admin');

      // Escuchar eventos de mesas
      socket.on('table:new', (data) => {
        console.log('➕ Nueva mesa:', data);
        fetchTables();
      });

      socket.on('table:update', (data) => {
        console.log('🔄 Mesa actualizada:', data);
        fetchTables();
      });

      socket.on('table:delete', (data) => {
        console.log('🗑️ Mesa eliminada:', data);
        fetchTables();
      });

      // Escuchar eventos de sesiones
      socket.on('session:new', (data) => {
        console.log('🆕 Nueva sesión:', data);
        fetchTables();
      });

      socket.on('session:close', (data) => {
        console.log('🔒 Sesión cerrada:', data);
        fetchTables();
      });

      // Escuchar eventos de órdenes
      socket.on('order:new', (data) => {
        console.log('📝 Nueva orden:', data);
        fetchTables();
      });

      return () => {
        socket.off('table:new');
        socket.off('table:update');
        socket.off('table:delete');
        socket.off('session:new');
        socket.off('session:close');
        socket.off('order:new');
      };
    }
  }, [socket]);

  // Cargar mesas inicialmente
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/tables");
      if (response.ok) {
        const data = await response.json();
        setTables(data);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!newTableNumber.trim()) {
      alert("Ingresa un número de mesa");
      return;
    }

    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: parseInt(newTableNumber) }),
      });

      if (response.ok) {
        const newTable = await response.json();
        
        // Emitir evento de Socket.io
        emitEvent('table:created', {
          tableId: newTable.id,
          tableNumber: newTable.number,
          timestamp: new Date().toISOString(),
        });
        
        setShowCreateModal(false);
        setNewTableNumber("");
        await fetchTables();
        success("Mesa creada correctamente");
      } else {
        const errorData = await response.json();
        error(errorData.error || "Error al crear mesa");
      }
    } catch (err) {
      console.error("Error creating table:", err);
      error("Error al crear mesa");
    }
  };

  const deleteTable = async (tableId: string, tableNumber: number) => {
    confirm(
      `¿Estás seguro de eliminar la Mesa ${tableNumber}? Esta acción no se puede deshacer.`,
      async () => {
        try {
          const response = await fetch(`/api/tables/${tableId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            // Emitir evento de Socket.io
            emitEvent('table:deleted', {
              tableId,
              tableNumber,
              timestamp: new Date().toISOString(),
            });
            
            await fetchTables();
            success("Mesa eliminada correctamente");
          } else {
            const errorData = await response.json();
            error(errorData.error || "No se puede eliminar mesa con sesiones activas");
          }
        } catch (err) {
          console.error("Error deleting table:", err);
          error("Error al eliminar mesa");
        }
      },
      "Eliminar Mesa",
      "Eliminar",
      "Cancelar"
    );
  };

  const closeSession = async (sessionId: string, sessionCode: string, tableNumber: number) => {
    confirm(
      `¿Cerrar la sesión ${sessionCode} de la Mesa ${tableNumber}? La mesa quedará disponible.`,
      async () => {
        try {
          const response = await fetch(`/api/sessions/${sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: false }),
          });

          if (response.ok) {
            // Emitir evento de Socket.io
            emitEvent('session:closed', {
              sessionId,
              sessionCode,
              tableNumber,
              timestamp: new Date().toISOString(),
            });
            
            await fetchTables();
            success("Sesión cerrada correctamente");
          } else {
            error("Error al cerrar sesión");
          }
        } catch (err) {
          console.error("Error closing session:", err);
          error("Error al cerrar sesión");
        }
      },
      "Cerrar Sesión",
      "Cerrar",
      "Cancelar"
    );
  };

  const downloadQR = (table: Table) => {
    // Crear un elemento temporal para descargar
    const link = document.createElement("a");
    link.href = table.qrImageUrl;
    link.download = `Mesa-${table.number}-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTables = tables.filter((table) => {
    if (view === "active") return !table.available;
    if (view === "available") return table.available;
    return true;
  });

  const stats = {
    total: tables.length,
    active: tables.filter((t) => !t.available).length,
    available: tables.filter((t) => t.available).length,
    activeSessions: tables.reduce((acc, t) => acc + t.sessions.filter(s => s.active).length, 0),
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
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black border-b border-zinc-800">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-full bg-zinc-900 border border-zinc-800 p-2 transition hover:bg-zinc-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Image src="/Logo.svg" alt="co.mos" width={32} height={32} />
              <span className="text-lg font-semibold">Gestión de Mesas</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Connection Status */}
              <div className={`rounded-full px-2 py-1 flex items-center gap-1.5 ${
                isConnected 
                  ? 'bg-green-500/20 border border-green-500/50' 
                  : 'bg-red-500/20 border border-red-500/50'
              }`}>
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-green-300" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-300" />
                )}
                <span className="text-xs">{isConnected ? 'En línea' : 'Desconectado'}</span>
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-full bg-orange-500 p-2 transition hover:bg-orange-600"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 p-3">
              <p className="text-xs text-white/80 mb-1">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 p-3">
              <p className="text-xs text-white/80 mb-1">Ocupadas</p>
              <p className="text-2xl font-bold text-red-300">{stats.active}</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 p-3">
              <p className="text-xs text-white/80 mb-1">Libres</p>
              <p className="text-2xl font-bold text-green-300">{stats.available}</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 p-3">
              <p className="text-xs text-white/80 mb-1">Sesiones</p>
              <p className="text-2xl font-bold text-blue-300">{stats.activeSessions}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setView("all")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                view === "all"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Todas ({stats.total})
            </button>
            <button
              onClick={() => setView("active")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                view === "active"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Ocupadas ({stats.active})
            </button>
            <button
              onClick={() => setView("available")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                view === "available"
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              Libres ({stats.available})
            </button>
          </div>
        </div>
      </header>

      {/* Tables Grid */}
      <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTables.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <div className="mb-4 text-6xl">🪑</div>
            <p className="text-lg font-semibold mb-2">No hay mesas</p>
            <p className="text-sm text-white/60">Crea tu primera mesa</p>
          </div>
        ) : (
          filteredTables.map((table) => {
            const activeSession = table.sessions.find((s) => s.active);
            const pendingOrders = activeSession?.orders.filter(
              (o) => o.status === "PENDIENTE" || o.status === "PREPARANDO"
            ).length || 0;

            return (
              <div
                key={table.id}
                className={`rounded-2xl border-2 p-5 transition-all ${
                  table.available
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                {/* Table Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-3xl font-bold">Mesa {table.number}</h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          table.available
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {table.available ? "✓ Libre" : "● Ocupada"}
                      </span>
                    </div>
                    {activeSession && (
                      <div className="space-y-1">
                        <p className="text-sm text-white/80">
                          <span className="font-semibold">Código:</span> {activeSession.sessionCode}
                        </p>
                        {activeSession.customerName && (
                          <p className="text-sm text-white/80">
                            <span className="font-semibold">Cliente:</span> {activeSession.customerName}
                          </p>
                        )}
                        <p className="text-xs text-white/60">
                          Iniciada: {new Date(activeSession.createdAt).toLocaleTimeString("es-CO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedTable(table);
                        setShowQRModal(true);
                      }}
                      className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20"
                      title="Ver QR"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTable(table.id, table.number)}
                      className="rounded-lg bg-white/10 p-2 transition hover:bg-red-500/30"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Session Info */}
                {activeSession && (
                  <div className="space-y-3 mb-4">
                    <div className="rounded-lg bg-black/30 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white/60 uppercase">
                          Órdenes Activas
                        </span>
                        <span className="text-sm font-bold">
                          {activeSession.orders.length}
                        </span>
                      </div>
                      {pendingOrders > 0 && (
                        <div className="flex items-center gap-2 rounded-md bg-orange-500/20 px-2 py-1">
                          <Clock className="h-3 w-3 text-orange-300" />
                          <span className="text-xs text-orange-300 font-medium">
                            {pendingOrders} en preparación
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => closeSession(activeSession.id, activeSession.sessionCode, table.number)}
                      className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3 font-bold text-sm transition hover:from-blue-600 hover:to-purple-600 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadQR(table)}
                    className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium transition hover:bg-white/20 flex items-center justify-center gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Descargar QR
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Table Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-[#1a1a1f] p-6 animate-fadeIn">
            <h3 className="text-2xl font-bold mb-4">Nueva Mesa</h3>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Número de Mesa</label>
              <input
                type="number"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="Ej: 15"
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 focus:border-orange-500 focus:outline-none"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-xl bg-white/10 px-4 py-3 font-semibold transition hover:bg-white/20"
              >
                Cancelar
              </button>
              <button
                onClick={createTable}
                className="flex-1 rounded-xl bg-orange-500 px-4 py-3 font-semibold transition hover:bg-orange-600"
              >
                Crear Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setShowQRModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-[#1a1a1f] p-6 animate-fadeIn">
            <h3 className="text-2xl font-bold mb-4 text-center">
              QR Mesa {selectedTable.number}
            </h3>
            <div className="rounded-xl bg-white p-6 mb-4">
              <img
                src={selectedTable.qrImageUrl}
                alt={`QR Mesa ${selectedTable.number}`}
                className="w-full h-auto"
              />
            </div>
            <div className="mb-4 rounded-lg bg-white/10 p-3">
              <p className="text-xs text-white/60 mb-1">Código QR:</p>
              <p className="text-sm font-mono break-all">{selectedTable.qrCode}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 rounded-xl bg-white/10 px-4 py-3 font-semibold transition hover:bg-white/20"
              >
                Cerrar
              </button>
              <button
                onClick={() => downloadQR(selectedTable)}
                className="flex-1 rounded-xl bg-orange-500 px-4 py-3 font-semibold transition hover:bg-orange-600 flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Component */}
      <AlertComponent />
    </div>
  );
}
