import nodemailer from 'nodemailer';

export const otpStore: { [key: string]: { otp: string; expires: number; name: string } } = {};

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * @param email 
 * @param otp 
 */
export async function sendOtpEmail(email: string, otp: string) {
  const mailOptions = {
    from: '"Note Taking App" <no-reply@notesapp.com>',
    to: email,
    subject: 'Your One-Time Password (OTP)',
    html: `
      <div style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h2>Welcome to the Note Taking App!</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otp}</p>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending OTP email to ${email}:`, error);
    throw new Error('Could not send OTP email.');
  }
}
