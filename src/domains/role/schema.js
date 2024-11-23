const mongoose = require('mongoose');
const { baseSchema } = require('../../libraries/db/base-schema');

const permissionSchema = new mongoose.Schema({
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true,
  },
  canAccess: {
    type: Boolean,
    default: false,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
});

const roleSchema = new mongoose.Schema({
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
  permissions: [permissionSchema],
  isSystem: {
    type: Boolean,
    default: false,
  },
});

roleSchema.add(baseSchema);

module.exports = mongoose.model('Role', roleSchema);
