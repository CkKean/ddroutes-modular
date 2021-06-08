const User = require("../../config/database").user;
const StatusModel = require("../../model/status.model");
const multer = require("multer");
const fs = require("fs");
const generateDateTime = require("../../utils/unique-date-time.util");
const AuthController = require("../auth/auth.controller");
const AccountMiddleware = require("../../middleware/account/accountmiddleware");
const {Op} = require("sequelize");
const {EmployeePositionConstant} = require("../../constant/employee-position.constant");
const {UserTypeConstant} = require("../../constant/user-type.constant");
const {IMAGE_PATH} = require("../../constant/routes.constant");
const statusModel = new StatusModel();

findAllStaff = (req, res) => {
    User.findAll(
        {
            where: {
                userType: req.query.userType
            },
            order: [
                ['fullname', 'ASC']
            ],
            attributes: {
                exclude: ['userId', 'password']
            }
        }
    ).then(user => {
        return res.json(statusModel.success(user));
    }).catch(err => {
        return res.json(statusModel.failed({message: err.message}));
    });
};

findAllStaffByPosition = (req, res) => {
    User.findAll(
        {
            where: {
                position: req.query.position,
                userType: UserTypeConstant.S
            },
            order: [
                ['fullName', 'ASC']
            ],
            attributes: {
                exclude: ['userId', 'password']
            }
        }
    ).then(users => {
        return res.json(statusModel.success(users));
    }).catch(err => {
        return res.json(statusModel.failed({message: err.message}));
    })
};

findOne = (req, res) => {
    User.findOne({
        where: {
            username: req.query.username
        },
    }).then(user => {
        if (!user) {
            return res.json(statusModel.failed({message: "User does not exist."}));
        }
        return res.json(statusModel.success(user));
    }).catch(err => {
        return res.json(statusModel.failed({message: err.message}));
    });
};

findAllCourierPersonnel = (req, res) => {
    User.findAll(
        {
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
            },
            order: [
                ['fullname', 'ASC']
            ],
            attributes: {
                exclude: ['userId', 'password']
            }
        }
    ).then(user => {
        return res.json(statusModel.success(user));
    }).catch(err => {
        return res.json(statusModel.failed({message: err.message}));
    });
}

createStaff = async (req, res) => {

    let userData = JSON.parse(req.body.user);
    userData.createdBy = req.userId;
    AuthController.signUpFieldsValidation(userData, res);
    const user = await User.findOne({where: {username: userData.username}});
    if (user) {
        statusModel.failed({message: "Failed! Username is already in use!"})
    }
    if (req.file) {
        userData.profileImg = req.file.filename;
        userData.profileImgPath = '/' + req.file.destination.split('/')[1];
    }
    userData.createdDT = new Date();

    User.create(userData).then(user => {
        return res.json(statusModel.success("Employee record has been created."));
    }).catch(err => {
        return res.json(statusModel.failed({message: err.message}));
    });
};

deleteStaff = async (req, res) => {
    const user = await User.findOne({where: {username: req.query.username, userType: req.query.userType}});
    if (!user) {
        return res.json(statusModel.failed({message: "User does not exist."}));
    }

    User.destroy({
        where: {
            userId: user.userId,
        }
    }).then(() => {
        if (user.profileImgPath && user.profileImg) {
            const filePath = IMAGE_PATH + user.profileImgPath + '/' + user.profileImg;
            try {
                fs.unlinkSync(filePath);
                return res.json(statusModel.success("Employee record has been deleted."));
            } catch (err) {
                return res.json(statusModel.failed({message: err.message}));
            }
        }
        return res.json(statusModel.success("Employee record has been deleted."));

    }).catch(err => {
        return res.json(statusModel.failed({message: err.message}));
    })
};

updateStaff = async (req, res) => {

    let userData = JSON.parse(req.body.user);
    const user = await User.findOne({where: {username: userData.username}, raw: true});
    if (user) {
        statusModel.failed({message: "Failed! Username is already in use!"})
    }
    if (req.file) {
        userData.profileImg = req.file.filename;
        userData.profileImgPath = '/' + req.file.destination.split('/')[1];
    } else {
        userData.profileImg = null;
        userData.profileImgPath = null;
    }

    console.log(req.file);
    console.log(userData);

    User.update(userData,
        {
            where: {
                userId: user.userId
            }
        }).then(() => {
        if (req.file && user.profileImgPath && user.profileImg) {
            const filePath = IMAGE_PATH + user.profileImgPath + '/' + user.profileImg;
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                return res.json(statusModel.failed({message: err.message}));
            }
        }
        return res.json(statusModel.success("Employee record has been updated."));
    }).catch(err => {
        return res.json(statusModel.failed({message: err.message}));
    });
};


findUserInformation = async (req, res) => {
    User.findOne({
        where: {
            userId: req.userId
        },
        attributes: {
            exclude: ["createdBy", "createdAt", "password"]
        }
    }).then(user => {
        if (!user) {
            return res.json(statusModel.failed({message: "User does not exist."}));
        }
        return res.json(statusModel.success(user));
    }).catch(err => {
        return res.json(statusModel.failed({message: err.message}));
    });
}


let storage = multer.diskStorage({
    destination: function (req, file, callback) {
        if (file)
            callback(null, "uploaded-files/users")
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

uploadFile = multer({
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

const UserController = {
    findAllStaff: findAllStaff,
    findOne: findOne,
    createStaff: createStaff,
    deleteStaff: deleteStaff,
    updateStaff: updateStaff,
    findAllStaffByPosition: findAllStaffByPosition,
    findAllCourierPersonnel: findAllCourierPersonnel,
    findUserInformation:findUserInformation,
    uploadFile: uploadFile
};

module.exports = UserController;

