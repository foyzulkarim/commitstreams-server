const config = require('../configs');
const crypto = require('crypto');

function encryptToken(token) {
  const encryptionKey = config.ENCRYPTION_KEY;
  const iv = crypto.randomBytes(16); // Generate a secure IV
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encrypted = cipher.update(token, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  return {
    token: encrypted,
    iv: iv.toString('hex'),
  };
}

function decryptToken(encryptedToken, iv) {
  const encryptionKey = config.ENCRYPTION_KEY;
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    encryptionKey,
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(encryptedToken, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}

module.exports = {
  encryptToken,
  decryptToken,
};
