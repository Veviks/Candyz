const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const gelateriaSchema = new Schema({
  address: {
    type: String,
    required: true,
    unique:true
  },
  latitude:{
    type:Number,
    required: true,
  },
  longitude:{
    type: Number,
    required:true,
  },
  photoURL: {
    type: String,
    required:false,
  },
});

module.exports = mongoose.model("Gelateria", gelateriaSchema);
