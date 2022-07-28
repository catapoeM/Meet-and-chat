const mongoose = require('mongoose')

mongoose.set('autoIndex', true)

const messagesSchema = new mongoose.Schema({
  message: String,
  userName: String,
  date: String,
  likes: Number
})

module.exports = mongoose.model('Messages', messagesSchema)