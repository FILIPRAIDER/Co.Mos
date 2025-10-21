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
  const [alertState, setAlertState] = useState<AlertState>({
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
    setAlertState({
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
    setAlertState({
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
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  const AlertComponent = () => (
    <Alert
      isOpen={alertState.isOpen}
      onClose={closeAlert}
      onConfirm={alertState.onConfirm}
      type={alertState.type}
      title={alertState.title}
      message={alertState.message}
      confirmText={alertState.confirmText}
      cancelText={alertState.cancelText}
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
    alertState,
  };
}
