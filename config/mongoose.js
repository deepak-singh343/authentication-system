//include mongoose
const mongoose = require("mongoose");

//connect to the authentication system database
mongoose.connect("mongodb://localhost/auth_system",{ useNewUrlParser: true,useUnifiedTopology: true });

//check if connected to the database
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Error in connecting to db"));
db.once("open", function () {
  // if connected
  console.log("Successfully connected to the database");
});

//export the database
module.exports = db;
