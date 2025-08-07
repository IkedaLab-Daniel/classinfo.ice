const nodemailer = require('nodemailer');
const webpush = require('web-push');
const User = require('../models/User');

class NotificationService {
  constructor() {
    this.setupEmailTransporter();
    this.setupWebPush();
  }

  setupEmailTransporter() {
    // Create email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify transporter configuration
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.emailTransporter.verify((error, success) => {
        if (error) {
          console.log('Email transporter verification failed:', error);
        } else {
          console.log('✅ Email transporter is ready');
        }
      });
    }
  }

  setupWebPush() {
    // Configure web push
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:' + (process.env.CONTACT_EMAIL || 'admin@classinfo.com'),
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      console.log('✅ Web push is configured');
    } else {
      console.log('⚠️ VAPID keys not found. Push notifications will not work.');
    }
  }

  // Send email notification
  async sendEmail(to, subject, htmlContent, textContent = null) {
    if (!this.emailTransporter || !process.env.SMTP_USER) {
      console.log('Email not configured, skipping email to:', to);
      return { success: false, error: 'Email not configured' };
    }

    try {
      const mailOptions = {
        from: {
          name: 'ClassInfo System',
          address: process.env.SMTP_USER
        },
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', to);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending email to:', to, error);
      return { success: false, error: error.message };
    }
  }

  // Send push notification
  async sendPushNotification(subscription, payload) {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.log('VAPID keys not configured, skipping push notification');
      return { success: false, error: 'VAPID not configured' };
    }

    try {
      const result = await webpush.sendNotification(subscription, JSON.stringify(payload));
      console.log('✅ Push notification sent successfully');
      return { success: true, result };
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      
      // If subscription is invalid, we might want to remove it
      if (error.statusCode === 410) {
        console.log('Push subscription expired/invalid');
        return { success: false, error: 'Subscription expired', shouldRemove: true };
      }
      
      return { success: false, error: error.message };
    }
  }

  // Send notification to all users
  async sendNotificationToAll(notification) {
    try {
      const users = await User.find({ 
        isActive: true,
        'preferences.announcements': true 
      });

      console.log(`📢 Sending notification to ${users.length} users`);

      const results = {
        email: { sent: 0, failed: 0 },
        push: { sent: 0, failed: 0 },
        total: users.length
      };

      // Send to each user
      for (const user of users) {
        // Send email notification
        if (user.preferences.emailNotifications && user.email) {
          const emailResult = await this.sendEmailNotification(user, notification);
          if (emailResult.success) {
            results.email.sent++;
          } else {
            results.email.failed++;
          }
        }

        // Send push notification
        if (user.preferences.pushNotifications && user.pushSubscription) {
          const pushResult = await this.sendPushNotificationToUser(user, notification);
          if (pushResult.success) {
            results.push.sent++;
          } else {
            results.push.failed++;
            // Remove invalid subscription
            if (pushResult.shouldRemove) {
              user.pushSubscription = undefined;
              await user.save();
            }
          }
        }

        // Small delay to avoid overwhelming services
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('📊 Notification results:', results);
      return results;
    } catch (error) {
      console.error('❌ Error sending notifications to all users:', error);
      throw error;
    }
  }

  // Send email notification to a specific user
  async sendEmailNotification(user, notification) {
    const subject = `📢 ${notification.title}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ClassInfo Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; margin: -20px -20px 20px -20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 20px 0; }
          .announcement { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; margin: 15px 0; }
          .announcement-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333; }
          .announcement-body { font-size: 14px; line-height: 1.6; color: #666; }
          .meta { font-size: 12px; color: #888; margin-top: 10px; }
          .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 ClassInfo Announcement</h1>
          </div>
          <div class="content">
            <p>Hello ${user.name || 'Student'},</p>
            <p>You have a new announcement from your class:</p>
            
            <div class="announcement">
              <div class="announcement-title">${notification.title}</div>
              <div class="announcement-body">${notification.description}</div>
              <div class="meta">
                Posted by: <strong>${notification.postedBy}</strong><br>
                Date: <strong>${new Date(notification.createdAt || Date.now()).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</strong>
              </div>
            </div>
            
            <p>To view more announcements and manage your schedule, visit the ClassInfo dashboard:</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" class="btn">View Dashboard</a>
          </div>
          <div class="footer">
            <p>This is an automated message from the ClassInfo system.</p>
            <p>Class: ${user.className || 'BSIT - 3B'}</p>
            <p>To unsubscribe from these notifications, please contact your administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, htmlContent);
  }

  // Send push notification to a specific user
  async sendPushNotificationToUser(user, notification) {
    const payload = {
      title: notification.title,
      body: notification.description.length > 100 
        ? notification.description.substring(0, 100) + '...'
        : notification.description,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        type: 'announcement',
        id: notification._id || notification.id,
        url: process.env.CLIENT_URL || 'http://localhost:5173'
      },
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    return await this.sendPushNotification(user.pushSubscription, payload);
  }

  // Generate email templates for different types of notifications
  generateScheduleUpdateEmail(user, schedule, changeType = 'updated') {
    const subject = `📅 Schedule ${changeType}: ${schedule.subject}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Schedule Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; margin: -20px -20px 20px -20px; }
          .schedule-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin: 15px 0; }
          .schedule-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333; }
          .schedule-details { display: grid; grid-template-columns: auto 1fr; gap: 10px; font-size: 14px; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { color: #333; }
          .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Schedule ${changeType.charAt(0).toUpperCase() + changeType.slice(1)}</h1>
          </div>
          <div class="content">
            <p>Hello ${user.name || 'Student'},</p>
            <p>Your class schedule has been ${changeType}:</p>
            
            <div class="schedule-card">
              <div class="schedule-title">${schedule.subject}</div>
              <div class="schedule-details">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(schedule.date).toLocaleDateString()}</span>
                <span class="detail-label">Time:</span>
                <span class="detail-value">${schedule.startTime} - ${schedule.endTime}</span>
                <span class="detail-label">Room:</span>
                <span class="detail-value">${schedule.room}</span>
                ${schedule.description ? `
                <span class="detail-label">Description:</span>
                <span class="detail-value">${schedule.description}</span>
                ` : ''}
              </div>
            </div>
          </div>
          <div class="footer">
            <p>Class: ${user.className || 'BSIT - 3B'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, htmlContent };
  }
}

module.exports = new NotificationService();
