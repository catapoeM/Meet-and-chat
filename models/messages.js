const mongoose = require('mongoose')

const messagesSchema = new mongoose.Schema({
  message: String,
  userName: String,
  date: String,
  likes: Number
})

module.exports = mongoose.model('Messages', messagesSchema)