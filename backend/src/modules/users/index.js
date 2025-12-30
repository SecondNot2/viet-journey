/**
 * Users Module
 * Exports all user-related components
 */
const usersRoutes = require("./users.routes");
const usersService = require("./users.service");
const usersController = require("./users.controller");
const usersRepository = require("./users.repository");

module.exports = {
  routes: usersRoutes,
  service: usersService,
  controller: usersController,
  repository: usersRepository,
};
