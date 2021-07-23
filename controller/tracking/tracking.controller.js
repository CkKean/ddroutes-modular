const StatusModel = require("../../model/status.model");
const {OrderTypeConstant} = require("../../constant/order-type.constant");
const {OrderStatusConstant} = require("../../constant/order-status.constant");
const {Op} = require("sequelize");
const CourierOrder = require("../../config/database").courierOrder;
const OrderRoute = require("../../config/database").orderRoute;
const TaskProof = require("../../config/database").taskProof;
const statusModel = new StatusModel();
const {
    sortOrder,
} = require("../order-route/order-route-helper");

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
        let orderEstComingAt = null;
        let orderPickedAt = null;
        // Delivery
        let orderShippedAt = null;
        let orderEstShippedAt = null;
        let orderReceivedAt = null;

        let orderCompletedAt = null;

        let deliveryReason = null;
        let pickupReason = null;

        let step = 1;

        if (courierOrder.orderType === OrderTypeConstant.PICK_UP) {

            let pickupOrderRoute;
            let pickUpRouteId;

            if (!courierOrder.isPickedUp) {
                pickUpRouteId = courierOrder.routeId;
                pickupOrderRoute = await OrderRoute.findOne({
                    where: {
                        routeId: courierOrder.routeId
                    },
                    raw: true
                });
            } else if (courierOrder.isPickedUp) {
                pickUpRouteId = courierOrder.pickupRouteId;
                pickupOrderRoute = await OrderRoute.findOne({
                    where: {
                        routeId: courierOrder.pickupRouteId
                    },
                    raw: true
                });
            }

            // Get Pick Up Data Only
            if (pickupOrderRoute) {
                const allCourierOrder = await CourierOrder.findAll({
                    where: {
                        [Op.or]: [
                            {routeId: pickUpRouteId},
                            {pickupRouteId: pickUpRouteId},
                        ]
                    },
                    order: [['sortId', 'ASC']],
                    raw: true
                });

                let sortedCourierOrder = sortOrder(allCourierOrder, pickupOrderRoute.routeId);
                const pickUpTaskProof = await TaskProof.findOne({
                    where: {proofId: courierOrder.pickupProofId},
                    raw: true
                });
                orderComingAt = pickupOrderRoute.startedAt;
                console.log(orderComingAt.toLocaleString());
                if (pickupOrderRoute.status === OrderStatusConstant.IN_PROGRESS) {
                    step = 2;
                    orderEstComingAt = getTotalEstTime(orderComingAt, sortedCourierOrder, courierOrder);
                    console.log(orderEstComingAt.toLocaleString());

                }
                if (pickUpTaskProof) {
                    if (pickUpTaskProof.status === OrderStatusConstant.NOT_PICK_UP) {
                        pickupReason = pickUpTaskProof.reason;
                    } else {
                        orderPickedAt = pickUpTaskProof.pickedAt;
                    }
                    orderEstComingAt = null;
                    step = 3;
                }
            }

            if (courierOrder.isPickedUp) {
                let deliveryRouteId = courierOrder.routeId;

                const deliveryOrderRoute = await OrderRoute.findOne({
                    where: {
                        routeId: deliveryRouteId
                    },
                    raw: true
                });
                const allCourierOrder = await CourierOrder.findAll({
                    where: {
                        [Op.or]: [
                            {routeId: deliveryRouteId},
                            {pickupRouteId: deliveryRouteId},
                        ]
                    },
                    order: [['sortId', 'ASC']],
                    raw: true
                });

                if (deliveryOrderRoute) {
                    const deliveryTaskProof = await TaskProof.findOne({
                        where: {proofId: courierOrder.proofId},
                        raw: true
                    });
                    orderShippedAt = deliveryOrderRoute.startedAt;
                    if (deliveryOrderRoute.status === OrderStatusConstant.IN_PROGRESS) {
                        let sortedCourierOrder = sortOrder(allCourierOrder, pickupOrderRoute.routeId);
                        orderEstShippedAt = getTotalEstTime(orderShippedAt, sortedCourierOrder, courierOrder);
                        orderEstComingAt = null;
                        step = 4;
                    }
                    if (deliveryTaskProof) {
                        if (deliveryTaskProof.status === OrderStatusConstant.NOT_DELIVERED) {
                            deliveryReason = deliveryTaskProof.reason;
                        } else {
                            orderReceivedAt = deliveryTaskProof.receivedAt;
                            orderCompletedAt = deliveryTaskProof.createdAt;
                        }
                        orderEstShippedAt = null;
                        orderEstComingAt = null;
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
                const allCourierOrder = await CourierOrder.findAll({
                    where: {
                        [Op.or]: [
                            {routeId: deliveryOrderRoute.routeId},
                            {pickupRouteId: deliveryOrderRoute.routeId},
                        ]
                    },
                    order: [['sortId', 'ASC']],
                    raw: true
                });
                let sortedCourierOrder = sortOrder(allCourierOrder, deliveryOrderRoute.routeId);

                const deliveryTaskProof = await TaskProof.findOne({where: {proofId: courierOrder.proofId}, raw: true});
                orderShippedAt = deliveryOrderRoute.startedAt;
                if (deliveryOrderRoute.status === OrderStatusConstant.IN_PROGRESS) {
                    orderEstShippedAt = getTotalEstTime(orderShippedAt, sortedCourierOrder, courierOrder);
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
                    orderEstShippedAt = null;
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
            orderEstShippedAt: orderEstShippedAt,
            orderComingAt: orderComingAt,
            orderEstComingAt: orderEstComingAt,
            orderReceivedAt: orderReceivedAt,
            orderPickedAt: orderPickedAt,
            orderCompletedAt: orderCompletedAt
        };

        return res.json(statusModel.success(trackingData));

    } else {
        return res.json(statusModel.failed({message: "Shipping order does not exist."}));
    }
}

getTotalEstTime = (startTime, sortedCourierOrder, courierOrder) => {

    // Two condition: Start After Break Time or Start Before Break Time - Break time (12 PM - 1PM)
    // -------------------------------------------
    // Case Start Before Break Time:
    // Start Time + CourierOrder Est Time + Accumulate Order Est Time = ETA
    // After Break Time:
    // Start Time + CourierOrder Est Time + Accumulate Order Est Time + 3600s (1 Hour break) = ETA for the rest of courier order
    // -------------------------------------------
    // -------------------------------------------
    // Case Start After Break Time:
    // Start Time + CourierOrder Est Time + Accumulate Order Est Time = ETA
    // -------------------------------------------

    let breakTime = new Date(startTime).setHours(12, 0, 0); // Break Time
    let afterBreakTime = new Date(startTime).setHours(13, 0, 0); // After Break Time

    let totalEstArriveTime = 0;

    let startTimeSecond = convertDateTimeToSecond(new Date(startTime));
    let courierOrderEstTimeSecond = courierOrder.estArriveTime;

    let arrivalDateTime

    if (startTime >= breakTime) { // After 12-1pm then start the route
        for (let i in sortedCourierOrder) {
            if (sortedCourierOrder[i].orderNo !== courierOrder.orderNo) {
                totalEstArriveTime = totalEstArriveTime + sortedCourierOrder[i].estArriveTime;
            } else {
                break;
            }
        }

        arrivalDateTime = new Date((startTimeSecond + totalEstArriveTime + courierOrderEstTimeSecond) * 1000);
    } else { // Before 12 pm start

        for (let i in sortedCourierOrder) {
            if (sortedCourierOrder[i].orderNo !== courierOrder.orderNo) {
                totalEstArriveTime += sortedCourierOrder[i].estArriveTime;
            } else {
                break;
            }
        }
        arrivalDateTime = new Date((startTimeSecond + courierOrderEstTimeSecond + totalEstArriveTime) * 1000); // Current Order Estimated Arrive Time

        if (arrivalDateTime >= new Date(breakTime)) {
            arrivalDateTime = new Date((startTimeSecond + courierOrder.estArriveTime + totalEstArriveTime + 3600) * 1000); // After 12 pm, add 1 hour break time
        }
    }
    return arrivalDateTime;
}

convertDateTimeToSecond = (dateTime) => {
    return new Date((dateTime)).getTime() / 1000;
}

convertMsToSecond = (milliSecond) => {
    return milliSecond / 1000;
}

const TrackingController = {
    findAllByTrackingOrderNo: findAllByTrackingOrderNo
};

module.exports = TrackingController;
