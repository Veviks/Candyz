const mongoose = require("mongoose");
const config = require("config");  //The config package is used to manage configuration settings for the application.
const db = config.get("mongoURI");

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify:false,
      debug: true
    });

    console.log("MongoDB connected");
  } catch (error) {
    console.log("Something went wrong with Database connection " + error);
    process.exit(1);
  }
};

module.exports = connectDB;
