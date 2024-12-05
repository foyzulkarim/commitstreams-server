const mongoose = require('mongoose');
const { baseSchema } = require('../../libraries/db/base-schema');

const resourceSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    index: true,
  },
  description: {
    type: String,
    default: '',
  },
  identifier: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['api', 'ui', 'menu'],
    default: 'api',
    index: true,
  },
  module: {
    type: String,
    required: true,
    index: true,
  },
});

resourceSchema.add(baseSchema);

module.exports = mongoose.model('Resource', resourceSchema);
