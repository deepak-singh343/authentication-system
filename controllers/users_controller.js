const User = require("../models/user");
const Reset = require('../models/reset_password');

const bcrypt = require('bcryptjs');

const async = require('async');

const request = require('request');

const crypto = require('crypto');

const nodemailer = require("nodemailer");



//create a user
module.exports.create = function (req, res) {
  if (req.body.captcha === undefined || req.body.captcha === "" || req.body.captcha === null) {
    return res.json({ 'success': false, 'message': req.flash('error', 'Please select captcha') });
  }
  const secretKey = "6Lef-rEZAAAAAGVP47_7lME_9obNwVtlJ88YaDE3";
  const verifyUrl = `https://google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}&remoteip=${req.connection.remoteAddress}`;
  request(verifyUrl, (err, response, body) => {
    body = JSON.parse(body);
    if (body.success !== undefined && !body.success) {
      return res.json({ 'success': false, 'message': req.flash('error', 'Captcha failed') });
    }
    User.findOne({ email: req.body.email }, function (err, user) {
      if (err)
        console.log("Error", err);
      if (!user) {
        User.create(req.body, function (err, user) {
          if (err)
            console.log("error", err);
          return res.json({ 'success': true, 'message': req.flash('success', 'User added successfully') });
        });
      }
      else {
        return res.json({ 'success': false, 'message': req.flash('error', 'Already signed up.Login to continue') });

      }
    });
  });
};

module.exports.signIn = function (req, res) {
  if (req.isAuthenticated()) {
    return res.render('home', {
      title: "Auth-Sys | Home"
    });
  }
  return res.render('sign_in', {
    title: "Auth-Sys | SignIn"
  });
}


//create a news session when user signs in through passport
module.exports.createSession = function (req, res) {
  req.flash('success', 'Logged in Successfully');
  res.redirect('/');
}

//destroy session when user signs out
module.exports.destroySession = function (req, res) {
  req.logout();
  req.flash('success', 'Logged out Successfully');
  return res.redirect('/');
}

//update password after signing in
module.exports.updatePassword = async function (req, res) {
  try {
    // //if new password doesnt match
    if (req.body.new_password != req.body.confirm_password) {
      req.flash('error', 'Passwords dont match');
      return res.redirect('back');
    }
    let user = await User.findById(req.user.id);
    if (user) {
      let isMatch = await bcrypt.compare(req.body.old_password, user.password);
      if (isMatch) {
        user.password = req.body.new_password;
        user.save();
        req.flash('success', 'Password updated successfully');
      }
      if (isMatch == false) {
        req.flash('error', 'Incorrect old password');
      }
    }
    else {
      req.flash('error', 'user not found');
    }
    return res.redirect('back');
  } catch (err) {
    req.flash('error', 'Internal system error');
    return res.redirect('back');
  }
}

//render forgot password page
module.exports.forgotPassword = function (req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('home');
  }
  return res.render('forgot_password', {
    title: "Auth-Sys | Forgot Password"
  });
}

//send reset password link when the user forgot his password
module.exports.PasswordResetReq = function (req, res) {
  async.waterfall([                                    
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      User.findOne({ email: req.body.email }, function (err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }
        let reset = Reset.create({
          user: user._id,
          resetPasswordToken: token,
          resetPasswordExpires: Date.now() + 600000
        });
        user.save(function (err) {
          done(err, token, user);
        });
      });
    },
    function (token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'your emailid',
          pass: 'your email password'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'administrator email',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/resetlogin/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function (err) {
    if (err) {
      req.flash('error', 'Failed to send');
      return next(err);
    }
    res.redirect('/users/sign-in');
  });
}

//render reset password page from the received reset password link
module.exports.resetPasswordlogin = async function (req, res) {
  let reset = await Reset.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
  if (!reset) {
    req.flash('error', 'Password reset token is invalid or has expired.');
    return res.redirect('/users/sign-in');
  }
  res.render('reset_password', { token: req.params.token });
};

//reset the password from the mailed reset password link
module.exports.resetPassword = function (req, res) {
  async.waterfall([
    async function (done) {
      let reset = await Reset.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }).populate('user');
      if (!reset) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('back');
      }
      if (req.body.password === req.body.confirm_password) {
        reset.user.password = req.body.password;
        reset.user.save();
        req.flash("success", "Password reset.Please login to continue");
      } else {
        req.flash("error", "Passwords do not match");
        return res.redirect('back');
      }
    }
  ], function (err) {
    res.redirect('/users/sign-in');
  });
};
