const mongoose = require('mongoose');

const noteSchema = mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
