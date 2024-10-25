const config = require('../configs');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { AppError } = require('../libraries/error-handling/AppError');
const { getByGoogleId, create, updateById } = require('../domains/user/service');

const getGoogleStrategy = () => {
  console.log('config', config);
  return new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: `${config.HOST}/api/auth/google/callback`,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const trimmedPayloadForSession = await getOrCreateUserFromGoogleProfile({
          profile,
          accessToken,
        });
        cb(null, trimmedPayloadForSession);
      } catch (error) {
        cb(error, null);
      }
    }
  );
};

async function getOrCreateUserFromGoogleProfile({ profile, accessToken }) {
  const isAdmin = config.ADMIN_USERNAMES.includes(profile.emails[0].value);
  
  const payload = {
    email: profile.emails[0].value,
    displayName: profile.displayName,
    authType: 'google',
    
    google: {
      id: profile.id,
      email: profile.emails[0].value,
      picture: profile.photos[0].value,
    },

    isDemo: false,
    isVerified: true,
    isAdmin,
  };

  let user = await getByGoogleId(profile.id);

  if (user) {
    if (user.isDeactivated) {
      throw new AppError('user-is-deactivated', 'User is deactivated', 401);
    }

    user = Object.assign(user, payload, {
      updatedAt: new Date(),
    });
    await updateById(user._id, user);
  } else {
    user = await create(payload);
  }

  const userObj = user.toObject();
  const trimmedPayloadForSession = {
    _id: userObj._id,
    email: userObj.email,
    authType: userObj.authType,
    isAdmin: userObj.isAdmin,
    isDeactivated: userObj.isDeactivated,
    isDemo: userObj.isDemo,
    displayName: userObj.displayName,
    avatarUrl: userObj.google.picture,
  };
  return trimmedPayloadForSession;
}

module.exports = {
  getGoogleStrategy,
  getOrCreateUserFromGoogleProfile,
};
