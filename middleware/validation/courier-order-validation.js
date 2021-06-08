const StatusModel = require("../../model/status.model");
const statusModel = new StatusModel();

fieldsValidation = (req, res, next) => {
    if (!req.body.orderType) {
        return res.json(statusModel.failed({message: "Order type is missing."}));
    }

    if (!req.body.vehicleType) {
        return res.json(statusModel.failed({message: "Vehicle type is missing."}));
    }

    if (!req.body.senderName) {
        return res.json(statusModel.failed({message: "Sender name is missing."}));
    }
    if (!req.body.senderMobileNo) {
        return res.json(statusModel.failed({message: "Sender mobile number is missing."}));
    }
    if (!req.body.senderAddress) {
        return res.json(statusModel.failed({message: "Sender address is missing."}));
    }
    if (!req.body.senderCity) {
        return res.json(statusModel.failed({message: "Sender city is missing."}));
    }
    if (!req.body.senderState) {
        return res.json(statusModel.failed({message: "Sender state is missing."}));
    }
    if (!req.body.senderPostcode) {
        return res.json(statusModel.failed({message: "Sender postcode is missing."}));
    }

    if (!req.body.recipientName) {
        return res.json(statusModel.failed({message: "Recipient name is missing."}));
    }
    if (!req.body.recipientMobileNo) {
        return res.json(statusModel.failed({message: "Recipient mobile number is missing."}));
    }
    if (!req.body.recipientAddress) {
        return res.json(statusModel.failed({message: "Recipient address is missing."}));
    }
    if (!req.body.recipientCity) {
        return res.json(statusModel.failed({message: "Recipient city is missing."}));
    }
    if (!req.body.recipientState) {
        return res.json(statusModel.failed({message: "Recipient state is missing."}));
    }
    if (!req.body.recipientPostcode) {
        return res.json(statusModel.failed({message: "Recipient postcode is missing."}));
    }

    if (!req.body.itemQty) {
        return res.json(statusModel.failed({message: "Item quantity is missing."}));
    }
    if (!req.body.itemType) {
        return res.json(statusModel.failed({message: "Item type is missing."}));
    }
    if (!req.body.itemWeight) {
        return res.json(statusModel.failed({message: "Item weight is missing."}));
    }
    next();
}

updateFieldValidation = (req, res, next) => {
    if (!req.body.orderNo) {
        return res.json(statusModel.failed({message: "Order number is missing."}));
    }
    if (!req.body.orderId) {
        return res.json(statusModel.failed({message: "Order id is missing."}));
    }
    next();
}

const CourierOrderValidation = {
    fieldsValidation: fieldsValidation,
    updateFieldValidation: updateFieldValidation
};

module.exports = CourierOrderValidation;
