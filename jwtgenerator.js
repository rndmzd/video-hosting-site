const crypto = require('crypto');

function generateJWTSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

const jwtSecret = generateJWTSecret();
console.log('Generated JWT Secret:');
console.log(jwtSecret);
console.log('\nAdd this to your .env file:');
console.log(`JWT_SECRET_KEY=${jwtSecret}`);