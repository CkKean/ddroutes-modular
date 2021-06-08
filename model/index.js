const User = require("./user/user.model");
const Vehicle = require("./vehicle/vehicle.model");
const PricePlan = require("./price-plan/price-plan.model");
const CourierOrder = require("./courier-order/courier-order.model");
const RouteReport = require("./route-report/route-report.model");
const OrderRoute = require("./order-route/order-route.model");
const CompanyAddress = require("./company-address/company-address.model");
const TaskProof = require("./task-proof/task-proof.model");

const model = {
    User,
    Vehicle,
    PricePlan,
    CourierOrder,
    RouteReport,
    OrderRoute,
    CompanyAddress,
    TaskProof
};

module.exports = model;
