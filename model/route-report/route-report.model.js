module.exports = (sequelize, Sequelize) => {
    const routeReport = sequelize.define("route_report", {
            routeReportId: {
                type: Sequelize.STRING,
                primaryKey: true,
                field: "route_report_id"
            },
            actualPetrolFees: {
                type: Sequelize.DECIMAL,
                field: "actual_petrol_fees"
            },
            calculatedDistanceTravel: {
                type: Sequelize.DECIMAL,
                field: "calculated_distance_travel"
            },
            calculatedPetrolFees: {
                type: Sequelize.DECIMAL,
                field: "calculated_petrol_fees"
            },
            calculatedPetrolUsage: {
                type: Sequelize.DECIMAL,
                field: "calculated_petrol_usage"
            },
            latestPetrolPrice: {
                type: Sequelize.DECIMAL,
                field: "latest_petrol_price"
            },
            statement: {
                type: Sequelize.STRING,
                field: "statement"
            },
            statementPath: {
                type: Sequelize.STRING,
                field: "statement_path"
            },
            totalItemsQty: {
                type: Sequelize.INTEGER,
                field: "total_items_qty"
            },
            routeId: {
                type: Sequelize.STRING,
                field: "route_id"
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
            }
        },
        {
            tableName: 'route_report',
            freezeTableName: true, // Model tableName will be the same as the model name
            timestamps: false,
        });

    routeReport.hasOne(sequelize.models.user, {
        foreignKey: "userId",
        sourceKey: "createdBy",
    });

    return routeReport;
}
