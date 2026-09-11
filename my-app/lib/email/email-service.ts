export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  /**
   * 1. Welcome Email
   */
  getWelcomeEmail(params: { name: string; email: string }): EmailPayload {
    const { name, email } = params;
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
            <a href="https://jolloftips.com/all-matches" style="background:#6366f1; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:bold; font-size:14px; display:inline-block;">Explore Today's Predictions</a>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `Welcome to Jolloftips, ${name}!\nYour account (${email}) is active with 7 free daily tips.\nExplore predictions at https://jolloftips.com/all-matches`;
    return { to: email, subject, html, text };
  }

  /**
   * 2. Password Reset Email
   */
  getPasswordResetEmail(params: { email: string; resetToken: string }): EmailPayload {
    const { email, resetToken } = params;
    const resetUrl = `https://jolloftips.com/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
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
   * 3. Subscription Confirmation Email
   */
  getSubscriptionConfirmationEmail(params: { name: string; email: string; planName: string; amount: string; expiresAt: string }): EmailPayload {
    const { name, email, planName, amount, expiresAt } = params;
    const subject = `Subscription Confirmed: VIP Access to ${planName}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="background:#090d1a; color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,sans-serif; padding:40px 20px; margin:0;">
        <div style="max-width:560px; margin:0 auto; background:#12182c; border:1px solid #2a3356; border-radius:16px; padding:32px;">
          <div style="text-align:center; margin-bottom:20px;">
            <span style="background:rgba(16,185,129,0.15); color:#34d399; font-weight:800; font-size:12px; padding:4px 12px; border-radius:999px; border:1px solid rgba(16,185,129,0.3);">ACTIVE VIP SUBSCRIPTION</span>
            <h2 style="color:#ffffff; margin:12px 0 4px;">Thank You for Upgrading!</h2>
          </div>
          <p style="color:#cbd5e1; font-size:15px; line-height:1.6;">Hi <strong>${name}</strong>,</p>
          <p style="color:#94a3b8; font-size:15px; line-height:1.6;">
            Your payment was successful and full VIP access has been unlocked for your account. You now receive unrestricted daily predictions, VIP Bet Builder, and Match Matrix analytics.
          </p>
          <div style="background:#1b2340; border-radius:10px; padding:18px; margin:24px 0;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:14px; color:#cbd5e1;">
              <span>Plan:</span> <strong style="color:#fbbf24;">${planName}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:14px; color:#cbd5e1;">
              <span>Amount Paid:</span> <strong>${amount}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:14px; color:#cbd5e1;">
              <span>Next Renewal Date:</span> <strong>${new Date(expiresAt).toLocaleDateString()}</strong>
            </div>
          </div>
          <div style="text-align:center; margin-top:28px;">
            <a href="https://jolloftips.com/all-matches" style="background:#10b981; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:bold; font-size:14px; display:inline-block;">Access VIP Predictions</a>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `Hi ${name},\nYour ${planName} subscription is active!\nAmount: ${amount}\nValid until: ${expiresAt}\nAccess VIP at https://jolloftips.com/all-matches`;
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
   * Send email stub (logs in development / hooks into Resend or SendGrid in production)
   */
  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId: string }> {
    console.log(`[EmailService] Sending email to: ${payload.to} | Subject: "${payload.subject}"`);
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }
}

export const emailService = new EmailService();
