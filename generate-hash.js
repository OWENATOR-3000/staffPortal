// generate-hash.js
const bcrypt = require('bcryptjs');

const password = 'testing_diana_password';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('--- NEW HASH ---');
    console.log('Password to use:', password);
    console.log('New Hash to store:', hash);
    console.log('------------------');
});