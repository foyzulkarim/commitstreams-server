const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const {
  getByUsername,
  getByEmail,
  create,
} = require('../domains/user/service');
const { AppError } = require('../libraries/error-handling/AppError');

const verifyCallback = async (username, password, done) => {
  try {
    // Find user by email (since we're using email as username)
    const user = await getByEmail(username);
    
    if (!user) {
      return done(null, false, { message: 'Incorrect email.' });
    }

    // Verify this is a local auth user
    if (user.authType !== 'local') {
      return done(null, false, { 
        message: `Please use ${user.authType} authentication for this account.` 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.local.password);
    if (!isValidPassword) {
      return done(null, false, { message: 'Incorrect password.' });
    }

    // Check if user is deactivated
    if (user.isDeactivated) {
      return done(null, false, { message: 'Account is deactivated.' });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

const registerUser = async ({ email, password }) => {
  try {
    // Check if user already exists
    const existingUser = await getByEmail(email);
    if (existingUser) {
      throw new AppError('user-already-exists', 'Email already taken', 400);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user payload matching new schema structure
    const payload = {
      email,
      displayName: email,
      authType: 'local', // Specify auth type
      local: {
        username: email,
        password: hashedPassword,
      },
      isDemo: false,
      isVerified: false,
      isAdmin: false,
    };

    // Create the user
    const newUser = await create(payload);

    // Prepare the user object for the session
    const userObj = newUser.toObject();
    const trimmedPayloadForSession = {
      _id: userObj._id,
      email: userObj.email,
      authType: userObj.authType,
      isAdmin: userObj.isAdmin,
      isDeactivated: userObj.isDeactivated,
      isDemo: userObj.isDemo,
      displayName: userObj.displayName,
    };

    return trimmedPayloadForSession;
  } catch (error) {
    throw new AppError('registration-failed', error.message, 400);
  }
};

const localStrategy = new LocalStrategy(verifyCallback);

module.exports = { localStrategy, registerUser };
