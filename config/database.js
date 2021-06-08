const {DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE} = process.env;

const model = require("../model");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
    // "heroku_0da9999a0d967a4", //Database
    // "b6992ec63f331a", //Username
    // "b912375f", // Password
    // host: "us-cdbr-east-03.cleardb.com",

    DB_DATABASE, //Database
    DB_USERNAME, //Username
    DB_PASSWORD, // Password
    {
        host: DB_HOST,
        dialect: "mysql",
        operatorAliases: false,
        timezone: '+08:00',
        dialectOptions: {
            options: {
                useUTC: false, // for reading from database
            },
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
