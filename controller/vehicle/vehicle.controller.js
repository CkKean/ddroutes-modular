const StatusModel = require("../../model/status.model");
const generateUniqueId = require("../../utils/unique-id.util");
const {Op} = require("sequelize");
const Vehicle = require("../../config/database").vehicle;
const User = require("../../config/database").user;
const multer = require("multer");
const fs = require("fs");
const generateDateTime = require("../../utils/unique-date-time.util");
const {UserTypeConstant} = require("../../constant/user-type.constant");

const statusModel = new StatusModel();

findAll = async (req, res) => {
    const vehicleList = await Vehicle.findAll({
        order: [
            ["plateNo", "ASC"]
        ],
        attributes: {
            exclude: ["createdBy", "updatedBy"]
        }
    });

    for (let index in vehicleList) {
        const user = await User.findOne(
            {where: {userId: vehicleList[index].owner}},
        );
        if (user)
            vehicleList[index].owner = user.fullName;
    }

    return res.json(statusModel.success(vehicleList));
}

findOne = async (req, res) => {
    const vehicle = await Vehicle.findOne({
        where: {
            plateNo: req.query.plateNo
        },
        attributes: {
            exclude: ['createdBy', 'updatedBy']
        }
    });

    if (!vehicle) {
        return res.json(statusModel.failed({message: "Vehicle does not exist."}));
    }
    const user = await User.findOne(
        {where: {userId: vehicle.owner}},
    );
    if (user)
        vehicle.owner = user.fullName;
    return res.json(statusModel.success(vehicle));
}

createVehicle = async (req, res) => {
    let vehicleData = JSON.parse(req.body.vehicle);

    if (vehicleData) {
        let uniqueId = generateUniqueId('V');

        vehicleData.vehicleId = uniqueId;
        vehicleData.createdBy = req.userId;
        vehicleData.createdAt = new Date();
        if (req.file) {
            vehicleData.photo = req.file.filename;
            vehicleData.photoPath = '/' + req.file.destination.split('/')[1];
        }

        Vehicle.create(vehicleData).then(() => {
            return res.json(statusModel.success("Vehicle record has been created."));
        }).catch(err => {
            return res.json(statusModel.failed({message: err.message}));
        })
    }
}

deleteVehicle = async (req, res) => {
    const vehicle = await verifyVehicle(req.query.vehicleId);
    if (vehicle) {
        Vehicle.destroy({
            where: {
                vehicleId: req.query.vehicleId,
            }
        }).then(() => {
            if (vehicle.photoPath && vehicle.photo) {
                const filePath = 'uploaded-files' + vehicle.photoPath + '/' + vehicle.photo;
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    return res.json(statusModel.failed({message: err.message}));
                }
            }
            return res.json(statusModel.success("Vehicle record has been deleted."));
        }).catch(err => {
            return res.json(statusModel.failed({message: err.message}));
        })
    } else {
        return res.json(statusModel.failed({message: "Vehicle does not exist."}));
    }
}

updateVehicle = async (req, res) => {
    let vehicleData = JSON.parse(req.body.vehicle);
    const vehicle = await verifyVehicle(vehicleData.vehicleId);

    if (vehicle) {
        if (req.file) {
            vehicleData.photo = req.file.filename;
            vehicleData.photoPath = '/' + req.file.destination.split('/')[1];
        } else {
            vehicleData.photo = null;
            vehicleData.photoPath = null;
        }
        vehicleData.updatedAt = new Date();
        vehicleData.updatedBy = req.userId;

        Vehicle.update(vehicleData,
            {
                where: {
                    vehicleId: vehicleData.vehicleId
                }
            }).then(() => {
            if (req.file && vehicle.photoPath && vehicle.photo) {
                const filePath = 'uploaded-files' + vehicle.photoPath + '/' + vehicle.photo;
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    return res.json(statusModel.failed({message: err.message}));
                }
            }
            return res.json(statusModel.success("Vehicle has been updated."));
        }).catch(err => {
            return res.json(statusModel.failed({message: err.message}));
        });
    } else {
        return res.json(statusModel.failed({message: "Vehicle does not exist."}));
    }

}

verifyVehicle = async (vehicleId) => {
    let vehicle = await Vehicle.findOne(
        {
            where: {
                vehicleId: vehicleId
            },
            raw: true
        }
    );
    return vehicle;
}

checkDuplicatedVehicle = async (req, res) => {
    let vehicle = await Vehicle.findOne(
        {
            where: {
                plateNo: req.query.plateNo
            }
        }
    );

    if (vehicle) {
        return res.json(statusModel.failed({message: "Vehicle (" + req.query.plateNo + ") is existed."}));
    } else {
        return res.json(statusModel.success("Vehicle does not exist."));
    }
}

findAllVehicleStaff = (req, res) => {
    User.findAll(
        {
            where: {
                [Op.or]: [
                    {userType: UserTypeConstant.S},
                    {userType: UserTypeConstant.SA}
                ]
            },
            order: [
                ['fullName', 'ASC']
            ],
            attributes: ['userId', 'fullName']
        }
    ).then(user => {
        return res.json(statusModel.success(user));
    }).catch(err => {
        return res.json(statusModel.failed({message: err.message}));
    });
};

let storage = multer.diskStorage({
    destination: function (req, file, callback) {
        if (file) {
            callback(null, "uploaded-files/vehicle")
        }
    },
    filename: function (req, file, cb) {
        if (file) {
            let fileOriginalName = file.originalname;
            let fileName = fileOriginalName.split('.')[0];
            let fileExtension = fileOriginalName.split('.')[1];
            cb(null, fileName + '_' + generateDateTime() + '.' + fileExtension);
        }
    }
});

upload = multer({
    storage: storage,
    limits: {fileSize: 2000000},
    fileFilter(req, file, callback) {
        if (file) {
            if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
                callback(new Error('Please upload JPG, JPEG, PNG image only.'))
            }
            callback(undefined, true)
        }
    }
});

const VehicleController = {
    findAll: findAll,
    findOne: findOne,
    createVehicle: createVehicle,
    updateVehicle: updateVehicle,
    deleteVehicle: deleteVehicle,
    findAllVehicleStaff: findAllVehicleStaff,
    checkDuplicatedVehicle: checkDuplicatedVehicle,
    upload: upload,
}

module.exports = VehicleController;
