const { encryptToken, decryptToken } = require('./util');
const { updateById } = require('../domains/user/service');

const {
  getGitHubStrategy,
  getOrCreateUserFromGitHubProfile,
} = require('./githubStrategy');
const { localStrategy, registerUser } = require('./localStrategy');

// clear the accessToken value from database after logout
const clearAuthInfo = async (userId) => {
  return await updateById(userId, {
    accessToken: null,
    accessTokenIV: null,
    updatedAt: new Date(),
  });
};

module.exports = {
  getGitHubStrategy,
  getOrCreateUserFromGitHubProfile,
  clearAuthInfo,
  encryptToken,
  decryptToken,
  localStrategy,
  registerUser,
};
