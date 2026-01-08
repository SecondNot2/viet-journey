/**
 * Response Utility
 * Chuẩn hóa format response API
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const success = (res, data = null, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Created response (201)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
const created = (res, data = null, message = "Created successfully") => {
  return success(res, data, message, 201);
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Additional error details
 */
const error = (res, message = "Error", statusCode = 500, errors = null) => {
  const response = {
    success: false,
    error: message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Bad Request response (400)
 */
const badRequest = (res, message = "Bad request", errors = null) => {
  return error(res, message, 400, errors);
};

/**
 * Unauthorized response (401)
 */
const unauthorized = (res, message = "Unauthorized") => {
  return error(res, message, 401);
};

/**
 * Forbidden response (403)
 */
const forbidden = (res, message = "Forbidden") => {
  return error(res, message, 403);
};

/**
 * Not Found response (404)
 */
const notFound = (res, message = "Not found") => {
  return error(res, message, 404);
};

/**
 * Internal Server Error response (500)
 */
const serverError = (res, message = "Internal server error") => {
  return error(res, message, 500);
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info {page, limit, total}
 */
const paginated = (res, data, pagination) => {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
};

module.exports = {
  success,
  created,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  paginated,
};
