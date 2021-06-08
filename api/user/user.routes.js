require('dotenv').config()
const express = require("express");
const router = express.Router();
const UserController = require("../../controller/user/user.controller");
const AccountMiddleware = require("../../middleware/account/accountmiddleware");
const AuthMiddleware = require("../../middleware/auth/authmiddleware");
const AuthController = require("../../controller/auth/auth.controller");
const ShippingOrderController = require("../../controller/shipping-order/shipping-order.controller");


router.get('/find-all', AuthMiddleware.verifyToken, AuthMiddleware.isSuperAdmin, UserController.findAllStaff);
router.get('/find', AuthMiddleware.verifyToken, AuthMiddleware.isSuperAdmin, UserController.findOne);
router.post('/create', AuthMiddleware.verifyToken, AuthMiddleware.isSuperAdmin,
    UserController.uploadFile.single('file'),
    UserController.createStaff
);
router.post('/update', AuthMiddleware.verifyToken, AuthMiddleware.isSuperAdmin, UserController.uploadFile.single('file'), UserController.updateStaff);
router.post('/delete', AuthMiddleware.verifyToken, AuthMiddleware.isSuperAdmin, UserController.deleteStaff);

router.get('/find/position', UserController.findAllStaffByPosition);
router.get('/find/courier-personnel', AuthMiddleware.verifyToken, AuthMiddleware.isSuperAdmin, UserController.findAllCourierPersonnel);

router.get('/find/user',AuthMiddleware.verifyToken, UserController.findUserInformation);

module.exports = router;
