const CourierOrder = require("../../config/database").courierOrder;
const CompanyAddress = require("../../config/database").companyAddress;
const User = require("../../config/database").user;

const StatusModel = require("../../model/status.model");
const {Op} = require("sequelize");
const {UserTypeConstant} = require("../../constant/user-type.constant");
const {EmployeePositionConstant} = require("../../constant/employee-position.constant");
const statusModel = new StatusModel();

findAll = async (req, res) => {

    const today = new Date().toLocaleDateString();
    const courierOrder = await CourierOrder.findAll();
    let todayTodayOrder = 0;
    for (let order of courierOrder) {
        if (order.createdAt.toLocaleDateString() === today) {
            todayTodayOrder += 1;
        }
    }

    const normalUsers = await User.findAll({where: {userType: UserTypeConstant.NU}, raw: true});
    const personnel = await User.findAll({
        where: {
            [Op.and]: [
                {userType: UserTypeConstant.S},
                {
                    [Op.or]: [
                        {position: EmployeePositionConstant.CP},
                        {position: EmployeePositionConstant.CP_PT},
                    ]
                }
            ]
        }, raw: true
    });
    const branches = await CompanyAddress.findAll();

    const dashboardModel = {
        totalOrder: todayTodayOrder,
        totalBranch: branches.length,
        totalUser: normalUsers.length,
        totalPersonnel: personnel.length
    };

    return res.json(statusModel.success(dashboardModel));
}

const DashboardController = {
    findAll: findAll
};

module.exports = DashboardController;
