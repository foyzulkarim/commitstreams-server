const mongoose = require('mongoose');

const RepositorySchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  node_id: String,
  name: String,
  full_name: String,
  private: Boolean,
  owner: mongoose.Schema.Types.Mixed,
  html_url: String,
  description: String,
  fork: Boolean,
  url: String,
  created_at: Date,
  updated_at: Date,
  pushed_at: Date,
  homepage: String,
  size: Number,
  stargazers_count: Number,
  watchers_count: Number,
  language: String,
  languages: mongoose.Schema.Types.Mixed,
  forks_count: Number,
  archived: Boolean,
  disabled: Boolean,
  open_issues_count: Number,
  license: {
    key: String,
    name: String,
    spdx_id: String,
    url: String,
    node_id: String,
  },
  topics: [String],
  visibility: String,
  default_branch: String,
});

module.exports = mongoose.model('Repository', RepositorySchema);
