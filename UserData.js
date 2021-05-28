const { text } = require('body-parser') // used as middleware to get data in a structured manner 
var mongoose = require('mongoose')
const userSchema = mongoose.Schema({
  email: {
    type: String,
    require: true,
    unique: true
  },
  password: {
    type: String,
    require: true
  },
  name: {
    type: String,
    require: true
  },
  phone: {
    type: Number,
    require: true
  },
  address: {
    type: String,
    require: true
  },
  dob: {
    type: Date,
    require: true
  }
});

module.exports = User = mongoose.model('userSchema', userSchema);