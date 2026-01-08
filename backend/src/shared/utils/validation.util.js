/**
 * Validation Utility
 * Common validation functions
 */

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Vietnamese format)
 * @param {string} phone
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone?.replace(/\s/g, "") || "");
};

/**
 * Validate password strength
 * @param {string} password
 * @returns {{valid: boolean, message: string}}
 */
const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, message: "Mật khẩu phải có ít nhất 6 ký tự" };
  }
  return { valid: true, message: "" };
};

/**
 * Validate required fields
 * @param {Object} data - Object to validate
 * @param {Array<string>} requiredFields - List of required field names
 * @returns {{valid: boolean, missing: Array<string>}}
 */
const validateRequired = (data, requiredFields) => {
  const missing = requiredFields.filter(
    (field) => !data[field] || data[field].toString().trim() === ""
  );

  return {
    valid: missing.length === 0,
    missing,
  };
};

/**
 * Sanitize string input
 * @param {string} str
 * @returns {string}
 */
const sanitizeString = (str) => {
  if (!str) return "";
  return str.toString().trim();
};

/**
 * Parse integer with default value
 * @param {*} value
 * @param {number} defaultValue
 * @returns {number}
 */
const parseIntOrDefault = (value, defaultValue = 0) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

module.exports = {
  isValidEmail,
  isValidPhone,
  validatePassword,
  validateRequired,
  sanitizeString,
  parseIntOrDefault,
};
