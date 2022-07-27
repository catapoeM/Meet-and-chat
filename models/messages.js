const mongoose = require('mongoose')

const messagesSchema = new mongoose.Schema({
  message: String,
  userName: String,
  date: String
})

module.exports = mongoose.model('Messages', messagesSchema)