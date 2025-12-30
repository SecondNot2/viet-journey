/**
 * Auth Module
 * Exports all auth-related components
 */
const authRoutes = require("./auth.routes");
const authService = require("./auth.service");
const authController = require("./auth.controller");

module.exports = {
  routes: authRoutes,
  service: authService,
  controller: authController,
};
