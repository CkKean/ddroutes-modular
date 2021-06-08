module.exports = (sequelize, Sequelize) => {
    const orderRoutes = sequelize.define("order_routes", {
            routeId: {
                type: Sequelize.STRING,
                primaryKey: true,
                field: "route_id"
            },
            departurePoint: {
                type: Sequelize.INTEGER,
                field: "departure_point",
                allowNull: false,
                validate: {
                    notNull: {args: true, msg: 'Departure point cannot be null.'}
                }
            },
            roundTrip: {
                type: Sequelize.BOOLEAN,
                field: "round_trip",
                allowNull: true,
            },
            departureDate: {
                type: Sequelize.DATE,
                field: "departure_date",
                allowNull: false,
                validate: {
                    notNull: {args: true, msg: 'Departure date cannot be null.'}
                }
            },
            departureTime: {
                type: Sequelize.DATE,
                field: "departure_time"
            },
            personnel: {
                type: Sequelize.STRING,
                field: "personnel"
            },
            status: {
                type: Sequelize.STRING,
                field: "status"
            },
            timeNeeded: {
                type: Sequelize.DECIMAL,
                field: "time_needed"
            },
            totalDistance: {
                type: Sequelize.DECIMAL,
                field: "total_distance"
            },
            vehicleId: {
                type: Sequelize.STRING,
                field: "vehicle_id"
            },
            createdBy: {
                type: Sequelize.STRING,
                field: "created_by"
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
            startedAt: {
                type: Sequelize.DATE,
                field: "started_at"
            }
        },
        {
            tableName: 'order_routes',
            freezeTableName: true, // Model tableName will be the same as the model name
            timestamps: false,
        });


    orderRoutes.hasOne(sequelize.models.route_report, {
        foreignKey: "route_id"
    });
    sequelize.models.route_report.belongsTo(orderRoutes, {
        targetKey: "routeId",
        foreignKey: "route_id",
        as: "orderRoute"
    });

    orderRoutes.hasOne(sequelize.models.user, {
        foreignKey: "userId",
        sourceKey: "createdBy",
        as: "createdByInfo"
    });

    orderRoutes.hasOne(sequelize.models.user, {
        foreignKey: "userId",
        sourceKey: "personnel",
        as: "personnelInfo"
    });

    orderRoutes.hasOne(sequelize.models.vehicle, {
        foreignKey: "vehicle_id",
        sourceKey: "vehicleId",
        as: "vehicleInfo"
    })

    return orderRoutes;
}
