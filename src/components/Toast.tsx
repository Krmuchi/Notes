import { useState, useEffect, useCallback } from "react";

export interface ToastProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  onClose: (id: string) => void;
  duration?: number;
}

const iconMap = {
  success: "✓",
  error: "✗",
  warning: "⚠️",
  info: "ℹ️",
};

export function ToastItem({ id, type, message, onClose, duration = 3000 }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(id), 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 200);
  }, [id, onClose]);

  return (
    <div className={`toast toast-${type} ${isExiting ? "exit" : "enter"}`}>
      <span className="toast-icon">{iconMap[type]}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={handleClose}>
        ×
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}

let toastId = 0;

export interface ToastMessage {
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message: ToastMessage) => {
    const id = `toast-${++toastId}`;
    setToasts((prev) => [...prev, { ...message, id, onClose: () => removeToast(id) }]);
    return id;
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => {
    return addToast({ type: "success", message, duration });
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    return addToast({ type: "error", message, duration });
  }, [addToast]);

  const warning = useCallback((message: string, duration?: number) => {
    return addToast({ type: "warning", message, duration });
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    return addToast({ type: "info", message, duration });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}