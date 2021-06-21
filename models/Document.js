const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  original_name: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: false,
  },
  doc_size: {
    type: String,
    required: false,
  },
  conv_time: {
    type: Number,
    required: false,
  },
  content: {
    type: JSON,
    required: false,
  },
  created_at: {
    type: Date,
    required: true,
  },
  expired_at: {
    type: Date,
    required: true,
  },
});

module.exports = new mongoose.model("Document", DocumentSchema);
