import nodemailer from "nodemailer";

// Create nodemailer transporter using Gmail SMTP
const getTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.error("❌ Email SMTP credentials not configured!");
    console.error("Please ensure EMAIL_USER and EMAIL_PASS are set in your .env.local file");
    console.error("Note: You need to use a Gmail App Password, not your regular Gmail password");
    console.error("Get an App Password at: https://myaccount.google.com/apppasswords");
    throw new Error(
      "Email SMTP credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env.local"
    );
  }

  console.log(`📧 Configuring email transporter for: ${emailUser}`);
  
  return nodemailer.createTransport({
    service: "gmail",
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass, // Gmail App Password (not regular password)
    },
  });
};

// Send email using nodemailer (Gmail SMTP)
export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  try {
    const transporter = getTransporter();
    const fromEmail = process.env.EMAIL_USER;

    if (!fromEmail) {
      throw new Error("EMAIL_USER not configured");
    }

    const info = await transporter.sendMail({
      from: `"Crystal Bowl Studio" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Plain text fallback
    });

    console.log(`✅ Email sent successfully to ${to} | Subject: ${subject} | Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email send error:", error);
    
    // Check for authentication error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EAUTH') {
      console.error("⚠️  Gmail Authentication Failed!");
      console.error("Please check:");
      console.error("1. EMAIL_USER is set to your full Gmail address");
      console.error("2. EMAIL_PASS is set to a valid App Password (NOT your regular password)");
      console.error("3. 2-Step Verification is enabled on your Google Account");
      console.error("4. Create an App Password at: https://myaccount.google.com/apppasswords");
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to send email: ${errorMessage}`);
  }
}

// Send OTP email
export async function sendOTPEmail(email: string, otp: string, name: string) {
  const subject = "Verify Your Email - Crystal Bowl Studio";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .otp-box { background-color: #fff; border: 2px solid #000; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Crystal Bowl Studio</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>Thank you for registering with Crystal Bowl Studio. Please verify your email address using the OTP below:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Crystal Bowl Studio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(email, subject, html);
    console.log(`✅ OTP email sent successfully to ${name} (${email})`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${name} (${email}):`, error);
    throw error;
  }
}

// Send verification email with link
export async function sendVerificationEmail(email: string, name: string, verificationUrl: string) {
  const subject = "Verify Your Email - Crystal Bowl Studio";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .button { display: inline-block; background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Crystal Bowl Studio</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>Thank you for registering with Crystal Bowl Studio. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Crystal Bowl Studio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(email, subject, html);
    console.log(`✅ Verification email sent successfully to ${name} (${email})`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${name} (${email}):`, error);
    throw error;
  }
}

// Send enquiry notification to admin
export async function sendEnquiryNotificationToAdmin(enquiryData: {
  fullName: string;
  email: string;
  phone: string;
  services: string;
  sessionType: string;
  comment?: string;
  createdAt: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  
  if (!adminEmail) {
    throw new Error("Admin email not configured");
  }

  const subject = `New Yoga Session Enquiry - ${enquiryData.fullName}`;
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
        .session-badge { display: inline-block; padding: 6px 12px; border-radius: 5px; font-weight: bold; color: #fff; }
        .discovery { background-color: #10b981; }
        .private { background-color: #3b82f6; }
        .corporate { background-color: #8b5cf6; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 New Session Enquiry</h1>
        </div>
        <div class="content">
          <h2>New enquiry received from ${enquiryData.fullName}</h2>
          <p>A new yoga session enquiry has been submitted. Here are the details:</p>
          
          <table class="info-table">
            <tr>
              <td>Full Name</td>
              <td>${enquiryData.fullName}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td><a href="mailto:${enquiryData.email}">${enquiryData.email}</a></td>
            </tr>
            <tr>
              <td>Phone</td>
              <td><a href="tel:${enquiryData.phone}">${enquiryData.phone}</a></td>
            </tr>
            <tr>
              <td>Service Requested</td>
              <td>${enquiryData.services}</td>
            </tr>
            <tr>
              <td>Session Type</td>
              <td>
                <span class="session-badge ${enquiryData.sessionType || 'discovery'}">
                  ${enquiryData.sessionType ? (enquiryData.sessionType.charAt(0).toUpperCase() + enquiryData.sessionType.slice(1)) : 'Discovery'}
                </span>
              </td>
            </tr>
            ${enquiryData.comment ? `
            <tr>
              <td>Comment</td>
              <td>${enquiryData.comment}</td>
            </tr>
            ` : ''}
            <tr>
              <td>Submitted At</td>
              <td>${new Date(enquiryData.createdAt).toLocaleString()}</td>
            </tr>
          </table>
          
          <p style="margin-top: 30px;">
            <strong>Action Required:</strong> Please contact ${enquiryData.fullName} at the provided email or phone number to discuss their ${enquiryData.sessionType} session enquiry.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Crystal Bowl Studio. All rights reserved.</p>
          <p>This is an automated notification from your website's enquiry form.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(adminEmail, subject, html);
    console.log(`✅ Admin notification sent successfully for enquiry from ${enquiryData.fullName}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send admin notification for enquiry from ${enquiryData.fullName}:`, error);
    throw error;
  }
}

// Send confirmation email to user
export async function sendEnquiryConfirmationToUser(enquiryData: {
  fullName: string;
  email: string;
  services: string;
  sessionType: string;
}) {
  const subject = "Thank You for Your Enquiry - Crystal Bowl Studio";
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1C3163; color: #fff; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .highlight-box { background-color: #fff; border-left: 4px solid #1C3163; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; background-color: #1C3163; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Crystal Bowl Studio</h1>
          <p style="margin: 0; font-size: 18px;">Thank You for Your Interest!</p>
        </div>
        <div class="content">
          <h2>Hello ${enquiryData.fullName}!</h2>
          <p>Thank you for your enquiry about our <strong>${enquiryData.services}</strong> service.</p>
          
          <div class="highlight-box">
            <h3 style="margin-top: 0;">📋 What's Next?</h3>
            <p>We have received your enquiry for a <strong>${enquiryData.sessionType}</strong> session and our team will review it shortly.</p>
            <p>One of our specialists will contact you within 24-48 hours to discuss:</p>
            <ul>
              <li>Available session times</li>
              <li>Pricing and packages</li>
              <li>Your specific needs and goals</li>
              <li>Any questions you may have</li>
            </ul>
          </div>
          
          <p>In the meantime, feel free to explore more about our services on our website.</p>
          
          <p style="margin-top: 30px;">
            <strong>Need immediate assistance?</strong><br>
            Feel free to reach out to us directly at <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>
          </p>
          
          <p style="margin-top: 30px; font-style: italic; color: #666;">
            We look forward to guiding you on your wellness journey!
          </p>
        </div>
        <div class="footer">
          <p><strong>Crystal Bowl Studio</strong></p>
          <p>&copy; ${new Date().getFullYear()} Crystal Bowl Studio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(enquiryData.email, subject, html);
    console.log(`✅ Confirmation email sent successfully to ${enquiryData.fullName} (${enquiryData.email})`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send confirmation email to ${enquiryData.fullName} (${enquiryData.email}):`, error);
    throw error;
  }
}

// Send discovery session registration confirmation email
export async function sendDiscoverySessionConfirmation(discoveryData: {
  selectedDate: string;
  selectedTime: string;
  email?: string;
}) {
  // Send to provided email or admin email if no email provided
  const recipientEmail = discoveryData.email && discoveryData.email !== 'discovery@example.com' 
    ? discoveryData.email 
    : process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  
  if (!recipientEmail) {
    throw new Error("Recipient email not configured");
  }

  const subject = "Discovery Session Registration Successful - Crystal Bowl Studio";
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
        .appointment-details { background-color: #fff; border: 2px solid #D5B584; border-radius: 8px; padding: 20px; margin: 20px 0; }
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
          <h1>✨ Crystal Bowl Studio</h1>
          <p style="margin: 0; font-size: 18px;">Discovery Session Registration</p>
        </div>
        <div class="content">
          <div class="success-box">
            <h2 style="margin-top: 0; color: #10b981;">✅ Registration Successfully for This Discovery Session</h2>
            <p style="font-size: 18px; margin: 10px 0;">Your discovery session appointment has been successfully registered!</p>
          </div>
          
          <div class="appointment-details">
            <h3 style="margin-top: 0; color: #5B7C99;">📅 Appointment Details</h3>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${discoveryData.selectedDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${discoveryData.selectedTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Session Type:</span>
              <span class="detail-value">Discovery Session</span>
            </div>
          </div>
          
          <p style="margin-top: 30px;">
            <strong>What's Next?</strong><br>
            Our team will review your registration and contact you shortly to confirm your discovery session appointment.
          </p>
          
          <p style="margin-top: 20px;">
            If you have any questions or need to make changes to your appointment, please don't hesitate to reach out to us.
          </p>
          
          <p style="margin-top: 30px; font-style: italic; color: #666;">
            We look forward to helping you discover your perfect crystal bowl!
          </p>
        </div>
        <div class="footer">
          <p><strong>Crystal Bowl Studio</strong></p>
          <p>&copy; ${new Date().getFullYear()} Crystal Bowl Studio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(recipientEmail, subject, html);
    console.log(`✅ Discovery session confirmation email sent successfully to ${recipientEmail}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send discovery session confirmation email to ${recipientEmail}:`, error);
    throw error;
  }
}

// NEW: Send order placement notification to admin
export async function sendOrderPlacementNotificationToAdmin(orderData: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; price: number; isSet?: boolean }>;
  productTotal: number;
  deliveryMethod: string;
  deliveryCharges: number;
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  customerComments?: string;
  createdAt: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  
  if (!adminEmail) {
    throw new Error("Admin email not configured");
  }

  const subject = `🛒 New Order #${orderData.orderId.slice(-8).toUpperCase()} - ${orderData.customerName}`;
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
        .order-items { background-color: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .item-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .item-row:last-child { border-bottom: none; }
        .total-row { background-color: #f0f0f0; padding: 15px; margin-top: 10px; font-weight: bold; font-size: 18px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛒 New Order Received!</h1>
          <p style="margin: 0;">Order #${orderData.orderId.slice(-8).toUpperCase()}</p>
        </div>
        <div class="content">
          <h2>Order from ${orderData.customerName}</h2>
          
          <table class="info-table">
            <tr>
              <td>Order ID</td>
              <td>${orderData.orderId}</td>
            </tr>
            <tr>
              <td>Customer Name</td>
              <td>${orderData.customerName}</td>
            </tr>
            <tr>
              <td>Customer Email</td>
              <td><a href="mailto:${orderData.customerEmail}">${orderData.customerEmail}</a></td>
            </tr>
            <tr>
              <td>Order Date</td>
              <td>${new Date(orderData.createdAt).toLocaleString()}</td>
            </tr>
          </table>

          <div class="order-items">
            <h3 style="margin-top: 0;">📦 Order Items</h3>
            ${orderData.items.map(item => `
              <div class="item-row">
                <div>
                  <strong>${item.name}</strong>
                  <br>
                  <small>Qty: ${item.quantity} ${item.isSet ? '(Set)' : '(Piece)'} × $${item.price.toFixed(2)}</small>
                </div>
                <div>$${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            `).join('')}
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #e0e0e0;">
              <div class="item-row">
                <span>Product Total:</span>
                <span>$${orderData.productTotal.toFixed(2)}</span>
              </div>
              <div class="item-row">
                <span>Delivery (${orderData.deliveryMethod}):</span>
                <span>$${orderData.deliveryCharges.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="total-row">
              <div style="display: flex; justify-content: space-between;">
                <span>Total Amount (SGD):</span>
                <span>$${orderData.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <table class="info-table">
            <tr>
              <td colspan="2" style="background-color: #1C3163; color: white; font-weight: bold;">📍 Shipping Address</td>
            </tr>
            <tr>
              <td>Full Name</td>
              <td>${orderData.shippingAddress.fullName}</td>
            </tr>
            <tr>
              <td>Phone</td>
              <td><a href="tel:${orderData.shippingAddress.phone}">${orderData.shippingAddress.phone}</a></td>
            </tr>
            <tr>
              <td>Street</td>
              <td>${orderData.shippingAddress.street}</td>
            </tr>
            <tr>
              <td>City</td>
              <td>${orderData.shippingAddress.city}</td>
            </tr>
            <tr>
              <td>State</td>
              <td>${orderData.shippingAddress.state}</td>
            </tr>
            <tr>
              <td>Postal Code</td>
              <td>${orderData.shippingAddress.postalCode}</td>
            </tr>
            <tr>
              <td>Country</td>
              <td>${orderData.shippingAddress.country}</td>
            </tr>
            ${orderData.customerComments ? `
            <tr>
              <td colspan="2" style="background-color: #f0f0f0; font-weight: bold;">💬 Customer Comments</td>
            </tr>
            <tr>
              <td colspan="2">${orderData.customerComments}</td>
            </tr>
            ` : ''}
          </table>
          
          <p style="margin-top: 30px;">
            <strong>Action Required:</strong> Please log in to the admin panel to process this order and update the customer on shipment status.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Crystal Bowl Studio. All rights reserved.</p>
          <p>This is an automated notification from your e-commerce system.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(adminEmail, subject, html);
    console.log(`✅ Order placement notification sent to admin for Order #${orderData.orderId.slice(-8)}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send order placement notification to admin:`, error);
    throw error;
  }
}

// NEW: Send order status update to user
export async function sendOrderStatusUpdateToUser(orderData: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  deliveryStatus: string; // Changed from status to deliveryStatus
  message?: string;
  items: Array<{ name: string; quantity: number; price: number; isSet?: boolean }>;
  totalAmount: number;
}) {
  const statusEmojis: Record<string, string> = {
    pending: '⏳',
    processing: '⚙️',
    'ready to ship': '📦',
    shipped: '🚚',
    'reached to your country': '🌍',
    'on the way to delivery': '🚛',
    delivered: '✅',
  };

  const statusColors: Record<string, string> = {
    pending: '#fbbf24',
    processing: '#3b82f6',
    'ready to ship': '#8b5cf6',
    shipped: '#6366f1',
    'reached to your country': '#10b981',
    'on the way to delivery': '#f59e0b',
    delivered: '#10b981',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    'ready to ship': 'Ready to Ship',
    shipped: 'Shipped',
    'reached to your country': 'Reached to Your Country',
    'on the way to delivery': 'On the Way to Delivery',
    delivered: 'Delivered',
  };

  const emoji = statusEmojis[orderData.deliveryStatus] || '📋';
  const color = statusColors[orderData.deliveryStatus] || '#1C3163';
  const statusLabel = statusLabels[orderData.deliveryStatus] || orderData.deliveryStatus;

  const subject = `${emoji} Order #${orderData.orderId.slice(-8).toUpperCase()} - Delivery Status: ${statusLabel}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${color}; color: #fff; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .status-box { background-color: #fff; border-left: 4px solid ${color}; padding: 20px; margin: 20px 0; }
        .order-summary { background-color: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${emoji} Order Delivery Update</h1>
          <p style="margin: 0; font-size: 18px;">Order #${orderData.orderId.slice(-8).toUpperCase()}</p>
        </div>
        <div class="content">
          <h2>Hello ${orderData.customerName}!</h2>
          <p>Your order delivery status has been updated.</p>
          
          <div class="status-box">
            <h3 style="margin-top: 0; color: ${color};">Delivery Status: ${statusLabel}</h3>
            ${orderData.message ? `
              <p style="font-size: 16px; margin: 15px 0;"><strong>Message from Crystal Bowl Studio:</strong></p>
              <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; font-style: italic;">${orderData.message}</p>
            ` : ''}
          </div>
          
          <div class="order-summary">
            <h3 style="margin-top: 0;">📦 Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <thead>
                <tr style="background-color: #f0f0f0; border-bottom: 2px solid #ddd;">
                  <th style="padding: 10px; text-align: left; font-weight: bold;">Product</th>
                  <th style="padding: 10px; text-align: center; font-weight: bold;">Quantity</th>
                  <th style="padding: 10px; text-align: right; font-weight: bold;">Unit Price</th>
                  <th style="padding: 10px; text-align: right; font-weight: bold;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderData.items.map(item => `
                  <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 12px;">
                      <strong>${item.name}</strong>
                      ${item.isSet ? '<br><small style="color: #666;">Type: Set</small>' : '<br><small style="color: #666;">Type: Piece</small>'}
                    </td>
                    <td style="padding: 12px; text-align: center;">${item.quantity}</td>
                    <td style="padding: 12px; text-align: right;">$${item.price.toFixed(2)}</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr style="background-color: #f9f9f9; border-top: 2px solid #ddd;">
                  <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold; font-size: 16px;">Total Amount (SGD):</td>
                  <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #1C3163;">$${orderData.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <p style="margin-top: 30px;">
            If you have any questions about your order, please don't hesitate to contact us.
          </p>
          
          <p style="margin-top: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile?tab=orders" 
               style="display: inline-block; background-color: ${color}; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
              View Order Details
            </a>
          </p>
        </div>
        <div class="footer">
          <p><strong>Crystal Bowl Studio</strong></p>
          <p>&copy; ${new Date().getFullYear()} Crystal Bowl Studio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail(orderData.customerEmail, subject, html);
    console.log(`✅ Order status update sent to ${orderData.customerName} for Order #${orderData.orderId.slice(-8)}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send order status update email:`, error);
    throw error;
  }
}
