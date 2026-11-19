
import mongoose from "mongoose";

const ConferenceSchema = new mongoose.Schema(
  {
    conferenceName: {
      type: String,
      required: [true, "Conference name is required."],
      trim: true,
      unique: true,
      maxlength: [150, "Conference name cannot exceed 150 characters."],
    },

    specialityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Speciality",
      required: [true, "Speciality is required."],
    },

    startDateTime: {
      type: Date,
      required: [true, "Start date time is required."],
    },

    endDateTime: {
      type: Date,
      required: [true, "End date time is required."],
      validate: {
        validator: function (value) {
          if (!this.startDateTime || !value) return true;
          return value >= this.startDateTime;
        },
        message:
          "End date time must be greater than or equal to start date time.",
      },
    },

    venue: {
      type: String,
      required: [true, "Venue is required."],
      trim: true,
    },

    conferenceType: {
      type: String,
      enum: {
        values: ["Paid", "Free", "Restricted"],
        message: "Conference type must be Paid, Free, or Restricted.",
      },
      required: [true, "Conference type is required."],
    },

    amount: {
      type: Number,
      min: [0, "Amount cannot be negative."],
      required: function () {
        return this.conferenceType === "Paid";
      },
      validate: {
        validator: function (value) {
          if (this.conferenceType !== "Paid") {
            return value === undefined || value === null;
          }
          return value !== undefined && value !== null;
        },
        message:
          "Amount is only allowed for Paid conferences.",
      },
    },

    image: {
      type: String,
      required: [true, "Image is required."],
      trim: true,
    },

    banner: {
      type: String,
      required: [true, "Banner is required."],
      trim: true,
    },

    brochureUpload: {
      type: String,
      required: [true, "Brochure is required."],
      trim: true,
    },

    status: {
      type: String,
      enum: {
        values: ["Active", "Inactive"],
        message: "Status must be Active or Inactive.",
      },
      default: "Active",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
ConferenceSchema.index({ createdAt: -1 });

// Dynamic Conference Status
ConferenceSchema.virtual("dynamicStatus").get(function () {
  if (!this.startDateTime || !this.endDateTime) {
    return null;
  }

  const now = new Date();

  if (now < this.startDateTime) {
    return "Upcoming";
  }

  if (now > this.endDateTime) {
    return "Past";
  }

  return "Live";
});

// JSON Transform
ConferenceSchema.set("toJSON", {
  virtuals: true,

  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

// Export
const Conference =
  mongoose.models.Conference ||
  mongoose.model("Conference", ConferenceSchema);

export default Conference;
