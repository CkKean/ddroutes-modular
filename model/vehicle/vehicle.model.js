const {Model, DataTypes, Deferrable} = require("sequelize");

module.exports = (sequelize, Sequelize) => {
    const vehicle = sequelize.define("vehicle", {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: true
            },
            vehicleId: {
                type: DataTypes.STRING,
                field: "vehicle_id",
                unique: true,
                allowNull: false,
                validate: {
                    notNull: {args: true, msg: 'Departure date cannot be null.'}
                }
            },
            plateNo: {
                type: DataTypes.STRING,
                field: "plate_no",
                unique: true,
                allowNull: false
            },
            brand: {
                type: DataTypes.STRING,
                allowNull: false
            },
            model: {
                type: DataTypes.STRING,
                allowNull: false
            },
            color: {
                type: DataTypes.STRING,
                allowNull: false
            },
            fuelEfficiency: {
                type: DataTypes.DECIMAL,
                field: "fuel_efficiency",

                allowNull: false,
                validate: {
                    notNull: {args: true, msg: 'Fuel efficiency cannot be null.'}
                }
            },
            fuelEfficiencyUnit: {
                type: DataTypes.STRING,
                field: "fuel_efficiency_unit",
                allowNull: false
            },
            fuelTank: {
                type: DataTypes.DECIMAL,
                field: "fuel_tank",
                allowNull: false
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false
            },
            owner: {
                type: DataTypes.STRING,
                allowNull: false
            },
            gpsTrackNo: {
                type: DataTypes.STRING,
                field: "gps_track_no",
            },
            photo: {
                type: DataTypes.STRING,
            },
            photoPath: {
                type: DataTypes.STRING,
                field: "photo_path"
            },
            createdBy: {
                type: DataTypes.STRING,
                field: "created_by",
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
            tableName: 'vehicle',
            freezeTableName: true, // Model tableName will be the same as the model name
            timestamps: false,
        });

    return vehicle;
};
