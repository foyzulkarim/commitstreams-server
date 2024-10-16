const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { getByUsername, getByEmail, create } = require('../domains/user/service');
const { AppError } = require('../libraries/error-handling/AppError');

const verifyCallback = async (username, password, done) => {
  try {
    const user = await getByUsername(username);
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    console.log('user', user);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const isValidPassword = await bcrypt.compare(password, user.password);

    console.log(
      'user',
      password,
      user.password,
      hashedPassword,
      isValidPassword
    );
    if (!isValidPassword) {
      return done(null, false, { message: 'Incorrect password.' });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

const registerUser = async ({ email, password }) => {
  try {
    console.log('registerUser', email, password);
    // Check if user already exists
    const existingUser = await getByEmail(email);
    if (existingUser) {
      throw new AppError('user-already-exists', 'Email already taken', 400);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user payload
    const payload = {
      email,
      username: email,
      password: hashedPassword,
      displayName: email,
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
      isAdmin: userObj.isAdmin,
      isDeactivated: userObj.isDeactivated,
      isDemo: userObj.isDemo,
      username: userObj.username,
      displayName: userObj.displayName,
    };

    return trimmedPayloadForSession;
  } catch (error) {
    throw new AppError('registration-failed', error.message, 400);
  }
};

const localStrategy = new LocalStrategy(verifyCallback);

module.exports = { localStrategy, registerUser };
