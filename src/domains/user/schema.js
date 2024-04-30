const mongoose = require('mongoose');
const { baseSchema } = require('../../libraries/db/base-schema');

const schema = new mongoose.Schema({
  // id
  githubId: {
    type: String,
    required: true,
  },
  nodeId: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  profileUrl: {
    type: String,
    required: true,
  },

  /* _json */
  // url
  apiUrl: {
    type: String,
    required: true,
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
  email: {
    type: String,
    required: true,
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

  // auth
  accessToken: {
    type: String,
    required: true,
  },
  accessTokenIV: {
    type: String,
    required: true,
  },
});
schema.add(baseSchema);

module.exports = mongoose.model('User', schema);
