require('dotenv').config()
const express = require("express");
const AuthMiddleware = require("../../middleware/auth/authmiddleware");
const CompanyAddressController = require("../../controller/company-address/company-address.controller");
const router = express.Router();

router.use(AuthMiddleware.verifyToken, AuthMiddleware.requireStaffOrSuperAdmin);
router.get('/find-all', CompanyAddressController.findAll);
router.get('/find', CompanyAddressController.find);
router.post('/create', CompanyAddressController.create);
router.post('/update', CompanyAddressController.update);
router.post('/delete', CompanyAddressController.deleteAddress);

module.exports = router
