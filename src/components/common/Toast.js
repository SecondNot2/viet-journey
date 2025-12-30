import React, { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const Toast = ({ message, type = "success", onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const types = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-500",
      textColor: "text-emerald-800",
      iconColor: "text-emerald-500",
    },
    error: {
      icon: AlertCircle,
      bgColor: "bg-red-50",
      borderColor: "border-red-500",
      textColor: "text-red-800",
      iconColor: "text-red-500",
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-500",
      textColor: "text-yellow-800",
      iconColor: "text-yellow-500",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-500",
      textColor: "text-blue-800",
      iconColor: "text-blue-500",
    },
  };

  const config = types[type] || types.success;
  const Icon = config.icon;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 ${config.bgColor} ${config.textColor} px-6 py-4 rounded-2xl shadow-2xl border-l-4 ${config.borderColor} animate-slide-in-right max-w-md`}
    >
      <Icon className={`w-6 h-6 ${config.iconColor} flex-shrink-0`} />
      <p className="flex-1 font-medium">{message}</p>
      <button
        onClick={onClose}
        className={`${config.textColor} hover:opacity-70 transition-opacity`}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;
