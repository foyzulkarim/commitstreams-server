const mongoose = require('mongoose');

const { baseSchema } = require('../../libraries/db/base-schema');

const schema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, // Unique pull request ID
  node_id: { type: String, required: true },
  html_url: { type: String, required: true },
  number: { type: Number, required: true },
  state: { type: String, enum: ['open', 'closed', 'merged'], required: true }, 
  locked: { type: Boolean, required: true },
  title: { type: String, required: true },

  user: {  // Nested schema for the user who opened the pull request
    login: { type: String, required: true },
    id: { type: Number, required: true },
    node_id: { type: String, required: true },
    avatar_url: { type: String, required: true },
    type: { type: String, required: true }
  },

  created_at: { type: Date, required: true },
  updated_at: { type: Date, required: true },
  closed_at: { type: Date }, 
  merged_at: { type: Date }, 
  draft: { type: Boolean, required: true }, 

  merged: { type: Boolean,  }, 
  comments: { type: Number, required: true, default: 0},
  review_comments: { type: Number, required: true, default: 0}, 
  commits: { type: Number, required: true, default: 0}, 
  additions: { type: Number, required: true, default: 0}, 
  deletions: { type: Number, required: true, default: 0}, 
  changed_files: { type: Number, required: true, default: 0}, 

  source_branch: {  // Nested schema for the source branch
    id: { type: Number, required: true },
    node_id: { type: String, required: true },
    name: { type: String, required: true },
    full_name: { type: String, required: true }
  },

  target_branch: {  // Nested schema for the target branch
    id: { type: Number, required: true },
    node_id: { type: String, required: true },
    name: { type: String, required: true },
    full_name: { type: String, required: true }
  }
});

schema.add(baseSchema);

module.exports = mongoose.model('Pull', schema);
