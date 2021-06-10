const StatusModel = require("../../model/status.model");
const {OrderTypeConstant} = require("../../constant/order-type.constant");
const {OrderStatusConstant} = require("../../constant/order-status.constant");
const {Op} = require("sequelize");
const CourierOrder = require("../../config/database").courierOrder;
const OrderRoute = require("../../config/database").orderRoute;
const TaskProof = require("../../config/database").taskProof;
const statusModel = new StatusModel();

findAllByTrackingOrderNo = async (req, res) => {

    const courierOrder = await CourierOrder.findOne({
        where: {
            [Op.or]: [
                {trackingNo: req.query.trackingOrderNo},
                {orderNo: req.query.trackingOrderNo},
            ]
        }, raw: true
    });

    if (courierOrder) {
        let orderPlacedAt = courierOrder.createdAt;
        // Pickup
        let orderComingAt = null;
        let orderPickedAt = null;
        // Delivery
        let orderShippedAt = null;
        let orderReceivedAt = null;

        let orderCompletedAt = null;

        let deliveryReason = null;
        let pickupReason = null;

        let step = 1;

        if (courierOrder.orderType === OrderTypeConstant.PICK_UP) {
            let pickupOrderRoute;
            if (!courierOrder.isPickedUp && courierOrder.pickupOrderStatus !== OrderStatusConstant.COMPLETED) {
                pickupOrderRoute = await OrderRoute.findOne({
                    where: {
                        routeId: courierOrder.routeId
                    },
                    raw: true
                });
            } else if (courierOrder.isPickedUp && courierOrder.pickupOrderStatus === OrderStatusConstant.COMPLETED) {
                pickupOrderRoute = await OrderRoute.findOne({
                    where: {
                        routeId: courierOrder.pickupRouteId
                    },
                    raw: true
                });
            }

            if (pickupOrderRoute) {
                const pickUpTaskProof = await TaskProof.findOne({
                    where: {proofId: courierOrder.pickupProofId},
                    raw: true
                });
                if (pickupOrderRoute.status === OrderStatusConstant.IN_PROGRESS) {
                    orderShippedAt = pickupOrderRoute.startedAt;
                    step = 2;
                }
                if (pickUpTaskProof) {
                    if (pickUpTaskProof.status === OrderStatusConstant.NOT_PICK_UP) {
                        pickupReason = pickUpTaskProof.reason;
                    } else {
                        orderPickedAt = pickUpTaskProof.pickedAt;
                    }
                    step = 3;
                }
            }

            if (courierOrder.isPickedUp) {
                const deliveryOrderRoute = await OrderRoute.findOne({
                    where: {
                        routeId: courierOrder.routeId
                    },
                    raw: true
                });
                if (deliveryOrderRoute) {
                    const deliveryTaskProof = await TaskProof.findOne({
                        where: {proofId: courierOrder.proofId},
                        raw: true
                    });
                    if (deliveryOrderRoute.status === OrderStatusConstant.IN_PROGRESS) {
                        orderShippedAt = deliveryOrderRoute.startedAt;
                        step = 4;
                    }
                    if (deliveryTaskProof) {
                        if (deliveryTaskProof.status === OrderStatusConstant.NOT_DELIVERED) {
                            deliveryReason = deliveryTaskProof.reason;
                        } else {
                            orderReceivedAt = deliveryTaskProof.receivedAt;
                            orderCompletedAt = deliveryTaskProof.createdAt;
                        }
                        step = 6;
                    }
                }

            }
        } else if (courierOrder.orderType === OrderTypeConstant.DELIVERY) {
            const deliveryOrderRoute = await OrderRoute.findOne({
                where: {
                    routeId: courierOrder.routeId
                },
                raw: true
            });

            if (deliveryOrderRoute) {
                const deliveryTaskProof = await TaskProof.findOne({where: {proofId: courierOrder.proofId}, raw: true});

                if (deliveryOrderRoute.status === OrderStatusConstant.IN_PROGRESS) {
                    orderShippedAt = deliveryOrderRoute.startedAt;
                    step = 2;
                }

                if (deliveryTaskProof) {
                    if (deliveryTaskProof.status === OrderStatusConstant.NOT_DELIVERED) {
                        deliveryReason = deliveryTaskProof.reason;
                        step = 3;
                    } else {
                        orderReceivedAt = deliveryTaskProof.receivedAt;
                        orderCompletedAt = deliveryTaskProof.createdAt;
                        step = 4;
                    }
                }
            }
        }

        let trackingData = {
            orderStatus: courierOrder.orderStatus, // Pending, In progress, Completed
            trackingNo: courierOrder.trackingNo,
            orderType: courierOrder.orderType,
            orderNo: courierOrder.orderNo,
            isPickedUp: courierOrder.isPickedUp,
            pickupOrderStatus: courierOrder.pickupOrderStatus,
            step: step,
            pickupReason: pickupReason,
            deliveryReason: deliveryReason,
            orderPlacedAt: orderPlacedAt,
            orderShippedAt: orderShippedAt,
            orderComingAt: orderComingAt,
            orderReceivedAt: orderReceivedAt,
            orderPickedAt: orderPickedAt,
            orderCompletedAt: orderCompletedAt
        };

        return res.json(statusModel.success(trackingData));

    } else {
        return res.json(statusModel.failed({message: "Shipping order does not exist."}));
    }
}

const TrackingController = {
    findAllByTrackingOrderNo: findAllByTrackingOrderNo
};

module.exports = TrackingController;
