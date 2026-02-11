import nodemailer from 'nodemailer';

// Lazy transporter — created on first use so dotenv has time to load
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL/TLS (standard for production)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
  }
  return transporter;
}

/**
 * Send notification welcome email
 */
export async function sendNotificationWelcomeEmail(userEmail, userName) {
  const mailOptions = {
    from: `PrepTrack <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: '🔔 PrepTrack Notifications Enabled',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Courier New', monospace;
            background-color: #0a0e27;
            color: #00ff00;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1a1f3a;
            border: 2px solid #00ff00;
            padding: 30px;
            border-radius: 8px;
          }
          .header {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
            color: #00ff00;
          }
          .content {
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .highlight {
            color: #00ffff;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #00ff00;
            font-size: 12px;
            text-align: center;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            🔔 PREPTRACK :: NOTIFICATIONS ENABLED
          </div>
          <div class="content">
            <p>Hello <span class="highlight">${userName || 'User'}</span>,</p>
            
            <p>Your notifications have been successfully enabled!</p>
            
            <p>You will now receive:</p>
            <ul>
              <li>📅 Daily streak reminders</li>
              <li>🎯 Task completion notifications</li>
              <li>📺 Video progress updates</li>
              <li>🏆 Contest reminders</li>
            </ul>
            
            <p>Keep up the great work on your preparation journey!</p>
            
            <p style="margin-top: 30px;">
              <strong>STREAK :: ACTIVE</strong><br>
              <span style="color: #888;">Stay consistent, stay ahead.</span>
            </p>
          </div>
          <div class="footer">
            PrepTrack - Your Competitive Programming Companion<br>
            To disable notifications, click the NOTIFS button in your dashboard.
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log('✅ Notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);

    // Specific check for Gmail Auth failure
    if (error.code === 'EAUTH' || (error.response && error.response.includes('535'))) {
      return {
        success: false,
        error: "Bad Credentials: Check your EMAIL_PASSWORD in backend/.env. Ensure you are using a Gmail App Password, not your regular password."
      };
    }

    return { success: false, error: error.code || error.message };
  }
}

/**
 * Send streak reminder email
 */
export async function sendStreakReminder(userEmail, userName) {
  const mailOptions = {
    from: `PrepTrack <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: '🔥 Don\'t Lose Your Streak! - PrepTrack',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Courier New', monospace; background-color: #000; color: #ffbf00; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; border: 2px solid #ffbf00; padding: 30px; border-radius: 8px; }
          .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; color: #ffbf00; }
          .highlight { color: #fff; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; font-size: 12px; text-align: center; color: #666; }
          .btn { display: inline-block; background: #ffbf00; color: #000; padding: 10px 20px; text-decoration: none; font-weight: bold; margin-top: 20px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">⚠️ STREAK RISK DETECTED</div>
          <p>Hello <span class="highlight">${userName || 'User'}</span>,</p>
          <p>This is an automated alert from <strong>PrepTrack OS</strong>.</p>
          <p>We noticed you haven't logged any activity today. Your streak is at risk of resetting to 0 at midnight!</p>
          <p>Log a task or video now to keep your momentum going.</p>
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">LOG ACTIVITY NOW</a>
          </div>
          <div class="footer">PrepTrack Intelligence System</div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Streak reminder sent:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending streak reminder:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig() {
  try {
    await getTransporter().verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    return false;
  }
}
