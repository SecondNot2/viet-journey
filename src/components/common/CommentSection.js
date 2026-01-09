import { API_URL, API_HOST } from "../../config/api";
import React, { useState } from "react";
import {
  MessageCircle,
  ThumbsUp,
  Send,
  Edit2,
  Trash2,
  MoreVertical,
  Reply,
  Star,
} from "lucide-react";
import Toast from "./Toast";
import ConfirmModal from "./ConfirmModal";
import EditCommentModal from "./EditCommentModal";

const CommentSection = ({
  comments = [],
  commentCount = 0,
  currentUserId = null,
  isAdmin = false,
  likedComments = new Set(),
  onAddComment,
  onEditComment,
  onDeleteComment,
  onLikeComment,
  onReloadComments,
  hideRating = false,
}) => {
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [editModal, setEditModal] = useState({ isOpen: false, comment: null });

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Wrapper for like comment with toast
  const handleLikeComment = async (commentId) => {
    if (!currentUserId) {
      showToast("Vui lòng đăng nhập để thích bình luận", "warning");
      return;
    }

    try {
      const isLiked = likedComments.has(commentId);
      await onLikeComment(commentId);
      showToast(
        isLiked ? "Đã bỏ thích bình luận" : "Đã thích bình luận",
        "success"
      );
    } catch (error) {
      console.error("Lỗi khi thích bình luận:", error);
      showToast("Không thể thực hiện thao tác", "error");
    }
  };

  // Hàm xử lý URL avatar
  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) {
      return `${API_HOST}/images/default-destination.jpg`;
    }
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
      return avatarUrl;
    }
    if (avatarUrl.startsWith("/uploads")) {
      return `${API_HOST}${avatarUrl}`;
    }
    return `${API_HOST}/uploads/avatars/${avatarUrl}`;
  };

  // Hàm thêm bình luận
  const handleAddComment = async () => {
    if (!currentUserId) {
      showToast("Vui lòng đăng nhập để bình luận", "warning");
      return;
    }

    if (!newComment.trim()) {
      showToast("Vui lòng nhập nội dung bình luận", "warning");
      return;
    }

    try {
      setCommentLoading(true);
      await onAddComment({
        comment: newComment,
        parent_id: replyTo ? replyTo.id : null,
      });
      setNewComment("");
      setReplyTo(null);
      showToast("Đã thêm bình luận thành công!", "success");
      if (onReloadComments) onReloadComments();
    } catch (error) {
      console.error("Lỗi khi thêm bình luận:", error);
      showToast("Không thể thêm bình luận. Vui lòng thử lại.", "error");
    } finally {
      setCommentLoading(false);
    }
  };

  // Hàm xử lý reply
  const handleReply = (comment) => {
    setReplyingToId(comment.id);
    setReplyTo(comment);
    setReplyText("");
  };

  // Hàm cancel reply
  const handleCancelReply = () => {
    setReplyingToId(null);
    setReplyTo(null);
    setReplyText("");
  };

  // Hàm submit reply inline
  const handleSubmitReply = async () => {
    if (!currentUserId) {
      showToast("Vui lòng đăng nhập để bình luận", "warning");
      return;
    }

    if (!replyText.trim()) {
      showToast("Vui lòng nhập nội dung bình luận", "warning");
      return;
    }

    try {
      setCommentLoading(true);
      await onAddComment({
        comment: replyText,
        parent_id: replyTo.id,
      });
      handleCancelReply();
      showToast("Đã thêm bình luận thành công!", "success");
      if (onReloadComments) onReloadComments();
    } catch (error) {
      console.error("Lỗi khi thêm bình luận:", error);
      showToast("Không thể thêm bình luận. Vui lòng thử lại.", "error");
    } finally {
      setCommentLoading(false);
    }
  };

  // Hàm sửa bình luận
  const handleEdit = async (editedText) => {
    try {
      await onEditComment(editModal.comment.id, editedText);
      setEditModal({ isOpen: false, comment: null });
      showToast("Đã cập nhật bình luận!", "success");
      if (onReloadComments) onReloadComments();
    } catch (error) {
      console.error("Lỗi khi sửa bình luận:", error);
      showToast(
        error.response?.data?.error || "Không thể sửa bình luận",
        "error"
      );
    }
  };

  // Hàm xóa bình luận
  const handleDelete = async (commentId) => {
    try {
      await onDeleteComment(commentId);
      showToast("Đã xóa bình luận!", "success");
      if (onReloadComments) onReloadComments();
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
      showToast(
        error.response?.data?.error || "Không thể xóa bình luận",
        "error"
      );
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gray-900">Bình luận</h3>
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
            {commentCount || 0} bình luận
          </span>
        </div>

        {/* Comment Form - Chỉ hiển thị khi KHÔNG đang reply inline */}
        {!replyingToId && (
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <img
                src={`${API_HOST}/images/default-destination.jpg`}
                alt="Your avatar"
                className="w-12 h-12 rounded-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `${API_HOST}/images/default-destination.jpg`;
                }}
              />
              <div className="flex-1">
                <textarea
                  placeholder={
                    replyTo
                      ? `Trả lời ${replyTo.full_name || replyTo.username}...`
                      : "Chia sẻ suy nghĩ của bạn..."
                  }
                  className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows="3"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={commentLoading}
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Hãy giữ bình luận tích cực và có ích
                  </div>
                  <button
                    onClick={handleAddComment}
                    disabled={commentLoading || !newComment.trim()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {commentLoading
                      ? "Đang gửi..."
                      : replyTo
                      ? "Trả lời"
                      : "Gửi bình luận"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {comments && comments.length > 0 ? (
            comments
              .filter((comment) => comment && !comment?.parent_id)
              .map((comment) => {
                if (!comment) return null;
                const isOwner = comment.user_id === currentUserId;
                const canDelete = isOwner || isAdmin;
                const replies = comments.filter(
                  (c) => c && c?.parent_id === comment.id
                );

                return (
                  <div key={comment.id}>
                    {/* Comment gốc */}
                    <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors relative">
                      <img
                        src={getAvatarUrl(comment.avatar)}
                        alt={comment.full_name || comment.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${API_HOST}/images/default-destination.jpg`;
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {comment.full_name ||
                              comment.username ||
                              "Người dùng"}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString(
                              "vi-VN",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </span>
                          {!hideRating && comment.rating && (
                            <div className="flex items-center gap-1 ml-2">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium text-gray-700">
                                {comment.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                          {comment.comment}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className={`flex items-center gap-1 transition-colors ${
                              likedComments.has(comment.id)
                                ? "text-emerald-600 font-medium"
                                : "text-gray-500 hover:text-emerald-600"
                            }`}
                          >
                            <ThumbsUp
                              className={`w-4 h-4 ${
                                likedComments.has(comment.id)
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
                            Thích
                            {comment.likes_count > 0 && (
                              <span className="ml-1">
                                ({comment.likes_count})
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => handleReply(comment)}
                            className="text-gray-500 hover:text-emerald-600 transition-colors"
                          >
                            Trả lời
                          </button>
                        </div>

                        {/* Inline Reply Form */}
                        {replyingToId === comment.id && (
                          <div className="mt-4 bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                            <div className="flex items-center gap-2 mb-3 text-sm text-blue-700">
                              <Reply className="w-4 h-4" />
                              <span>
                                Đang trả lời{" "}
                                <strong>
                                  {comment.full_name || comment.username}
                                </strong>
                              </span>
                            </div>
                            <div className="flex items-start gap-3">
                              <img
                                src={`${API_HOST}/images/default-destination.jpg`}
                                alt="Your avatar"
                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `${API_HOST}/images/default-destination.jpg`;
                                }}
                              />
                              <div className="flex-1">
                                <textarea
                                  placeholder={`Trả lời ${
                                    comment.full_name || comment.username
                                  }...`}
                                  className="w-full p-3 border border-blue-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                  rows="3"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  disabled={commentLoading}
                                  autoFocus
                                />
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={handleSubmitReply}
                                    disabled={
                                      commentLoading || !replyText.trim()
                                    }
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                                  >
                                    {commentLoading ? (
                                      <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Đang gửi...
                                      </span>
                                    ) : (
                                      "Gửi"
                                    )}
                                  </button>
                                  <button
                                    onClick={handleCancelReply}
                                    disabled={commentLoading}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Comment Actions Menu */}
                      {canDelete && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === comment.id ? null : comment.id
                              )
                            }
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>

                          {openMenuId === comment.id && (
                            <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10 min-w-[150px]">
                              {isOwner && (
                                <button
                                  onClick={() => {
                                    setEditModal({
                                      isOpen: true,
                                      comment,
                                    });
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-blue-600" />
                                  <span className="text-gray-700">
                                    Chỉnh sửa
                                  </span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: "Xóa bình luận",
                                    message:
                                      "Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.",
                                    onConfirm: () => handleDelete(comment.id),
                                  });
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                                <span className="text-red-600">Xóa</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Nested Replies */}
                    {replies.length > 0 && (
                      <div className="ml-16 mt-4 space-y-4">
                        {replies.map((reply) => {
                          const isReplyOwner = reply.user_id === currentUserId;
                          const canDeleteReply = isReplyOwner || isAdmin;

                          return (
                            <div
                              key={reply.id}
                              className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-200 transition-colors relative"
                            >
                              <img
                                src={getAvatarUrl(reply.avatar)}
                                alt={reply.full_name || reply.username}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `${API_HOST}/images/default-destination.jpg`;
                                }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900 text-sm">
                                    {reply.full_name ||
                                      reply.username ||
                                      "Người dùng"}
                                  </h4>
                                  <span className="text-xs text-gray-500">
                                    {new Date(
                                      reply.created_at
                                    ).toLocaleDateString("vi-VN", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                <p className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">
                                  {reply.comment}
                                </p>
                                <div className="flex items-center gap-4 text-xs">
                                  <button
                                    onClick={() => handleLikeComment(reply.id)}
                                    className={`flex items-center gap-1 transition-colors ${
                                      likedComments.has(reply.id)
                                        ? "text-emerald-600 font-medium"
                                        : "text-gray-500 hover:text-emerald-600"
                                    }`}
                                  >
                                    <ThumbsUp
                                      className={`w-3 h-3 ${
                                        likedComments.has(reply.id)
                                          ? "fill-current"
                                          : ""
                                      }`}
                                    />
                                    Thích
                                    {reply.likes_count > 0 && (
                                      <span className="ml-1">
                                        ({reply.likes_count})
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleReply(comment)}
                                    className="text-gray-500 hover:text-emerald-600 transition-colors"
                                  >
                                    Trả lời
                                  </button>
                                </div>
                              </div>

                              {/* Reply Actions Menu */}
                              {canDeleteReply && (
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      setOpenMenuId(
                                        openMenuId === reply.id
                                          ? null
                                          : reply.id
                                      )
                                    }
                                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                                  >
                                    <MoreVertical className="w-4 h-4 text-gray-500" />
                                  </button>

                                  {openMenuId === reply.id && (
                                    <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10 min-w-[150px]">
                                      {isReplyOwner && (
                                        <button
                                          onClick={() => {
                                            setEditModal({
                                              isOpen: true,
                                              comment: reply,
                                            });
                                            setOpenMenuId(null);
                                          }}
                                          className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors"
                                        >
                                          <Edit2 className="w-4 h-4 text-blue-600" />
                                          <span className="text-gray-700 text-sm">
                                            Chỉnh sửa
                                          </span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          setConfirmModal({
                                            isOpen: true,
                                            title: "Xóa trả lời",
                                            message:
                                              "Bạn có chắc chắn muốn xóa trả lời này? Hành động này không thể hoàn tác.",
                                            onConfirm: () =>
                                              handleDelete(reply.id),
                                          });
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-red-50 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                        <span className="text-red-600 text-sm">
                                          Xóa
                                        </span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      {/* Edit Comment Modal */}
      <EditCommentModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, comment: null })}
        onSave={handleEdit}
        comment={editModal.comment}
      />
    </>
  );
};

export default CommentSection;
