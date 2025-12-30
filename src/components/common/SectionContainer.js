import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * SectionContainer - Container chung cho tất cả các section hiển thị danh sách dịch vụ
 * @param {Object} props
 * @param {React.ReactNode} props.children - Nội dung bên trong section
 * @param {string} props.title - Tiêu đề section
 * @param {string} props.viewAllLink - Đường dẫn đến trang xem tất cả
 * @param {string} props.viewAllText - Text cho nút xem tất cả
 * @param {string} props.bgColor - Màu nền cho section
 * @param {Function} props.onViewAllClick - Hàm xử lý khi click nút xem tất cả
 * @param {boolean} props.loading - Trạng thái loading
 * @param {string} props.error - Thông báo lỗi nếu có
 */
const SectionContainer = ({
  children,
  title,
  viewAllLink,
  viewAllText = "Xem tất cả",
  bgColor = "bg-gray-50",
  onViewAllClick,
  loading = false,
  error = null,
}) => {
  // Xử lý view all click
  const handleViewAllClick = (e) => {
    if (onViewAllClick) {
      e.preventDefault();
      onViewAllClick();
    }
  };

  // Loading skeleton
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-md overflow-hidden h-96 animate-pulse"
        >
          <div className="h-56 bg-gray-200"></div>
          <div className="p-4">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
            <div className="h-10 bg-gray-200 rounded w-full mt-6"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Error message
  const renderError = () => (
    <div className="bg-white p-8 rounded-xl shadow text-center">
      <div className="text-red-500 mb-4 text-lg">{error}</div>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
      >
        Tải lại
      </button>
    </div>
  );

  return (
    <section className={`py-16 ${bgColor}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">{title}</h2>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              onClick={handleViewAllClick}
              className="flex items-center text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <span className="mr-2">{viewAllText}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>

        {loading ? renderSkeleton() : error ? renderError() : children}
      </div>
    </section>
  );
};

export default SectionContainer;
