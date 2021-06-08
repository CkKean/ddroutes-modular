const db = require("../../config/database");
const config = require("../../config/auth.config");
const User = db.user;
const StatusModel = require("../../model/status.model");

const jwt = require("jsonwebtoken");
const {EmployeePositionConstant} = require("../../constant/employee-position.constant");
const {Op} = require("sequelize");
const statusModel = new StatusModel();

const refreshTokens = {};

signup = (req, res) => {

    signUpFieldsValidation(req.body);

    User.create({
        username: req.body.username,
        password: req.body.password,
        userType: req.body.userType,
        email: req.body.email,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        postcode: req.body.postcode,
        country: req.body.country,
        dob: req.body.dob,
        gender: req.body.gender,
        fullName: req.body.fullName,
        mobileNo: req.body.mobileNo,
        race: req.body.race,
        religion: req.body.religion,
        startDate: req.body.startDate,
        position: req.body.position,
        profileImg: req.body.profileImg,
        created_by: req.body.createdBy ? req.body.createdBy : null,
        createdDT: new Date()
    }).then(user => {
        res.json(statusModel.success("User created successfully."));
    }).catch(err => {
        res.json(statusModel.failed({message: err.message}));
    });
};

signin = (req, res) => {
    console.log(req.body);
    const statusModel = new StatusModel();
    User.findOne({
        where: {
            username: req.body.username
        },
        attributes: {
            exclude: ["startDate", "position", "createdDT", "createdBy"]
        }
    }).then(user => {
        if (!user || user == null) {
            return res.json(statusModel.failed({
                message: "User Not Found!"
            }));
        }

        const passwordIsValid = user["password"] === req.body.password;
        if (!passwordIsValid) {
            return res.json(statusModel.failed({
                message: "Invalid Password!"
            }));
        }

        user.password = null;
        const token = jwt.sign({id: user.userId}, config.secret, {
            expiresIn: 86400 // 15 Minutes
        });
        const refreshToken = jwt.sign({id: user.userId}, config.refreshTokenSecret, {
            expiresIn: 86400 //1 day
        })
        refreshTokens[refreshToken] = user.userId;

        res.json(statusModel.success({
            username: user.username,
            userType: user.userType,
            jwtToken: token,
            refreshToken: refreshToken,
            expiresIn: 86400,
            userInformation: user
        }));

    }).catch(err => {
        res.status(500).send({message: err.message});
    });
}

mobileSignIn = (req, res) => {
    const statusModel = new StatusModel();

    User.findOne({
        where: {username: req.body.username}
    }).then(user => {
        if (!user) {
            return res.json(statusModel.failed({
                message: "User Not Found!"
            }));
        }

        if (user.position === EmployeePositionConstant.BO) {
            return res.json(statusModel.failed({
                message: "Permission denied. You are not authorized to perform this action."
            }));
        }

        const passwordIsValid = user["password"] === req.body.password;
        if (!passwordIsValid) {
            return res.json(statusModel.failed({
                message: "Invalid Password!"
            }));
        }

        const token = jwt.sign({id: user.userId}, config.secret, {
            expiresIn: 86400 // 15 Minutes
        });
        const refreshToken = jwt.sign({id: user.userId}, config.refreshTokenSecret, {
            expiresIn: 86400 //1 day
        })
        refreshTokens[refreshToken] = user.userId;

        console.log(user.fullName);
        res.json(statusModel.success({
            username: user.username,
            fullname: user.fullName,
            userType: user.userType,
            position: user.position,
            startDate: user.startDate,
            profileImg: user.profileImg ? user.profileImg : null,
            profileImgPath: user.profileImgPath ? user.profileImgPath : null,
            jwtToken: token,
            refreshToken: refreshToken,
            expiresIn: 86400,
        }));

    }).catch(err => {
        res.status(500).send({message: err.message});
    });
}

refreshToken = (req, res) => {
    const token = req.body.refreshToken;

    if (!token) {
        return res.sendStatus(401);
    }

    if (!refreshTokens.includes(token)) {
        return res.sendStatus(403);
    }
    jwt.verify(token, config.refreshTokenSecret, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        const accessToken = jwt.sign({id: user.userId}, config.refreshTokenSecret, {
            expiresIn: 900 // 15 min
        })

        res.json({
            accessToken
        });
    });
}

validateUsername = (req, res) => {
    const statusModel = new StatusModel();
    User.findOne({
        where: {
            username: req.query.username
        }
    }).then(user => {
        if (user) {
            return res.json(statusModel.failed({message: "existed"}));
        }
        return res.json(statusModel.success("does.not.exist"));
    });
}

validateEmail = (req, res) => {
    const statusModel = new StatusModel();
    User.findOne({
        where: {
            email: req.query.email
        }
    }).then(user => {
        if (user) {
            return res.json(statusModel.failed({message: "existed"}));
        }
        return res.json(statusModel.success("does.not.exist"));
    });
}

signUpFieldsValidation = (userData, res) => {
    if (!userData.username) {
        return res.json(statusModel.failed({message: "username.is.missing"}));
    }
    if (!userData.userType) {
        return res.json(statusModel.failed({message: "user.type.is.missing"}));
    }
    if (!userData.email) {
        return res.json(statusModel.failed({message: "email.is.missing"}));
    }
    if (!userData.password) {
        return res.json(statusModel.failed({message: "password.is.missing"}));
    }
    if (!userData.address) {
        return res.json(statusModel.failed({message: "address.is.missing"}));
    }
    if (!userData.city) {
        return res.json(statusModel.failed({message: "city.is.missing"}));
    }
    if (!userData.state) {
        return res.json(statusModel.failed({message: "state.is.missing"}));
    }
    if (!userData.postcode) {
        return res.json(statusModel.failed({message: "postcode.is.missing"}));
    }
    if (!userData.country) {
        return res.json(statusModel.failed({message: "country.is.missing"}));
    }
    if (!userData.dob) {
        return res.json(statusModel.failed({message: "dob.is.missing"}));
    }
    if (!userData.gender) {
        return res.json(statusModel.failed({message: "gender.is.missing"}));
    }
    if (!userData.fullName) {
        return res.json(statusModel.failed({message: "fullname.is.missing"}));
    }
    if (!userData.mobileNo) {
        return res.json(statusModel.failed({message: "phoneNo.is.missing"}));
    }
    if (!userData.race) {
        return res.json(statusModel.failed({message: "race.is.missing"}));
    }
    if (!userData.religion) {
        return res.json(statusModel.failed({message: "religion.is.missing"}));
    }

    if (userData.userType === 1) {
        if (!userData.startDate) {
            return res.json(statusModel.failed({message: "start.date.is.missing"}));
        }
        if (!userData.position) {
            return res.json(statusModel.failed({message: "position.is.missing"}));
        }
        if (!userData.createdBy) {
            return res.json(statusModel.failed({message: "createdBy.is.missing"}));
        }
    }
}

const AuthController = {
    signUpFieldsValidation: signUpFieldsValidation,
    validateUsername: validateUsername,
    validateEmail: validateEmail,
    signup: signup,
    signin: signin,
    refreshToken: refreshToken,
    mobileSignIn: mobileSignIn
};

module.exports = AuthController;
