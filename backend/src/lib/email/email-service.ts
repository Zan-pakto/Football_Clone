import nodemailer, { Transporter } from "nodemailer";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface VipConfirmationParams {
  name: string;
  email: string;
  planName: string;
  amount: string;
  expiresAt: string;
  orderId?: string;
  provider?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;

  /**
   * Helper to get or create Nodemailer SMTP Transporter
   */
  private getTransporter(): Transporter | null {
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

    if (!smtpUser || !smtpPass) {
      return null;
    }

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false, // Prevents self-signed cert issues in diverse environments
        },
      });
    }

    return this.transporter;
  }

  /**
   * Verify whether an email provider is configured in environment variables
   */
  async verifyConfiguration(): Promise<{
    configured: boolean;
    provider: "resend" | "smtp" | "none";
    message: string;
  }> {
    if (process.env.RESEND_API_KEY?.trim()) {
      return {
        configured: true,
        provider: "resend",
        message: "Resend API configured via RESEND_API_KEY",
      };
    }

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.verify();
        return {
          configured: true,
          provider: "smtp",
          message: `SMTP Transporter verified successfully (${process.env.SMTP_HOST || "smtp.gmail.com"})`,
        };
      } catch (err: any) {
        return {
          configured: false,
          provider: "smtp",
          message: `SMTP verification failed: ${err.message}`,
        };
      }
    }

    return {
      configured: false,
      provider: "none",
      message: "No email keys configured. Please add SMTP_USER/SMTP_PASS or RESEND_API_KEY in .env.",
    };
  }

  /**
   * 1. VIP Subscription / Purchase Confirmation Email
   * Beautiful luxury dark-gold football intelligence design
   */
  getSubscriptionConfirmationEmail(params: VipConfirmationParams): EmailPayload {
    const { name, email, planName, amount, expiresAt, orderId } = params;
    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:3000";
    const predictionsUrl = `${frontendUrl}/all-matches`;
    const accountUrl = `${frontendUrl}/account`;

    const formattedExpiry = expiresAt
      ? new Date(expiresAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Active Ongoing";

    const subject = `👑 VIP Access Confirmed: Welcome to ${planName} on Jolloftips!`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="background-color:#090d1a; color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; padding:40px 16px; margin:0; -webkit-font-smoothing:antialiased;">
        <div style="max-width:580px; margin:0 auto; background:linear-gradient(180deg, #13192f 0%, #0d1222 100%); border:1px solid #2a3356; border-radius:18px; padding:36px 30px; box-shadow:0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header / Brand -->
          <div style="text-align:center; margin-bottom:28px;">
            <div style="display:inline-block; padding:10px 18px; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:30px; margin-bottom:14px;">
              <span style="color:#fbbf24; font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase;">👑 VIP MEMBERSHIP UNLOCKED</span>
            </div>
            <h1 style="color:#ffffff; font-size:26px; font-weight:900; margin:0; letter-spacing:-0.02em;">⚽ JOLLOFTIPS</h1>
            <p style="color:#94a3b8; font-size:14px; margin:4px 0 0;">AI Football Prediction & Edge Telemetry</p>
          </div>

          <!-- Greeting -->
          <div style="margin-bottom:24px;">
            <h2 style="color:#ffffff; font-size:20px; font-weight:700; margin:0 0 10px;">Payment Received — Welcome to VIP!</h2>
            <p style="color:#cbd5e1; font-size:15px; line-height:1.6; margin:0 0 8px;">
              Hi <strong>${name || "Valued Football Fan"}</strong>,
            </p>
            <p style="color:#94a3b8; font-size:14px; line-height:1.6; margin:0;">
              Your purchase was successful and full VIP privileges have been granted to your account (<span style="color:#fbbf24;">${email}</span>).
            </p>
          </div>

          <!-- Purchase Summary Card -->
          <div style="background:#1b2340; border:1px solid #2b3863; border-radius:12px; padding:20px 22px; margin-bottom:28px;">
            <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px; margin-bottom:12px; font-size:12px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">
              Receipt & Membership Details
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:14px; color:#cbd5e1;">
              <tr>
                <td style="padding:6px 0; color:#94a3b8;">Plan Subscribed:</td>
                <td style="padding:6px 0; text-align:right; font-weight:700; color:#fbbf24;">${planName}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#94a3b8;">Amount Paid:</td>
                <td style="padding:6px 0; text-align:right; font-weight:700; color:#ffffff;">${amount}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#94a3b8;">Status:</td>
                <td style="padding:6px 0; text-align:right;">
                  <span style="background:rgba(16,185,129,0.2); color:#34d399; font-weight:700; font-size:12px; padding:3px 10px; border-radius:20px; border:1px solid rgba(16,185,129,0.3);">ACTIVE</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#94a3b8;">Valid Until:</td>
                <td style="padding:6px 0; text-align:right; font-weight:600; color:#ffffff;">${formattedExpiry}</td>
              </tr>
              ${
                orderId
                  ? `<tr>
                      <td style="padding:6px 0; color:#94a3b8;">Reference ID:</td>
                      <td style="padding:6px 0; text-align:right; font-family:monospace; font-size:12px; color:#94a3b8;">${orderId}</td>
                    </tr>`
                  : ""
              }
            </table>
          </div>

          <!-- Unlocked VIP Features -->
          <div style="background:rgba(245,158,11,0.05); border:1px solid rgba(245,158,11,0.2); border-radius:12px; padding:20px; margin-bottom:28px;">
            <p style="margin:0 0 14px; font-weight:700; color:#fbbf24; font-size:14px;">🔥 What is now unlocked on your account:</p>
            <ul style="margin:0; padding-left:20px; color:#cbd5e1; font-size:13px; line-height:1.7;">
              <li><strong>Unrestricted Daily AI Predictions</strong>: Instant access to high-confidence match picks across 50+ global leagues.</li>
              <li><strong>VIP Banker Accumulators</strong>: Algorithms filtered for maximum probability and safe rollover slips.</li>
              <li><strong>Advanced Value Odds & Form Telemetry</strong>: AI predictive goal matrices and edge calculations.</li>
              <li><strong>Zero Limits & Zero Ads</strong>: Uninterrupted analysis experience.</li>
            </ul>
          </div>

          <!-- CTA Buttons -->
          <div style="text-align:center; margin-bottom:28px;">
            <a href="${predictionsUrl}" style="background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color:#090d1a; text-decoration:none; padding:15px 32px; border-radius:10px; font-weight:800; font-size:15px; display:inline-block; box-shadow:0 6px 18px rgba(245,158,11,0.35); text-transform:uppercase; letter-spacing:0.04em;">
              🚀 Access VIP Predictions Now
            </a>
            <div style="margin-top:12px;">
              <a href="${accountUrl}" style="color:#94a3b8; font-size:13px; text-decoration:underline;">
                View your account and billing details
              </a>
            </div>
          </div>

          <!-- Divider -->
          <div style="height:1px; background:#2a3356; margin:28px 0;"></div>

          <!-- Footer -->
          <div style="text-align:center; color:#64748b; font-size:12px; line-height:1.6;">
            <p style="margin:0 0 6px;">
              Need help or have questions about your VIP subscription? Reply directly to this email or reach us at <a href="mailto:support@jolloftips.com" style="color:#818cf8; text-decoration:none;">support@jolloftips.com</a>.
            </p>
            <p style="margin:0;">
              &copy; ${new Date().getFullYear()} Jolloftips. All rights reserved.
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    const text = `
👑 VIP ACCESS CONFIRMED - JOLLOFTIPS

Hi ${name || "Valued Football Fan"},

Your payment was successfully received and VIP access is now active for your account (${email}).

PURCHASE SUMMARY:
- Plan: ${planName}
- Amount: ${amount}
- Status: ACTIVE
- Valid Until: ${formattedExpiry}
${orderId ? `- Reference: ${orderId}` : ""}

WHAT'S UNLOCKED:
- Unrestricted Daily AI Predictions
- VIP Banker Accumulators & Safe Rollovers
- Value Odds Telemetry & Match Consensus Matrix
- Full Premium Edge Analytics

Access your VIP picks now at:
${predictionsUrl}

Manage your subscription anytime at:
${accountUrl}

Thank you for choosing Jolloftips!
    `.trim();

    return { to: email, subject, html, text };
  }

  /**
   * 2. Welcome Email for New Signups
   */
  getWelcomeEmail(params: { name: string; email: string }): EmailPayload {
    const { name, email } = params;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const subject = "Welcome to Jolloftips - AI Football Intelligence";
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>${subject}</title></head>
      <body style="background:#090d1a; color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,sans-serif; padding:40px 20px; margin:0;">
        <div style="max-width:560px; margin:0 auto; background:#12182c; border:1px solid #2a3356; border-radius:16px; padding:32px;">
          <div style="text-align:center; margin-bottom:24px;">
            <h1 style="color:#ffffff; font-size:24px; margin:0;">⚽ Jolloftips</h1>
            <p style="color:#a5b4fc; font-size:14px; margin-top:4px;">Advanced AI Football Predictions</p>
          </div>
          <p style="font-size:16px; line-height:1.6; color:#cbd5e1;">Hi <strong>${name || "Football Fan"}</strong>,</p>
          <p style="font-size:15px; line-height:1.6; color:#94a3b8;">
            Welcome aboard! You now have access to high-accuracy daily AI predictions, match consensus algorithms, and comprehensive league analytics across top global leagues.
          </p>
          <div style="background:#1b2340; border-radius:10px; padding:18px; margin:24px 0;">
            <p style="margin:0 0 8px; font-weight:bold; color:#34d399;">Your Account Details:</p>
            <p style="margin:0; font-size:14px; color:#cbd5e1;">Email: <strong>${email}</strong></p>
            <p style="margin:4px 0 0; font-size:14px; color:#cbd5e1;">Daily Free Tier: <strong>7 Tips / Day</strong></p>
          </div>
          <div style="text-align:center; margin-top:32px;">
            <a href="${frontendUrl}/all-matches" style="background:#6366f1; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:bold; font-size:14px; display:inline-block;">Explore Today's Predictions</a>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `Welcome to Jolloftips, ${name}!\nYour account (${email}) is active with 7 free daily tips.\nExplore predictions at ${frontendUrl}/all-matches`;
    return { to: email, subject, html, text };
  }

  /**
   * 3. Password Reset Email
   */
  getPasswordResetEmail(params: { email: string; resetToken: string }): EmailPayload {
    const { email, resetToken } = params;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    const subject = "Reset Your Jolloftips Password";
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="background:#090d1a; color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,sans-serif; padding:40px 20px; margin:0;">
        <div style="max-width:560px; margin:0 auto; background:#12182c; border:1px solid #2a3356; border-radius:16px; padding:32px;">
          <h2 style="color:#ffffff; margin:0 0 16px;">Password Reset Request</h2>
          <p style="color:#94a3b8; font-size:15px; line-height:1.6;">
            We received a request to reset the password for your Jolloftips account. Click the button below to choose a new password:
          </p>
          <div style="text-align:center; margin:28px 0;">
            <a href="${resetUrl}" style="background:#ef4444; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:bold; font-size:14px; display:inline-block;">Reset My Password</a>
          </div>
          <p style="color:#64748b; font-size:13px; line-height:1.5;">
            If you did not request this password reset, please ignore this email or contact support. This link expires in 1 hour.
          </p>
        </div>
      </body>
      </html>
    `;
    const text = `Reset your Jolloftips password by visiting: ${resetUrl}\nLink expires in 1 hour.`;
    return { to: email, subject, html, text };
  }

  /**
   * 4. Subscription Renewal / Expiry Reminder
   */
  getSubscriptionExpiryReminderEmail(params: { name: string; email: string; planName: string; daysRemaining: number; renewalUrl: string }): EmailPayload {
    const { name, email, planName, daysRemaining, renewalUrl } = params;
    const subject = `Notice: Your ${planName} Access Expires in ${daysRemaining} Day${daysRemaining === 1 ? "" : "s"}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="background:#090d1a; color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,sans-serif; padding:40px 20px; margin:0;">
        <div style="max-width:560px; margin:0 auto; background:#12182c; border:1px solid #2a3356; border-radius:16px; padding:32px;">
          <h2 style="color:#ffffff; margin:0 0 12px;">Subscription Renewal Notice</h2>
          <p style="color:#cbd5e1; font-size:15px; line-height:1.6;">Hi <strong>${name}</strong>,</p>
          <p style="color:#94a3b8; font-size:15px; line-height:1.6;">
            Your <strong>${planName}</strong> plan will expire in <strong>${daysRemaining} day${daysRemaining === 1 ? "" : "s"}</strong>. Renew now to maintain uninterrupted access to high-confidence match picks and daily AI matrices.
          </p>
          <div style="text-align:center; margin:28px 0;">
            <a href="${renewalUrl}" style="background:#6366f1; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:bold; font-size:14px; display:inline-block;">Renew VIP Access</a>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `Hi ${name},\nYour ${planName} subscription expires in ${daysRemaining} days. Renew at ${renewalUrl}`;
    return { to: email, subject, html, text };
  }

  /**
   * 5. Payment Failed Alert
   */
  getPaymentFailedEmail(params: { name: string; email: string; planName: string; retryUrl: string }): EmailPayload {
    const { name, email, planName, retryUrl } = params;
    const subject = "Action Required: Payment Failed for Jolloftips";
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="background:#090d1a; color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,sans-serif; padding:40px 20px; margin:0;">
        <div style="max-width:560px; margin:0 auto; background:#12182c; border:1px solid #3b1d28; border-radius:16px; padding:32px;">
          <div style="text-align:center; margin-bottom:20px;">
            <span style="background:rgba(239,68,68,0.15); color:#f87171; font-weight:800; font-size:12px; padding:4px 12px; border-radius:999px; border:1px solid rgba(239,68,68,0.3);">PAYMENT UNSUCCESSFUL</span>
            <h2 style="color:#ffffff; margin:12px 0 4px;">We couldn't process your renewal</h2>
          </div>
          <p style="color:#cbd5e1; font-size:15px; line-height:1.6;">Hi <strong>${name}</strong>,</p>
          <p style="color:#94a3b8; font-size:15px; line-height:1.6;">
            We attempted to renew your <strong>${planName}</strong> subscription, but the charge was declined by your payment provider. Please update your payment method to keep your VIP perks active.
          </p>
          <div style="text-align:center; margin:28px 0;">
            <a href="${retryUrl}" style="background:#ef4444; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:bold; font-size:14px; display:inline-block;">Update Billing & Retry</a>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `Hi ${name},\nYour payment for ${planName} could not be processed. Update your billing method at ${retryUrl}`;
    return { to: email, subject, html, text };
  }

  /**
   * Universal Dispatcher:
   * 1. If RESEND_API_KEY is present -> Sends via Resend HTTP API
   * 2. Else if SMTP_USER & SMTP_PASS are present -> Sends via Nodemailer SMTP (Gmail, SendGrid, etc.)
   * 3. Else -> Gracefully logs email details in development console
   */
  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId: string; error?: string }> {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || "Jolloftips VIP <support@jolloftips.com>";

    // Option 1: Direct Resend API
    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    if (resendApiKey) {
      try {
        console.log(`📨 [EmailService:Resend] Dispatching email to: ${payload.to} | Subject: "${payload.subject}"`);
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
          }),
        });

        const data: any = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error || `Resend responded with HTTP ${res.status}`);
        }

        console.log(`✅ [EmailService:Resend] Email delivered to ${payload.to} (ID: ${data.id})`);
        return { success: true, messageId: data.id || `resend_${Date.now()}` };
      } catch (err: any) {
        console.error(`❌ [EmailService:Resend:Error] Failed to send email to ${payload.to}:`, err.message);
        return { success: false, messageId: "", error: err.message };
      }
    }

    // Option 2: Nodemailer SMTP (Gmail, Hostinger, SendGrid, Mailgun, Brevo, AWS SES)
    const transporter = this.getTransporter();
    if (transporter) {
      try {
        console.log(`📨 [EmailService:SMTP] Dispatching email to: ${payload.to} | Subject: "${payload.subject}"`);
        const info = await transporter.sendMail({
          from: fromAddress,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        });

        console.log(`✅ [EmailService:SMTP] Email delivered to ${payload.to} (MessageId: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
      } catch (err: any) {
        console.error(`❌ [EmailService:SMTP:Error] Failed to send email to ${payload.to}:`, err.message);
        return { success: false, messageId: "", error: err.message };
      }
    }

    // Option 3: Fallback Log Mode (when no SMTP credentials are in .env yet)
    const mockId = `sim_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.warn(`\n⚠️  [EmailService:Simulated] Email to "${payload.to}" not sent via network.`);
    console.warn(`   Reason: No SMTP or Resend credentials configured yet.`);
    console.warn(`   To enable live delivery, fill in SMTP_HOST, SMTP_USER, SMTP_PASS (or RESEND_API_KEY) in backend/.env.`);
    console.log(`   [Simulated Subject]: ${payload.subject}`);
    console.log(`   [Simulated To]: ${payload.to}`);
    console.log(`   [Simulated MessageId]: ${mockId}\n`);

    return {
      success: true,
      messageId: mockId,
    };
  }
}

export const emailService = new EmailService();

