/**
 * Date formatting utilities
 */

/**
 * Format date to Vietnamese locale
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/**
 * Format date with time
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format price to Vietnamese currency
 * @param {number} price
 * @returns {string}
 */
export const formatPrice = (price) => {
  if (!price && price !== 0) return "";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

/**
 * Format number with thousand separator
 * @param {number} num
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (!num && num !== 0) return "";
  return new Intl.NumberFormat("vi-VN").format(num);
};
