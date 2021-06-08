require('dotenv').config()
const express = require("express");
const ShippingOrderController = require("../../controller/shipping-order/shipping-order.controller");
const AuthMiddleware = require("../../middleware/auth/authmiddleware");
const CourierOrderValidation = require("../../middleware/validation/courier-order-validation");
const CourierOrderController = require("../../controller/courier-order/courier-order.controller");
const VehicleController = require("../../controller/vehicle/vehicle.controller");
const PricePlanController = require("../../controller/price-plan/price-plan.controller");
const UserController = require("../../controller/user/user.controller");
const router = express.Router();

router.use(AuthMiddleware.verifyToken, AuthMiddleware.isNormalUser);
router.get('/find-all', ShippingOrderController.findAllShippingOrder);
router.post('/create', CourierOrderValidation.fieldsValidation, ShippingOrderController.createShippingOrder);
router.get('/find', ShippingOrderController.findByShippingOrderNo);
router.post('/shipping-cost', CourierOrderController.calculateShippingCost);
router.get('/type', PricePlanController.findVehicleUniqueType);

module.exports = router;
