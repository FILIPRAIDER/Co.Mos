"use client";

import { useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  type?: "success" | "error" | "info" | "confirm";
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
};

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  onConfirm,
  confirmText = "Enviar Pedido",
  cancelText = "Cancelar",
  icon,
}: ModalProps) {
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

  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-12 w-12 text-green-500" />;
      case "error":
        return <AlertCircle className="h-12 w-12 text-red-500" />;
      case "confirm":
        return <div className="text-6xl">❓</div>;
      default:
        return <Info className="h-12 w-12 text-blue-500" />;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={type !== "confirm" ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-md animate-fadeIn">
        <div className="rounded-2xl bg-[#1a1a1f] border border-white/10 overflow-hidden">
          {/* Close button */}
          {type !== "confirm" && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Content */}
          <div className="p-6 text-center">
            {/* Icon */}
            <div className="mb-4 flex justify-center">
              {getIcon()}
            </div>

            {/* Title */}
            <h3 className="mb-2 text-xl font-semibold text-white">
              {title}
            </h3>

            {/* Message */}
            {message && (
              <p className="text-sm text-white/70 leading-relaxed">
                {message}
              </p>
            )}

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              {type === "confirm" ? (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-white/20 py-3 font-medium text-white transition hover:bg-white/5"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 rounded-lg bg-green-500 py-3 font-semibold text-white transition hover:bg-green-600"
                  >
                    {confirmText}
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className={`w-full rounded-lg py-3 font-semibold transition ${
                    type === "success"
                      ? "bg-green-500 hover:bg-green-600"
                      : type === "error"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  Aceptar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
