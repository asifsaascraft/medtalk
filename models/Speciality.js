import mongoose from "mongoose";

const SpecialitySchema = new mongoose.Schema(
  {
    specialityName: {
      type: String,
      required: [true, "Speciality name is required."],
      trim: true,
      unique: true,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  },
);


// JSON Transform
SpecialitySchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

// Export
const Speciality =
  mongoose.models.Speciality ||
  mongoose.model("Speciality", SpecialitySchema);

export default Speciality;