const mongoose = require('mongoose')

const messagesSchema = new mongoose.Schema({
  message: String,
  userName: String,
  date: String,
  likes: Number,
  whoLiked: [String]
})

module.exports = mongoose.model('Messages', messagesSchema)