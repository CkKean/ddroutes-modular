const jwt = require("jsonwebtoken");
const config = require("../../config/auth.config");
const db = require("../../config/database");
const {EmployeePositionConstant} = require("../../constant/employee-position.constant");
const {UserTypeConstant} = require("../../constant/user-type.constant");
const User = db.user;

verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    const token = bearerHeader && bearerHeader.split(" ")[1];
    if (!token) {
        return res.status(401).send({
            message: "No token provided!"
        });
    }

    jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
            return res.status(403).send({
                message: err.message
            });
        }
        req.userId = decoded.id;
        next();
    })
};

isSuperAdmin = (req, res, next) => {
    User.findByPk(req.userId).then(user => {
        if (user.userType === UserTypeConstant.SA) {
            return next();
        }
        res.status(403).send({
            message: "Require Admin Role.",
            status: "access.denied"
        });

    })
};

isStaff = (req, res, next) => {
    User.findByPk(req.userId).then(user => {
        if (user.userType === UserTypeConstant.S) {
            next();
            return;
        }
        res.status(403).send({
            message: "Require Staff Role.",
            status: "access.denied"
        });

    })
};

requireStaffOrSuperAdmin = (req, res, next) => {
    User.findByPk(req.userId).then(user => {
        if ((user.userType === UserTypeConstant.S || user.userType === UserTypeConstant.SA) &&
            (user.position === EmployeePositionConstant.BO || user.position === EmployeePositionConstant.SA)) {
            next();
            return;
        }
        res.status(403).send({
            message: "Require Staff or Super Admin Role.",
            status: "access.denied"
        });

    })
};

requireCourierPersonnelOrSuperAdmin = (req, res, next) => {
    User.findByPk(req.userId).then(user => {
        if (user.userType === UserTypeConstant.S && (user.position === EmployeePositionConstant.CP || user.position === EmployeePositionConstant.SA || user.position === EmployeePositionConstant.CP_PT)) {
            next();
            return;
        }
        res.status(403).send({
            message: "Require Staff role and position Courier Personnel.",
            status: "access.denied"
        });

    })
}


isNormalUser = (req, res, next) => {
    User.findByPk(req.userId).then(user => {
        if (user.userType === UserTypeConstant.NU) {
            next();
            return;
        }
        res.status(403).send({
            message: "Require User Role!",
            status: "access.denied"
        });

    })
};

const AuthMiddleware = {
    verifyToken: verifyToken,
    isSuperAdmin: isSuperAdmin,
    isStaff: isStaff,
    isNormalUser: isNormalUser,
    requireStaffOrSuperAdmin: requireStaffOrSuperAdmin,
    requireCourierPersonnelOrSuperAdmin: requireCourierPersonnelOrSuperAdmin
};

module.exports = AuthMiddleware;
