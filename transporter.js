const nodemailer = require('nodemailer');

// create transporter object with smtp server details
const transporter = nodemailer.createTransport({
    host: '13.81.39.210',
    port: 1025,
    auth: {
        user: 'myusername',
        pass: 'mypassword'
    }
});

module.exports = transporter;