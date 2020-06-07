const mongoose = require('mongoose');

const resetPasswordSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
});

const ResetPasswordToken = mongoose.model('ResetPasswordToken', resetPasswordSchema);
module.exports = ResetPasswordToken;