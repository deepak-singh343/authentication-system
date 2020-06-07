//include passport
const passport = require("passport");
const bcrypt = require('bcryptjs');
//include passport's local startegy
const LocalStrategy = require("passport-local").Strategy;
//include user model
const User = require("../models/user");

//Authentication using passport
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passReqToCallback: true,
    },
    function (req, email, password, done) {
      User.findOne({ email: email }, function (err, user) {
        //if error
        if (err) {
          req.flash('error', err);
          console.log("Error in finding user");
          return done(err);
        }
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err)
            throw err;
          if (isMatch) {
            console.log('password matches');
            return done(null, user);
          }
          else {
            req.flash('error', 'Incorrect username/password');
            console.log("Inavlid username/password");
          }

          return done(null, false, { message: 'password incorrect' });
        });
      });
    })
);

// serializing the user to decide which values is kept in the cookies
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

//deserializing the user from cookies
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    if (err) {
      console.log("Error in finding user --> Passport");
      return done(err);
    }
    return done(null, user);
  });
});

passport.checkAuthentication = function (req, res, next) {
  //if the user is signed in pass on the request to next function (controller's action)
  if (req.isAuthenticated()) {
    return next();
  }

  //if the user is not signed in
  return res.redirect("/users/sign_in");
};

passport.setAuthenticatedUser = function (req, res, next) {
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
  }
  next();
};

module.exports = passport;
