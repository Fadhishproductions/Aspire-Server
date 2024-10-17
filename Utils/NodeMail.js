import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendEmail = async (options) => {
  // Create transporter object with email service configuration
  const transporter = nodemailer.createTransport({
    service: 'gmail',  
    auth: {
      user: process.env.EMAIL, // Your email address
      pass: process.env.EMAIL_PASS, // Your email password or app-specific password
    },
  });

  // Define email options
  const mailOptions = {
    from: process.env.EMAIL,
    to: options.to, // Recipient's email
    subject: options.subject, // Email subject
    html: options.text, // HTML body of the email
  };

   await transporter.sendMail(mailOptions);
};

export default sendEmail;
