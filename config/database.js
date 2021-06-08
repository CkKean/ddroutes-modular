const {
    DB_HOST,
    DB_USERNAME,
    DB_PASSWORD,
    DB_DATABASE,
} = process.env;

const model = require("../model");

const DB_DEV_HOST = "us-cdbr-east-04.cleardb.com"
const DB_DEV_USERNAME = "bd25f8f1af39c6"
const DB_DEV_PASSWORD = "02a3fa60"
const DB_DEV_DATABASE = "heroku_3d67ae1496f0ac0"

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
    "heroku_3d67ae1496f0ac0", //Database
    "bd25f8f1af39c6", //Username
    "02a3fa60", // Password
    {
        host: "us-cdbr-east-04.cleardb.com",
        dialect: "mysql",
        dialectOptions: {
            options: {
                useUTC: false, // for reading from database
            },
        },
        pool: {
            connectionLimit: 20
        },
    }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = model.User(sequelize, Sequelize);
db.vehicle = model.Vehicle(sequelize, Sequelize);
db.pricePlan = model.PricePlan(sequelize, Sequelize);
db.courierOrder = model.CourierOrder(sequelize, Sequelize);
db.routeReport = model.RouteReport(sequelize, Sequelize);
db.orderRoute = model.OrderRoute(sequelize, Sequelize);
db.companyAddress = model.CompanyAddress(sequelize, Sequelize);
db.taskProof = model.TaskProof(sequelize, Sequelize);

module.exports = db;
