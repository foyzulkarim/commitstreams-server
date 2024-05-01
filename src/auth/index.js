const config = require('../configs');
const crypto = require('crypto');
const logger = require('../libraries/log/logger');
const GitHubStrategy = require('passport-github2').Strategy;

const {
  getByGitHubId,
  create,
  updateById,
} = require('../domains/user/service');

function encryptToken(token, encryptionKey) {
  const iv = crypto.randomBytes(16); // Generate a secure IV
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encrypted = cipher.update(token, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  return {
    token: encrypted,
    iv: iv.toString('hex'),
  };
}

function decryptRefreshToken(encryptedToken, iv, encryptionKey) {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    encryptionKey,
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(encryptedToken, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}

const getGitHubStrategy = () => {
  return new GitHubStrategy(
    {
      clientID: config.GITHUB_CLIENT_ID,
      clientSecret: config.GITHUB_CLIENT_SECRET,
      callbackURL: `${config.HOST}/api/auth/github/callback`,
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        // Create a new user from GitHub API Profile data
        const payload = {
          githubId: profile.id,
          nodeId: profile.nodeId,
          displayName: profile.displayName,
          username: profile.username,
          profileUrl: profile.profileUrl,

          avatarUrl: profile._json.avatar_url,
          apiUrl: profile._json.url,
          company: profile._json.company,
          blog: profile._json.blog,
          location: profile._json.location,
          email: profile._json.email,
          hireable: profile._json.hireable,
          bio: profile._json.bio,
          public_repos: profile._json.public_repos,
          public_gists: profile._json.public_gists,
          followers: profile._json.followers,
          following: profile._json.following,
          created_at: profile._json.created_at,
          updated_at: profile._json.updated_at,
        };
        console.log('DB payload:', { payload });

        let user = await getByGitHubId(profile.id);
        const tokenInfo = encryptToken(accessToken, config.ENCRYPTION_KEY);
        if (user) {
          console.log('User already exists', user);
          // Update the user with the latest data
          user = Object.assign(user, payload, {
            accessToken: tokenInfo.token,
            accessTokenIV: tokenInfo.iv,
            updatedAt: new Date(),
          });
          await updateById(user._id, user);
        } else {
          // Create a new user
          user = await create({
            ...payload,
            accessToken: tokenInfo.token,
            accessTokenIV: tokenInfo.iv,
          });
        }
        const userObj = user.toObject();
        const { accessTokenIV, ...others } = userObj;
        cb(null, others); // Pass the user object to the session
      } catch (error) {
        cb(error, null);
      }
    }
  );
};

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
  clearAuthInfo,
};
