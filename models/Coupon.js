import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    conferenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conference",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    mobile: {
      type: String,
      default: null,
    },

    couponCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },

    importedAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["Unused", "Used", "Expired"],
      default: "Unused",
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate coupon for same email in same conference
CouponSchema.index(
  {
    conferenceId: 1,
    email: 1,
  },
  {
    unique: true,
  },
);

CouponSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Coupon =
  mongoose.models.Coupon ||
  mongoose.model("Coupon", CouponSchema);

export default Coupon;