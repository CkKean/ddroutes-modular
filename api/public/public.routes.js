require('dotenv').config()
const express = require("express");
const ShippingOrderController = require("../../controller/shipping-order/shipping-order.controller");
const router = express.Router();

router.use('/',express.static( 'uploaded-files'));
router.get('/find/orderNo', ShippingOrderController.findByShippingOrderNo);

module.exports = router;
