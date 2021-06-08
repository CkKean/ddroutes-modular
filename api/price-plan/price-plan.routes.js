require('dotenv').config()
const express = require("express");
const PricePlanController = require("../../controller/price-plan/price-plan.controller");
const AuthMiddleware = require("../../middleware/auth/authmiddleware");
const router = express.Router();

router.get('/find-all', PricePlanController.findAll);
router.get('/find', AuthMiddleware.verifyToken, AuthMiddleware.requireStaffOrSuperAdmin, PricePlanController.findOne);
router.post('/create', AuthMiddleware.verifyToken, AuthMiddleware.requireStaffOrSuperAdmin, PricePlanController.createPricePlan);
router.post('/delete', AuthMiddleware.verifyToken, AuthMiddleware.requireStaffOrSuperAdmin, PricePlanController.deleteVehicle);
router.post('/update', AuthMiddleware.verifyToken, AuthMiddleware.requireStaffOrSuperAdmin, PricePlanController.updateVehicle);

module.exports = router;
