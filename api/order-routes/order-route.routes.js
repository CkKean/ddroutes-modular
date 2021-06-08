require('dotenv').config()
const express = require("express");
const AuthMiddleware = require("../../middleware/auth/authmiddleware");
const OrderRouteController = require("../../controller/order-route/order-route.controller");
const router = express.Router();

router.use(AuthMiddleware.verifyToken, AuthMiddleware.requireStaffOrSuperAdmin);
router.get('/find-all', OrderRouteController.findAll);
router.get('/find/courier-personnel', OrderRouteController.findCourierPersonnel);
router.get('/find/courier-order', OrderRouteController.findUnHandleOrders);
router.get('/find/status', OrderRouteController.findRouteByStatus);
router.get('/find/company-address', OrderRouteController.findAllCompanyAddress);
router.get('/find/vehicle-personnel', OrderRouteController.findVehiclePersonnel);
router.post('/create', OrderRouteController.createOrderRoute);
router.post('/delete', OrderRouteController.deleteOrderRoute);
router.post('/update', OrderRouteController.updateOrderRoute);
router.post('/add-order', OrderRouteController.addOrdersToRoute);
router.post('/manual/optimize', OrderRouteController.manualOptimizeRoute);
router.post('/auto/optimize', OrderRouteController.autoOptimizeRoute);

module.exports = router;
