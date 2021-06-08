const StatusModel = require("../../model/status.model");
const generateUniqueId = require("../../utils/unique-id.util");
const MapDirectionRoutingController = require("../map-direction-routing/map-direction-routing.controller");
const generateTrackingId = require("../../utils/generateTrackingNo.util");
const {OrderStatusConstant} = require("../../constant/order-status.constant");
const {OrderTypeConstant} = require("../../constant/order-type.constant");
const CourierOrder = require("../../config/database").courierOrder;
const User = require("../../config/database").user;
const statusModel = new StatusModel();

findAllShippingOrder = async (req, res) => {
    if (req.userId) {
        const courierOrder = await CourierOrder.findAll({
            where: {
                createdBy: req.userId
            },
            attributes: {
                exclude: ["orderId"]
            },
            order: [["createdAt", "DESC"]],
            raw: true
        });

        let completedList = [];
        let inProgressList = [];
        let failedList = [];
        let pendingList = [];
        let pickedUpList = [];

        for (let order of courierOrder) {
            let status;
            if (order.isPickedUp) {
                status = order.orderStatus;
            } else {
                status = order.pickupOrderStatus;
            }
            if (status === OrderStatusConstant.COMPLETED) {
                completedList.push(order);
            } else if (status === OrderStatusConstant.IN_PROGRESS) {
                inProgressList.push(order);
            } else if (status === OrderStatusConstant.FAILED) {
                failedList.push(order);
            } else if (status === OrderStatusConstant.PENDING) {
                pendingList.push(order);
            } else if (status === OrderStatusConstant.PICKED_UP) {
                pickedUpList.push(order);
            }
        }

        let finalOrder = {
            allOrder: courierOrder,
            completedList: completedList,
            inProgressList: inProgressList,
            failedList: failedList,
            pendingList: pendingList,
            pickedUpList: pickedUpList,
        };

        return res.json(statusModel.success(finalOrder));
    } else {
        return res.json(statusModel.failed({message: "User does not exists."}));
    }
}

findShippingOrder = async (req, res) => {

    const courierOrder = await CourierOrder.findOne({
        where: {
            createdBy: req.userId,
            orderNo: req.query.orderNo
        },
        attributes: {
            exclude: ["updatedBy", "updatedAt"]
        }
    });

    if (courierOrder) {
        return res.json(statusModel.success(courierOrder));
    } else {
        return res.json(statusModel.failed({message: "Shipping order does not exists."}));
    }
}

findByShippingOrderNo = async (req, res) => {
    const courierOrder = await CourierOrder.findOne({
        where: {
            orderNo: req.query.orderNo
        },
        attributes: {
            exclude: ["updatedBy", "updatedAt", "createdBy"]
        }
    });
    if (!courierOrder) {
        return res.json(statusModel.failed({message: "Shipping order does not exist."}));
    }

    return res.json(statusModel.success(courierOrder));
}

createShippingOrder = async (req, res) => {

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
    req.body.trackingNo = trackingNo;
    req.body.createdBy = req.userId;
    req.body.createdAt = new Date();

    req.body.senderLongitude = senderGeocodingData.longitude;
    req.body.senderLatitude = senderGeocodingData.latitude;
    req.body.senderFormattedAddress = senderGeocodingData.formattedAddress;

    req.body.recipientLongitude = recipientGeocodingData.longitude;
    req.body.recipientLatitude = recipientGeocodingData.latitude;
    req.body.recipientFormattedAddress = recipientGeocodingData.formattedAddress;

    req.body.isPickedUp = false;
    req.body.pickupOrderStatus = OrderStatusConstant.PENDING;

    CourierOrder.create(req.body).then(() => {
        return res.json(statusModel.success("Shipping order has been created."));
    }).catch(err => {
        return res.json(statusModel.failed({message: err.message}));
    });
}


const ShippingOrderController = {
    findAllShippingOrder: findAllShippingOrder,
    findShippingOrder: findShippingOrder,
    findByShippingOrderNo: findByShippingOrderNo,
    createShippingOrder: createShippingOrder
}

module.exports = ShippingOrderController;
