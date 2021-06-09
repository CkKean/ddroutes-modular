const StatusModel = require("../../model/status.model");
const generateUniqueId = require("../../utils/unique-id.util");
const generateDateTime = require("../../utils/unique-date-time.util");
const {OrderStatusConstant} = require("../../constant/order-status.constant");
const TaskProof = require("../../config/database").taskProof;
const CourierOrder = require("../../config/database").courierOrder;
const OrderRoute = require("../../config/database").orderRoute;
const CompanyAddress = require("../../config/database").companyAddress;
const Vehicle = require("../../config/database").vehicle;
const {OrderTypeConstant} = require("../../constant/order-type.constant");
const statusModel = new StatusModel();
const multer = require("multer");
const sequelize = require("../../config/database").sequelize;
const {Op} = require("sequelize");
const {
    getOrderTypeRouteId,
    sortOrder,
    getOrderListAddressOnRoute
} = require("../order-route/order-route-helper");

createFailedTaskProof = async (req, res) => {
    const taskProof = req.body;
    const userId = req.userId;

    if (taskProof.status === OrderStatusConstant.PICKED_UP || taskProof.status === OrderStatusConstant.DELIVERED) {
        return res.json(statusModel.failed({message: "Task status is not match."}));
    }
    const courierOrder = await CourierOrder.findOne({where: {orderNo: taskProof.orderNo}, raw: true});
    if (!courierOrder) {
        return res.json(statusModel.failed({message: "Courier order does not exists."}));
    }

    const taskProofId = generateUniqueId("TP");

    let courierUpdate;

    taskProof.courierPersonnelId = userId;
    taskProof.proofId = taskProofId;
    taskProof.createdAt = new Date();
    taskProof.createdBy = userId;

    if (courierOrder.orderType === OrderTypeConstant.PICK_UP) {
        if (taskProof.status === OrderStatusConstant.NOT_PICK_UP) {
            if (!courierOrder.isPickedUp) { // Mean have not pick up
                courierUpdate = {
                    pickupOrderStatus: OrderStatusConstant.FAILED,
                    pickupProofId: taskProofId
                };
            } else { // Mean picked up and waiting for delivery
                courierUpdate = {
                    orderStatus: OrderStatusConstant.FAILED,
                    proofId: taskProofId
                };
            }
        }
    } else if (courierOrder.orderType === OrderTypeConstant.DELIVERY) {
        if (taskProof.status === OrderStatusConstant.NOT_DELIVERED) {
            courierUpdate = {orderStatus: OrderStatusConstant.FAILED, proofId: taskProofId}; // order status
        }
    } else {
        return res.json(statusModel.failed({message: "Order type is missing."}));
    }
    await createTaskProofService(courierUpdate, courierOrder.orderNo, taskProof, res);

    await checkFinishTask(taskProof.routeId, userId, res);
};

createTaskProofWithImage = async (req, res) => {

    const taskProof = JSON.parse(req.body.taskProof);

    const file = req.file;
    if (taskProof.status === OrderStatusConstant.NOT_PICK_UP || taskProof.status === OrderStatusConstant.NOT_DELIVERED) {
        return res.json(statusModel.failed({message: "Task status is not match."}));
    }
    const courierOrder = await CourierOrder.findOne({where: {orderNo: taskProof.orderNo}, raw: true});
    if (!courierOrder) {
        return res.json(statusModel.failed({message: "Courier order does not exists."}));
    }

    if (file) {
        taskProof.signature = req.file.filename;
        taskProof.signaturePath = '/' + req.file.destination.split('/')[1];
    }
    const taskProofId = generateUniqueId("TP");
    const userId = req.userId;

    let courierUpdate;
    taskProof.courierPersonnelId = userId;
    taskProof.proofId = taskProofId;
    taskProof.createdAt = new Date();
    taskProof.createdBy = userId;

    if (courierOrder.orderType === OrderTypeConstant.PICK_UP) {
        if (courierOrder.isPickedUp) {
            taskProof.receivedAt = new Date();
            courierUpdate = {proofId: taskProofId, orderStatus: OrderStatusConstant.COMPLETED};
        } else {
            taskProof.pickedAt = new Date();
            courierUpdate = {
                orderStatus: OrderStatusConstant.PICKED_UP,
                isPickedUp: true,
                pickupOrderStatus: OrderStatusConstant.COMPLETED,
                pickupProofId: taskProofId,
                pickupSortId: courierOrder.sortId,
                pickupRouteId: courierOrder.routeId,
                proofId: null,
                sortId: null,
                routeId: null
            };
        }
    } else if (courierOrder.orderType === OrderTypeConstant.DELIVERY) {
        if (taskProof.status === OrderStatusConstant.DELIVERED) {
            taskProof.receivedAt = new Date();
            courierUpdate = {proofId: taskProofId, orderStatus: OrderStatusConstant.COMPLETED};
        }
    } else {
        return res.json(statusModel.failed({message: "Order type is missing."}));
    }
    await createTaskProofService(courierUpdate, courierOrder.orderNo, taskProof, res);
    await checkFinishTask(taskProof.routeId, userId, res);

}

createTaskProofService = async (courierUpdate, orderNo, taskProof, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();

        await TaskProof.create(taskProof, {transaction: transaction});
        await CourierOrder.update(courierUpdate, {where: {orderNo: orderNo}, transaction: transaction});
        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        return res.json(statusModel.failed({message: "Failed to submit."}));
    }
}

checkFinishTask = async (routeId, userId, res) => {
    const orderList = await CourierOrder.findAll({
        where: {
            [Op.or]: [
                {routeId: routeId},
                {pickupRouteId: routeId},
            ]
        }
    });
    let completed = 0;
    for (let order of orderList) {
        if (getOrderTypeRouteId(order, routeId) === 0) {
            if (order.pickupOrderStatus === OrderStatusConstant.COMPLETED || order.pickupOrderStatus === OrderStatusConstant.FAILED) {
                completed++;
            }
        } else {
            if (order.orderStatus === OrderStatusConstant.COMPLETED || order.orderStatus === OrderStatusConstant.FAILED) {
                completed++;
            }
        }
    }

    if (completed === orderList.length) {
        await OrderRoute.update({
            status: OrderStatusConstant.COMPLETED,
            updatedBy: userId,
            updatedAt: new Date()
        }, {
            where: {
                routeId: routeId
            }
        });
    }

    return res.json(statusModel.success("Submitted successfully."));
}

getRouteAndTasks = async (req, res) => {
    const userId = req.userId;
    const orderRoute = await OrderRoute.findAll({
        where: {personnel: userId},
        raw: true,
        order: [["departureDate", "DESC"]],
        include: [{
            model: Vehicle,
            attributes: ["plateNo"],
            as: 'vehicleInfo'
        }],
    });
    if (!orderRoute) {
        return res.json(statusModel.failed({message: "No orders currently."}));
    }
    const routeIds = orderRoute.map(route => route.routeId);
    const companyAddresses = await CompanyAddress.findAll({raw: true});
    const courierOrder = await CourierOrder.findAll(
        {
            where: {
                [Op.or]: [{routeId: {[Op.in]: routeIds}},
                    {pickupRouteId: {[Op.in]: routeIds}},
                ]
            },
            order: [["sortId", "ASC"]],
            raw: true
        }
    );


    for (let route of orderRoute) {
        let orderList = courierOrder.filter(order => {
            return (route.routeId === order.routeId) || (route.routeId === order.pickupRouteId);
        });
        let sortedOrderList = sortOrder(orderList, route.routeId);
        route.orderList = sortedOrderList;
        route.companyAddress = companyAddresses.filter(address => {
            return address.id === route.departurePoint;
        })[0];
        route.vehiclePlateNo = route['vehicleInfo.plateNo'];
        route.displayOrderList = getOrderListAddressOnRoute(sortedOrderList, route.routeId);
    }
    return res.json(statusModel.success(orderRoute));
};

orderRouteStart = async (req, res) => {
    const routeId = req.query.routeId;

    let transaction;
    try {
        transaction = await sequelize.transaction();

        await OrderRoute.update(
            {status: OrderStatusConstant.IN_PROGRESS, startedAt: new Date()},
            {where: {routeId: routeId}, transaction: transaction},
        );
        // Pickup order
        await CourierOrder.update(
            {pickupOrderStatus: OrderStatusConstant.IN_PROGRESS},
            {
                where: {
                    [Op.and]: [
                        {routeId: routeId},
                        {orderType: OrderTypeConstant.PICK_UP},
                        {isPickedUp: 0},
                    ],

                }, transaction: transaction
            }
        );
        // Pickuped order
        await CourierOrder.update(
            {orderStatus: OrderStatusConstant.IN_PROGRESS},
            {
                where: {
                    [Op.and]: [
                        {routeId: routeId},
                        {orderType: OrderTypeConstant.PICK_UP},
                        {isPickedUp: 1},
                    ],

                }, transaction: transaction
            }
        );
        // Delivery Order
        await CourierOrder.update(
            {orderStatus: OrderStatusConstant.IN_PROGRESS},
            {
                where: {
                    [Op.and]: [
                        {routeId: routeId},
                        {orderType: OrderTypeConstant.DELIVERY},
                    ],

                }, transaction: transaction
            }
        );
        await transaction.commit();
        return res.json(statusModel.success("Route started."));
    } catch (err) {
        if (transaction) {
            await transaction.rollback();
            return res.json(statusModel.failed({message: "Failed to start."}));
        }
    }
}

let storage = multer.diskStorage({
    destination: function (req, file, callback) {
        if (file)
            callback(null, "uploaded-files/task-proof")
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


const TaskProofController = {
    createFailedTaskProof: createFailedTaskProof,
    getRouteAndTasks: getRouteAndTasks,
    createTaskProofWithImage: createTaskProofWithImage,
    orderRouteStart: orderRouteStart,
    uploadFile: uploadFile
}

module.exports = TaskProofController;
