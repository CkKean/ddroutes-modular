const StatusModel = require("../../model/status.model");
const generateUniqueId = require("../../utils/unique-id.util");
const {OrderStatusConstant} = require("../../constant/order-status.constant");
const {Op} = require("sequelize");
const {UserTypeConstant} = require("../../constant/user-type.constant");
const {EmployeePositionConstant} = require("../../constant/employee-position.constant");
const OrderRoute = require("../../config/database").orderRoute;
const Vehicle = require("../../config/database").vehicle;
const CompanyAddress = require("../../config/database").companyAddress;
const User = require("../../config/database").user;
const CourierOrder = require("../../config/database").courierOrder;
const RouteReport = require("../../config/database").routeReport;
const TaskProof = require("../../config/database").taskProof;
const sequelize = require("../../config/database").sequelize;
const MapDirectionRoutingController = require("../map-direction-routing/map-direction-routing.controller");
const {
    getOrderTypeRouteId,
    sortOrder,
    getOrderListAddress,
    getOrderListAddressOnRoute,
    convertSecondToDHM
} = require("./order-route-helper");
const {OrderTypeConstant} = require("../../constant/order-type.constant");

const statusModel = new StatusModel();

findAll = async (req, res) => {
    const orderRoute = await OrderRoute.findAll({
        order: [
            ["createdAt", "DESC"]
        ],
        include: [{
            model: User,
            attributes: ["fullName"],
            as: 'personnelInfo'
        },
            {
                model: Vehicle,
                as: 'vehicleInfo',
                attributes: ["plateNo", "type"],
            }
        ],
    });

    const courierOrder = await CourierOrder.findAll({
        attributes:
            {exclude: ["orderId", "updatedBy", "updatedAt"]},
        order: [
            ["recipientPostcode", "ASC"]
        ],
        raw: true
    });
    const companyAddresses = await CompanyAddress.findAll({raw: true});
    const taskProofs = await TaskProof.findAll({raw: true});

    for (let route of orderRoute) {
        let completed = 0;
        let orderList = courierOrder.filter((order) => order.routeId === route.routeId || (route.routeId === order.pickupRouteId));
        const companyAddress = companyAddresses.filter(address => address.id === route.departurePoint)[0];
        // Sort Order
        let sortedOrderList = sortOrder(orderList, route.routeId);
        // Calculate Completed Order
        for (let order of orderList) {
            if (getOrderTypeRouteId(order, route.routeId) === 0) {
                if (order.pickupOrderStatus === OrderStatusConstant.COMPLETED || order.pickupOrderStatus === OrderStatusConstant.FAILED) {
                    completed++;
                }
            } else {
                if (order.orderStatus === OrderStatusConstant.COMPLETED || order.orderStatus === OrderStatusConstant.FAILED) {
                    completed++;
                }
            }

            let proof;
            if (order.orderType === OrderTypeConstant.PICK_UP) {
                if (order.isPickedUp && order.pickupRouteId === route.routeId) { // Success Pickup
                    if (order.pickupProofId) {
                        proof = taskProofs.filter((proof) => order.pickupProofId === proof.proofId)[0];
                    }
                } else if (!order.isPickedUp && order.routeId === route.routeId) { // Failed Pickup
                    if (order.pickupProofId) {
                        proof = taskProofs.filter((proof) => order.pickupProofId === proof.proofId)[0];
                    }
                } else if (order.isPickedUp && order.routeId === route.routeId) { // Pickup -> Success
                    if (order.proofId) {
                        proof = taskProofs.filter((proof) => order.proofId === proof.proofId)[0];
                    }
                }
            } else {
                if (order.proofId) {
                    proof = taskProofs.filter((proof) => order.proofId === proof.proofId)[0];
                }
            }
            order.proof = proof;
        }

        const displayOrderList = getOrderListAddressOnRoute(sortedOrderList, route.routeId);
        const orderListCount = displayOrderList.length;
        let totalServiceTime = orderListCount * (60 * 3); // 3 min service time
        let totalEstTimeUsed = +route.timeNeeded + +totalServiceTime;

        route.timeNeeded = convertSecondToDHM(totalEstTimeUsed);

        route.dataValues.completed = completed;
        route.dataValues.orderList = sortedOrderList;
        route.dataValues.departureAddress = companyAddress;
        route.dataValues.displayOrderList = displayOrderList;
    }

    return res.json(statusModel.success(orderRoute));
}


findOne = async (req, res) => {
    const orderRoute = await OrderRoute.findOne({
        where: {
            routeId: req.query.routeId
        },
        attributes: {
            exclude: ['createdBy', 'updatedBy']
        }
    });
    if (!orderRoute) {
        return res.json(statusModel.failed({message: "Order route does not exist."}));
    }
    return res.json(statusModel.success(orderRoute));
}

findRouteByStatus = async (req, res) => {

    // All Order Route
    const orderRoute = await OrderRoute.findAll({
        where: {
            status: req.query.status
        },
        attributes: ["routeId", "vehicleId"],
        raw: true
    });

    // All one type vehicle
    const vehicleType = await Vehicle.findAll({
        where: {
            type: req.query.vehicleType
        },
        raw: true
    });

    let matchedRoute = [];
    for (let route of orderRoute) {
        for (let vehicle of vehicleType) {
            if (route.vehicleId === vehicle.vehicleId) {
                matchedRoute.push(route);
            }
        }
    }

    return res.json(statusModel.success(matchedRoute));
}

updateOrderRoute = async (req, res) => {
    const routeId = req.body.routeId;
    const orderRoute = await verifyOrderRoute(routeId);

    if (orderRoute) {
        const deletedCourierOrder = req.body.orderDeletedList;
        const orderDeleteNoList = deletedCourierOrder.map(order => order.orderNo);

        const courierOrder = req.body.orderList;
        const totalItemsQty = courierOrder.map(order => order.itemQty).reduce((sum, order) => (sum + order), 0);
        let transaction;
        transaction = await sequelize.transaction();

        let companyAddress;
        if (req.body.departurePoint) {
            companyAddress = await CompanyAddress.findOne({where: {id: req.body.departurePoint}, raw: true});
        } else {
            return res.json(statusModel.failed({message: "Departure point is missing."}));
        }

        let tempCourierOrderList = getOrderListAddressOnRoute(courierOrder, routeId); // Get the required address only

        const totalDistanceModel = {
            orderList: tempCourierOrderList,
            companyAddress: companyAddress,
            roundTrip: req.body.roundTrip
        }

        const totalDistanceTime = await MapDirectionRoutingController.calcOrderTotalDistanceTime(totalDistanceModel);


        try {
            transaction = await sequelize.transaction();

            await OrderRoute.update({
                departurePoint: req.body.departurePoint,
                roundTrip: req.body.roundTrip,
                departureDate: req.body.departureDate,
                departureTime: req.body.departureTime,
                totalDistance: totalDistanceTime.totalDistance,
                timeNeeded: totalDistanceTime.totalDuration,
                personnel: req.body.personnel,
                vehicleId: req.body.vehicle,
                updatedAt: new Date(),
                updatedBy: req.userId
            }, {
                where: {
                    routeId: routeId
                },
                transaction: transaction
            });

            const data = {
                totalDistanceTime: totalDistanceTime,
                totalItemsQty: totalItemsQty,
                createdBy: req.userId,
                createdAt: new Date(),
                routeId: req.body.routeId
            };

            let promises = [];
            for (let i in courierOrder) {
                let newPromise = await CourierOrder.update({
                    sortId: +i + 1,
                    routeId: routeId
                }, {
                    where: {routeId: routeId},
                    transaction: transaction
                });
                promises.push(newPromise);
            }

            await updateRouteReport(data, transaction, res);
            await CourierOrder.update({
                    routeId: null,
                    sortId: null,
                }, {
                    where: {
                        orderNo: {
                            [Op.in]: orderDeleteNoList
                        }
                    },
                    transaction: transaction
                }
            );
            await Promise.all(promises);
            await transaction.commit();

            return res.json(statusModel.success("Order route has been updated."));

        } catch (err) {
            await transaction.rollback();
            console.log("Error : ", err.message);
            return res.json(statusModel.failed({message: "Order route failed to update."}));
        }
    } else {
        return res.json(statusModel.failed({message: "Order route does not exist."}));
    }
}

addOrdersToRoute = async (req, res) => {
    const orderRoute = await verifyOrderRoute(req.body.routeId);
    const routeId = req.body.routeId;

    if (orderRoute) {
        const orderList = req.body.orderList;
        if (orderList.length <= 0) {
            return res.json(statusModel.failed({message: "Orders is required."}));
        }

        let transaction;
        try {
            transaction = await sequelize.transaction();
            const courierOrder = await CourierOrder.findAll({
                where: {routeId: routeId},
                raw: true,
                order: [
                    ["sortId", "ASC"]
                ],
            });
            let latestSortId = courierOrder[courierOrder.length - 1].sortId;
            let promises = [];
            for (let i in orderList) {
                let newPromise = await CourierOrder.update({
                    sortId: +latestSortId + (+i + 1),
                    routeId: routeId
                }, {
                    where: {orderNo: orderList[i].orderNo},
                });
                promises.push(newPromise);
            }

            await Promise.all(promises).then(async (_) => {

                const courierOrderList = await CourierOrder.findAll({where: {routeId: routeId}, raw: true});

                if (courierOrderList) {
                    let sortedOrderList = sortOrder(courierOrderList, routeId);

                    let companyAddress;
                    if (orderRoute.departurePoint) {
                        companyAddress = await CompanyAddress.findOne({
                            where: {id: orderRoute.departurePoint},
                            raw: true
                        });
                    } else {
                        return res.json(statusModel.failed({message: "Departure point is missing."}));
                    }

                    const totalDistanceModel = {
                        orderList: getOrderListAddressOnRoute(sortedOrderList, routeId),
                        companyAddress: companyAddress,
                        roundTrip: orderRoute.roundTrip
                    };

                    let totalDistanceTime = await MapDirectionRoutingController.calcOrderTotalDistanceTime(totalDistanceModel);
                    const totalItemsQty = courierOrderList.map(order => order.itemQty).reduce((sum, order) => (sum + order), 0);

                    const data = {
                        totalDistanceTime: totalDistanceTime,
                        totalItemsQty: totalItemsQty,
                        updatedBy: req.userId,
                        updatedAT: new Date(),
                        routeId: routeId
                    };
                    await updateRouteReport(data, transaction, res);
                    await updateOrderRouteDistance(data, transaction, res);
                    await transaction.commit();

                    return res.json(statusModel.success("Order route have been updated."));
                }
            });
        } catch (err) {
            await transaction.rollback();
            return res.json(statusModel.failed({message: "Order route failed to update."}));
        }
    } else {
        return res.json(statusModel.failed({message: "Order route does not exist."}));
    }
}

deleteOrderRoute = async (req, res) => {
    const orderRoute = await verifyOrderRoute(req.query.routeId);
    const routeId = req.query.routeId;

    if (orderRoute) {
        let transaction;
        try {
            transaction = await sequelize.transaction();

            //Delivery Order
            await CourierOrder.update({
                    routeId: null, sortId: null, orderStatus: OrderStatusConstant.PENDING, estArriveTime: null
                }, {
                    where: {
                        [Op.and]: [
                            {routeId: routeId},
                            {orderType: OrderTypeConstant.DELIVERY}
                        ]
                    }, transaction: transaction
                }
            );

            // Pickup Order
            await CourierOrder.update({
                    routeId: null,
                    sortId: null,
                    pickupOrderStatus: OrderStatusConstant.PENDING,
                    estArriveTime: null

                }, {
                    where: {
                        [Op.and]: [
                            {routeId: routeId},
                            {orderType: OrderTypeConstant.PICK_UP},
                            {isPickedUp: false}
                        ]
                    }, transaction: transaction
                }
            );

            // Pickedup Order
            await CourierOrder.update({
                    routeId: null,
                    sortId: null,
                    orderStatus: OrderStatusConstant.PICKED_UP,
                    isPickedUp: true,
                    estArriveTime: null
                }, {
                    where: {
                        [Op.and]: [
                            {routeId: routeId},
                            {orderType: OrderTypeConstant.PICK_UP},
                            {isPickedUp: true}
                        ]
                    }, transaction: transaction
                }
            );

            await OrderRoute.destroy({where: {routeId: routeId}, transaction: transaction});
            await RouteReport.destroy({where: {routeId: routeId}, transaction: transaction});

            await transaction.commit();
            return res.json(statusModel.success("Order Route has been deleted."));

        } catch (err) {
            await transaction.rollback();
            return res.json(statusModel.failed({message: "Order Route failed to delete."}));
        }
    } else {
        return res.json(statusModel.failed({message: "Order route does not exist."}));
    }
}

createOrderRoute = async (req, res) => {
    const routeID = generateUniqueId("OR");

    let companyAddress;
    if (req.body.departurePoint) {
        companyAddress = await CompanyAddress.findOne({where: {id: req.body.departurePoint}, raw: true});
    } else {
        return res.json(statusModel.failed({message: "Departure point is missing."}));
    }

    const courierOrder = req.body.orderList;
    const orderNoList = courierOrder.map(order => order.orderNo);
    const totalItemsQty = courierOrder.map(order => order.itemQty).reduce((sum, order) => (sum + order), 0);


    for (let i in courierOrder) {
        courierOrder[i].sortId = +i + 1;
    }

    const totalDistanceModel = {
        orderList: getOrderListAddress(courierOrder),
        companyAddress: companyAddress,
        roundTrip: req.body.roundTrip
    }

    let transaction;
    try {
        transaction = await sequelize.transaction();
        let totalDistanceTime = await MapDirectionRoutingController.calcOrderTotalDistanceTime(totalDistanceModel);

        await OrderRoute.create({
            routeId: routeID,
            departurePoint: req.body.departurePoint,
            roundTrip: req.body.roundTrip,
            departureDate: req.body.departureDate,
            departureTime: req.body.departureTime,
            personnel: req.body.personnel,
            status: OrderStatusConstant.READY,
            timeNeeded: totalDistanceTime.totalDuration,
            totalDistance: totalDistanceTime.totalDistance,
            vehicleId: req.body.vehicle,
            createdAt: new Date(),
            createdBy: req.userId
        }, {transaction: transaction});

        const routeReportId = generateUniqueId("RR");
        await updateCourierOrderRouteId({orderNoList: orderNoList, routeId: routeID}, transaction, res);
        await RouteReport.create({
            routeReportId: routeReportId,
            totalItemsQty: totalItemsQty,
            calculatedDistanceTravel: totalDistanceTime.totalDistance,
            routeId: routeID,
            createdBy: req.userId,
            createdAt: new Date()
        }, {transaction: transaction});

        let promises = [];
        for (let order of courierOrder) {
            let newPromise = await CourierOrder.update({
                sortId: order.sortId,
                routeId: routeID
            }, {
                where: {orderNo: order.orderNo},
                transaction: transaction
            });
            promises.push(newPromise);
        }
        await Promise.all(promises);
        await transaction.commit();
        return res.json(statusModel.success("Order route have been created."));
    } catch (err) {
        await transaction.rollback();
        return res.json(statusModel.failed({message: "Order route failed to create."}));
    }
}

verifyOrderRoute = async (routeId) => {
    return await OrderRoute.findOne({
        where: {
            routeId: routeId
        },
        raw: true
    });
}

findCourierPersonnel = async (req, res) => {
    const courierPersonnelList = await User.findAll(
        {
            where: {
                [Op.and]: [
                    {userType: UserTypeConstant.S},
                    {
                        [Op.or]: [
                            {position: EmployeePositionConstant.CP},
                            {position: EmployeePositionConstant.CP_PT},
                        ]
                    }
                ]
            },
            order: [
                ['fullName', 'ASC']
            ],
            attributes: ['fullName', 'userId', "state"]
        }
    );
    let uniqueState = courierPersonnelList.map(personnel => personnel.state).filter((item, index, self) => self.indexOf(item) === index);

    let courierPersonnel = {};
    for (let state of uniqueState) {
        let personnelList = [];
        for (let personnel of courierPersonnelList) {
            if (personnel.state === state) {
                personnelList.push(personnel);
            }
        }
        courierPersonnel[state] = personnelList;
    }
    return res.json(statusModel.success(courierPersonnel));
}

findVehiclePersonnel = async (req, res) => {

    const vehicleType = req.query.vehicleType;
    const selectedDate = req.query.selectedDate;
    const routeId = req.query.routeId;
    const routeList = await OrderRoute.findAll({
        raw: true
    });

    const matchedRoute = [];

    for (let route of routeList) {
        if (route.departureDate.toLocaleDateString() === (new Date(selectedDate).toLocaleDateString())) {
            matchedRoute.push(route);
        }
    }
    const removeSelfRoute = matchedRoute.filter((route) => route.routeId !== routeId);
    const routeVehicleList = removeSelfRoute.map(route => route.vehicleId);
    const unavailablePersonnel = removeSelfRoute.map(route => route.personnel);

    const vehicleList = await Vehicle.findAll(
        {
            attributes: ["vehicleId", "plateNo", "owner", "type"],
            where: {
                [Op.and]: [
                    {type: vehicleType},
                    {
                        vehicleId: {
                            [Op.notIn]: routeVehicleList
                        }
                    },
                ]
            }
        }
    );

    const userList = await User.findAll({
        where: {
            [Op.or]: [
                {userType: UserTypeConstant.SA},
                {userType: UserTypeConstant.S},
            ]
        },
        attributes: ["userId", "fullName", "postcode", "city", "state"]
    });

    for (let vehicle of vehicleList) {
        vehicle.owner = userList.find(user => {
            return user.userId === vehicle.owner
        }).fullName;
    }
    let uniqueOwner = vehicleList.map(vehicle => vehicle.owner).filter((item, index, self) => self.indexOf(item) === index);

    let vehicles = {};
    for (let owner of uniqueOwner) {
        let v = [];
        for (let vehicle of vehicleList) {
            if (vehicle.owner === owner) {
                v.push(vehicle);
            }
        }
        vehicles[owner] = v;
    }

    const courierPersonnelList = await User.findAll(
        {
            where: {
                [Op.and]: [
                    {userType: UserTypeConstant.S},
                    {
                        [Op.or]: [
                            {position: EmployeePositionConstant.CP},
                            {position: EmployeePositionConstant.CP_PT},
                        ]
                    },
                    {
                        userId: {
                            [Op.notIn]: unavailablePersonnel
                        }
                    },
                ]
            },
            order: [
                ['fullName', 'ASC']
            ],
            attributes: ["userId", "fullName", "postcode", "city", "state"]
        }
    );
    let uniqueState = courierPersonnelList.map(personnel => personnel.state).filter((item, index, self) => self.indexOf(item) === index);
    let courierPersonnel = {};
    for (let state of uniqueState) {
        let personnelList = [];
        for (let personnel of courierPersonnelList) {
            if (personnel.state === state) {
                personnelList.push(personnel);
            }
        }
        courierPersonnel[state] = personnelList;
    }

    const result = {
        personnelList: courierPersonnel,
        vehicleList: vehicles
    }
    return res.json(statusModel.success(result));
}


findAllCompanyAddress = async (req, res) => {
    const companyAddressList = await CompanyAddress.findAll();

    let uniqueState = companyAddressList.map(address => address.state).filter((item, index, self) => self.indexOf(item) === index);
    let companyAddresses = {};

    for (let state of uniqueState) {
        let addressList = [];
        for (let companyAddress of companyAddressList) {
            if (companyAddress.state === state) {
                addressList.push(companyAddress);
            }
        }
        companyAddresses[state] = addressList;
    }
    return res.json(statusModel.success(companyAddresses));
}

findUnHandleOrders = async (req, res) => {
    const allCourierOrder = await CourierOrder.findAll({
        where: {
            [Op.or]: [
                {routeId: null},
                {routeId: ''},
            ],
        },
        order: [["createdAt", "DESC"]],
    });

    let courierOrderList = getOrderListAddress(allCourierOrder);
    let uniquePostcode = courierOrderList.map(order => order.recipientPostcode.trim()).filter((item, index, self) => self.indexOf(item) === index).sort();
    let uniqueState = courierOrderList.map(order => order.recipientState).filter((item, index, self) => self.indexOf(item) === index).sort();
    let uniqueVehicle = courierOrderList.map(order => order.vehicleType).filter((item, index, self) => self.indexOf(item) === index).sort();
    let uniqueCity = courierOrderList.map(order => order.recipientCity).filter((item, index, self) => self.indexOf(item) === index).sort();

    let unhandledOrderModel = {
        uniquePostcode: uniquePostcode,
        uniqueState: uniqueState,
        uniqueVehicle: uniqueVehicle,
        uniqueCity: uniqueCity,
        courierOrderList: courierOrderList
    }

    return res.json(statusModel.success(unhandledOrderModel));
}

manualOptimizeRoute = async (req, res) => {
    const {sortList, departurePoint, routeId} = req.body;

    const orderRoute = await verifyOrderRoute(routeId);
    const roundTrip = orderRoute.roundTrip;

    if (!orderRoute) {
        return res.json(statusModel.failed({message: "Order Route does not exist."}));
    }

    if (sortList.length > 0) {

        let companyAddress;
        if (departurePoint) {
            companyAddress = await CompanyAddress.findOne({where: {id: departurePoint}, raw: true});
        } else {
            return res.json(statusModel.failed({message: "Departure point is missing."}));
        }

        try {
            let transaction;
            transaction = await sequelize.transaction();

            let promises = [];
            for (let order of sortList) {
                let newPromise = CourierOrder.update({
                    sortId: order.sortId,
                }, {
                    where: {
                        [Op.and]: [
                            {routeId: routeId},
                            {orderNo: order.orderNo},
                        ]
                    },
                });
                promises.push(newPromise);
            }

            await Promise.all(promises).then(async (_) => {

                const totalDistanceModel = {
                    orderList: sortList,
                    companyAddress: companyAddress,
                    roundTrip: roundTrip
                };
                const totalDistanceTime = await MapDirectionRoutingController.calcOrderTotalDistanceTime(totalDistanceModel);
                const updatedData = {
                    totalDistanceTime: totalDistanceTime,
                    updatedBy: req.userId,
                    updatedAt: new Date(),
                    routeId: routeId
                }

                await updateOrderRouteDistance(updatedData, transaction, res);
                await updateRouteReportDistance(updatedData, transaction, res);
                await transaction.commit();
                return res.json(statusModel.success("Waypoints has been sorted."));
            });
        } catch (err) {
            await transaction.rollback();
            return res.json(statusModel.failed({message: "Waypoints failed to optimize."}));
        }
    } else {
        return res.json(statusModel.failed({message: "Waypoints does not exist."}));
    }
}

autoOptimizeRoute = async (req, res) => {
    const {sortList, departurePoint, routeId} = req.body;
    const orderRoute = await verifyOrderRoute(routeId);
    const roundTrip = orderRoute.roundTrip;

    if (!orderRoute) {
        return res.json(statusModel.failed({message: "Order route does not exist."}));
    }

    if (sortList.length > 0) {
        const orderNoList = sortList.map(sort => sort.orderNo);
        let courierOrders = await CourierOrder.findAll(
            {
                where:
                    {
                        orderNo: {[Op.in]: orderNoList}
                    },
                raw: true,
                order: [["sortId", "ASC"]]
            });

        let companyAddress;
        if (departurePoint) {
            companyAddress = await CompanyAddress.findOne({where: {id: departurePoint}, raw: true});
        } else {
            return res.json(statusModel.failed({message: "Departure point is missing."}));
        }
        let correctedOrderList = getOrderListAddressOnRoute(courierOrders, routeId);

        const optimizeModel = {
            orderList: correctedOrderList,
            companyAddress: companyAddress,
            roundTrip: roundTrip,
        };

        // //     // ------------------------------------------ Optimize Route ----------------------------------------------------------
        const result = await MapDirectionRoutingController.optimizeRoute(optimizeModel);
        if (!result.optimizeStatus) {
            return res.json(statusModel.failed({message: "Waypoints failed to optimize. Please try again later."}));
        }
        courierOrders = setSortIds(courierOrders, result.wayPoints);
        //     // ------------------------------------------ Calculate Route Distance ----------------------------------------------------------
        let sortedOrderList = sortOrder(courierOrders, routeId);

        let correctedAddressOrderList = getOrderListAddressOnRoute(sortedOrderList, routeId);
        const totalDistanceModel = {
            orderList: correctedAddressOrderList,
            companyAddress: companyAddress,
            roundTrip: roundTrip
        };

        const totalDistanceTime = await MapDirectionRoutingController.calcOrderTotalDistanceTime(totalDistanceModel);
        const updatedData = {
            totalDistanceTime: totalDistanceTime,
            updatedBy: req.userId,
            updatedAt: new Date(),
            routeId: routeId
        }

        // // ------------------------------------------ Update SQL ----------------------------------------------------------
        let transaction;
        try {
            transaction = await sequelize.transaction();
            OrderRoute.update({
                timeNeeded: totalDistanceTime.totalDuration,
                totalDistance: totalDistanceTime.totalDistance,
                updatedAt: new Date(),
                updatedBy: req.userId
            }, {
                where: {routeId: routeId}, transaction: transaction
            });

            await updateRouteReportDistance(updatedData, transaction, res);
            let promises = [];
            for (let order of courierOrders) {
                let newPromise = CourierOrder.update({
                    sortId: order.sortId
                }, {
                    where: {
                        [Op.and]: [
                            {routeId: routeId},
                            {orderNo: order.orderNo},
                        ]
                    },
                    transaction: transaction
                });
                promises.push(newPromise);
            }

            await Promise.all(promises);
            await transaction.commit();
            return res.json(statusModel.success("Waypoints has been optimized."));
        } catch (err) {
            await transaction.rollback();
            return res.json(statusModel.failed({message: "Waypoints failed to optimize."}));
        }
    } else {
        return res.json(statusModel.failed({message: "Waypoints does not exist."}));
    }
}

setSortIds = (courierOrders, wayPoints) => {
    for (let orderIndex in courierOrders) {
        for (let waypointIndex in wayPoints) {
            let index = parseInt(waypointIndex) + 1;
            if (orderIndex === waypointIndex) {
                courierOrders[parseInt(orderIndex)].sortId = parseInt(wayPoints[index].waypoint_index);
            }
        }
    }
    return courierOrders;
}

updateOrderRouteDistance = async (data, transaction) => {

    await OrderRoute.update({
        timeNeeded: data.totalDistanceTime.totalDuration,
        totalDistance: data.totalDistanceTime.totalDistance,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt
    }, {
        where: {
            routeId: data.routeId,
        },
        transaction: transaction
    });
}

updateRouteReportDistance = async (data, transaction) => {
    await RouteReport.update({
        calculatedDistanceTravel: data.totalDistanceTime.totalDistance,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt
    }, {
        where: {
            routeId: data.routeId,
        },
        transaction: transaction
    });
};

updateRouteReport = async (data, transaction) => {
    await RouteReport.update({
        calculatedDistanceTravel: data.totalDistanceTime.totalDistance,
        totalItemQty: data.totalItemQty,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt
    }, {
        where: {
            routeId: data.routeId,
        },
        transaction: transaction
    });
};


updateCourierOrder = async (orderNoList, transaction, routeId, res) => {

}


updateCourierOrderRouteId = async (data, transaction) => {
    await CourierOrder.update({
            routeId: data.routeId
        }, {
            where: {
                orderNo: {
                    [Op.in]: data.orderNoList
                }
            },
            transaction: transaction
        }
    );
}

const OrderRouteController = {
    findAll: findAll,
    findOne: findOne,
    findRouteByStatus: findRouteByStatus,
    findCourierPersonnel: findCourierPersonnel,
    findVehiclePersonnel: findVehiclePersonnel,
    findUnHandleOrders: findUnHandleOrders,
    findAllCompanyAddress: findAllCompanyAddress,
    updateOrderRoute: updateOrderRoute,
    createOrderRoute: createOrderRoute,
    deleteOrderRoute: deleteOrderRoute,
    addOrdersToRoute: addOrdersToRoute,
    manualOptimizeRoute: manualOptimizeRoute,
    autoOptimizeRoute: autoOptimizeRoute
};

module.exports = OrderRouteController;

