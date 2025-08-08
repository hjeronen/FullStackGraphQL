const mongoose = require('mongoose')

const uniqueValidator = require('mongoose-unique-validator')

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: 4,
  },
  born: {
    type: Number,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value',
    },
    min: [0, 'Born year must be a positive integer'],
  },
  bookCount: {
    type: Number,
    default: 0,
  },
})

schema.plugin(uniqueValidator)

module.exports = mongoose.model('Author', schema)
