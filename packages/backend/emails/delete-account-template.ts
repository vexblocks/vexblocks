export const deleteAccountTemplate = (url: string) => `
<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
  Confirm Account Deletion - Goalimpact
  <div>${Array(100).fill("&nbsp;‌​‍‎‏﻿").join("")}</div>
</div>
<table style="width:100%;background-color:#f6f9fc" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
  <tbody>
    <tr>
      <td>
        <table style="width:100%" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
          <tbody>
            <tr>
              <td>
                <img 
                  alt="Goalimpact" 
                  src="https://res.cloudinary.com/https-tinloof-com/image/upload/v1673766585/Goalimpact/logo_x0dls9.png" 
                  width="80" 
                  height="80" 
                  style="display:block;outline:none;border:none;text-decoration:none;margin:80px auto 20px"
                >
                <p style="font-size:24px;line-height:32px;margin:30px 0;color:#dc2626;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-weight:600;text-align:center;padding:0">
                  Confirm Account Deletion
                </p>
              </td>
            </tr>
          </tbody>
        </table>
        <div></div>
        <div style="max-width:37.5em;background-color:#ffffff;margin:0 auto;padding:20px 0 48px">
          <table style="width:100%;padding:0 48px" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
            <tbody>
              <tr>
                <td>
                  <p style="font-size:16px;line-height:24px;margin:16px 0;color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;text-align:left">
                    Hello,
                  </p>
                  
                  <p style="font-size:16px;line-height:24px;margin:16px 0;color:#374151;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;text-align:left">
                    You have requested to delete your Goalimpact account. This action is <strong style="color:#dc2626">permanent and cannot be undone</strong>.
                  </p>
                  
                  <!-- Warning Box -->
                  <table style="width:100%;background-color:#fef2f2;border-left:4px solid #dc2626;margin:24px 0" border="0" cellpadding="16" cellspacing="0" role="presentation">
                    <tbody>
                      <tr>
                        <td>
                          <p style="font-size:14px;line-height:20px;margin:0 0 8px 0;color:#dc2626;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;font-weight:600">
                            ⚠️ Warning: Deleting your account will permanently remove:
                          </p>
                          <table style="width:100%" border="0" cellpadding="0" cellspacing="0">
                            <tbody>
                              <tr>
                                <td style="width:20px;vertical-align:top;padding:2px 0">
                                  <span style="color:#7f1d1d;font-size:14px">•</span>
                                </td>
                                <td style="color:#7f1d1d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;font-size:14px;line-height:20px;padding:2px 0">
                                  Your profile and personal information
                                </td>
                              </tr>
                              <tr>
                                <td style="width:20px;vertical-align:top;padding:2px 0">
                                  <span style="color:#7f1d1d;font-size:14px">•</span>
                                </td>
                                <td style="color:#7f1d1d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;font-size:14px;line-height:20px;padding:2px 0">
                                  All your saved data and preferences
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:#e6ebf1;margin:20px 0">
                  
                  <p style="font-size:16px;line-height:24px;margin:16px 0;color:#374151;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;text-align:left">
                    If you're sure you want to proceed, click the button below to confirm the deletion:
                  </p>
                  
                  <table style="width:100%;margin-top:40px;text-align:center" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tbody>
                      <tr>
                        <td>
                          <a 
                            href="${url}" 
                            style="background-color:#dc2626;border-radius:12px;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;font-size:16px;font-weight:600;text-decoration:none;text-align:center;display:inline-block;padding:12px 30px;line-height:120%"
                          >
                            Confirm Account Deletion
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <p style="font-size:16px;line-height:24px;margin:32px 0 16px;color:#374151;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;text-align:left">
                    <strong>If you didn't request this deletion, please ignore this email.</strong> Your account will remain active and secure.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div></div>
        <div></div>
        <div style="max-width:37.5em;color:#8898aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;font-size:12px;line-height:16px;margin:0 auto;margin-bottom:64px;text-align:center;padding:20px 0px 48px">
          <p style="font-size:12px;line-height:16px;margin:16px 0;padding:0 32px;color:#8898aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;text-align:center">
            This link will expire in 24 hours for security reasons.
          </p>
          <p style="font-size:12px;line-height:16px;margin:16px 0;padding:0 32px;color:#8898aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;text-align:center">
            If you have any questions, contact our support team.
          </p>
          <table style="margin-bottom:20px" border="0" cellpadding="0" cellspacing="10" align="center">
            <tbody>
              <tr>
                <td style="vertical-align:center" align="left" valign="middle">
                  <a style="color:#067df7;text-decoration:none" href="https://twitter.com/Goalimpact">
                    <img alt="twitter" src="https://res.cloudinary.com/https-tinloof-com/image/upload/v1673766592/Goalimpact/twitter_qiypjo.png" width="48" height="48" style="display:block;outline:none;border:none;text-decoration:none">
                  </a>
                </td>
                <td style="vertical-align:center" align="left" valign="middle">
                  <a style="color:#067df7;text-decoration:none" href="https://www.facebook.com/Goalimpact-285144984948490/">
                    <img alt="facebook" src="https://res.cloudinary.com/https-tinloof-com/image/upload/v1673766592/Goalimpact/facebook_yvnohf.png" width="48" height="48" style="display:block;outline:none;border:none;text-decoration:none">
                  </a>
                </td>
                <td style="vertical-align:center" align="left" valign="middle">
                  <a style="color:#067df7;text-decoration:none" href="https://www.linkedin.com/company/Goalimpact">
                    <img alt="linkedin" src="https://res.cloudinary.com/https-tinloof-com/image/upload/v1673766592/Goalimpact/linkedin_wk6uhq.png" width="48" height="48" style="display:block;outline:none;border:none;text-decoration:none">
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          <p style="font-size:16px;line-height:24px;margin:16px 0;color:#6D7284;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;text-align:center">
            ©${new Date().getFullYear()} Goalimpact
          </p>
          <p style="font-size:12px;line-height:16px;margin:16px 0;padding:0 32px;color:#8898aa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;text-align:center">
            Goalimpact is an objective player rating system that rates football players by their impact on the goal difference.
          </p>
        </div>
        <div></div>
      </td>
    </tr>
  </tbody>
</table>
`
