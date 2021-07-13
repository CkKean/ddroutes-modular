const {
    DB_HOST,
    DB_USERNAME,
    DB_PASSWORD,
    DB_DATABASE,
} = process.env;

const model = require("../model");
const Sequelize = require("sequelize");

const db = {};
db.Sequelize = Sequelize;
let sequelize;

if (process.env.NODE_ENV === "development") {
    sequelize = new Sequelize(
        DB_DATABASE, //Database
        DB_USERNAME, //Username
        DB_PASSWORD, // Password
        {
            host: DB_HOST,
            dialect: "mysql",
            operatorAliases: false,
            timezone: '+08:00',
            pool: {
                connectionLimit: 10
            },
        },
    );
    db.sequelize = sequelize;
    console.log("Development Database Configuration");
} else {
    sequelize = new Sequelize(
        "heroku_3d67ae1496f0ac0", //Database
        "bd25f8f1af39c6", //Username
        "02a3fa60", // Password
        {
            host: "us-cdbr-east-04.cleardb.com",
            dialect: "mysql",
            operatorAliases: false,
            timezone: '+08:00',
            pool: {
                connectionLimit: 10
            },
        }
    );

    db.sequelize = sequelize;
    console.log("Production Database Configuration");
}

db.user = model.User(sequelize, Sequelize);
db.vehicle = model.Vehicle(sequelize, Sequelize);
db.pricePlan = model.PricePlan(sequelize, Sequelize);
db.courierOrder = model.CourierOrder(sequelize, Sequelize);
db.routeReport = model.RouteReport(sequelize, Sequelize);
db.orderRoute = model.OrderRoute(sequelize, Sequelize);
db.companyAddress = model.CompanyAddress(sequelize, Sequelize);
db.taskProof = model.TaskProof(sequelize, Sequelize);

module.exports = db;
