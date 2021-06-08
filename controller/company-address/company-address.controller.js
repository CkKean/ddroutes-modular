const StatusModel = require("../../model/status.model");
const CompanyAddress = require("../../config/database").companyAddress;
const MapDirectionRoutingController = require("../map-direction-routing/map-direction-routing.controller");

const statusModel = new StatusModel();

findAll = async (req, res) => {
    const orderRoute = await CompanyAddress.findAll();

    return res.json(statusModel.success(orderRoute));
};

find = async (req, res) => {
    const orderRoute = await CompanyAddress.findByPk(req.query.id);

    return res.json(statusModel.success(orderRoute));
};

create = async (req, res) => {
    if (req.body) {
        const fullAddress = req.body.fullAddress;
        const coordinate = await MapDirectionRoutingController.getGeoCoding(fullAddress);
        req.body.latitude = coordinate.latitude;
        req.body.longitude = coordinate.longitude;
        req.body.formattedAddress = coordinate.formattedAddress;
        CompanyAddress.create(req.body).then(() => {
            return res.json(statusModel.success("Company address has been created."));

        }).catch(err => {
            return res.json(statusModel.failed({message: err.message}));
        });
    } else {
        return res.json(statusModel.success("Required attribute is missing."));
    }
};

update = async (req, res) => {

    const companyAddress = await verifyCompanyAddress(req.body.id);
    if (companyAddress) {
        const fullAddress = req.body.fullAddress;
        const coordinate = await MapDirectionRoutingController.getGeoCoding(fullAddress);
        req.body.latitude = coordinate.latitude;
        req.body.longitude = coordinate.longitude;
        req.body.formattedAddress = coordinate.formattedAddress;
        CompanyAddress.update(req.body, {
            where: {id: req.body.id}
        }).then(() => {
            return res.json(statusModel.success("Company address has been updated."));

        }).catch(err => {
            return res.json(statusModel.failed({message: err.message}));
        });
    } else {
        return res.json(statusModel.success("Company address does not exist."));
    }
};

deleteAddress = async (req, res) => {

    const companyAddress = await verifyCompanyAddress(req.query.id);
    if (companyAddress) {
        CompanyAddress.destroy({
            where: {id: req.query.id}
        }).then(() => {
            return res.json(statusModel.success("Company address has been deleted."));
        }).catch(err => {
            return res.json(statusModel.failed({message: err.message}));
        });
    } else {
        return res.json(statusModel.failed({message: "Company address does not exist."}));
    }

}

verifyCompanyAddress = async (id) => {
    return await CompanyAddress.findByPk(id);
};


const CompanyAddressController = {
    findAll: findAll,
    find: find,
    create: create,
    update: update,
    deleteAddress: deleteAddress
}

module.exports = CompanyAddressController;
