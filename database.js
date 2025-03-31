const mongoose = require("mongoose");
const { Schema, model } = mongoose;
// Define schema for the parcels
export const ParcelSchema = new Schema({
  sender: {
    name: String,
    phone: String,
    address: String,
    postalCode: String,
  },
  recipient: {
    name: String,
    phone: String,
    address: String,
    postalCode: String,
  },
  parcel: {
    weight: Number, // grams
    type: String,
    note: String,
  },
  cod: {
    value: Number,
    product: {
      category: String,
      type: String,
      size: String,
      color: String,
      quantity: Number,
    },
  },
});
const ParcelSchema = new mongoose.Schema({ sender: Object,recipient: Object, })
// Create Mongoose model
export const Parcel = model("Parcel", ParcelSchema);
module.exports = mongoose.model("Parcel", ParcelSchema);
