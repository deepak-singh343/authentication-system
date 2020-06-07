// //include express and create a router
const express = require("express");
const router = express.Router();

// //passport to authenticate user during login
const passport = require("passport");

const usersController = require("../controllers/users_controller");

router.post('/sign_up', usersController.create);
router.get('/sign-in', usersController.signIn);
router.get('/sign-out', usersController.destroySession);
// router.get('/activate-account', usersController.activateAccount)
router.get('/resetlogin/:token', usersController.resetPasswordlogin);
router.post('/reset/:token', usersController.resetPassword);
// router.get('/home', usersController.home);

// //use recaptcha as a middleware to authenticate
// router.post('/create', recaptcha.middleware.verify = verifyCaptcha, usersController.createAccount);

// //use recaptcha and passport as a middleware to authenticate
router.post('/createSession', passport.authenticate(
    'local',
    { failureRedirect: '/users/sign-in' }
), usersController.createSession);

router.post('/update-password', usersController.updatePassword);
router.get('/forgot-password', usersController.forgotPassword);
router.post('/reset-req', usersController.PasswordResetReq);
// router.post('/create-new-password', usersController.createNewPassword);

// //export router
module.exports = router;
