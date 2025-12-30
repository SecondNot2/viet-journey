import React, { useState, useEffect } from "react";
import { X, Send } from "lucide-react";

const EditCommentModal = ({ isOpen, onClose, onSave, comment }) => {
  const [editedComment, setEditedComment] = useState("");

  useEffect(() => {
    if (comment) {
      setEditedComment(comment.comment || "");
    }
  }, [comment]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (editedComment.trim()) {
      onSave(editedComment);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">
            Chỉnh sửa bình luận
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <textarea
            value={editedComment}
            onChange={(e) => setEditedComment(e.target.value)}
            placeholder="Nhập nội dung bình luận..."
            className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            rows="6"
          />
        </div>
        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!editedComment.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCommentModal;
