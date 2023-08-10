const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const iceCreamSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique:true
  },
  flavor: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type:Number,
    required:false,
  },
  photoURL: {
    type: String,
    required:false,
  },
  countOrdered:{
    type:Number,
    required:false,
  },
});

module.exports = mongoose.model("IceCream", iceCreamSchema);
