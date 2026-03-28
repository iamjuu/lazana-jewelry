import nodemailer from "nodemailer";

// Base email sending function using nodemailer
// Note: transporter is created once and reused to avoid connection issues
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  // Validate email configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      "Email configuration missing: EMAIL_USER and EMAIL_PASS must be set in environment variables",
    );
  }

  // Reuse transporter if already created
  if (transporter) {
    return transporter;
  }

  const port = parseInt(process.env.EMAIL_PORT || "587");
  const useSecure = process.env.EMAIL_SECURE === "true";

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port,
    secure: useSecure, // true for 465, false for 587 (STARTTLS)
    requireTLS: !useSecure && port === 587, // Hostinger/smtp.hostinger.com on 587 needs STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool: true,
    maxConnections: 1,
    maxMessages: 5,
    rateDelta: 1000,
    rateLimit: 5,
  });

  return transporter;
}

async function sendEmail(to: string, subject: string, html: string) {
  // Same as your Hostinger snippet: display name + angle-address
  const mailOptions = {
    from: `"Lazana Jewelry" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}:`, info.messageId);
    return info;
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    console.error("   Full error:", error);

    if (error.code === "EAUTH") {
      transporter = null;
      const isHostinger = (process.env.EMAIL_HOST || "").includes("hostinger");
      if (isHostinger) {
        console.error("💡 Hostinger SMTP auth failed. Check:");
        console.error("   1. EMAIL_USER = full address (e.g. hello@lazana-jewelry.com)");
        console.error("   2. EMAIL_PASS: if password has # or special chars, wrap in quotes: EMAIL_PASS=\"YourPass#123\"");
        console.error("   3. In hPanel: Email → your account → ensure SMTP is enabled / password is correct");
        console.error("   4. Restart dev server after changing .env");
      } else {
        console.error("💡 Gmail Authentication Error - Common fixes:");
        console.error("   1. Check if App Password was revoked by Google");
        console.error("   2. Generate a NEW App Password at: https://myaccount.google.com/apppasswords");
        console.error("   3. Update EMAIL_PASS in .env.local with the new 16-character password");
        console.error("   4. Ensure 2FA is enabled on your Google account");
        console.error("   7. Restart your development server after updating credentials");
      }
    }

    throw error;
  }
}

// Add these functions after the existing email functions, before the end of the file

// Send event booking confirmation email to user
export async function sendEventBookingConfirmationToUser(bookingData: {
  fullName: string;
  email: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  slots: number;
  amount: number;
}) {
  const subject = "Event Booking Confirmed - Lazana Jewelry";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #D5B584; color: #fff; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .success-box { background-color: #fff; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; }
        .event-details { background-color: #fff; border: 2px solid #D5B584; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: bold; color: #5B7C99; }
        .detail-value { color: #333; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Lazana Jewelry</h1>
          <p style="margin: 0; font-size: 18px;">Event Booking Confirmed</p>
        </div>
        <div class="content">
          <div class="success-box">
            <h2 style="margin-top: 0; color: #10b981;">✅ Your Event Booking is Confirmed!</h2>
            <p style="font-size: 18px; margin: 10px 0;">Thank you for booking with us. We look forward to seeing you at the event!</p>
          </div>
          
          <div class="event-details">
            <h3 style="margin-top: 0; color: #5B7C99;">📅 Event Details</h3>
            <div class="detail-row">
              <span class="detail-label">Event:</span>
              <span class="detail-value">${bookingData.eventTitle}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${bookingData.eventDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${bookingData.eventTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">${bookingData.eventLocation}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Number of Slots:</span>
              <span class="detail-value">${bookingData.slots}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Amount:</span>
              <span class="detail-value" style="font-weight: bold; color: #D5B584;">USD $${bookingData.amount.toFixed(2)}</span>
            </div>
          </div>
          
          <p style="margin-top: 30px; color: #666;">
            If you have any questions or need to make changes to your booking, please contact us at your earliest convenience.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(bookingData.email, subject, html);
    console.log(
      `✅ Event booking confirmation email sent to ${bookingData.email}`,
    );
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send event booking confirmation email to ${bookingData.email}:`,
      error,
    );
    throw error;
  }
}

// Send event booking notification email to admin
export async function sendEventBookingNotificationToAdmin(bookingData: {
  fullName: string;
  email: string;
  phone: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  slots: number;
  amount: number;
  bookingId: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  if (!adminEmail) {
    throw new Error("Admin email not configured");
  }

  const subject = `New Event Booking - ${bookingData.fullName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1C3163; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fff; }
        .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
        .info-table td:first-child { font-weight: bold; width: 200px; color: #1C3163; }
        .booking-badge { display: inline-block; padding: 6px 12px; border-radius: 5px; font-weight: bold; color: #fff; background-color: #3b82f6; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 New Event Booking</h1>
        </div>
        <div class="content">
          <h2>Payment received for event booking</h2>
          <p>A new event has been booked and payment has been confirmed. Here are the details:</p>
          
          <table class="info-table">
            <tr>
              <td>Booking ID</td>
              <td>#${bookingData.bookingId.slice(-8).toUpperCase()}</td>
            </tr>
            <tr>
              <td>Full Name</td>
              <td>${bookingData.fullName}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td><a href="mailto:${bookingData.email}">${bookingData.email}</a></td>
            </tr>
            <tr>
              <td>Phone</td>
              <td><a href="tel:${bookingData.phone}">${bookingData.phone}</a></td>
            </tr>
            <tr>
              <td colspan="2" style="background-color: #1C3163; color: white; font-weight: bold;">Event Details</td>
            </tr>
            <tr>
              <td>Event</td>
              <td>${bookingData.eventTitle}</td>
            </tr>
            <tr>
              <td>Date</td>
              <td>${bookingData.eventDate}</td>
            </tr>
            <tr>
              <td>Time</td>
              <td>${bookingData.eventTime}</td>
            </tr>
            <tr>
              <td>Location</td>
              <td>${bookingData.eventLocation}</td>
            </tr>
            <tr>
              <td>Number of Slots</td>
              <td>${bookingData.slots}</td>
            </tr>
            <tr>
              <td>Total Amount</td>
              <td style="font-weight: bold; color: #10b981;">USD $${bookingData.amount.toFixed(2)}</td>
            </tr>
          </table>
          
          <p style="margin-top: 30px;">
            Log in to the admin panel to manage this booking.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
          <p>This is an automated notification from your booking system.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(adminEmail, subject, html);
    console.log(
      `✅ Event booking notification email sent to admin: ${adminEmail}`,
    );
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send event booking notification email to ${adminEmail}:`,
      error,
    );
    throw error;
  }
}

// Send subscription confirmation email to user
export async function sendSubscriptionConfirmationToUser(email: string) {
  const subject = "Welcome to Lazana Jewelry Newsletter! ✨";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #D5B584; color: #fff; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .success-box { background-color: #fff; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Lazana Jewelry</h1>
          <p style="margin: 0; font-size: 18px;">Welcome to Our Newsletter!</p>
        </div>
        <div class="content">
          <div class="success-box">
            <h2 style="margin-top: 0; color: #10b981;">✅ You're Successfully Subscribed!</h2>
            <p style="font-size: 18px; margin: 10px 0;">Thank you for joining our mailing list!</p>
            <p style="margin: 15px 0;">
              We're excited to share with you:
            </p>
            <ul style="margin: 15px 0; padding-left: 20px;">
              <li>Special offers and promotions</li>
              <li>New collections and products</li>
              <li>Upcoming events and workshops</li>
              <li>Healing tips and insights</li>
              <li>All the magic from Lazana Jewelry</li>
            </ul>
            <p style="margin-top: 20px;">
              Stay tuned for our next update! We look forward to connecting with you.
            </p>
          </div>
          
          <p style="margin-top: 30px; color: #666; text-align: center;">
            If you have any questions, feel free to reach out to us anytime.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
          <p>You're receiving this email because you subscribed to our newsletter.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(email, subject, html);
    console.log(`✅ Subscription confirmation email sent to ${email}`);
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send subscription confirmation email to ${email}:`,
      error,
    );
    throw error;
  }
}

// Send subscription notification email to admin
export async function sendSubscriptionNotificationToAdmin(subscriptionData: {
  email: string;
  subscribedAt: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  if (!adminEmail) {
    throw new Error("Admin email not configured");
  }

  const subject = `New Newsletter Subscription - Lazana Jewelry`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1C3163; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fff; }
        .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
        .info-table td:first-child { font-weight: bold; width: 200px; color: #1C3163; }
        .subscription-badge { display: inline-block; padding: 6px 12px; border-radius: 5px; font-weight: bold; color: #fff; background-color: #10b981; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 New Newsletter Subscription</h1>
        </div>
        <div class="content">
          <h2>New subscriber added to mailing list</h2>
          <p>A new person has subscribed to your newsletter. Here are the details:</p>
          
          <table class="info-table">
            <tr>
              <td>Email Address</td>
              <td><a href="mailto:${subscriptionData.email}">${subscriptionData.email}</a></td>
            </tr>
            <tr>
              <td>Subscribed At</td>
              <td>${new Date(subscriptionData.subscribedAt).toLocaleString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}</td>
            </tr>
          </table>
          
          <p style="margin-top: 30px;">
            You can view all subscribers in your admin dashboard.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
          <p>This is an automated notification from your newsletter subscription system.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(adminEmail, subject, html);
    console.log(
      `✅ Subscription notification email sent to admin: ${adminEmail}`,
    );
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send subscription notification email to ${adminEmail}:`,
      error,
    );
    throw error;
  }
}

// Send OTP email
export async function sendOTPEmail(email: string, otp: string, name: string) {
  const subject = "Your OTP Code - Lazana Jewelry";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #D5B584; color: #fff; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .otp-box { background-color: #fff; border: 2px solid #D5B584; border-radius: 8px; padding: 30px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #1C3163; letter-spacing: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Lazana Jewelry</h1>
          <p style="margin: 0; font-size: 18px;">Verification Code</p>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Your one-time password (OTP) for Lazana Jewelry is:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p>This code will expire in 10 minutes. Please do not share this code with anyone.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(email, subject, html);
    console.log(`✅ OTP email sent to ${email}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${email}:`, error);
    throw error;
  }
}

// Send enquiry confirmation email to user
export async function sendEnquiryConfirmationToUser(data: {
  fullName: string;
  email: string;
  services: string;
  sessionType: string;
}) {
  const subject = "Enquiry Received - Lazana Jewelry";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #D5B584; color: #fff; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .success-box { background-color: #fff; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Lazana Jewelry</h1>
          <p style="margin: 0; font-size: 18px;">Enquiry Received</p>
        </div>
        <div class="content">
          <div class="success-box">
            <h2 style="margin-top: 0; color: #10b981;">✅ Thank You for Your Enquiry!</h2>
            <p>Dear ${data.fullName},</p>
            <p>We have received your enquiry for <strong>${data.services}</strong>.</p>
            ${data.sessionType === "corporate" ? '<p style="margin-top: 15px; font-weight: 500;">Our team will review your enquiry and respond within 2–3 business days.</p>' : "<p>Our team will get back to you soon. We appreciate your interest in Lazana Jewelry!</p>"}
            ${data.sessionType === "corporate" ? '<p style="margin-top: 15px;">We appreciate your interest in Lazana Jewelry!</p>' : ""}
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(data.email, subject, html);
    console.log(`✅ Enquiry confirmation email sent to ${data.email}`);
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send enquiry confirmation email to ${data.email}:`,
      error,
    );
    throw error;
  }
}

// Send enquiry notification email to admin
export async function sendEnquiryNotificationToAdmin(data: {
  fullName: string;
  email: string;
  phone: string;
  services: string;
  sessionType: string;
  comment?: string;
  createdAt?: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  if (!adminEmail) {
    throw new Error("Admin email not configured");
  }

  const subject = `New Enquiry - ${data.fullName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1C3163; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fff; }
        .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
        .info-table td:first-child { font-weight: bold; width: 200px; color: #1C3163; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 New Enquiry</h1>
        </div>
        <div class="content">
          <h2>New enquiry received</h2>
          <table class="info-table">
            <tr>
              <td>Full Name</td>
              <td>${data.fullName}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td><a href="mailto:${data.email}">${data.email}</a></td>
            </tr>
            <tr>
              <td>Phone</td>
              <td><a href="tel:${data.phone}">${data.phone}</a></td>
            </tr>
            <tr>
              <td>Services</td>
              <td>${data.services}</td>
            </tr>
            <tr>
              <td>Session Type</td>
              <td>${data.sessionType}</td>
            </tr>
            ${data.comment ? `<tr><td>Comment</td><td>${data.comment}</td></tr>` : ""}
            ${data.createdAt ? `<tr><td>Submitted At</td><td>${new Date(data.createdAt).toLocaleString()}</td></tr>` : ""}
          </table>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(adminEmail, subject, html);
    console.log(`✅ Enquiry notification email sent to admin: ${adminEmail}`);
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send enquiry notification email to ${adminEmail}:`,
      error,
    );
    throw error;
  }
}

// Send discovery session confirmation email
export async function sendDiscoverySessionConfirmation(data: {
  selectedDate?: string;
  selectedTime?: string;
  email?: string;
  userName?: string;
}) {
  if (!data.email) return;

  const subject = "Discovery Session Booked - Lazana Jewelry";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #D5B584; color: #fff; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .success-box { background-color: #fff; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Lazana Jewelry</h1>
          <p style="margin: 0; font-size: 18px;">Discovery Session Booked</p>
        </div>
        <div class="content">
          <div class="success-box">
            <h2 style="margin-top: 0; color: #10b981;">✅ Your Discovery Session is Booked!</h2>
            <p>Dear ${data.userName || "Customer"},</p>
            <p>Your discovery session has been confirmed:</p>
            <p><strong>Date:</strong> ${data.selectedDate || "To be confirmed"}</p>
            <p><strong>Time:</strong> ${data.selectedTime || "To be confirmed"}</p>
            <p>We look forward to meeting you!</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(data.email, subject, html);
    console.log(
      `✅ Discovery session confirmation email sent to ${data.email}`,
    );
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send discovery session confirmation email to ${data.email}:`,
      error,
    );
    throw error;
  }
}

// Send discovery session notification email to admin
export async function sendDiscoverySessionNotificationToAdmin(data: {
  userName: string;
  userEmail: string;
  userPhone: string;
  selectedDate: string;
  selectedTime: string;
  amount: number;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  if (!adminEmail) {
    throw new Error("Admin email not configured");
  }

  const subject = `New Discovery Session Booking - ${data.userName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1C3163; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fff; }
        .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
        .info-table td:first-child { font-weight: bold; width: 200px; color: #1C3163; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Discovery Session Booking</h1>
        </div>
        <div class="content">
          <p>A new discovery session has been booked:</p>
          <table class="info-table">
            <tr>
              <td>Customer Name:</td>
              <td>${data.userName}</td>
            </tr>
            <tr>
              <td>Email:</td>
              <td>${data.userEmail}</td>
            </tr>
            <tr>
              <td>Phone:</td>
              <td>${data.userPhone}</td>
            </tr>
            <tr>
              <td>Date:</td>
              <td>${data.selectedDate}</td>
            </tr>
            <tr>
              <td>Time:</td>
              <td>${data.selectedTime}</td>
            </tr>
            <tr>
              <td>Amount Paid:</td>
              <td>S$${data.amount.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(adminEmail, subject, html);
    console.log(`✅ Discovery session notification email sent to admin`);
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send discovery session notification email to admin:`,
      error,
    );
    throw error;
  }
}

// Send private session confirmation email to user
export async function sendPrivateSessionConfirmationToUser(data: {
  fullName: string;
  email: string;
  sessionTitle?: string;
  date?: string;
  time?: string;
  preferredDates?: string;
  preferredLocation?: string;
  preferredDuration?: string;
  companyName?: string;
  jobTitle?: string;
  workEmail?: string;
  industry?: string;
  companySize?: string;
  sessionObjectives?: string[];
  comment?: string;
}) {
  const subject = "Private Session Request - Lazana Jewelry";

  // Build session details section
  let sessionDetailsHtml = "";
  if (data.sessionTitle) {
    sessionDetailsHtml += `<p><strong>Session:</strong> ${data.sessionTitle}</p>`;
  }
  // if (data.date && data.time) {
  //   sessionDetailsHtml += `<p><strong>Date:</strong> ${data.date}</p>`;
  //   sessionDetailsHtml += `<p><strong>Time:</strong> ${data.time}</p>`;
  // }

  // Build form details section
  let formDetailsHtml = "";
  if (data.preferredDates) {
    formDetailsHtml += `<p><strong>Preferred Date(s):</strong> ${data.preferredDates}</p>`;
  }
  if (data.preferredLocation) {
    formDetailsHtml += `<p><strong>Preferred Location:</strong> ${data.preferredLocation}</p>`;
  }
  if (data.preferredDuration) {
    formDetailsHtml += `<p><strong>Preferred Duration:</strong> ${data.preferredDuration}</p>`;
  }
  if (data.companyName) {
    formDetailsHtml += `<p><strong>Company Name:</strong> ${data.companyName}</p>`;
  }
  if (data.jobTitle) {
    formDetailsHtml += `<p><strong>Job Title / Role:</strong> ${data.jobTitle}</p>`;
  }
  if (data.workEmail) {
    formDetailsHtml += `<p><strong>Work Email:</strong> ${data.workEmail}</p>`;
  }
  if (data.industry) {
    formDetailsHtml += `<p><strong>Industry:</strong> ${data.industry}</p>`;
  }
  if (data.companySize) {
    formDetailsHtml += `<p><strong>Company Size:</strong> ${data.companySize}</p>`;
  }
  if (data.sessionObjectives && data.sessionObjectives.length > 0) {
    formDetailsHtml += `<p><strong>Session Objectives:</strong> ${data.sessionObjectives.join(", ")}</p>`;
  }
  if (data.comment) {
    formDetailsHtml += `<p><strong>Additional Notes:</strong> ${data.comment}</p>`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #D5B584; color: #fff; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .success-box { background-color: #fff; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; }
        .details-section { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Lazana Jewelry</h1>
          <p style="margin: 0; font-size: 18px;">Private Session Confirmed</p>
        </div>
        <div class="content">
          <div class="success-box">
            <h2 style="margin-top: 0; color: #10b981;">✅ Your Private Session is Confirmed!</h2>
            <p>Dear ${data.fullName},</p>
            <p>Your private session has been confirmed.</p>
            ${sessionDetailsHtml ? `<div class="details-section"><h3 style="margin-top: 0; color: #1C3163;">Session Details</h3>${sessionDetailsHtml}</div>` : ""}
            ${formDetailsHtml ? `<div class="details-section"><h3 style="margin-top: 0; color: #1C3163;">Your Booking Details</h3>${formDetailsHtml}</div>` : ""}
            <p style="margin-top: 20px;">We look forward to seeing you!</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(data.email, subject, html);
    console.log(`✅ Private session confirmation email sent to ${data.email}`);
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send private session confirmation email to ${data.email}:`,
      error,
    );
    throw error;
  }
}

// Send private session notification email to admin
export async function sendPrivateSessionNotificationToAdmin(data: {
  fullName: string;
  email: string;
  phone: string;
  sessionTitle?: string;
  date?: string;
  time?: string;
  preferredDates?: string;
  preferredLocation?: string;
  preferredDuration?: string;
  companyName?: string;
  jobTitle?: string;
  workEmail?: string;
  industry?: string;
  companySize?: string;
  sessionObjectives?: string[];
  comment?: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  if (!adminEmail) {
    throw new Error("Admin email not configured");
  }

  const subject = `New Private Session Booking - ${data.fullName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1C3163; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fff; }
        .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
        .info-table td:first-child { font-weight: bold; width: 200px; color: #1C3163; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 New Private Session Booking</h1>
        </div>
        <div class="content">
          <h2>New private session booking received</h2>
          <table class="info-table">
            <tr>
              <td>Full Name</td>
              <td>${data.fullName}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td><a href="mailto:${data.email}">${data.email}</a></td>
            </tr>
            <tr>
              <td>Phone</td>
              <td><a href="tel:${data.phone}">${data.phone}</a></td>
            </tr>
            ${data.sessionTitle ? `<tr><td>Session Title</td><td>${data.sessionTitle}</td></tr>` : ""}
            ${data.date ? `<tr><td>Date</td><td>${data.date}</td></tr>` : ""}
            ${data.time ? `<tr><td>Time</td><td>${data.time}</td></tr>` : ""}
            ${data.preferredDates ? `<tr><td>Preferred Date(s)</td><td>${data.preferredDates}</td></tr>` : ""}
            ${data.preferredLocation ? `<tr><td>Preferred Location</td><td>${data.preferredLocation}</td></tr>` : ""}
            ${data.preferredDuration ? `<tr><td>Preferred Duration</td><td>${data.preferredDuration}</td></tr>` : ""}
            ${data.companyName ? `<tr><td>Company Name</td><td>${data.companyName}</td></tr>` : ""}
            ${data.jobTitle ? `<tr><td>Job Title / Role</td><td>${data.jobTitle}</td></tr>` : ""}
            ${data.workEmail ? `<tr><td>Work Email</td><td><a href="mailto:${data.workEmail}">${data.workEmail}</a></td></tr>` : ""}
            ${data.industry ? `<tr><td>Industry</td><td>${data.industry}</td></tr>` : ""}
            ${data.companySize ? `<tr><td>Company Size</td><td>${data.companySize}</td></tr>` : ""}
            ${data.sessionObjectives && data.sessionObjectives.length > 0 ? `<tr><td>Session Objectives</td><td>${data.sessionObjectives.join(", ")}</td></tr>` : ""}
            ${data.comment ? `<tr><td>Additional Notes</td><td>${data.comment}</td></tr>` : ""}
          </table>

          <p style="margin-top: 30px;">
            Log in to the admin panel to manage this booking.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
          <p>This is an automated notification from your booking system.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(adminEmail, subject, html);
    console.log(
      `✅ Private session notification email sent to admin: ${adminEmail}`,
    );
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send private session notification email to ${adminEmail}:`,
      error,
    );
    throw error;
  }
}

// Send order status update email to user
export async function sendOrderStatusUpdateToUser(data: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  deliveryStatus: string;
  message?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    isSet?: boolean;
  }>;
  shippingAddress?: any;
  totalAmount?: number;
}) {
  const subject = `Order Update - ${data.deliveryStatus}`;
  const statusMessages: Record<string, string> = {
    processing: "Your order is being processed",
    "ready to ship": "Your order is ready to ship",
    "reached to your country": "Your order has reached your country",
    delivered: "Your order has been delivered",
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #D5B584; color: #fff; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .status-box { background-color: #fff; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Lazana Jewelry</h1>
          <p style="margin: 0; font-size: 18px;">Order Update</p>
        </div>
        <div class="content">
          <div class="status-box">
            <h2 style="margin-top: 0; color: #10b981;">${statusMessages[data.deliveryStatus] || "Order Status Updated"}</h2>
            <p>Dear ${data.customerName},</p>
            <p>Your order #${data.orderId.slice(-8).toUpperCase()} status has been updated:</p>
            <p><strong>Status:</strong> ${data.deliveryStatus}</p>
            ${data.message ? `<p>${data.message}</p>` : ""}
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(data.customerEmail, subject, html);
    console.log(`✅ Order status update email sent to ${data.customerEmail}`);
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send order status update email to ${data.customerEmail}:`,
      error,
    );
    throw error;
  }
}

// Send universal product order confirmation email to user
export async function sendUniversalProductOrderConfirmationToUser(
  orderData: any,
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const orderLink = `${baseUrl}/profile?tab=orders`;

  // Format shipping address
  const formatAddress = (addr: any) => {
    if (!addr) return "N/A";
    const parts = [
      addr.fullName,
      addr.street,
      addr.city,
      addr.state,
      addr.postalCode,
      addr.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  // Build product items HTML
  const itemsHtml = orderData.items
    .map((item: any) => {
      const imageHtml = item.imageUrl
        ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />`
        : `<div style="width: 80px; height: 80px; background-color: #f0f0f0; border-radius: 8px; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px;">No Image</div>`;

      return `
      <div style="display: flex; padding: 15px; border-bottom: 1px solid #e0e0e0; align-items: center;">
        ${imageHtml}
        <div style="flex: 1;">
          <p style="margin: 0; font-weight: bold; color: #333; font-size: 16px;">${item.name}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">Quantity: ${item.quantity} ${item.isSet ? "(Set)" : "(Piece)"}</p>
          <p style="margin: 5px 0; color: #1C3163; font-weight: bold; font-size: 16px;">USD $${(item.price * item.quantity).toFixed(2)}</p>
        </div>
      </div>
    `;
    })
    .join("");

  const subject = "Session Order Confirmed - Lazana Jewelry";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #D5B584; color: #fff; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .success-box { background-color: #fff; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; }
        .info-box { background-color: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-box h3 { margin-top: 0; color: #1C3163; font-size: 18px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #1C3163; color: #fff; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Lazana Jewelry</h1>
          <p style="margin: 0; font-size: 18px;">Session Order Confirmed</p>
        </div>
        <div class="content">
          <div class="success-box">
            <h2 style="margin-top: 0; color: #10b981;">✅ Your Session Order is Confirmed!</h2>
            <p>Dear ${orderData.customerName},</p>
            <p>Thank you for your session order. Our team will connect with you within 24-48 hours to provide you with the service.</p>
            <p><strong>Order ID:</strong> #${orderData.orderId.slice(-8).toUpperCase()}</p>
          </div>

          <div class="info-box">
            <h3>Order Items</h3>
            ${itemsHtml}
            <div style="padding: 15px; border-top: 2px solid #e0e0e0; margin-top: 10px; text-align: right;">
              <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: bold; color: #1C3163;">Total: USD $${orderData.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${orderLink}" class="button">View Your Orders</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(orderData.customerEmail, subject, html);
    console.log(
      `✅ Universal product order confirmation email sent to ${orderData.customerEmail}`,
    );
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send universal product order confirmation email to ${orderData.customerEmail}:`,
      error,
    );
    throw error;
  }
}

// Send regular product order confirmation email to user
export async function sendRegularProductOrderConfirmationToUser(
  orderData: any,
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const orderLink = `${baseUrl}/profile?tab=orders`;

  // Format shipping address
  const formatAddress = (addr: any) => {
    if (!addr) return "N/A";
    const parts = [
      addr.fullName,
      addr.street,
      addr.city,
      addr.state,
      addr.postalCode,
      addr.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  // Build product items HTML
  const itemsHtml = orderData.items
    .map((item: any) => {
      const imageHtml = item.imageUrl
        ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />`
        : `<div style="width: 80px; height: 80px; background-color: #f0f0f0; border-radius: 8px; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px;">No Image</div>`;

      return `
      <div style="display: flex; padding: 15px; border-bottom: 1px solid #e0e0e0; align-items: center;">
        ${imageHtml}
        <div style="flex: 1;">
          <p style="margin: 0; font-weight: bold; color: #333; font-size: 16px;">${item.name}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">Quantity: ${item.quantity} ${item.isSet ? "(Set)" : "(Piece)"}</p>
          <p style="margin: 5px 0; color: #1C3163; font-weight: bold; font-size: 16px;">USD $${(item.price * item.quantity).toFixed(2)}</p>
        </div>
      </div>
    `;
    })
    .join("");

  const subject = "Order Confirmed - Lazana Jewelry";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #D5B584; color: #fff; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .success-box { background-color: #fff; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; }
        .info-box { background-color: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-box h3 { margin-top: 0; color: #1C3163; font-size: 18px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #1C3163; color: #fff; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Lazana Jewelry</h1>
          <p style="margin: 0; font-size: 18px;">Order Confirmed</p>
        </div>
        <div class="content">
          <div class="success-box">
            <h2 style="margin-top: 0; color: #10b981;">✅ Your Order is Confirmed!</h2>
            <p>Dear ${orderData.customerName},</p>
            <p>Thank you for your order. We'll process it soon.</p>
            <p><strong>Order ID:</strong> #${orderData.orderId.slice(-8).toUpperCase()}</p>
          </div>

          <div class="info-box">
            <h3>Order Items</h3>
            ${itemsHtml}
            ${
              orderData.couponCode
                ? `
              <div style="padding: 15px; border-top: 2px solid #e0e0e0; margin-top: 10px;">
                <p style="margin: 5px 0; color: #10b981;">Coupon Applied: ${orderData.couponCode}</p>
                <p style="margin: 5px 0; color: #10b981;">Discount: USD $${orderData.discountAmount.toFixed(2)}</p>
              </div>
            `
                : ""
            }
            <div style="padding: 15px; border-top: 2px solid #e0e0e0; margin-top: 10px; text-align: right;">
              <p style="margin: 5px 0; color: #666;">Product Total: USD $${orderData.productTotal.toFixed(2)}</p>
              <p style="margin: 5px 0; color: #666;">Delivery Charges: USD $${orderData.deliveryCharges.toFixed(2)}</p>
              ${orderData.discountAmount > 0 ? `<p style="margin: 5px 0; color: #10b981;">Discount: -USD $${orderData.discountAmount.toFixed(2)}</p>` : ""}
              <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: bold; color: #1C3163;">Total: USD $${orderData.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div class="info-box">
            <h3>Shipping Address</h3>
            <p style="color: #666; margin: 5px 0;">${formatAddress(orderData.shippingAddress)}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${orderLink}" class="button">View Your Orders</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(orderData.customerEmail, subject, html);
    console.log(
      `✅ Regular product order confirmation email sent to ${orderData.customerEmail}`,
    );
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send regular product order confirmation email to ${orderData.customerEmail}:`,
      error,
    );
    throw error;
  }
}

// Send universal product order notification email to admin
export async function sendUniversalProductOrderNotificationToAdmin(
  orderData: any,
) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  if (!adminEmail) {
    throw new Error("Admin email not configured");
  }

  // Format shipping address
  const formatAddress = (addr: any) => {
    if (!addr) return "N/A";
    const parts = [
      addr.fullName,
      addr.street,
      addr.city,
      addr.state,
      addr.postalCode,
      addr.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  // Build product items HTML
  const itemsHtml = orderData.items
    .map((item: any) => {
      const imageHtml = item.imageUrl
        ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />`
        : `<div style="width: 80px; height: 80px; background-color: #f0f0f0; border-radius: 8px; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px;">No Image</div>`;

      return `
      <div style="display: flex; padding: 15px; border-bottom: 1px solid #e0e0e0; align-items: center;">
        ${imageHtml}
        <div style="flex: 1;">
          <p style="margin: 0; font-weight: bold; color: #333; font-size: 16px;">${item.name}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">Quantity: ${item.quantity} ${item.isSet ? "(Set)" : "(Piece)"}</p>
          <p style="margin: 5px 0; color: #1C3163; font-weight: bold; font-size: 16px;">USD $${(item.price * item.quantity).toFixed(2)}</p>
        </div>
      </div>
    `;
    })
    .join("");

  const subject = `New Session Order - ${orderData.customerName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1C3163; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fff; }
        .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
        .info-table td:first-child { font-weight: bold; width: 200px; color: #1C3163; }
        .info-box { background-color: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-box h3 { margin-top: 0; color: #1C3163; font-size: 18px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 New Session Order</h1>
        </div>
        <div class="content">
          <h2>New session order received (requires manual service)</h2>
          <p><strong>⚠️ This is a session order. Connect with the customer within 24-48 hours.</strong></p>
          <table class="info-table">
            <tr>
              <td>Order ID</td>
              <td>#${orderData.orderId.slice(-8).toUpperCase()}</td>
            </tr>
            <tr>
              <td>Customer Name</td>
              <td>${orderData.customerName}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td><a href="mailto:${orderData.customerEmail}">${orderData.customerEmail}</a></td>
            </tr>
            <tr>
              <td>Phone</td>
              <td>${orderData.shippingAddress?.phone || "N/A"}</td>
            </tr>
            <tr>
              <td>Total Amount</td>
              <td style="font-weight: bold; color: #10b981;">USD $${orderData.totalAmount.toFixed(2)}</td>
            </tr>
          </table>

          <div class="info-box">
            <h3>Order Items</h3>
            ${itemsHtml}
            <div style="padding: 15px; border-top: 2px solid #e0e0e0; margin-top: 10px; text-align: right;">
              <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: bold; color: #1C3163;">Total: USD $${orderData.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div class="info-box">
            <h3>Shipping Address</h3>
            <p style="color: #666; margin: 5px 0; white-space: pre-line;">${formatAddress(orderData.shippingAddress)}</p>
          </div>

          ${
            orderData.customerComments
              ? `
            <div class="info-box">
              <h3>Customer Comments</h3>
              <p style="color: #666; margin: 5px 0;">${orderData.customerComments}</p>
            </div>
          `
              : ""
          }
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(adminEmail, subject, html);
    console.log(
      `✅ Universal product order notification email sent to admin: ${adminEmail}`,
    );
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send universal product order notification email to ${adminEmail}:`,
      error,
    );
    throw error;
  }
}

// Send order placement notification email to admin
export async function sendOrderPlacementNotificationToAdmin(orderData: any) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  if (!adminEmail) {
    throw new Error("Admin email not configured");
  }

  // Format shipping address
  const formatAddress = (addr: any) => {
    if (!addr) return "N/A";
    const parts = [
      addr.fullName,
      addr.street,
      addr.city,
      addr.state,
      addr.postalCode,
      addr.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  // Build product items HTML
  const itemsHtml = orderData.items
    .map((item: any) => {
      const imageHtml = item.imageUrl
        ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />`
        : `<div style="width: 80px; height: 80px; background-color: #f0f0f0; border-radius: 8px; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 12px;">No Image</div>`;

      return `
      <div style="display: flex; padding: 15px; border-bottom: 1px solid #e0e0e0; align-items: center;">
        ${imageHtml}
        <div style="flex: 1;">
          <p style="margin: 0; font-weight: bold; color: #333; font-size: 16px;">${item.name}</p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">Quantity: ${item.quantity} ${item.isSet ? "(Set)" : "(Piece)"}</p>
          <p style="margin: 5px 0; color: #1C3163; font-weight: bold; font-size: 16px;">USD $${(item.price * item.quantity).toFixed(2)}</p>
        </div>
      </div>
    `;
    })
    .join("");

  const subject = `New Order - ${orderData.customerName}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1C3163; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #fff; }
        .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
        .info-table td:first-child { font-weight: bold; width: 200px; color: #1C3163; }
        .info-box { background-color: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info-box h3 { margin-top: 0; color: #1C3163; font-size: 18px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 New Order</h1>
        </div>
        <div class="content">
          <h2>New order received</h2>
          <table class="info-table">
            <tr>
              <td>Order ID</td>
              <td>#${orderData.orderId.slice(-8).toUpperCase()}</td>
            </tr>
            <tr>
              <td>Customer Name</td>
              <td>${orderData.customerName}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td><a href="mailto:${orderData.customerEmail}">${orderData.customerEmail}</a></td>
            </tr>
            <tr>
              <td>Phone</td>
              <td>${orderData.shippingAddress?.phone || "N/A"}</td>
            </tr>
            <tr>
              <td>Total Amount</td>
              <td style="font-weight: bold; color: #10b981;">USD $${orderData.totalAmount.toFixed(2)}</td>
            </tr>
          </table>

          <div class="info-box">
            <h3>Order Items</h3>
            ${itemsHtml}
            ${
              orderData.couponCode
                ? `
              <div style="padding: 15px; border-top: 2px solid #e0e0e0; margin-top: 10px;">
                <p style="margin: 5px 0; color: #10b981;">Coupon Applied: ${orderData.couponCode}</p>
                <p style="margin: 5px 0; color: #10b981;">Discount: USD $${(orderData.discountAmount || 0).toFixed(2)}</p>
              </div>
            `
                : ""
            }
            <div style="padding: 15px; border-top: 2px solid #e0e0e0; margin-top: 10px; text-align: right;">
              <p style="margin: 5px 0; color: #666;">Product Total: USD $${orderData.productTotal.toFixed(2)}</p>
              <p style="margin: 5px 0; color: #666;">Delivery Charges: USD $${orderData.deliveryCharges.toFixed(2)}</p>
              ${(orderData.discountAmount || 0) > 0 ? `<p style="margin: 5px 0; color: #10b981;">Discount: -USD $${orderData.discountAmount.toFixed(2)}</p>` : ""}
              <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: bold; color: #1C3163;">Total: USD $${orderData.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div class="info-box">
            <h3>Shipping Address</h3>
            <p style="color: #666; margin: 5px 0; white-space: pre-line;">${formatAddress(orderData.shippingAddress)}</p>
          </div>

          ${
            orderData.customerComments
              ? `
            <div class="info-box">
              <h3>Customer Comments</h3>
              <p style="color: #666; margin: 5px 0;">${orderData.customerComments}</p>
            </div>
          `
              : ""
          }
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Lazana Jewelry. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(adminEmail, subject, html);
    console.log(
      `✅ Order placement notification email sent to admin: ${adminEmail}`,
    );
    return result;
  } catch (error) {
    console.error(
      `❌ Failed to send order placement notification email to ${adminEmail}:`,
      error,
    );
    throw error;
  }
}
