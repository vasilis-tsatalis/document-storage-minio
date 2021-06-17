const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  doc_size: {
    type: BigInt,
    required: true,
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
