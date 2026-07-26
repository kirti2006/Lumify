export const EmailTemplates = {
  getVerificationEmail: (name: string, code: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email address</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); }
    .header { padding: 40px 40px 20px; text-align: center; }
    .logo { width: 48px; height: 48px; margin-bottom: 16px; }
    .content { padding: 0 40px 40px; color: #334155; line-height: 1.6; font-size: 16px; }
    h1 { color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 16px; text-align: center; }
    .otp-container { background-color: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0; border: 1px solid #e2e8f0; }
    .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2563eb; margin: 0; font-family: monospace; }
    .footer { background-color: #f8fafc; padding: 32px 40px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #f1f5f9; }
    .muted { color: #64748b; font-size: 14px; text-align: center; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <!-- You can replace with actual absolute URL to your logo if hosted -->
      <svg class="logo" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
    </div>
    <div class="content">
      <h1>Verify your email</h1>
      <p>Hi ${name},</p>
      <p>Welcome to Lumify! To complete your registration and secure your account, please verify your email address using the code below:</p>
      
      <div class="otp-container">
        <p class="otp-code">${code}</p>
      </div>
      
      <p>This code will expire in 15 minutes. If you didn't create an account with Lumify, you can safely ignore this email.</p>
      <p>Best regards,<br>The Lumify Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Lumify. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `,

  getPasswordResetEmail: (name: string, code: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); }
    .header { padding: 40px 40px 20px; text-align: center; }
    .logo { width: 48px; height: 48px; margin-bottom: 16px; }
    .content { padding: 0 40px 40px; color: #334155; line-height: 1.6; font-size: 16px; }
    h1 { color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 16px; text-align: center; }
    .otp-container { background-color: #fef2f2; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0; border: 1px solid #fee2e2; }
    .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #dc2626; margin: 0; font-family: monospace; }
    .footer { background-color: #f8fafc; padding: 32px 40px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <svg class="logo" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
    </div>
    <div class="content">
      <h1>Reset your password</h1>
      <p>Hi ${name},</p>
      <p>We received a request to reset the password for your Lumify account. Use the verification code below to securely reset your password:</p>
      
      <div class="otp-container">
        <p class="otp-code">${code}</p>
      </div>
      
      <p>This code will expire in 15 minutes. If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      <p>Best regards,<br>The Lumify Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Lumify. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `
};
