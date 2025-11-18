export const getInviteEmailTemplate = (
	inviterName: string,
	organisationName: string,
	url: string,
) => `
<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
  You've been invited to join ${organisationName} on Goalimpact
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
                <p style="font-size:24px;line-height:24px;margin:30px 0;color:#000;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-weight:normal;text-align:center;padding:0">
                  You've been invited to join ${organisationName}
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
                  <p style="font-size:16px;line-height:24px;margin:16px 0;color:#6D7284;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif;text-align:center">
                    <strong style="color:#000">${inviterName}</strong> has invited you to join <strong style="color:#000">${organisationName}</strong> on Goalimpact.
                  </p>
                  <p style="font-size:16px;line-height:24px;margin:16px 0;color:#6D7284;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif;text-align:center">
                    Goalimpact is an objective player rating system that rates football players by their impact on the goal difference.
                  </p>
                  <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:#e6ebf1;margin:20px 0">
                  <p style="font-size:16px;line-height:24px;margin:16px 0;color:#6D7284;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif;text-align:center">
                    Accept the invitation to start collaborating with your team and access professional football data and analytics.
                  </p>
                  <table style="width:100%;margin-top:40px;text-align:center" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tbody>
                      <tr>
                        <td>
                          <a 
                            href="${url}" 
                            style="background-color:#51C0B1;border-radius:12px;color:#fff;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif;font-size:16px;font-weight:600;text-decoration:none;text-align:center;display:inline-block;width:70%;p-x:10px;p-y:10px;line-height:100%;max-width:100%;padding:16px 24px"
                          >
                            <span></span>
                            <span style="background-color:#51C0B1;border-radius:12px;color:#fff;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif;font-size:16px;font-weight:600;text-decoration:none;text-align:center;display:inline-block;width:70%;p-x:10px;p-y:10px;max-width:100%;line-height:120%;text-transform:none;mso-padding-alt:0px;mso-text-raise:7.5px">
                              Accept Invitation
                            </span>
                            <span></span>
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p style="font-size:14px;line-height:20px;margin:24px 0 0 0;color:#8898aa;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif;text-align:center">
                    If you don't want to accept this invitation, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div></div>
        <div></div>
        <div style="max-width:37.5em;color:#8898aa;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif;font-size:12px;line-height:16px;margin:0 auto;margin-bottom:64px;text-align:center;padding:20px 0px 48px">
          <p style="font-size:12px;line-height:16px;margin:16px 0;padding:0 32px;color:#8898aa;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif;text-align:center">
            Goalimpact is an objective player rating system that rates football players by their impact on the goal difference.
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
          <p style="font-size:16px;line-height:24px;margin:16px 0;color:#6D7284;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif;text-align:center">
            ©${new Date().getFullYear()} Goalimpact
          </p>
          <p style="font-size:12px;line-height:16px;margin:16px 0;padding:0 32px;color:#8898aa;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif;text-align:center">
            By accepting this invitation, you acknowledge that you agree with Goalimpact's 
            <a style="color:#8898aa;text-decoration:underline" href="https://Goalimpact.com/terms-and-conditions">Terms & Conditions</a> and 
            <a style="color:#8898aa;text-decoration:underline" href="https://Goalimpact.com/privacy-policy">Privacy Policy</a>.
          </p>
        </div>
        <div></div>
      </td>
    </tr>
  </tbody>
</table>
`
