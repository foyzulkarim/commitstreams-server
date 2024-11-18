const mongoose = require('mongoose');
const { baseSchema } = require('../../libraries/db/base-schema');

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  identifier: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['api', 'ui', 'menu'],
    default: 'api',
  },
});

resourceSchema.add(baseSchema);

module.exports = mongoose.model('Resource', resourceSchema);
