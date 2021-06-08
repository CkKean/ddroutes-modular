require('dotenv').config();
const express = require("express");
const router = express.Router();
const AuthController = require("../../controller/auth/auth.controller");
const AccountMiddleware = require("../../middleware/account/accountmiddleware");

router.post('/verify/username', AuthController.validateUsername);

router.post('/verify/email', AuthController.validateEmail);

router.post('/signup', AccountMiddleware.checkDuplicateUsername, AuthController.signup);

router.post('/signin', AuthController.signin);

router.post('/refresh-token', AuthController.refreshToken);

router.post('/mobile/signin', AuthController.mobileSignIn);

module.exports = router;

