import mongoose from "mongoose";

const FacultySchema = new mongoose.Schema(
  {

    fullName: {
      type: String,
      required: [true, "Faculty name is required."],
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
      required: [true, "Mobile number is required."],
      trim: true,
      unique: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid mobile number."],
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
  },
  {
    timestamps: true,
  },
);

//==============================
// Indexes
//==============================

// Speciality

FacultySchema.index({
  specialityId: 1,
});

//==============================
// JSON Transform
//==============================

FacultySchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});


//==============================
// Export
//==============================

const Faculty = mongoose.models.Faculty || mongoose.model("Faculty", FacultySchema);

export default Faculty;
