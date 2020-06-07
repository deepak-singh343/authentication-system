const User = require("../models/user");
const bcrypt = require('bcryptjs');
const async = require('async');
const request = require('request');
const crypto = require('crypto');
const nodemailer = require("nodemailer");
const Reset = require('../models/reset_password');
//create a user
module.exports.create = function (req, res) {
  if (req.body.captcha === undefined || req.body.captcha === "" || req.body.captcha === null) {
    return res.json({ 'success': false, 'message': req.flash('error', 'Please select captcha') });
  }
  const secretKey = "6LcxrwAVAAAAANu_SIcbClbe1cJxTDAjI4ZJkwjP";
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

          // req.flash('success', 'User added Successfully');
          // return res.json({ 'success': true, 'message': 'successfully added' });
          // or simply
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
  console.log('inside create session');
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
      console.log("passwords dont match");
      return res.redirect('back');
    }
    console.log(req.user.id);
    let user = await User.findById(req.user.id);
    if (user) {
      let isMatch = await bcrypt.compare(req.body.old_password, user.password);
      console.log(isMatch);
      if (isMatch) {
        user.password = req.body.new_password;
        user.save();
        req.flash('success', 'Password updated successfully');
        console.log("password updated successfully");
      }
      console.log(isMatch);
      if (isMatch == false) {
        req.flash('error', 'Incorrect old password');
        console.log('old password do not match');
      }
    }
    else {
      req.flash('error', 'user not found');
      console.log("user not found");
    }
    return res.redirect('back');
  } catch (err) {
    console.log(err);
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

module.exports.PasswordResetReq = function (req, res) {
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      console.log('inside forget');
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
          user: 'deepak.negi343@gmail.com',
          pass: 1526001500037990
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'deepak.negi343@gmaail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/resetlogin/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        console.log('mail sent');
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

module.exports.resetPasswordlogin = async function (req, res) {
  console.log('inside reset');
  console.log(req.params.token);
  let reset = await Reset.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
  if (!reset) {
    req.flash('error', 'Password reset token is invalid or has expired.');
    return res.redirect('/users/sign-in');
  }
  console.log(reset);
  res.render('reset_password', { token: req.params.token });
};

module.exports.resetPassword = function (req, res) {
  console.log('inside reseter');
  async.waterfall([
    async function (done) {
      let reset = await Reset.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }).populate('user');
      if (!reset) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('back');
      }
      console.log(reset);
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
