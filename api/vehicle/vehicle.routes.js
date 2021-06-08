require('dotenv').config()
const express = require("express");
const VehicleController = require("../../controller/vehicle/vehicle.controller");
const AuthMiddleware = require("../../middleware/auth/authmiddleware");
const router = express.Router();

router.use(AuthMiddleware.verifyToken, AuthMiddleware.requireStaffOrSuperAdmin);
router.get('/find-all', VehicleController.findAll);
router.get('/find', VehicleController.findOne);
router.post('/create', VehicleController.upload.single('file'), VehicleController.createVehicle);
router.post('/update', VehicleController.upload.single('file'), VehicleController.updateVehicle);
router.post('/delete', VehicleController.deleteVehicle);
router.get('/find-all-vehicle-staff', VehicleController.findAllVehicleStaff);
router.get('/verify', VehicleController.checkDuplicatedVehicle);

module.exports = router;
