// Require build in crypto module
const crypto = require('crypto');

// Import Mongoose Package
const mongoose = require('mongoose');

// Require the validator 3rd party package
const validator = require('validator');

// Requre Bcrypt package
const bcrypt = require('bcrypt');

// Create Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    lowercase: true, //transform the email to lowercase
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // This will prevent client from selecting the password field
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide a password confirm'],

    //Custom validation
    validate: {
      validator: function (el) {
        // This only work on CREATE and SAVE!!!
        return el === this.password; //abc === abc -> true
      },
      message: 'Password are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpire: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // we only going to update the password if the password field is updated
  // this refer to the current document
  // Only run this function only if the password was actually modified
  if (!this.isModified('password')) return next();

  // Encrypt or hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete the password confirm field
  this.passwordConfirm = undefined;

  next();
});

// WHENEVER WE RESET OR UPDATE PASSWORD -> THE PASSWORD DATE WILL BE UPDATED
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// /^find/ => target all query methods that start with "find."
userSchema.pre(/^find/, function (next) {
  // QUERY MIDDLEWARE -> "this" point to the current query
  this.find({ active: { $ne: false } });

  next();
});

/** CREATE AN INSTANCE METHOD
 *    - The name can be anything
 *    - return a boolean value
 */
userSchema.methods.comparePasswordInDB = async function (pswd, pswdDB) {
  // this is an async function
  return await bcrypt.compare(pswd, pswdDB);
};

/** CREATE AN INSTANCE METHOD */
userSchema.methods.changedPasswordAfter = function (JWTtimestamp) {
  // If the user changed the password
  if (this.passwordChangedAt) {
    // Convert timestamp to date
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    console.log(changedTimestamp, JWTtimestamp);
    return JWTtimestamp < changedTimestamp;
  }

  // FALSE MEANS NOT CHANGED
  return false;
};

/** INSTANCE METHOD */
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  // Provide 10 minutes
  this.passwordResetExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.updatePassword = function (updatePassword) {};

// Create Model from the schema above
const User = mongoose.model('User', userSchema);

// Export the schema
module.exports = User;
