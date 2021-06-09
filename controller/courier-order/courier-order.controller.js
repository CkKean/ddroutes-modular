const CourierOrder = require("../../config/database").courierOrder;
const User = require("../../config/database").user;
const PricePlan = require("../../config/database").pricePlan;
const TaskProof = require("../../config/database").taskProof;
const StatusModel = require("../../model/status.model");
const generateUniqueId = require("../../utils/unique-id.util");
const statusModel = new StatusModel();
const MapDirectionRoutingController = require("../map-direction-routing/map-direction-routing.controller");
const generateTrackingId = require("../../utils/generateTrackingNo.util");
const {OrderTypeConstant} = require("../../constant/order-type.constant");
const {Op} = require("sequelize");
const {OrderStatusConstant} = require("../../constant/order-status.constant");

findAll = async (req, res) => {

    const courierOrder = await CourierOrder.findAll({
        order: [
            ["createdAt", "DESC"]
        ]
    });

    return res.json(statusModel.success(courierOrder));
}

findAllByOrderStatus = async (req, res) => {
    const courierOrder = await CourierOrder.findAll({
        order: [
            ["createdAt", "ASC"]
        ],
        where: {
            orderStatus: req.query.orderStatus
        }
    });

    return res.json(statusModel.success(courierOrder));
}

findByOrderId = async (req, res) => {
    const courierOrder = await CourierOrder.findOne({
        where: {
            orderId: req.query.orderId
        }
    });
    if (!courierOrder) {
        return res.json(statusModel.failed({message: "Courier order does not exist."}));
    } else if (courierOrder.orderStatus !== OrderStatusConstant.PENDING) {
        let status = (courierOrder.isPickedUp && courierOrder.orderType === OrderTypeConstant.PICK_UP) ? courierOrder.orderStatus : courierOrder.pickupOrderStatus;

        return res.json(statusModel.failed({message: "Courier order cannot be edited because it was (" + status + ")"}));
    }
    const userList = await findUserByUserId(courierOrder.createdBy);
    courierOrder.createdBy = userList.fullName;
    return res.json(statusModel.success(courierOrder));
}

findByOrderNo = async (req, res) => {
    const courierOrder = await CourierOrder.findOne({
        where: {
            orderNo: req.query.orderNo
        },
        raw: true
    });
    if (!courierOrder) {
        return res.json(statusModel.failed({message: "Courier order does not exist."}));
    }
    let allProof;
    let taskProof = null;
    let pickupTaskProof = null;
    if (courierOrder.pickupProofId != null && courierOrder.proofId != null) { // For picked up
        allProof = await TaskProof.findAll(
            {
                where:
                    {
                        [Op.or]: [
                            {proofId: courierOrder.proofId},
                            {pickupRouteId: courierOrder.pickupProofId},
                        ]
                    },
                raw: true
            }
        );

        for (let proof of allProof) {
            if (proof.proofId === courierOrder.proofId) {
                taskProof = courierOrder.proofId;
            }
            if (proof.proofId === courierOrder.pickupProofId) {
                pickupTaskProof = courierOrder.pickupProofId;
            }
        }

    } else if (courierOrder.proofId != null && courierOrder.pickupProofId == null) { // For delivery
        taskProof = await TaskProof.findOne(
            {
                where:
                    {proofId: courierOrder.proofId},
                raw: true
            }
        );
    } else if (courierOrder.proofId == null && courierOrder.pickupProofId != null) {// For Pick up only
        pickupTaskProof = await TaskProof.findOne(
            {
                where:
                    {proofId: courierOrder.pickupProofId},
                raw: true
            }
        );
    }

    const userList = await findUserByUserId(courierOrder.createdBy);
    courierOrder.createdBy = userList.fullName;
    courierOrder.proofInfo = taskProof;
    courierOrder.pickupProofInfo = pickupTaskProof;

    return res.json(statusModel.success(courierOrder));
}

findByTrackingNo = async (req, res) => {
    const courierOrder = await CourierOrder.findOne({
        where: {
            trackingNo: req.query.trackingNo
        }
    });
    if (!courierOrder) {
        return res.json(statusModel.failed({message: "Courier order does not exist."}));
    }
    const userList = await findUserByUserId(courierOrder.createdBy);
    courierOrder.createdBy = userList.fullName;
    return res.json(statusModel.success(courierOrder));
}

createCourierOrder = async (req, res) => {

    let orderId = generateUniqueId('COI');
    let orderNo = generateUniqueId('CON');

    let trackingNo;
    if (req.body.recipientState === "Sabah" || req.body.recipientState === "Sarawak" || req.body.recipientState === "W.P Labuan") {
        trackingNo = generateTrackingId('EM', 'MY');
    } else {
        trackingNo = generateTrackingId('WM', 'MY');
    }

    let recipientGeocodingData = await MapDirectionRoutingController.getGeoCoding(req.body.fullRecipientAddress);
    let senderGeocodingData = await MapDirectionRoutingController.getGeoCoding(req.body.fullSenderAddress);
    req.body.orderId = orderId;
    req.body.orderNo = orderNo;
    req.body.orderStatus = OrderStatusConstant.PENDING;
    req.body.trackingNo = trackingNo;
    req.body.createdBy = req.userId;
    req.body.createdAt = new Date();
    req.body.senderLongitude = senderGeocodingData.longitude;
    req.body.senderLatitude = senderGeocodingData.latitude;
    req.body.senderFormattedAddress = senderGeocodingData.formattedAddress;

    req.body.recipientLongitude = recipientGeocodingData.longitude;
    req.body.recipientLatitude = recipientGeocodingData.latitude;
    req.body.recipientFormattedAddress = recipientGeocodingData.formattedAddress;

    CourierOrder.create(req.body).then(() => {
        return res.json(statusModel.success("Courier order has been created."));
    }).catch(err => {
        return res.json(statusModel.failed({message: err.message}));
    });
}

deleteCourierOrder = async (req, res) => {

    const courierOrder = await verifyCourierOrderByOrderNo(req.query.orderNo);

    if (courierOrder) {
        CourierOrder.destroy({
            where: {
                orderNo: req.query.orderNo,
            }
        }).then(() => {
            return res.json(statusModel.success("Courier order record have been deleted."));
        }).catch(err => {
            return res.json(statusModel.failed({message: err.message}));
        });
    } else {
        return res.json(statusModel.failed({message: "Courier order does not exist."}));
    }
}

updateCourierOrder = async (req, res) => {
    const courierOrder = await verifyCourierOrderByOrderId(req.body.orderId);

    if (courierOrder) {
        req.body.updatedBy = req.userId;
        req.body.updatedAt = new Date().toLocaleString();

        CourierOrder.update(
            req.body,
            {
                where: {
                    orderId: req.body.orderId
                }
            }
        ).then(() => {
            return res.json(statusModel.success("Courier order update successfully."));
        }).catch(err => {
            return res.json(statusModel.failed({message: err.message}));
        })
    } else {
        return res.json(statusModel.failed({message: "Courier order does not exist."}));
    }
}


verifyCourierOrderByOrderNo = async (orderNo) => {
    return await CourierOrder.findOne({
        where: {
            orderNo: orderNo
        }
    });
}

verifyCourierOrderByOrderId = async (orderId) => {
    return await CourierOrder.findOne({
        where: {
            orderId: orderId
        }
    });
}

findUserByUserId = async (userId) => {
    const user = await User.findOne(
        {
            where: {
                userId: userId
            },
            attributes: ['userId', 'fullName']
        }
    );
    return user;
};

calculateShippingCost = async (req, res) => {
    let vehicleType = req.body.vehicleType;
    let itemWeight = req.body.itemWeight;

    const pricePlanList = await PricePlan.findAll({raw: true});
    const distance = await MapDirectionRoutingController.getDistance(req);

    const pricePlan = pricePlanList.filter(p => p.vehicleType === vehicleType)[0];

    let shippingCost = pricePlan.defaultPricing;

    let defaultDistance = pricePlan.defaultDistance * 1000; // in meter
    let defaultWeight = pricePlan.defaultWeight;
    if (pricePlan.defaultWeightUnit === "ton") {
        defaultWeight = pricePlan.defaultWeight * 1000; // in kg
    }

    if (distance.distanceValue <= defaultDistance && itemWeight <= defaultWeight) { // Default
        shippingCost = pricePlan.defaultPricing;
    }

    if (distance.distanceValue > defaultDistance) {
        const distanceDifference = (distance.distanceValue - defaultDistance) / 1000;
        shippingCost = +shippingCost + +(distanceDifference.toFixed(0) * pricePlan.subDistancePricing);
    }

    if (defaultWeight < itemWeight) {
        shippingCost = +shippingCost + +((itemWeight - defaultWeight) * +pricePlan.subWeightPricing);
    }

    return res.json(statusModel.success(Number(shippingCost)));
}


const CourierOrderController = {
    findAll: findAll,
    findByOrderId: findByOrderId,
    findByOrderNo: findByOrderNo,
    findByTrackingNo: findByTrackingNo,
    createCourierOrder: createCourierOrder,
    deleteCourierOrder: deleteCourierOrder,
    updateCourierOrder: updateCourierOrder,
    findAllByOrderStatus: findAllByOrderStatus,
    calculateShippingCost: calculateShippingCost
}

module.exports = CourierOrderController;
