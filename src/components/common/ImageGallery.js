import React, { useState } from "react";
import { Camera, Eye, ChevronLeft, ChevronRight, X } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ImageGallery = ({ images = [], title = "" }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Đảm bảo images là array và không rỗng
  const galleryImages =
    Array.isArray(images) && images.length > 0
      ? images
      : [`${API_URL}/images/placeholder.png`];

  // Mở modal xem ảnh phóng to
  const handleOpenImageModal = (index) => {
    setModalImageIndex(index);
    setIsImageModalOpen(true);
  };

  // Đóng modal xem ảnh
  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
  };

  // Navigate trong modal
  const handleModalImageNav = (direction) => {
    if (direction === "next") {
      setModalImageIndex((prev) =>
        prev === galleryImages.length - 1 ? 0 : prev + 1
      );
    } else {
      setModalImageIndex((prev) =>
        prev === 0 ? galleryImages.length - 1 : prev - 1
      );
    }
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gray-900">Thư viện ảnh</h3>
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
            {galleryImages.length} ảnh
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden group shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => handleOpenImageModal(index)}
            >
              <img
                src={image}
                alt={`${title} ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `${API_URL}/images/placeholder.png`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm font-medium">Ảnh {index + 1}</span>
                </div>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={handleCloseImageModal}
        >
          <button
            onClick={handleCloseImageModal}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Button */}
          {galleryImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleModalImageNav("prev");
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-7xl max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryImages[modalImageIndex]}
              alt={`${title} ${modalImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `${API_URL}/images/placeholder.png`;
              }}
            />

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              {modalImageIndex + 1} / {galleryImages.length}
            </div>
          </div>

          {/* Next Button */}
          {galleryImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleModalImageNav("next");
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default ImageGallery;
