const StatusModel = require("../../model/status.model");
const generateUniqueId = require("../../utils/unique-id.util");
const PricePlan = require("../../config/database").pricePlan;
const statusModel = new StatusModel();

findAll = async (req, res) => {
    const pricePlan = await PricePlan.findAll({
        order: [
            ["createdAt", "ASC"]
        ]
    });

    return res.json(statusModel.success(pricePlan));
}

findOne = async (req, res) => {
    const pricePlan = await PricePlan.findOne({
        where: {
            pricePlanId: req.query.pricePlanId
        },
        attributes: {
            exclude: ['createdBy', 'updatedBy']
        }
    });
    if (!pricePlan) {
        return res.json(statusModel.failed({message: "Price Plan does not exist."}));
    }
    return res.json(statusModel.success(pricePlan));
}


createPricePlan = async (req, res) => {
    let vehicleTypeExisted = await verifyVehicleType(req.body.vehicleType);
    if (!vehicleTypeExisted) {
        let uniqueId = generateUniqueId('PP');
        req.body.pricePlanId = uniqueId;
        req.body.createdBy = req.userId;
        req.body.createdAt = new Date();
        PricePlan.create(req.body).then(pricePlan => {
            return res.json(statusModel.success("Price plan created successfully."));
        }).catch(err => {
            return res.json(statusModel.failed({message: err.message}));
        })
    } else {
        return res.json(statusModel.failed({message: "Vehicle type is existing."}));
    }
}

deleteVehicle = async (req, res) => {
    const pricePlan = await verifyPricePlan(req.query.pricePlanId);

    if (pricePlan) {
        PricePlan.destroy({
            where: {
                pricePlanId: req.query.pricePlanId,
            }
        }).then(response => {
            return res.json(statusModel.success("Price plan record successfully delete."));
        }).catch(err => {
            return res.json(statusModel.failed({message: err.message}));
        })
    } else {
        return res.json(statusModel.failed({message: "Price plan does not exist."}));
    }
}

updateVehicle = async (req, res) => {
    const pricePlan = await verifyPricePlan(req.body.pricePlanId);
    let vehicleTypeExisted = false;
    if (pricePlan.vehicleType != req.body.vehicleType) {
        vehicleTypeExisted = await verifyVehicleType(req.body.vehicleType);
    }

    if (pricePlan) {
        if (!vehicleTypeExisted) {
            req.body.updatedBy = req.userId;
            req.body.updatedAt = new Date();
            PricePlan.update(req.body,
                {
                    where:
                        {
                            pricePlanId: req.body.pricePlanId
                        }
                }).then(response => {
                return res.json(statusModel.success("Price plan updated successfully."));
            }).catch(err => {
                return res.json(statusModel.failed({message: err.message}));
            });
        } else {
            return res.json(statusModel.failed({message: "Vehicle type is existing."}));
        }
    } else {
        return res.json(statusModel.failed({message: "Price plan does not exist."}));
    }

}

verifyPricePlan = async (pricePlanId) => {
    let pricePlan = await PricePlan.findOne(
        {
            where: {
                pricePlanId: pricePlanId
            }
        }
    );
    return pricePlan;
}

verifyVehicleType = async (vehicleType) => {
    let pricePlan = await PricePlan.findAndCountAll(
        {
            where: {
                vehicleType: vehicleType
            }
        }
    );
    if (pricePlan.count >= 1) {
        return true;
    } else {
        return false;
    }
}

findVehicleUniqueType = async (req, res) => {
    const vehicleList = await PricePlan.findAll({
        attributes: ["vehicleType"],
        raw: true
    });

    const uniqueType = vehicleList.map(v => v.vehicleType).filter((item, index, self) => self.indexOf(item) === index);
    return res.json(statusModel.success(uniqueType));
}

const PricePlanController = {
    findAll: findAll,
    findOne: findOne,
    createPricePlan: createPricePlan,
    deleteVehicle: deleteVehicle,
    updateVehicle: updateVehicle,
    findVehicleUniqueType: findVehicleUniqueType
}

module.exports = PricePlanController;
