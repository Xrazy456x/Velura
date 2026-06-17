import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      index: true
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true
    }
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function toSafeObject() {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

export default mongoose.model("User", userSchema);
