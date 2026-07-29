const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Account must be associated with a user"],
      index: true, // to increase search speed
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "FROZEN", "CLOSED"],
        message: "Status can be either ACTIVE, FROZEN or CLOSED",
        default: "ACTIVE",
      },
    },
    currency: {
      type: String,
      required: [true, "Currency is required for creating an account"],
      default: "taka",
    },
  },
  { timestamps: true },
);

accountSchema.index({ user: 1, staus: 1 }); //compound index

const accountModel = mongoose.model("account", accountSchema);
module.exports = accountModel;
