// src/utils/sendEmail.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (options) => {
  // 1. Cấu hình transporter (Trạm gửi mail)
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2. Nội dung Email
  const mailOptions = {
    from: '"OmniDash Support" <no-reply@omnidash.com>',
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  // 3. Thực hiện gửi
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;