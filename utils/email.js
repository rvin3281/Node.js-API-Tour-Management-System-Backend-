const nodemailer = require('nodemailer');

// Email address(send email to) / subject / email content / etc
const sendEmail = async (options) => {
  /** FOLLOW 3 STEPS in order to send email with NODEMAILER */

  // 1) Create transporter -> a service that actually send the email (Ex: GMAIL)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      // Save the sensitive data on the config.env file
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Arvend rajan <arvendrajan100@gmail.com',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // 3) Actually send the email => transporter return a promise
  // Asynchronous function

  await transporter.sendMail(mailOptions);
};

// Export as default module
module.exports = sendEmail;
