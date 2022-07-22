const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: String,
  pass: String,
  birthday: Date
})

module.exports = mongoose.model('User', userSchema)
