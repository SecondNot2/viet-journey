import React, { useState } from "react";
import { AlertTriangle, X, CheckCircle, RefreshCw } from "lucide-react";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "danger", // 'danger', 'warning', 'info', 'success'
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  showInput = false,
  inputPlaceholder = "",
  inputLabel = "",
  isLoading = false,
}) => {
  const [inputValue, setInputValue] = useState("");

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: AlertTriangle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      confirmBtn: "bg-red-600 hover:bg-red-700 text-white",
      borderColor: "border-red-200",
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      confirmBtn: "bg-yellow-600 hover:bg-yellow-700 text-white",
      borderColor: "border-yellow-200",
    },
    info: {
      icon: AlertTriangle,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white",
      borderColor: "border-blue-200",
    },
    success: {
      icon: CheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      confirmBtn: "bg-green-600 hover:bg-green-700 text-white",
      borderColor: "border-green-200",
    },
  };

  const config = typeConfig[type] || typeConfig.danger;
  const Icon = config.icon;

  const handleConfirm = () => {
    if (showInput) {
      onConfirm(inputValue);
      setInputValue("");
    } else {
      onConfirm();
    }
  };

  const handleClose = () => {
    setInputValue("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${config.borderColor}`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${config.iconBg}`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 whitespace-pre-line">{message}</p>

          {/* Input field if needed */}
          {showInput && (
            <div className="mt-4">
              {inputLabel && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {inputLabel}
                </label>
              )}
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isLoading}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-2 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmBtn}`}
            disabled={isLoading || (showInput && !inputValue.trim())}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
