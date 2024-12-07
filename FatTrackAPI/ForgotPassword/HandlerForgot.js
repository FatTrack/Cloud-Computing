const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '', // Gmail Account
    pass: '', // Password Account
  },
});

const forgotPasswordHandler = async (request, h) => {
  const { email } = request.payload;

  if (!email) {
    return h.response({ status: 'fail', message: 'Email is required' }).code(400);
  }

  try {
    // Generate reset link from Firebase
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // Send email using nodemailer
    await transporter.sendMail({
      from: '', // Gmail Account
      to: email,
      subject: 'Reset your password for Fat Track',
      text: `Hi there,

We received a request to reset the password for your Fat Track account associated with this email: ${email}. 

To reset your password, please click on the link below or copy and paste it into your browser:
${resetLink}

If you did not request to reset your password, you can safely ignore this email. 

Thank you,
The Fat Track Team`,
});

    return h.response({
      code: 200,
      status: 'success',
      data : {
        message: 'Password reset email sent successfully.',
      }
    }).code(200);
  } catch (error) {
    console.error('Error while sending email:', error);
    return h.response({
      status: 'fail',
      data: {
        message: 'Gagal mengirim ke email, coba lagi nanti',
        error: error.message,
      }
    }).code(500);
  }
};

module.exports = { forgotPasswordHandler };
