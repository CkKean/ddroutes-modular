require('dotenv').config()
const express = require("express");
const AuthMiddleware = require("../../middleware/auth/authmiddleware");
const RouteReportController = require("../../controller/route-report/route-report.controller");
const router = express.Router();

router.use(AuthMiddleware.verifyToken, AuthMiddleware.requireStaffOrSuperAdmin);
router.get('/find-all', RouteReportController.findAll);
router.get('/find', RouteReportController.findOne);
router.post('/update', RouteReportController.uploadFile.single('file'), RouteReportController.updateRouteReport);
router.post('/delete', RouteReportController.deleteRouteReport);

module.exports = router;
