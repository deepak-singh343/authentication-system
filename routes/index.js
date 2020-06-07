//include express and create a router
const express = require("express");
const router = express.Router();
console.log('home route');
const homeController = require("../controllers/home_controller");
router.get("/", homeController.home);

// //redirect all user related URLs to users.js
console.log('users route');
router.use("/users", require("./users"));

//export router
module.exports = router;
