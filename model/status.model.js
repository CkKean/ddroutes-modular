"use strict";

class StatusModel {

    success(data) {
        return {
            success: true,
            data: data
        }
    }

    failed({errorCode, message}) {
        return {
            success: false,
            message: message,
            errorCode: errorCode
        }
    }
}

module.exports = StatusModel;
