const sgMail = require('@sendgrid/mail');
const config = require('../../configs');
const logger = require('../log/logger');
const fs = require('fs').promises;
const path = require('path');

// Initialize SendGrid with API key
sgMail.setApiKey(config.SENDGRID_API_KEY);

// Debug mode configuration
const isDebugMode = process.env.NODE_ENV === 'development' && process.env.EMAIL_DEBUG === 'true';
const debugDir = path.join(__dirname, 'debug');

// Ensure debug directory exists
const ensureDebugDir = async () => {
  if (isDebugMode) {
    try {
      await fs.mkdir(debugDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create debug directory', error);
    }
  }
};

// Save email to debug directory
const saveDebugEmail = async (email, content) => {
  if (!isDebugMode) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}-${email.replace('@', '_at_')}.html`;
  const filepath = path.join(debugDir, filename);

  try {
    await fs.writeFile(filepath, content, 'utf8');
    logger.info(`Debug email saved: ${filepath}`);
  } catch (error) {
    logger.error('Failed to save debug email', error);
  }
};

const sendVerificationEmail = async (email, verificationToken) => {
  const verificationLink = `${config.CLIENT_HOST}/verify-email?token=${verificationToken}`;
  
  try {
    await ensureDebugDir();
    
    const msg = {
      to: email,
      from: config.SENDGRID_FROM_EMAIL,
      templateId: config.SENDGRID_VERIFICATION_TEMPLATE_ID,
      dynamicTemplateData: {
        appName: 'CommitStreams',
        userEmail: email,
        verificationLink: verificationLink,
        expiryHours: '1'
      }
    };

    if (isDebugMode) {
      // In debug mode, save email data locally
      await saveDebugEmail(email, `
        <h2>Email Debug Information</h2>
        <pre>
To: ${msg.to}
From: ${msg.from}
Template ID: ${msg.templateId}
Dynamic Template Data: ${JSON.stringify(msg.dynamicTemplateData, null, 2)}
        </pre>
      `);
      logger.info('Debug mode: Email data saved locally', { email });
    } else {
      // In production mode, send via SendGrid
      await sgMail.send(msg);
      logger.info('Verification email sent successfully', { email });
    }
  } catch (error) {
    logger.error('Error with verification email', { error, email });
    throw error;
  }
};

// Utility function to list debug emails (useful for testing)
const listDebugEmails = async () => {
  if (!isDebugMode) {
    return [];
  }

  try {
    const files = await fs.readdir(debugDir);
    return files.filter(file => file.endsWith('.html'));
  } catch (error) {
    logger.error('Failed to list debug emails', error);
    return [];
  }
};

// Utility function to read a debug email
const readDebugEmail = async (filename) => {
  if (!isDebugMode) {
    throw new Error('Debug mode is not enabled');
  }

  const filepath = path.join(debugDir, filename);
  try {
    return await fs.readFile(filepath, 'utf8');
  } catch (error) {
    logger.error('Failed to read debug email', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  listDebugEmails,
  readDebugEmail,
  isDebugMode,
}; 
