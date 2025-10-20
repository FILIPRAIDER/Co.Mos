"use client";

import { useState } from "react";
import Alert, { AlertType } from "@/components/ui/Alert";

interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

export function useAlert() {
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const showAlert = (
    title: string,
    message: string,
    type: AlertType = "info",
    confirmText?: string
  ) => {
    setAlert({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = "Confirmar",
    cancelText: string = "Cancelar"
  ) => {
    setAlert({
      isOpen: true,
      type: "confirm",
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  const success = (message: string, title: string = "¡Éxito!") => {
    showAlert(title, message, "success");
  };

  const error = (message: string, title: string = "Error") => {
    showAlert(title, message, "error");
  };

  const warning = (message: string, title: string = "Advertencia") => {
    showAlert(title, message, "warning");
  };

  const info = (message: string, title: string = "Información") => {
    showAlert(title, message, "info");
  };

  const confirm = (
    message: string,
    onConfirm: () => void,
    title: string = "¿Confirmar acción?",
    confirmText?: string,
    cancelText?: string
  ) => {
    showConfirm(title, message, onConfirm, confirmText, cancelText);
  };

  const closeAlert = () => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  };

  const AlertComponent = () => (
    <Alert
      isOpen={alert.isOpen}
      onClose={closeAlert}
      onConfirm={alert.onConfirm}
      type={alert.type}
      title={alert.title}
      message={alert.message}
      confirmText={alert.confirmText}
      cancelText={alert.cancelText}
    />
  );

  return {
    alert: showAlert,
    confirm,
    success,
    error,
    warning,
    info,
    AlertComponent,
  };
}
