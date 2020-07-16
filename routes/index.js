//include express and create a router
const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home_controller");
router.get("/", homeController.home);

// //redirect all user related URLs to users.js
router.use("/users", require("./users"));

//export router
module.exports = router;
