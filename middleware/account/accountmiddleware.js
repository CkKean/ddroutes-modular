const db = require("../../config/database");
const User = db.user;
const StatusModel = require("../../model/status.model");

checkDuplicateUsername = (req, res, next) => {
    let statusModel = new StatusModel();
    User.findOne({
        where: {
            username: req.body.username
        }
    }).then(user => {
        if (user) {
            res.json(
                statusModel.failed({message: "Failed! Username is already in use!"})
            );
            return;
        }
        next();
    });
};

const AccountMiddleware = {
    checkDuplicateUsername: checkDuplicateUsername
};

module.exports = AccountMiddleware;
