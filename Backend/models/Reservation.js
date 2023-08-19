const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reservationSchema = new Schema({
  orderNumber: {
    type: Number,
    required: true,
    unique:true
  },
  email: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  price: {
    type:Number,
    required:true,
  },
  content: {
    type:String,
    required:true,
  },
});

module.exports = mongoose.model("Reservation", reservationSchema);
