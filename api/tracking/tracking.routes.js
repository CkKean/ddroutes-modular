require('dotenv').config()
const express = require("express");
const TrackingController = require("../../controller/tracking/tracking.controller");
const router = express.Router();

router.get('/find', TrackingController.findAllByTrackingOrderNo);

module.exports = router;
