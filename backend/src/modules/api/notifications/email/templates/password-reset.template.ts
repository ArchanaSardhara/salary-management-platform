const PasswordResetTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>

<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:Arial, Helvetica, sans-serif; color:#171717;">
  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="background-color:#f5f5f5; padding:40px 16px;"
  >
    <tr>
      <td align="center">

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="max-width:520px; background-color:#ffffff; border-radius:12px; overflow:hidden;"
        >
          <tr>
            <td style="padding:40px 32px;">

              <h1
                style="margin:0 0 24px; font-size:28px; line-height:36px; color:#171717; text-align:center;"
              >
                Reset your password
              </h1>

              <p style="margin:0 0 16px; font-size:16px; line-height:24px;">
                Hi {{ $firstName }},
              </p>

              <p style="margin:0 0 24px; font-size:16px; line-height:24px;">
                We received a request to reset your Salary Management
                password. Click the button below to choose a new password.
              </p>

              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                width="100%"
              >
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a
                      href="{{ $resetUrl }}"
                      style="
                        display:inline-block;
                        padding:14px 28px;
                        background-color:#171717;
                        color:#ffffff;
                        text-decoration:none;
                        font-size:16px;
                        font-weight:bold;
                        border-radius:8px;
                      "
                    >
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px; font-size:14px; line-height:22px; color:#525252;">
                This link will expire in <strong>15 minutes</strong>.
              </p>

              <p style="margin:0 0 16px; font-size:14px; line-height:22px; color:#525252;">
                If you didn't request a password reset, you can safely ignore
                this email. Your password will remain unchanged.
              </p>

              <hr
                style="border:0; border-top:1px solid #e5e5e5; margin:24px 0;"
              />

              <p style="margin:0; font-size:12px; line-height:18px; color:#737373; text-align:center;">
                This is an automated email from Salary Management. Please
                don't reply to this email.
              </p>

            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

export default PasswordResetTemplate;
