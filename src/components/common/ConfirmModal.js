import React from "react";
import {
  AlertTriangle,
  X,
  CheckCircle,
  Info as InfoIcon,
  HelpCircle,
} from "lucide-react";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "danger",
  loading = false,
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: AlertTriangle,
      buttonBg: "bg-red-600 hover:bg-red-700",
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
    },
    warning: {
      icon: AlertTriangle,
      buttonBg: "bg-yellow-600 hover:bg-yellow-700",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-500",
    },
    info: {
      icon: InfoIcon,
      buttonBg: "bg-blue-600 hover:bg-blue-700",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-500",
    },
    success: {
      icon: CheckCircle,
      buttonBg: "bg-emerald-600 hover:bg-emerald-700",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-500",
    },
    confirm: {
      icon: HelpCircle,
      buttonBg: "bg-emerald-600 hover:bg-emerald-700",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-500",
    },
  };

  const style = typeStyles[type] || typeStyles.danger;
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center flex-shrink-0`}
            >
              <Icon className={`w-6 h-6 ${style.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={loading}
            className={`px-6 py-2.5 ${style.buttonBg} text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {loading && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
