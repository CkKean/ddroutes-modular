module.exports = (sequelize, Sequelize) => {
    const companyAddresses = sequelize.define("company_addresses", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                field: "id"
            },
            address: {
                type: Sequelize.STRING,
                allowNull: false
            },
            city: {
                type: Sequelize.STRING,
                allowNull: false
            },
            state: {
                type: Sequelize.STRING,
                allowNull: false
            },
            postcode: {
                type: Sequelize.STRING,
                allowNull: false
            },
            latitude: {
                type: Sequelize.STRING,
                allowNull: false
            },
            longitude: {
                type: Sequelize.STRING,
                allowNull: false
            },
            formattedAddress: {
                type: Sequelize.STRING,
                field: "formatted_address",
                allowNull: false
            },
        },
        {
            tableName: 'company_addresses',
            freezeTableName: true, // Model tableName will be the same as the model name
            timestamps: false,
        });

    return companyAddresses;
}
