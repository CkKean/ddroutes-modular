const {DataTypes} = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const pricePlan = sequelize.define("price_plan", {
            pricePlanId: {
                type: DataTypes.STRING,
                primaryKey: true,
                field: "price_plan_id"
            },
            vehicleType: {
                type: DataTypes.STRING,
                field: "vehicle_type",
                unique:true
            },
            defaultWeightPrefix: {
                type: DataTypes.STRING,
                field: "default_weight_prefix"
            },
            defaultWeight: {
                type: DataTypes.DECIMAL,
                field: "default_weight"
            },
            defaultWeightUnit: {
                type: DataTypes.STRING,
                field: "default_weight_unit"
            },
            defaultDistancePrefix: {
                type: DataTypes.STRING,
                field: "default_distance_prefix"
            },
            defaultDistance: {
                type: DataTypes.DECIMAL,
                field: "default_distance"
            },
            defaultDistanceUnit: {
                type: DataTypes.STRING,
                field: "default_distance_unit"
            },
            defaultPricing: {
                type: DataTypes.DECIMAL,
                field: "default_pricing"
            },
            subDistance: {
                type: DataTypes.DECIMAL,
                field: "sub_distance"
            },
            subDistancePricing: {
                type: DataTypes.DECIMAL,
                field: "sub_distance_pricing"
            },
            subDistanceUnit: {
                type: DataTypes.STRING,
                field: "sub_distance_unit"
            },
            subWeight: {
                type: DataTypes.DECIMAL,
                field: "sub_weight"
            },
            subWeightPricing: {
                type: DataTypes.DECIMAL,
                field: "sub_weight_pricing"
            },
            subWeightUnit: {
                type: DataTypes.STRING,
                field: "sub_weight_unit"
            },
            createdBy: {
                type: DataTypes.STRING,
                field: "created_by"
            },
            createdAt: {
                type: DataTypes.DATE,
                field: "created_at"
            },
            updatedBy: {
                type: DataTypes.STRING,
                field: "updated_by"
            },
            updatedAt: {
                type: DataTypes.DATE,
                field: "updated_at"
            }
        },
        {
            tableName: 'price_plan',
            freezeTableName: true, // Model tableName will be the same as the model name
            timestamps: false,
        });
    pricePlan.hasOne(sequelize.models.user, {
        foreignKey: 'user_id'
    });

    return pricePlan;
};
