import nodemailer from 'nodemailer';

// Create a reusable transporter
// For production, replace with real SMTP credentials (e.g. Gmail, SendGrid, Resend)
// For development/demo, we use Nodemailer's built-in Ethereal test accounts
let cachedTransporter = null;

async function getTransporter() {
  // Check if real SMTP is configured via env
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: create Ethereal test account (free, no signup needed)
  if (cachedTransporter) return cachedTransporter;
  
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  
  console.log('[Email] Using Ethereal test account:', testAccount.user);
  return cachedTransporter;
}

export async function sendPasswordResetEmail(toEmail, resetLink) {
  const transporter = await getTransporter();
  const fromName = process.env.SMTP_FROM_NAME || 'Natura CRM';
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@naturacrm.io';

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: '🔑 Reset Your Password — Natura CRM',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f4f1ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#4a6741,#6b8f5e);padding:32px 32px 24px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">🌿 Natura CRM</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Password Reset Request</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:32px;">
                    <h2 style="margin:0 0 12px;font-size:18px;color:#1a1a1a;font-weight:700;">Reset your password</h2>
                    <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6;">
                      We received a request to reset the password for your account associated with <strong>${toEmail}</strong>.
                      Click the button below to set a new password.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${resetLink}" style="display:inline-block;background:#4a6741;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:24px 0 0;font-size:12px;color:#999;line-height:1.5;">
                      This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
                    </p>
                    <hr style="border:none;border-top:1px solid #eee;margin:24px 0 16px;">
                    <p style="margin:0;font-size:11px;color:#bbb;line-height:1.5;">
                      If the button doesn't work, copy and paste this URL into your browser:<br>
                      <a href="${resetLink}" style="color:#4a6741;word-break:break-all;">${resetLink}</a>
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f9f7f3;padding:16px 32px;text-align:center;border-top:1px solid #eee;">
                    <p style="margin:0;font-size:11px;color:#999;">© ${new Date().getFullYear()} Natura CRM. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });

  // For Ethereal test accounts, log the preview URL
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('[Email] Preview URL (Ethereal):', previewUrl);
  }

  return { messageId: info.messageId, previewUrl };
}
