'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Captura errores en componentes hijos y muestra UI de fallback
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Llamar callback si existe
    this.props.onError?.(error, errorInfo);

    // Log a servicio externo (ej: Sentry)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Aquí podrías enviar a Sentry, LogRocket, etc.
    console.group('🚨 Error Boundary Log');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // UI personalizada de fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="rounded-2xl bg-zinc-900 border-2 border-red-500/50 p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-red-500/20 p-4">
                  <AlertTriangle className="h-12 w-12 text-red-400" />
                </div>
              </div>

              <h1 className="text-2xl font-bold mb-3">¡Ups! Algo salió mal</h1>
              
              <p className="text-gray-400 mb-6">
                Lo sentimos, ocurrió un error inesperado. Nuestro equipo ha sido notificado.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-red-400 hover:text-red-300 mb-2">
                    Ver detalles técnicos
                  </summary>
                  <div className="rounded-lg bg-black/50 p-4 text-xs font-mono text-red-300 overflow-auto max-h-48">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 rounded-lg bg-orange-500 hover:bg-orange-600 px-6 py-3 font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="flex-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-6 py-3 font-semibold transition-colors"
                >
                  Ir al inicio
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook para capturar errores en componentes funcionales
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const handleError = React.useCallback((err: Error) => {
    console.error('Error capturado por useErrorHandler:', err);
    setError(err);
  }, []);

  return handleError;
}

/**
 * Logger centralizado con patrón Observer
 */
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: Date;
  context?: string;
}

type LogObserver = (entry: LogEntry) => void;

class Logger {
  private static instance: Logger;
  private observers: LogObserver[] = [];
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  subscribe(observer: LogObserver) {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter(obs => obs !== observer);
    };
  }

  private notify(entry: LogEntry) {
    this.observers.forEach(observer => observer(entry));
  }

  private log(level: LogLevel, message: string, data?: unknown, context?: string) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      context,
    };

    // Guardar en memoria
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Notificar observadores
    this.notify(entry);

    // Log en consola con formato
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🐛',
    };

    const contextStr = context ? `[${context}]` : '';
    console[level === 'debug' ? 'log' : level](
      `${emoji[level]} ${contextStr} ${message}`,
      data || ''
    );
  }

  info(message: string, data?: unknown, context?: string) {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: unknown, context?: string) {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: unknown, context?: string) {
    this.log('error', message, data, context);
  }

  debug(message: string, data?: unknown, context?: string) {
    this.log('debug', message, data, context);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    return level 
      ? this.logs.filter(log => log.level === level)
      : this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();

/**
 * Hook para usar el logger en componentes
 */
export function useLogger(context?: string) {
  return React.useMemo(
    () => ({
      info: (msg: string, data?: unknown) => logger.info(msg, data, context),
      warn: (msg: string, data?: unknown) => logger.warn(msg, data, context),
      error: (msg: string, data?: unknown) => logger.error(msg, data, context),
      debug: (msg: string, data?: unknown) => logger.debug(msg, data, context),
    }),
    [context]
  );
}

/**
 * Componente para mostrar logs en desarrollo
 */
export function LogViewer() {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = logger.subscribe((entry) => {
      setLogs(prev => [...prev.slice(-99), entry]);
    });

    return unsubscribe;
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-zinc-800 border border-zinc-700 p-3 shadow-xl hover:bg-zinc-700 transition"
          title="Abrir logs"
        >
          🐛 {logs.length > 0 && <span className="ml-1">({logs.length})</span>}
        </button>
      )}

      {isOpen && (
        <div className="w-96 max-h-96 rounded-lg bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-zinc-700">
            <h3 className="font-semibold text-sm">🐛 Logs de desarrollo</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  logger.clearLogs();
                  setLogs([]);
                }}
                className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
              >
                Limpiar
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No hay logs</p>
            ) : (
              logs.map((log, i) => {
                const displayData: string = log.data 
                  ? (typeof log.data === 'object' 
                      ? JSON.stringify(log.data, null, 2) 
                      : String(log.data))
                  : '';
                
                return (
                  <div
                    key={i}
                    className={`text-xs p-2 rounded ${
                      log.level === 'error'
                        ? 'bg-red-500/10 text-red-300'
                        : log.level === 'warn'
                        ? 'bg-yellow-500/10 text-yellow-300'
                        : 'bg-zinc-800 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{log.message}</span>
                      <span className="text-[10px] text-gray-500">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {displayData && (
                      <div className="text-[10px] mt-1 overflow-auto bg-black/30 p-2 rounded">
                        {displayData}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
