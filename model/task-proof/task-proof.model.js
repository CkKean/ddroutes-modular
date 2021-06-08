module.exports = (sequelize, Sequelize) => {
    const taskProof = sequelize.define("task_proof", {
            proofId: {
                type: Sequelize.STRING,
                primaryKey: true,
                field: "proof_id"
            },
            courierPersonnelId: {
                type: Sequelize.STRING,
                allowNull: false,
                field: "courier_personnel_id"
            },
            signature: {
                type: Sequelize.STRING,
                allowNull: true,
                field: "signature"
            },
            signaturePath: {
                type: Sequelize.STRING,
                allowNull: true,
                field: "signature_path"
            },
            status: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            reason: {
                type: Sequelize.STRING,
                allowNull: true,
                field: "reason"
            },
            recipientName: {
                type: Sequelize.STRING,
                allowNull: true,
                field: "recipient_name"
            },
            recipientIcNo: {
                type: Sequelize.STRING,
                allowNull: true,
                field: "recipient_ic_no"
            },
            arrivedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                field: "arrived_at"
            },
            pickedAt: {
                type: Sequelize.DATE,
                allowNull: true,
                field: "picked_at"
            },
            receivedAt: {
                type: Sequelize.DATE,
                allowNull: true,
                field: "received_at"
            },
            createdBy: {
                type: Sequelize.STRING,
                allowNull: false,
                field: "created_by"
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                field: "created_at"
            },
            updatedBy: {
                type: Sequelize.STRING,
                field: "updated_by"
            },
            updatedAt: {
                type: Sequelize.DATE,
                field: "updated_at"
            }
        },
        {
            tableName: 'task_proof',
            freezeTableName: true, // Model tableName will be the same as the model name
            timestamps: false,
        });

    return taskProof;
}
