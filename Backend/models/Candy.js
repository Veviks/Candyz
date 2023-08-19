const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CandySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  flavor: {
    type: String,
    default: 'None'
  },
  quantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  photoURL: {
    type: String,
    required: false
  },
  countOrdered: {
    type: Number,
    required: false
  },
});

module.exports = mongoose.model("Candy", CandySchema);
