import React from "react";
import { Package } from "lucide-react";

/**
 * EmptyState Component
 * Hiển thị thông báo khi không có dữ liệu
 */
const EmptyState = ({
  icon: Icon = Package,
  title = "Chưa có dữ liệu",
  description = "Hệ thống đang cập nhật dữ liệu mới",
  className = "",
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-gray-500 mb-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-lg font-medium text-gray-700">{title}</p>
        <p className="text-sm text-gray-500 mt-2">{description}</p>
      </div>
    </div>
  );
};

export default EmptyState;
