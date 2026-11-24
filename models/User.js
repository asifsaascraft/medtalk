import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    //==============================
    // Basic Information
    //==============================

    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 150,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address.",
      ],
    },

    mobile: {
      type: String,
      trim: true,
      default: null,
    },

    affiliation: {
      type: String,
      required: [true, "Affiliation is required."],
      trim: true,
      minlength: 2,
      maxlength: 300,
    },

    specialityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Speciality",
      required: [true, "Speciality is required."],
    },

    profileImage: {
      type: String,
      default: null,
    },

    //==============================
    // Authentication
    //==============================

    password: {
      type: String,
      required: function () {
        return this.role === "admin";
      },
      minlength: 8,
      maxlength: 128,
      select: false,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    //==============================
    // Authorization
    //==============================

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },

    //==============================
    // Account Status
    //==============================

    status: {
      type: String,
      enum: ["pending", "active"],
      default: "active",
      index: true,
    },

    //==============================
    // User OTP Authentication
    //==============================

    otpHash: {
      type: String,
      select: false,
      default: null,
    },

    otpExpiresAt: {
      type: Date,
      default: null,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },

    otpLastSentAt: {
      type: Date,
      default: null,
    },

    otpLockedUntil: {
      type: Date,
      default: null,
    },

    otpChannel: {
      type: String,
      enum: ["email", "mobile", null],
      default: null,
    },

    //==============================
    // Admin Login Security
    //==============================

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    loginCount: {
      type: Number,
      default: 0,
    },

    //==============================
    // Password Reset (Admin)
    //==============================

    passwordResetToken: {
      type: String,
      select: false,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },

    //==============================
    // Two Factor Authentication
    // Future
    //==============================

    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: {
      type: String,
      select: false,
      default: null,
    },

    //==============================
    // Preferences
    //==============================

    language: {
      type: String,
      trim: true,
      default: "en",
    },

    timezone: {
      type: String,
      trim: true,
      default: "Asia/Kolkata",
    },
  },
  {
    timestamps: true,
  },
);

//==============================
// Indexes
//==============================

// Only one admin account can exist.

UserSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: "admin",
    },
  },
);

// User role and status

UserSchema.index({
  role: 1,
  status: 1,
});

// Created date

UserSchema.index({
  createdAt: -1,
});

// Speciality

UserSchema.index({
  specialityId: 1,
});

//==============================
// Virtuals
//==============================

UserSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.virtual("isOtpLocked").get(function () {
  return !!(this.otpLockedUntil && this.otpLockedUntil > Date.now());
});

//==============================
// Pre Save Hook
//==============================

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  if (!this.isNew) {
    this.passwordChangedAt = new Date();
  }
});

//==============================
// Instance Methods
//==============================

// Compare Password (Admin)

UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(enteredPassword, this.password);
};

// Check Password Changed After JWT

UserSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (!this.passwordChangedAt || !JWTTimestamp) {
    return false;
  }

  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);

  return JWTTimestamp < changedTimestamp;
};

// Increase Failed Login Attempts (Admin)

UserSchema.methods.incrementLoginAttempts = async function () {
  this.failedLoginAttempts += 1;

  if (this.failedLoginAttempts >= 3) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }

  await this.save();
};

// Reset Failed Login Attempts

UserSchema.methods.resetLoginAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;

  await this.save();
};

// Update Login Information

UserSchema.methods.updateLoginInfo = async function () {
  this.lastLoginAt = new Date();
  this.loginCount += 1;

  this.failedLoginAttempts = 0;
  this.lockUntil = null;

  await this.save();
};

//==============================
// JSON Transform
//==============================

UserSchema.set("toJSON", {
  virtuals: true,

  transform(doc, ret) {
    [
      "password",
      "otpHash",
      "passwordResetToken",
      "passwordResetExpires",
      "twoFactorSecret",
      "__v",
    ].forEach((field) => delete ret[field]);

    return ret;
  },
});

//==============================
// Export
//==============================

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
