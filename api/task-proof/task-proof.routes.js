require('dotenv').config()
const express = require("express");
const TaskProof = require("../../controller/task-proof/task-proof.controller");
const AuthMiddleware = require("../../middleware/auth/authmiddleware");
const router = express.Router();

router.use(AuthMiddleware.verifyToken,);

router.get('/find/tasks', TaskProof.getRouteAndTasks);
router.get('/start/route', TaskProof.orderRouteStart);
router.post('/create', TaskProof.createFailedTaskProof);
router.post('/create/proof', TaskProof.uploadFile.single('file'), TaskProof.createTaskProofWithImage);

module.exports = router;
