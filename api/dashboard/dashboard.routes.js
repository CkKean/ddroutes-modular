require('dotenv').config()
const express = require("express");
const AuthMiddleware = require("../../middleware/auth/authmiddleware");
const DashboardController = require("../../controller/dashboard/dashboard.controller");
const router = express.Router();

router.use(AuthMiddleware.verifyToken, AuthMiddleware.requireStaffOrSuperAdmin);
router.get('/find-all', DashboardController.findAll);

module.exports = router;
