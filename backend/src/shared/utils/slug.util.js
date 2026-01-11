/**
 * Slug Utility Functions
 * Tạo và xử lý slug cho URL thân thiện SEO
 */

/**
 * Convert Vietnamese text to slug
 * @param {string} text - Text to convert
 * @returns {string} Slug
 */
const generateSlug = (text) => {
  if (!text) return "";

  // Vietnamese character map
  const vietnameseMap = {
    à: "a",
    á: "a",
    ả: "a",
    ã: "a",
    ạ: "a",
    ă: "a",
    ằ: "a",
    ắ: "a",
    ẳ: "a",
    ẵ: "a",
    ặ: "a",
    â: "a",
    ầ: "a",
    ấ: "a",
    ẩ: "a",
    ẫ: "a",
    ậ: "a",
    è: "e",
    é: "e",
    ẻ: "e",
    ẽ: "e",
    ẹ: "e",
    ê: "e",
    ề: "e",
    ế: "e",
    ể: "e",
    ễ: "e",
    ệ: "e",
    ì: "i",
    í: "i",
    ỉ: "i",
    ĩ: "i",
    ị: "i",
    ò: "o",
    ó: "o",
    ỏ: "o",
    õ: "o",
    ọ: "o",
    ô: "o",
    ồ: "o",
    ố: "o",
    ổ: "o",
    ỗ: "o",
    ộ: "o",
    ơ: "o",
    ờ: "o",
    ớ: "o",
    ở: "o",
    ỡ: "o",
    ợ: "o",
    ù: "u",
    ú: "u",
    ủ: "u",
    ũ: "u",
    ụ: "u",
    ư: "u",
    ừ: "u",
    ứ: "u",
    ử: "u",
    ữ: "u",
    ự: "u",
    ỳ: "y",
    ý: "y",
    ỷ: "y",
    ỹ: "y",
    ỵ: "y",
    đ: "d",
    // Uppercase
    À: "a",
    Á: "a",
    Ả: "a",
    Ã: "a",
    Ạ: "a",
    Ă: "a",
    Ằ: "a",
    Ắ: "a",
    Ẳ: "a",
    Ẵ: "a",
    Ặ: "a",
    Â: "a",
    Ầ: "a",
    Ấ: "a",
    Ẩ: "a",
    Ẫ: "a",
    Ậ: "a",
    È: "e",
    É: "e",
    Ẻ: "e",
    Ẽ: "e",
    Ẹ: "e",
    Ê: "e",
    Ề: "e",
    Ế: "e",
    Ể: "e",
    Ễ: "e",
    Ệ: "e",
    Ì: "i",
    Í: "i",
    Ỉ: "i",
    Ĩ: "i",
    Ị: "i",
    Ò: "o",
    Ó: "o",
    Ỏ: "o",
    Õ: "o",
    Ọ: "o",
    Ô: "o",
    Ồ: "o",
    Ố: "o",
    Ổ: "o",
    Ỗ: "o",
    Ộ: "o",
    Ơ: "o",
    Ờ: "o",
    Ớ: "o",
    Ở: "o",
    Ỡ: "o",
    Ợ: "o",
    Ù: "u",
    Ú: "u",
    Ủ: "u",
    Ũ: "u",
    Ụ: "u",
    Ư: "u",
    Ừ: "u",
    Ứ: "u",
    Ử: "u",
    Ữ: "u",
    Ự: "u",
    Ỳ: "y",
    Ý: "y",
    Ỷ: "y",
    Ỹ: "y",
    Ỵ: "y",
    Đ: "d",
  };

  let slug = text.toLowerCase();

  // Replace Vietnamese characters
  for (const [viet, latin] of Object.entries(vietnameseMap)) {
    slug = slug.replace(new RegExp(viet, "g"), latin);
  }

  // Replace special characters with hyphens
  slug = slug
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

  return slug;
};

/**
 * Generate unique slug by appending ID if needed
 * @param {string} text - Text to convert
 * @param {number} id - ID to append for uniqueness
 * @returns {string} Unique slug
 */
const generateUniqueSlug = (text, id) => {
  const baseSlug = generateSlug(text);
  return id ? `${baseSlug}-${id}` : baseSlug;
};

/**
 * Check if a string is a numeric ID or a slug
 * @param {string} param - Parameter to check
 * @returns {boolean} True if numeric ID
 */
const isNumericId = (param) => {
  return /^\d+$/.test(param);
};

/**
 * Generate flight slug from locations
 * @param {string} from - From location
 * @param {string} to - To location
 * @param {number} id - Flight schedule ID
 * @returns {string} Flight slug
 */
const generateFlightSlug = (from, to, id) => {
  const fromSlug = generateSlug(from);
  const toSlug = generateSlug(to);
  return `${fromSlug}-${toSlug}-${id}`;
};

/**
 * Generate transport slug from route name
 * @param {string} routeName - Route name
 * @param {number} id - Transport trip ID
 * @returns {string} Transport slug
 */
const generateTransportSlug = (routeName, id) => {
  return generateUniqueSlug(routeName, id);
};

module.exports = {
  generateSlug,
  generateUniqueSlug,
  isNumericId,
  generateFlightSlug,
  generateTransportSlug,
};
