const {DataTypes} = require("sequelize");
module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("user", {
            userId: {
                type: Sequelize.STRING,
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: Sequelize.UUIDV4,
                field: "user_id", // Will result in an attribute that is firstName when user facing but first_name in the database
            },
            userType: {
                type: Sequelize.INTEGER,
                field: "user_type",
                allowNull: false
            },
            username: {
                type: Sequelize.STRING,
                allowNull: false
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false
            },
            password: {
                type: Sequelize.STRING,
                allowNull: false
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
            country: {
                type: Sequelize.STRING,
                allowNull: false
            },
            dob: {
                type: Sequelize.DATE,
                allowNull: false
            },
            gender: {
                type: Sequelize.STRING,
                allowNull: false
            },
            fullName: {
                type: Sequelize.STRING,
                allowNull: false,
                field: "fullname"
            },
            mobileNo: {
                type: Sequelize.STRING,
                field: "mobile_no",
                allowNull: false
            },
            race: {
                type: Sequelize.STRING,
                allowNull: false
            },
            religion: {
                type: Sequelize.STRING,
                allowNull: false
            },
            startDate: {
                type: Sequelize.DATE,
                field: "start_date"
            },
            position: {
                type: Sequelize.STRING,
            },
            profileImg: {
                type: Sequelize.STRING,
                field: "profile_img"
            },
            profileImgPath: {
                type: Sequelize.STRING,
                field: "profile_img_path"
            },
            createdDT: {
                type: Sequelize.DATE,
                field: "created_date_time",
                allowNull: false
            },
            createdBy: {
                type: Sequelize.STRING,
                field: "created_by",
            }
        },
        {
            tableName: 'user',
            freezeTableName: true, // Model tableName will be the same as the model name
            timestamps: false,
            modelName: 'User'
        });

    return User;
};
