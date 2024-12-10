const sgMail = require('@sendgrid/mail');
const config = require('../../configs');
const logger = require('../log/logger');
const fs = require('fs').promises;
const path = require('path');

// Initialize SendGrid with API key
sgMail.setApiKey(config.SENDGRID_API_KEY);

// Debug mode configuration
const isDebugMode = process.env.EMAIL_DEBUG === 'true';
console.log('isDebugMode', isDebugMode, 'process.env.NODE_ENV', process.env.NODE_ENV, 'process.env.EMAIL_DEBUG', process.env.EMAIL_DEBUG);
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

// Function to load and compile email template
const loadTemplate = async (templateName, replacements) => {
  const templatePath = path.join(__dirname, 'templates', templateName);
  let template = await fs.readFile(templatePath, 'utf8');

  // Replace all placeholders with actual values
  Object.keys(replacements).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    template = template.replace(regex, replacements[key]);
  });

  return template;
};

const sendVerificationEmail = async (email, verificationToken) => {
  const verificationLink = `${config.CLIENT_HOST}/verify-email?token=${verificationToken}`;

  try {
    await ensureDebugDir();

    // Load and compile the HTML template
    const htmlContent = await loadTemplate('verification2.html', {
      appName: 'CommitStreams',
      userEmail: email,
      verificationLink: verificationLink,
      expiryHours: '24'
    });

    const msg = {
      to: email,
      from: config.SENDGRID_FROM_EMAIL,
      subject: 'Verify your email address',
      html: htmlContent,
    };

    if (isDebugMode) {
      // In debug mode, save email locally
      await saveDebugEmail(email, `
        <h2>Email Debug Information</h2>
        <pre>
To: ${msg.to}
From: ${msg.from}
Subject: ${msg.subject}
        </pre>
        <hr>
        ${htmlContent}
      `);
      logger.info('Debug mode: Email saved locally', { email });
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
