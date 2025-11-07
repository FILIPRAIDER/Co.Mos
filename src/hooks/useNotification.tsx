'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (
    type: NotificationType,
    title: string,
    message?: string,
    duration?: number
  ) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message?: string,
      duration: number = 5000
    ) => {
      const id = `notification-${Date.now()}-${Math.random()}`;
      const notification: Notification = { id, type, title, message, duration };

      setNotifications(prev => [...prev, notification]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification]
  );

  const success = useCallback(
    (title: string, message?: string) => {
      showNotification('success', title, message);
    },
    [showNotification]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      showNotification('error', title, message, 7000); // Errores duran más
    },
    [showNotification]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      showNotification('info', title, message);
    },
    [showNotification]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      showNotification('warning', title, message);
    },
    [showNotification]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        success,
        error,
        info,
        warning,
        removeNotification,
        clearAll,
      }}
    >
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }
  return context;
}

// Componente visual
function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
  };

  const styles = {
    success: 'bg-green-500/20 border-green-500 text-green-300',
    error: 'bg-red-500/20 border-red-500 text-red-300',
    info: 'bg-blue-500/20 border-blue-500 text-blue-300',
    warning: 'bg-yellow-500/20 border-yellow-500 text-yellow-300',
  };

  return (
    <div
      className={`
        rounded-lg border-2 p-4 shadow-2xl backdrop-blur-sm
        animate-in slide-in-from-right duration-300
        ${styles[notification.type]}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {icons[notification.type]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white mb-1">{notification.title}</h3>
          {notification.message && (
            <p className="text-sm text-white/80">{notification.message}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 hover:bg-white/10 transition-colors"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}
