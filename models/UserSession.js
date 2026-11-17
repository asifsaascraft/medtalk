
import mongoose from "mongoose";

const UserSessionSchema = new mongoose.Schema(
  {
    // User Reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Session Information
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },

    // Device Information
    deviceId: {
      type: String,
      default: null,
    },

    deviceName: {
      type: String,
      default: null,
    },

    browser: {
      type: String,
      default: null,
    },

    operatingSystem: {
      type: String,
      default: null,
    },

    platform: {
      type: String,
      default: null,
    },

    appVersion: {
      type: String,
      default: null,
    },

    // Network Information
    ipAddress: {
      type: String,
      default: null,
    },

    location: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    // Session Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    loggedOutAt: {
      type: Date,
      default: null,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revokeReason: {
      type: String,
      enum: [
        "logout",
        "logout_all",
        "password_changed",
        "admin_action",
        "expired",
        "new_login",
      ],
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Only one active session per user.
// Inactive historical sessions are allowed.
UserSessionSchema.index(
  { user: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true,
    },
  },
);

// Session expiry: MongoDB deletes expired records automatically.
UserSessionSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  },
);

// Virtual
UserSessionSchema.virtual("isExpired").get(function () {
  return this.expiresAt <= new Date();
});

// Update last activity at most once every five minutes.
UserSessionSchema.methods.touch = async function () {
  const now = new Date();

  if (
    !this.lastActivityAt ||
    now.getTime() - this.lastActivityAt.getTime() >
      5 * 60 * 1000
  ) {
    this.lastActivityAt = now;
    await this.save();
  }
};

// Revoke session
UserSessionSchema.methods.revoke = async function (
  reason = "logout",
) {
  this.isActive = false;
  this.loggedOutAt = new Date();
  this.revokedAt = new Date();
  this.revokeReason = reason;

  await this.save();
};

// JSON Transform
UserSessionSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.refreshTokenHash;
    delete ret.__v;

    return ret;
  },
});

// Export
const UserSession =
  mongoose.models.UserSession ||
  mongoose.model("UserSession", UserSessionSchema);

export default UserSession;
