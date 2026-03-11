interface EmailOptions {
  to: string
  subject: string
  htmlBody: string
  textBody: string
}

interface SMTP2GOResponse {
  data: {
    succeeded: number
    failed: number
    email_id?: string
  }
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const config = useRuntimeConfig()
  const apiKey = config.smtp2goApiKey
  const fromEmail = config.smtp2goFromEmail || 'noreply@example.com'
  const fromName = config.smtp2goFromName || 'Ranker'

  if (!apiKey) {
    throw new Error('SMTP2GO API key not configured')
  }

  const response = await $fetch<SMTP2GOResponse>('https://api.smtp2go.com/v3/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      api_key: apiKey,
      to: [options.to],
      sender: `${fromName} <${fromEmail}>`,
      subject: options.subject,
      html_body: options.htmlBody,
      text_body: options.textBody,
    },
  })

  if (!response.data || response.data.succeeded === 0) {
    throw new Error('Email sending failed')
  }
}

export function generatePasswordResetHTML(data: { name: string; resetUrl: string }): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - Ranker</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px;">Password Reset Request</h2>

              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Hi ${data.name},
              </p>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                We received a request to reset the password for your Ranker account. Click the button below to set a new password.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetUrl}" style="display: inline-block; padding: 12px 28px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: bold;">Reset My Password</a>
              </div>

              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                This link will expire in <strong>1 hour</strong>.
              </p>

              <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you did not request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>

              <div style="margin-top: 24px; padding: 14px; background-color: #f9fafb; border-radius: 6px; word-break: break-all;">
                <p style="margin: 0 0 4px 0; color: #9ca3af; font-size: 12px;">If the button above does not work, copy and paste this link into your browser:</p>
                <p style="margin: 0; color: #4b5563; font-size: 12px;">${data.resetUrl}</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px; text-align: center;">
        <p style="margin: 0; color: #9ca3af; font-size: 13px;">&copy; ${new Date().getFullYear()} Ranker. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function generatePasswordResetText(data: { name: string; resetUrl: string }): string {
  return `
RANKER - PASSWORD RESET REQUEST

Hi ${data.name},

We received a request to reset the password for your Ranker account.

To reset your password, visit the following link:
${data.resetUrl}

This link will expire in 1 hour.

If you did not request a password reset, you can safely ignore this email. Your password will not be changed.

© ${new Date().getFullYear()} Ranker. All rights reserved.
  `.trim()
}
