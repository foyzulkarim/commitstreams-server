const config = require('../configs');
const GitHubStrategy = require('passport-github2').Strategy;

const { encryptToken } = require('./util');
const {
  getByGitHubId,
  create,
  updateById,
} = require('../domains/user/service');
const { AppError } = require('../libraries/error-handling/AppError');

const getGitHubStrategy = () => {
  return new GitHubStrategy(
    {
      clientID: config.GITHUB_CLIENT_ID,
      clientSecret: config.GITHUB_CLIENT_SECRET,
      callbackURL: `${config.HOST}/api/auth/github/callback`,
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const trimmedPayloadForSession = await getOrCreateUserFromGitHubProfile(
          {
            profile,
            accessToken,
          }
        );

        cb(null, trimmedPayloadForSession); // Pass the user object to the session
      } catch (error) {
        cb(error, null);
      }
    }
  );
};

async function getOrCreateUserFromGitHubProfile({ profile, accessToken }) {
  const isAdmin = config.ADMIN_USERNAMES.includes(profile.username);
  
  // Restructured payload to match new schema
  const payload = {
    email: profile._json.email,
    displayName: profile.displayName,
    authType: 'github',
    
    // GitHub specific data moved to github subdocument
    github: {
      id: profile.id,
      nodeId: profile.nodeId,
      profileUrl: profile.profileUrl,
      avatarUrl: profile._json.avatar_url,
      apiUrl: profile._json.url,
      company: profile._json.company,
      blog: profile._json.blog,
      location: profile._json.location,
      hireable: profile._json.hireable,
      bio: profile._json.bio,
      public_repos: profile._json.public_repos,
      public_gists: profile._json.public_gists,
      followers: profile._json.followers,
      following: profile._json.following,
      created_at: profile._json.created_at,
      updated_at: profile._json.updated_at,
    },

    isDemo: false,
    isVerified: true,
    isAdmin,
  };

  // Update query to use github.id instead of githubId
  let user = await getByGitHubId(profile.id);

  const tokenInfo = encryptToken(accessToken);
  if (user) {
    if (user.isDeactivated) {
      throw new AppError('user-is-deactivated', 'User is deactivated', 401);
    }

    // Update the user with the latest data
    // Note: Using spread to maintain other fields while updating github subdocument
    user = Object.assign(user, payload, {
      github: {
        ...payload.github,
        accessToken: tokenInfo.token,
        accessTokenIV: tokenInfo.iv,
      },
      updatedAt: new Date(),
    });
    await updateById(user._id, user);
  } else {
    // Create a new user
    user = await create({
      ...payload,
      github: {
        ...payload.github,
        accessToken: tokenInfo.token,
        accessTokenIV: tokenInfo.iv,
      },
    });
  }

  const userObj = user.toObject();
  const trimmedPayloadForSession = {
    _id: userObj._id,
    email: userObj.email,
    authType: userObj.authType,
    isAdmin: userObj.isAdmin,
    isDeactivated: userObj.isDeactivated,
    isDemo: userObj.isDemo,
    // UI info
    displayName: userObj.displayName,
    avatarUrl: userObj.github.avatarUrl,
  };
  return trimmedPayloadForSession;
}

module.exports = {
  getGitHubStrategy,
  getOrCreateUserFromGitHubProfile,
};
