import React from "react";
import { AlertCircle, X } from "lucide-react";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isDanger = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
        <div className="bg-white px-6 pt-5 pb-4">
          <div className="flex items-start space-x-4">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                isDanger ? "bg-red-100" : "bg-emerald-100"
              }`}
            >
              <AlertCircle
                className={`h-6 w-6 ${
                  isDanger ? "text-red-600" : "text-emerald-600"
                }`}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{message}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
          <button
            type="button"
            className={`inline-flex justify-center rounded-xl px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isDanger
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                : "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button
            type="button"
            className="inline-flex justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            onClick={onClose}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
