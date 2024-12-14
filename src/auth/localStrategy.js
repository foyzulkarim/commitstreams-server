const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const {
  getByUsername,
  getByEmail,
  create,
  updateById,
  findByVerificationToken,
  refreshVerificationToken,
  completeEmailVerification,
} = require('../domains/user/service');
const { AppError } = require('../libraries/error-handling/AppError');
const { sendVerificationEmail } = require('../libraries/email/emailService');

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

    // Check if email is verified
    if (!user.isVerified) {
      return done(null, false, { message: 'Please verify your email address before signing in.', reason: 'email-not-verified' });
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

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
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

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Create user payload matching new schema structure
    const payload = {
      email,
      displayName: email,
      authType: 'local',
      local: {
        username: email,
        password: hashedPassword,
      },
      isDemo: false,
      isVerified: false,
      isAdmin: false,
      verificationToken,
      verificationTokenExpiry,
      isDeactivated: false, // we activate the user after email verification
      role: 'Visitor',
      roleId: null,
    };

    // Create the user
    const newUser = await create(payload);

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

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

const verifyEmail = async (token) => {
  try {
    const user = await findByVerificationToken(token);

    if (!user) {
      throw new AppError('invalid-token', 'Invalid or expired verification token', 400);
    }

    // Update user as verified
    await completeEmailVerification(user._id);

    return { message: 'Email verified successfully' };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('verification-failed', error.message, 400);
  }
};

const resendVerificationEmail = async (email) => {
  try {
    const { user, verificationToken } = await refreshVerificationToken(email);
    
    // Send new verification email
    await sendVerificationEmail(email, verificationToken);
    
    return { 
      message: 'Verification email sent successfully',
      email: user.email
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('resend-verification-failed', error.message, 400);
  }
};

const localStrategy = new LocalStrategy(verifyCallback);

module.exports = { 
  localStrategy, 
  registerUser, 
  verifyEmail,
  resendVerificationEmail,
};
