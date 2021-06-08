require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const routeConstant = require('./constant/routes.constant')

process.env.TZ = 'Asia/Kuala_Lumpur';

const authRouter = require(routeConstant.AUTH_ROUTE);
const userRouter = require(routeConstant.USER_ROUTE);
const vehicleRoute = require(routeConstant.VEHICLE_ROUTE);
const pricePlanRoute = require(routeConstant.PRICE_PLAN_ROUTE);
const courierOrderRoute = require(routeConstant.COURIER_ORDER_ROUTE);
const routeReportRoute = require(routeConstant.ROUTE_REPORT_ROUTE);
const orderRouteRoute = require(routeConstant.ORDER_ROUTE_ROUTE);
const trackingRoute = require(routeConstant.TRACKING_ROUTE);
const shippingOrderRoute = require(routeConstant.SHIPPING_ORDER_ROUTE);
const publicRoute = require(routeConstant.PUBLIC_ROUTE);
const companyAddressRoute = require(routeConstant.COMPANY_ADDRESS_ROUTE);
const taskProofRoute = require(routeConstant.TASK_PROOF_ROUTE);
const dashboardRoute = require(routeConstant.DASHBOARD_ROUTE);

const app = express();
const cors = require("cors");

const db = require("./config/database");
db.sequelize.sync({
    force: false, // To create table if exists , so make it false
    alter: false // To update the table if exists , so make it true
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cors());
app.use(cookieParser());

const baseUrl = "/ddroutes-modular";
app.use(baseUrl + '/auth', authRouter);
app.use(baseUrl + '/user', userRouter);
app.use(baseUrl + '/vehicle', vehicleRoute);
app.use(baseUrl + '/price-plan', pricePlanRoute);
app.use(baseUrl + '/courier-order', courierOrderRoute);
app.use(baseUrl + '/route-report', routeReportRoute);
app.use(baseUrl + '/order-route', orderRouteRoute);
app.use(baseUrl + '/tracking', trackingRoute);
app.use(baseUrl + '/shipping-order', shippingOrderRoute);
app.use(baseUrl + '/public', publicRoute);
app.use(baseUrl + '/company-address', companyAddressRoute);
app.use(baseUrl + '/task-proof', taskProofRoute);
app.use(baseUrl + '/dashboard', dashboardRoute);

app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    console.log("Error:  ", req.app.get('env') === 'development' ? err : {});
    console.log("Error Message:  ", err.message);
    console.log("Error Status: ", err.status || 500);
    next(createError(404));
});

module.exports = app;
