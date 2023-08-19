const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ShopsSchema = new Schema({
  address: {
    type: String,
    required: true,
    unique:true
  },
  latitude:{
    type:Number,
    required: false,
    default: 0
  },
  longitude:{
    type: Number,
    required: false,
    default: 0
  },
  photoURL: {
    type: String,
    required:false,
  },
});

module.exports = mongoose.model("Shops", ShopsSchema);
