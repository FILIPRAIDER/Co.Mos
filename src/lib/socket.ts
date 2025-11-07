import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let pingInterval: NodeJS.Timeout | null = null;
let latencyHistory: number[] = [];

export interface SocketStats {
  latency: number;
  avgLatency: number;
  isHealthy: boolean;
  reconnectCount: number;
}

export const getSocket = () => {
  if (!socket) {
    // Detectar URL base dinámicamente
    const socketUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

    socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity, // Intentar siempre
      timeout: 20000,
      randomizationFactor: 0.5, // Randomización para evitar thundering herd
    });

    let reconnectCount = 0;

    // Logs de depuración
    socket.on('connect', () => {
      console.log('✅ Socket conectado - ID:', socket?.id);
      reconnectCount = 0;
      startHeartbeat();
    });

    socket.on('disconnect', (reason) => {
      console.warn('❌ Socket desconectado:', reason);
      stopHeartbeat();
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.IO:', error.message);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      reconnectCount = attemptNumber;
      console.log(`🔄 Reintentando conexión... Intento ${attemptNumber}`);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconexión exitosa después de ${attemptNumber} intentos`);
      reconnectCount = 0;
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Falló la reconexión después de varios intentos');
    });

    // Responder a pings del servidor
    socket.on('pong', (latency: number) => {
      latencyHistory.push(latency);
      if (latencyHistory.length > 10) {
        latencyHistory.shift();
      }
      
      if (latency > 500) {
        console.warn(`⚠️ Alta latencia detectada: ${latency}ms`);
      }
    });
  }
  return socket;
};

// Sistema de Heartbeat
const startHeartbeat = () => {
  if (pingInterval) return;
  
  pingInterval = setInterval(() => {
    if (socket && socket.connected) {
      const start = Date.now();
      socket.emit('ping', () => {
        const latency = Date.now() - start;
        socket?.emit('pong', latency);
      });
    }
  }, 10000); // Ping cada 10 segundos
};

const stopHeartbeat = () => {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
};

// Obtener estadísticas de conexión
export const getSocketStats = (): SocketStats => {
  const latency = latencyHistory[latencyHistory.length - 1] || 0;
  const avgLatency = latencyHistory.length > 0
    ? latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length
    : 0;
  
  return {
    latency,
    avgLatency: Math.round(avgLatency),
    isHealthy: avgLatency < 500 && socket?.connected || false,
    reconnectCount: 0,
  };
};

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState<SocketStats>({
    latency: 0,
    avgLatency: 0,
    isHealthy: false,
    reconnectCount: 0,
  });

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    const onConnect = () => {
      console.log('✅ Socket conectado');
      setIsConnected(true);
      updateStats();
    };

    const onDisconnect = () => {
      console.log('❌ Socket desconectado');
      setIsConnected(false);
      updateStats();
    };

    const updateStats = () => {
      setStats(getSocketStats());
    };

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('pong', updateStats);

    // Verificar estado inicial
    if (socketInstance.connected) {
      setIsConnected(true);
    }

    // Actualizar stats cada 5 segundos
    const statsInterval = setInterval(updateStats, 5000);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('pong', updateStats);
      clearInterval(statsInterval);
    };
  }, []);

  const forceReconnect = useCallback(() => {
    if (socket) {
      console.log('🔄 Forzando reconexión...');
      socket.disconnect();
      setTimeout(() => socket.connect(), 100);
    }
  }, [socket]);

  return { socket, isConnected, stats, forceReconnect };
};

export const emitEvent = (event: string, data: unknown) => {
  const socket = getSocket();
  if (socket.connected) {
    socket.emit(event, data);
  } else {
    console.warn(`⚠️ No se puede emitir evento ${event}: Socket desconectado`);
    // Intentar reconectar si está desconectado
    if (!socket.connected) {
      console.log('🔄 Intentando reconectar...');
      socket.connect();
    }
  }
};

// Limpiar al cerrar la aplicación
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (socket) {
      socket.disconnect();
    }
    stopHeartbeat();
  });
}
