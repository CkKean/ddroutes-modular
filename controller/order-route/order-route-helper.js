const {OrderTypeConstant} = require("../../constant/order-type.constant");

sortOrder = (orderList, belongToRouteId) => {
    let sortedOrderList = [];

    for (let i = 1; i < (orderList.length + 1); i++) {
        for (let order of orderList) {
            if (order.orderType === OrderTypeConstant.PICK_UP) {
                if (order.isPickedUp) {
                    if (order.routeId === belongToRouteId) { // pickup -> delivery
                        if (order.sortId === i) {
                            sortedOrderList.push(order);
                        }
                    } else if (order.pickupRouteId === belongToRouteId) { // Get Pick up order information
                        if (order.pickupSortId === i) {
                            sortedOrderList.push(order);
                        }
                    }
                } else { // Pick up order
                    if (order.routeId === belongToRouteId) {
                        if (order.sortId === i) {
                            sortedOrderList.push(order);
                        }
                    }
                }
            } else {
                if (order.sortId === i) {
                    sortedOrderList.push(order);
                }
            }
        }
    }

    const unsortedOrder = orderList.filter((allOrder) =>
        !sortedOrderList.some((order) => order.orderNo === allOrder.orderNo)
    );
    sortedOrderList.push(...unsortedOrder);
    return sortedOrderList;
}

getOrderTypeRouteId = (order, routeId) => {
    // 0 = pickup status
    // 1 = status
    if (order.orderType === OrderTypeConstant.PICK_UP) {
        if (order.isPickedUp) {
            if (order.pickupRouteId === routeId) {
                return 0;
            } else {
                return 1;
            }
        } else {
            return 0;
        }
    } else {
        return 1;
    }
}


// For order list only
getOrderListAddress = (courierOrderList) => {
    let orderList = [];
    for (let order of courierOrderList) {
        let orderBasicInfo = getOrderBasicInfo(order);
        let displayOrderType = order.orderType;

        if (getOrderType(order.orderType, order.isPickedUp) === 0) {
            orderList.push({
                ...orderBasicInfo,
                ...getOrderSenderInfo(order),
                displayOrderType: displayOrderType,
            });
        } else {
            if (order.orderType === OrderTypeConstant.PICK_UP && order.isPickedUp) {
                displayOrderType = displayOrderType + ' -> ' + OrderTypeConstant.DELIVERY;
            }
            orderList.push({
                ...orderBasicInfo,
                ...getOrderRecipientInfo(order),
                displayOrderType: displayOrderType,


            });
        }
    }
    return orderList;
}

// For order with route
getOrderListAddressOnRoute = (courierOrderList, routeId) => {
    let orderList = [];
    for (let order of courierOrderList) {
        let orderBasicInfo = getOrderBasicInfo(order);
        let senderAddress = {...orderBasicInfo, ...getOrderSenderInfo(order)};
        let recipientAddress = {...orderBasicInfo, ...getOrderRecipientInfo(order)};

        if (order.orderType === OrderTypeConstant.PICK_UP) {
            if (!order.isPickedUp) {
                senderAddress.displayOrderType = order.orderType;
                senderAddress.displayOrderStatus = order.pickupOrderStatus;
                senderAddress.displayMobileOrderType = order.orderType;
                senderAddress.displayMobileNo = order.senderMobileNo;
                orderList.push(senderAddress); // pickup order
            } else {
                if (order.pickupRouteId === routeId) {
                    senderAddress.displayOrderType = order.orderType;
                    senderAddress.displayOrderStatus = order.pickupOrderStatus;
                    senderAddress.displayMobileOrderType = order.orderType;
                    senderAddress.displayMobileNo = order.senderMobileNo;

                    orderList.push(senderAddress); // pickup order
                } else {
                    recipientAddress.displayOrderType = (order.orderType + ' -> ' + OrderTypeConstant.DELIVERY);
                    recipientAddress.displayMobileOrderType = OrderTypeConstant.DELIVERY;
                    recipientAddress.displayOrderStatus = order.orderStatus;
                    recipientAddress.displayMobileNo = order.recipientMobileNo;

                    orderList.push(recipientAddress); // picked up order
                }
            }
        } else {
            recipientAddress.displayOrderType = order.orderType;
            recipientAddress.displayOrderStatus = order.orderStatus;
            recipientAddress.displayMobileOrderType = order.orderType;
            recipientAddress.displayMobileNo = order.recipientMobileNo;

            orderList.push(recipientAddress);
        }
    }

    return orderList;
}

getOrderType = (orderType, isPickedUp) => {
    // 0 = sender, pickupStatus
    // 1 = recipient, orderStatus
    if (orderType === OrderTypeConstant.PICK_UP) {
        if (!isPickedUp) {
            return 0;
        } else {
            return 1;
        }
    } else {
        return 1;
    }
}

getOrderBasicInfo = (order) => {
    return {
        routeId: order.routeId,
        orderNo: order.orderNo,
        orderId: order.orderId,
        createdAt: order.createdAt,
        orderType: order.orderType,
        orderStatus: order.orderStatus,
        pickupOrderStatus: order.pickupOrderStatus,
        pickupRouteId: order.pickupRouteId,
        vehicleType: order.vehicleType,
        isPickedUp: order.isPickedUp,
        trackingNo: order.trackingNo,
        itemQty: order.itemQty,
        itemWeight: order.itemWeight,
    };
}

getOrderRecipientInfo = (order) => {
    return {
        recipientName: order.recipientName,
        recipientAddress: order.recipientAddress,
        recipientCity: order.recipientCity,
        recipientState: order.recipientState,
        recipientPostcode: order.recipientPostcode,
        recipientLongitude: order.recipientLongitude,
        recipientLatitude: order.recipientLatitude,
    };
}

getOrderSenderInfo = (order) => {
    return {
        recipientName: order.senderName ? order.senderName : order.recipientName,
        recipientAddress: order.senderAddress ? order.senderAddress : order.recipientAddress,
        recipientCity: order.senderCity ? order.senderCity : order.recipientCity,
        recipientState: order.senderState ? order.senderState : order.recipientState,
        recipientPostcode: order.senderPostcode ? order.senderPostcode : order.recipientPostcode,
        recipientLongitude: order.senderLongitude ? order.senderLongitude : order.recipientLongitude,
        recipientLatitude: order.senderLatitude ? order.senderLatitude : order.recipientLatitude,
    };
}

convertSecondToDHM = (seconds) => {
    let d = Math.floor(+seconds / (3600 * 24));
    let h = Math.floor(+seconds % (3600 * 24) / 3600);
    let m = Math.floor(+seconds % 3600 / 60);

    let dDisplay = d > 0 ? d + (d == 1 ? " day" : " days") : "";
    let hDisplay = h > 0 ? h + (h == 1 ? ", hour, " : ", hours ") : "";
    let mDisplay = m > 0 ? m + (m == 1 ? " , minute " : ", minutes ") : "";

    let hms = dDisplay + hDisplay + mDisplay;
    return hms;
}


module.exports = {
    getOrderTypeRouteId,
    sortOrder,
    getOrderListAddress,
    getOrderListAddressOnRoute,
    getOrderType,
    convertSecondToDHM
}
