const {DataTypes} = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const courierOrder = sequelize.define("courier_order", {
            orderId: {
                type: Sequelize.STRING,
                primaryKey: true,
                field: "order_id",
            },
            orderNo: {
                type: Sequelize.STRING,
                field: "order_no",
                unique: true,
                allowNull: false
            },
            orderType: {
                type: Sequelize.STRING,
                field: "order_type",
                allowNull: false
            },
            orderStatus: {
                type: Sequelize.STRING,
                field: "order_status",
                allowNull: true
            },
            trackingNo: {
                type: Sequelize.STRING,
                field: "tracking_no",
                allowNull: false
            },
            senderName: {
                type: Sequelize.STRING,
                field: "sender_name",
                allowNull: false
            },
            senderMobileNo: {
                type: Sequelize.STRING,
                field: "sender_mobile_no",
                allowNull: false
            },
            senderEmail: {
                type: Sequelize.STRING,
                field: "sender_email",
            },
            senderAddress: {
                type: Sequelize.STRING,
                field: "sender_address",
                allowNull: false
            },
            senderCity: {
                type: Sequelize.STRING,
                field: "sender_city",
                allowNull: false
            },
            senderState: {
                type: Sequelize.STRING,
                field: "sender_state",
                allowNull: false
            },
            senderPostcode: {
                type: Sequelize.STRING,
                field: "sender_postcode",
                allowNull: false
            },
            senderLongitude: {
                type: Sequelize.STRING,
                field: "sender_longitude",
                allowNull: false
            },
            senderLatitude: {
                type: Sequelize.STRING,
                field: "sender_latitude",
                allowNull: false
            },
            senderFormattedAddress: {
                type: Sequelize.STRING,
                field: "sender_formatted_address",
                allowNull: false
            },
            recipientName: {
                type: Sequelize.STRING,
                field: "recipient_name",
                allowNull: false
            },
            recipientMobileNo: {
                type: Sequelize.STRING,
                field: "recipient_mobile_no",
                allowNull: false
            },
            recipientEmail: {
                type: Sequelize.STRING,
                field: "recipient_email",
            },
            recipientAddress: {
                type: Sequelize.STRING,
                field: "recipient_address",
                allowNull: false
            },
            recipientCity: {
                type: Sequelize.STRING,
                field: "recipient_city",
                allowNull: false
            },
            recipientState: {
                type: Sequelize.STRING,
                field: "recipient_state",
                allowNull: false
            },
            recipientPostcode: {
                type: Sequelize.STRING,
                field: "recipient_postcode",
                allowNull: false
            },
            recipientLongitude: {
                type: Sequelize.STRING,
                field: "recipient_longitude",
                allowNull: false
            },
            recipientLatitude: {
                type: Sequelize.STRING,
                field: "recipient_latitude",
                allowNull: false
            },
            recipientFormattedAddress: {
                type: Sequelize.STRING,
                field: "recipient_formatted_address",
                allowNull: false
            },

            itemQty: {
                type: Sequelize.INTEGER,
                field: "item_qty",
                allowNull: false
            },
            itemType: {
                type: Sequelize.STRING,
                field: "item_type",
                allowNull: false
            },
            itemWeight: {
                type: Sequelize.DECIMAL(20, 3),
                field: "item_weight",
                allowNull: false
            },
            vehicleType: {
                type: Sequelize.STRING,
                field: "vehicle_type",
                allowNull: false
            },
            shippingCost: {
                type: Sequelize.DECIMAL(20, 3),
                field: "shipping_cost",
                allowNull: false
            },
            paymentMethod: {
                type: Sequelize.STRING,
                field: "payment_method",
                allowNull: false
            },
            proofId: {
                type: Sequelize.STRING,
                field: "proof_id"
            },
            routeId: {
                type: Sequelize.STRING,
                field: "route_id"
            },
            sortId: {
                type: Sequelize.INTEGER,
                field: "sort_id"
            },
            isPickedUp: {
                type: Sequelize.BOOLEAN,
                field: "is_picked_up"
            },
            pickupOrderStatus: {
                type: Sequelize.STRING,
                field: "pickup_order_status"
            },
            pickupProofId: {
                type: Sequelize.STRING,
                field: "pickup_proof_id"
            },
            pickupSortId: {
                type: Sequelize.INTEGER,
                field: "pickup_sort_id"
            },
            pickupRouteId: {
                type: Sequelize.STRING,
                field: "pickup_route_id"
            },
            createdBy: {
                type: Sequelize.STRING,
                field: "created_by",
            },
            createdAt: {
                type: Sequelize.DATE,
                field: "created_at"
            },
            updatedBy: {
                type: Sequelize.STRING,
                field: "updated_by"
            },
            updatedAt: {
                type: Sequelize.DATE,
                field: "updated_at"
            },
            estArriveTime: {
                type: Sequelize.INTEGER,
                field: "est_arrive_time"
            }
        },
        {
            tableName: 'courier_order',
            freezeTableName: true, // Model tableName will be the same as the model name
            timestamps: false,
        });


    return courierOrder;
};
