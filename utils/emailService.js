const nodemailer = require('nodemailer');

// Create a reusable transporter object
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

/**
 * Sends a confirmation email to a newly registered user
 * @param {Object} user - User object containing email, name, etc.
 * @param {string} confirmationToken - Token for email verification
 * @returns {Promise<void>}
 */
async function sendRegistrationConfirmation(user, confirmationToken) {
  const confirmationUrl = `${process.env.APP_URL}/verify-email?token=${confirmationToken}`;
  
  // Email content
  const mailOptions = {
    from: "Suporte Rede Agromet <suporte@redeagromet.com.br>", // Must have username@domain format
    envelope: {
      from: "suporte@comunica.redeagromet.com.br", // Just the email without display name in envelope
      to: user.email
    },
    subject: 'Please confirm your registration',
    text: `Hello ${user.name},\n\nThank you for registering with REDEAGROMET. Please confirm your email address by clicking the link below:\n\n${confirmationUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account, please ignore this email.\n\nRegards,\nThe REDEAGROMET Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to REDEAGROMET!</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for registering with us. To complete your registration, please verify your email address:</p>
        <p style="text-align: center;">
          <a href="${confirmationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Confirm Email Address</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${confirmationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, please ignore this email.</p>
        <p>Regards,<br>The REDEAGROMET Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw new Error('Failed to send confirmation email');
  }
}

module.exports = {
  sendRegistrationConfirmation
};