const StatusModel = require("../../model/status.model");
const RouteReport = require("../../config/database").routeReport;
const OrderRoute = require("../../config/database").orderRoute;
const CourierOrder = require("../../config/database").courierOrder;
const Vehicle = require("../../config/database").vehicle;
const User = require("../../config/database").user;
const multer = require("multer");
const fs = require("fs");
const generateDateTime = require("../../utils/unique-date-time.util");

const {getOrderListAddressOnRoute} = require("../order-route/order-route-helper");
const statusModel = new StatusModel();

findAll = async (req, res) => {
    const routeReport = await RouteReport.findAll({
            order: [
                ["createdAt", "ASC"]
            ],
            include: [{
                model: OrderRoute,
                as: "orderRoute",
                include: {
                    model: User,
                    as: "personnelInfo",
                    attributes: ["fullName"]
                },
                attributes: {exclude: ["personnel"]},
            }],
            raw: true,
            nest: true,
            attributes: {
                exclude: ["createdBy", "updatedBy", "updatedAt"]
            }
        },
    );

    return res.json(statusModel.success(routeReport));
}

findOne = async (req, res) => {
    const routeReport = await RouteReport.findOne({
        where: {
            routeReportId: req.query.routeReportId
        },
        attributes: {
            exclude: ['createdBy', 'updatedBy']
        },
        raw: true
    });
    if (routeReport) {
        const courierOrder = await CourierOrder.findAll({
            where: {routeId: routeReport.routeId}
        });
        const orderRoute = await OrderRoute.findOne({
            where: {routeId: routeReport.routeId},
            include: [{
                model: User,
                as: "personnelInfo",
                attributes: ["fullName"]
            }, {
                model: User,
                as: "createdByInfo",
                attributes: ["fullName"]
            }],
            raw: true,
            nest: true,
            attributes: {exclude: ["personnel", "createdBy", "updatedBy"]}
        });
        const vehicleInfo = await Vehicle.findOne(
            {
                where: {vehicleId: orderRoute.vehicleId},
                raw: true,
                attributes: ["vehicleId", "type", "plateNo", "fuelEfficiency", "fuelEfficiencyUnit", "owner", "brand", "model"]
            });

        routeReport.orderRoute = orderRoute;
        routeReport.orderList = getOrderListAddressOnRoute(courierOrder, routeReport.routeId);
        routeReport.vehicleInfo = vehicleInfo;

        return res.json(statusModel.success(routeReport));
    } else {
        return res.json(statusModel.failed({message: "Route report does not exist."}));
    }
}

updateRouteReport = async (req, res) => {
    let routeReportData = JSON.parse(req.body.routeReport);
    const routeReport = await verifyRouteReport(routeReportData.routeReportId);
    if (routeReport) {

        const routeId = routeReportData.routeId;
        const latestPetrolPrice = routeReportData.latestPetrolPrice;
        const orderRoute = await OrderRoute.findOne({
            where: {routeId: routeId},
            include: [{model: Vehicle, as: "vehicleInfo", rawAttributes: true}],
            raw: true
        });

        const estimatedResult = calculatePetrolFeeAndUsage(+orderRoute.totalDistance, +orderRoute["vehicleInfo.fuelEfficiency"], +latestPetrolPrice);

        if (req.file) {
            routeReportData.statement = req.file.filename;
            routeReportData.statementPath = '/' + req.file.destination.split('/')[1];
        } else {
            routeReportData.statement = null;
            routeReportData.statementPath = null;
        }

        routeReportData.updatedBy = req.userId;
        routeReportData.updatedAt = new Date();
        routeReportData.calculatedDistanceTravel = orderRoute.totalDistance;
        routeReportData.calculatedPetrolFees = estimatedResult.fuelCost;
        routeReportData.calculatedPetrolUsage = estimatedResult.totalConsumedLitres;

        RouteReport.update(routeReportData, {
            where:
                {
                    routeReportId: routeReportData.routeReportId
                }
        }).then(() => {
            if (req.file && routeReport.statement && routeReport.statementPath) {
                const filePath = 'uploaded-files' + routeReport.statementPath + '/' + routeReport.statement;
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    return res.json(statusModel.failed({message: err.message}));
                }
            }
            return res.json(statusModel.success("Route report has been updated."));

        }).catch(err => {
            return res.json(statusModel.failed({message: err.message}));
        });
    } else {
        return res.json(statusModel.failed({message: "Route Report does not exist."}));
    }
}

deleteRouteReport = async (req, res) => {
    const routeReport = await verifyRouteReport(req.query.routeReportId);

    if (routeReport) {
        RouteReport.destroy({
            where: {
                routeReportId: req.query.routeReportId,
            }
        }).then(() => {
            if (routeReport.statement && routeReport.statementPath) {
                const filePath = 'uploaded-files' + routeReport.statementPath + '/' + routeReport.statement;
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    return res.json(statusModel.failed({message: err.message}));
                }
            }
            return res.json(statusModel.success("Route report record have been deleted."));
        }).catch(err => {
            return res.json(statusModel.failed({message: err.message}));
        })
    } else {
        return res.json(statusModel.failed({message: "Order route report does not exist."}));
    }

}

verifyRouteReport = async (routeReportId) => {
    const routeReport = await RouteReport.findOne({
        where: {
            routeReportId: routeReportId
        },
        raw: true
    });
    return routeReport;
}

calculatePetrolFeeAndUsage = (distance, fuelConsumption, latestPetrolPrice) => {
    console.log(distance, fuelConsumption, latestPetrolPrice);
    if (distance && fuelConsumption && latestPetrolPrice) {
        const totalConsumedLitres = (distance * fuelConsumption) / 100;
        const fuelCost = totalConsumedLitres * latestPetrolPrice;
        const petrolFeeAndUsage = {
            totalConsumedLitres: totalConsumedLitres,
            fuelCost: fuelCost
        };
        return petrolFeeAndUsage;
    } else {
        return null;
    }
}

let storage = multer.diskStorage({
    destination: function (req, file, callback) {
        if (file) {
            callback(null, "uploaded-files/route-report")
        }
    },
    filename: function (req, file, cb) {
        if (file) {
            let fileOriginalName = file.originalname;
            let fileName = fileOriginalName.split('.')[0];
            let fileExtension = fileOriginalName.split('.')[1];
            cb(null, fileName + '_' + generateDateTime() + '.' + fileExtension);
        }
    }
});

uploadFile = multer({
    storage: storage,
    limits: {fileSize: 2000000},
    fileFilter(req, file, callback) {
        if (file) {
            if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
                callback(new Error('Please upload JPG, JPEG, PNG image only.'))
            }
            callback(undefined, true)
        }
    }
});

const RouteReportController = {
    findAll: findAll,
    findOne: findOne,
    updateRouteReport: updateRouteReport,
    deleteRouteReport: deleteRouteReport,
    uploadFile: uploadFile
};

module.exports = RouteReportController;

