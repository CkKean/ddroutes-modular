require('dotenv').config()
const express = require("express");
const AuthMiddleware = require("../../middleware/auth/authmiddleware");
const CourierOrderController = require("../../controller/courier-order/courier-order.controller");
const CourierOrderValidation = require("../../middleware/validation/courier-order-validation");
const MapDirectionRoutingController = require("../../controller/map-direction-routing/map-direction-routing.controller");
const PricePlanController = require("../../controller/price-plan/price-plan.controller");
const router = express.Router();

router.use(AuthMiddleware.verifyToken, AuthMiddleware.requireStaffOrSuperAdmin);
router.get('/find-all', CourierOrderController.findAll);
router.get('/find/order/status', CourierOrderController.findAllByOrderStatus);
router.get('/find/orderId', CourierOrderController.findByOrderId);
router.get('/find/orderNo', CourierOrderController.findByOrderNo);
router.get('/find/trackingNo', CourierOrderController.findByTrackingNo);
router.post('/create', CourierOrderValidation.fieldsValidation, CourierOrderController.createCourierOrder);
router.post('/delete', CourierOrderController.deleteCourierOrder);
router.post('/update', CourierOrderValidation.updateFieldValidation, CourierOrderValidation.fieldsValidation, CourierOrderController.updateCourierOrder);
router.post('/shipping-cost', CourierOrderController.calculateShippingCost);
router.get('/type', PricePlanController.findVehicleUniqueType);

module.exports = router;
