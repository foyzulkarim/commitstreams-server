const mongoose = require('mongoose');
const { baseSchema } = require('../../libraries/db/base-schema');

const schema = new mongoose.Schema({
  // Core user fields
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  displayName: {
    type: String,
    required: false,
  },

  // Auth type identifier
  authType: {
    type: String,
    required: true,
    enum: ['local', 'google', 'github'],
  },

  // Auth-specific fields
  local: {
    username: {
      type: String,
      sparse: true,
    },
    password: {
      type: String,
    },
  },

  google: {
    id: { type: String },
    email: { type: String },
    picture: { type: String },
  },

  github: {
    id: {
      type: String,
    },
    nodeId: {
      type: String,
    },
    profileUrl: {
      type: String,
    },
    avatarUrl: {
      type: String,
    },
    apiUrl: {
      type: String,
    },
    company: {
      type: String,
    },
    blog: {
      type: String,
    },
    location: {
      type: String,
    },
    hireable: {
      type: Boolean,
    },
    bio: {
      type: String,
    },
    public_repos: {
      type: Number,
    },
    public_gists: {
      type: Number,
    },
    followers: { type: Number },
    following: { type: Number },
    created_at: { type: Date },
    updated_at: { type: Date },
    accessToken: {
      type: String,
    },
    accessTokenIV: {
      type: String,
    },
  },

  // Email verification fields
  verificationToken: {
    type: String,
    sparse: true,
  },
  verificationTokenExpiry: {
    type: Date,
  },

  // Auth and status flags
  isDemo: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isSuperAdmin: {
    type: Boolean,
    default: false,
  },
  isDeactivated: {
    type: Boolean,
    default: false,
  },

  // Commitstreams related
  csFollowers: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId },
      date: { type: Date, default: Date.now },
    },
  ],
  csFollowing: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId },
      date: { type: Date, default: Date.now },
    },
  ],
  csFollowingRepositories: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId },
      date: { type: Date, default: Date.now },
    },
  ],
  // Roles related
  role: {
    type: String,
    required: true,
    default: 'visitor',
  },
});

schema.add(baseSchema);

// Current problematic logic
schema.pre('save', function (next) {
  const authMethods = ['local', 'google', 'github'];

  // Better check for populated methods
  const populatedMethods = authMethods.filter((method) => {
    const authData = this[method];
    // Check if the auth data exists and has actual values
    return (
      authData &&
      typeof authData === 'object' &&
      Object.values(authData).some((value) => {
        // Improved value checking
        if (typeof value === 'object') {
          return value !== null && Object.keys(value).length > 0;
        }
        return value !== null && value !== undefined && value !== '';
      })
    );
  });

  // Validation
  if (!this.authType || !authMethods.includes(this.authType)) {
    return next(new Error('Invalid auth type'));
  }

  // Verify that only the specified auth type has data
  if (!this[this.authType]) {
    return next(new Error(`Missing data for auth type: ${this.authType}`));
  }

  // Check for multiple auth methods
  if (populatedMethods.length > 1) {
    return next(new Error('Multiple auth methods detected'));
  }

  next();
});

// Add unique indexes for auth provider IDs
schema.index({ 'github.id': 1 }, { unique: true, sparse: true });
schema.index({ 'google.id': 1 }, { unique: true, sparse: true });
schema.index({ 'local.username': 1 }, { unique: true, sparse: true });
schema.index({ email: 1 }, { unique: true });
schema.index({ verificationToken: 1 }, { sparse: true });

module.exports = mongoose.model('User', schema);
