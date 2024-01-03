const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },

  // this below property is used for protection,
  // becuase lets say a user logs in, and gains JWT key,
  // and then changes his password
  // (whenever the password is changed we assign this property current timestamp)
  // So whenever the user will make use of his JWT (passport) we will
  // check with help of this property, whether his JWT is still valid or not
  // We do so, by compairing the jwt (initiation time) & this property
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// Query Middleware
userSchema.pre(/^find/, async function(next) {
  this.find({ active: { $ne: false } });
  next();
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
userSchema.pre('save', async function(next) {
  // Only run this funtion if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password before saving
  this.password = await bcrypt.hash(this.password, 12);

  // passwordConfirm field should not be stored
  this.passwordConfirm = undefined;
  next();
});

// Setting PasswordChangedAt Property
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// This verifies the password when user logsIn
userSchema.methods.correctPassword = async function(
  candidatePassword,
  password
) {
  return await bcrypt.compare(candidatePassword, password);
};

// To Check if User has not changed Password
userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return changedTimeStamp > JWTTimeStamp;
  }

  // False means Not Changed - Default
  return false;
};

// Create Password Reset Token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
