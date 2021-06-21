const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase:  true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength:  8,
  },
  bucket: {
    type: String,
    required: false,
  },
  queue: {
    type: String,
    required: false,
  },
  routing_key: {
    type: String,
    required: false,
  },
});

module.exports = new mongoose.model("User", UserSchema);
