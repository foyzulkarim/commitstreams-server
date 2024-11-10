const mongoose = require('mongoose');
const { baseSchema } = require('../../libraries/db/base-schema');

const schema = new mongoose.Schema({
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
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isSystem: {
    type: Boolean,
    default: false  // To mark system-level roles like 'superadmin'
  }
});

schema.add(baseSchema);

module.exports = mongoose.model('Role', schema);
