/**
 * Date/Time Helper Functions for Frontend
 *
 * ⚠️ QUAN TRỌNG: KHÔNG BAO GIỜ PARSE STRING DATE THÀNH DATE OBJECT!
 *
 * Lý do:
 * - new Date("YYYY-MM-DD") có thể lệch timezone
 * - Backend trả về string YYYY-MM-DD hoặc YYYY-MM-DD HH:MM:SS
 * - Chỉ format string, KHÔNG parse Date!
 *
 * Ví dụ lỗi:
 * - Backend: "2025-10-12 08:30:00"
 * - Frontend: new Date("2025-10-12 08:30:00") → Có thể lệch timezone!
 * - Kết quả: Hiển thị sai ngày/giờ
 *
 * Giải pháp: Format string trực tiếp bằng split() và join()
 */

/**
 * Format YYYY-MM-DD string thành DD/MM/YYYY (để hiển thị)
 * @param {string} dateStr - YYYY-MM-DD string (ví dụ: "2025-10-12")
 * @returns {string} - DD/MM/YYYY string (ví dụ: "12/10/2025")
 */
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = String(dateStr).split("-");
  return `${day}/${month}/${year}`;
};

/**
 * Format YYYY-MM-DD HH:MM:SS string thành HH:MM DD/MM/YYYY (để hiển thị)
 * @param {string} datetime - YYYY-MM-DD HH:MM:SS string (ví dụ: "2025-10-12 08:30:00")
 * @returns {string} - HH:MM DD/MM/YYYY string (ví dụ: "08:30 12/10/2025")
 */
export const formatDateTime = (datetime) => {
  if (!datetime) return "Chưa xác định";

  // Split "2025-10-12 08:30:00" → ["2025-10-12", "08:30:00"]
  const [datePart, timePart] = String(datetime).split(" ");
  if (!datePart) return datetime;

  // Split date "2025-10-12" → ["2025", "10", "12"]
  const [year, month, day] = datePart.split("-");

  // Get time "08:30:00" → "08:30"
  const time = timePart ? timePart.substring(0, 5) : "";

  // Format: HH:MM DD/MM/YYYY
  return time ? `${time} ${day}/${month}/${year}` : `${day}/${month}/${year}`;
};

/**
 * Format HH:MM:SS thành HH:MM (để hiển thị giờ)
 * @param {string} timeStr - HH:MM:SS string (ví dụ: "08:30:00")
 * @returns {string} - HH:MM string (ví dụ: "08:30")
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return "";
  return String(timeStr).substring(0, 5);
};

/**
 * Parse DD/MM/YYYY string thành YYYY-MM-DD (để gửi cho backend)
 * @param {string} displayDate - DD/MM/YYYY string (ví dụ: "12/10/2025")
 * @returns {string} - YYYY-MM-DD string (ví dụ: "2025-10-12")
 */
export const parseDisplayDate = (displayDate) => {
  if (!displayDate) return "";
  const [day, month, year] = String(displayDate).split("/");
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date as YYYY-MM-DD string
 * @returns {string} - YYYY-MM-DD string
 */
export const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Check if date string is valid YYYY-MM-DD format
 * @param {string} dateStr - Date string to validate
 * @returns {boolean}
 */
export const isValidDateString = (dateStr) => {
  if (!dateStr) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateStr);
};

/**
 * Extract time from YYYY-MM-DD HH:MM:SS or HH:MM:SS string
 * @param {string} datetime - Datetime or time string
 * @returns {string} - HH:MM string
 */
export const extractTime = (datetime) => {
  if (!datetime) return "";

  // If it's full datetime "2025-10-12 08:30:00"
  if (String(datetime).includes(" ")) {
    const [, timePart] = String(datetime).split(" ");
    return timePart ? timePart.substring(0, 5) : "";
  }

  // If it's just time "08:30:00" or "08:30"
  return String(datetime).substring(0, 5);
};

/**
 * Format date string to long format: "DD Tháng MM, YYYY"
 * @param {string} dateStr - YYYY-MM-DD string
 * @returns {string} - "DD Tháng MM, YYYY"
 */
export const formatDateLong = (dateStr) => {
  if (!dateStr) return "";

  const [year, month, day] = String(dateStr).split("-");
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const monthName = monthNames[parseInt(month) - 1] || `Tháng ${month}`;
  return `${parseInt(day)} ${monthName}, ${year}`;
};

/**
 * Format date string to DD/MM/YYYY
 * @param {string} dateStr - YYYY-MM-DD string or Date object
 * @returns {string} - DD/MM/YYYY string
 */
export const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return "";

  // If it's a Date object, convert to string first
  if (dateStr instanceof Date) {
    const year = dateStr.getFullYear();
    const month = String(dateStr.getMonth() + 1).padStart(2, "0");
    const day = String(dateStr.getDate()).padStart(2, "0");
    dateStr = `${year}-${month}-${day}`;
  }

  const [year, month, day] = String(dateStr).split("-");
  return `${day}/${month}/${year}`;
};
