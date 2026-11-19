
import mongoose from "mongoose";

const HallSchema = new mongoose.Schema(
  {
    conferenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conference",
      required: [true, "Conference is required."],
      index: true,
    },

    hallName: {
      type: String,
      required: [true, "Hall Name is required."],
      trim: true,
      minlength: [2, "Hall Name must be at least 2 characters."],
      maxlength: [100, "Hall Name cannot exceed 100 characters."],
    },

    streamLink: {
      type: String,
      required: [true, "Video link is required."],
      trim: true,
      validate: {
        validator(value) {
          try {
            const url = new URL(value);
            return ["http:", "https:"].includes(url.protocol);
          } catch {
            return false;
          }
        },
        message: "Please provide a valid HTTP or HTTPS stream link.",
      },
    },

    status: {
      type: String,
      enum: {
        values: ["Active", "Inactive"],
        message: "Status must be Active or Inactive.",
      },
      default: "Active",
      required: [true, "Status is required."],
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate hall names inside the same conference.
HallSchema.index(
  { conferenceId: 1, hallName: 1 },
  { unique: true },
);

// Improve common conference hall queries.
HallSchema.index({ conferenceId: 1, status: 1, createdAt: -1 });

// JSON Transform
HallSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Hall =
  mongoose.models.Hall || mongoose.model("Hall", HallSchema);

export default Hall;
