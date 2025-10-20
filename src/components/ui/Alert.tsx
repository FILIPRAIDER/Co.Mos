"use client";

import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { useEffect } from "react";

export type AlertType = "success" | "error" | "warning" | "info" | "confirm";

export interface AlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  type?: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function Alert({
  isOpen,
  onClose,
  onConfirm,
  type = "info",
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
}: AlertProps) {
  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case "error":
        return <XCircle className="h-12 w-12 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-12 w-12 text-yellow-500" />;
      case "confirm":
        return <AlertCircle className="h-12 w-12 text-orange-500" />;
      default:
        return <Info className="h-12 w-12 text-blue-500" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500 hover:bg-green-600";
      case "error":
        return "bg-red-500 hover:bg-red-600";
      case "warning":
        return "bg-yellow-500 hover:bg-yellow-600 text-black";
      case "confirm":
        return "bg-orange-500 hover:bg-orange-600";
      default:
        return "bg-blue-500 hover:bg-blue-600";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn">
      <div className="w-full max-w-md rounded-lg bg-zinc-900 border border-zinc-800 shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-300 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-zinc-800 px-6 py-4">
          {type === "confirm" ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5 font-semibold text-white transition hover:border-zinc-600"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 rounded-lg px-4 py-2.5 font-semibold text-white transition ${getButtonColor()}`}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className={`w-full rounded-lg px-4 py-2.5 font-semibold text-white transition ${getButtonColor()}`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
