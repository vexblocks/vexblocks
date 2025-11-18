export const getOTPEmailTemplate = (otp: string) => `
<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
  Your VexBlocks login code
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
                  alt="VexBlocks" 
                  src="https://res.cloudinary.com/https-tinloof-com/image/upload/v1673766585/Goalimpact/logo_x0dls9.png" 
                  width="80" 
                  height="80" 
                  style="display:block;outline:none;border:none;text-decoration:none;margin:80px auto 20px"
                >
                <p style="font-size:24px;line-height:24px;margin:30px 0;color:#000;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-weight:normal;text-align:center;padding:0">
                  Your VexBlocks login code
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
                    Use the following code to log in to your VexBlocks account.
                  </p>
                  <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:#e6ebf1;margin:20px 0">
                  
                  <!-- OTP Code Display -->
                  <div style="text-align:center;margin:40px 0">
                    <div style="background-color:#f8f9fa;border:2px solid #e6ebf1;border-radius:12px;padding:24px;margin:0 auto;width:fit-content">
                      <p style="font-size:32px;line-height:40px;margin:0;color:#000;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif;font-weight:bold;letter-spacing:4px">
                        ${otp}
                      </p>
                    </div>
                  </div>
                  
                  <p style="font-size:16px;line-height:24px;margin:16px 0;color:#6D7284;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif;text-align:center">
                    This code will expire in 5 minutes. If you didn't request this code, please ignore this email.
                  </p>
                  
                  <p style="font-size:16px;line-height:24px;margin:16px 0;color:#6D7284;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif;text-align:center">
                    You can access your account at 
                    <a style="color:#2375E2;text-decoration:none" href="https://vexblocks.com">vexblocks.com</a>
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
           VexBlocks is your friendly UI CMS for Convex
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
            ©${new Date().getFullYear()} VexBlocks
          </p>
          <p style="font-size:12px;line-height:16px;margin:16px 0;padding:0 32px;color:#8898aa;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,&quot;Helvetica Neue&quot;,Ubuntu,sans-serif;text-align:center">
            By clicking "Continue", you acknowledge that you agree with VexBlocks's 
            <a style="color:#8898aa;text-decoration:underline" href="https://vexblocks.com/terms-and-conditions">Terms & Conditions</a> and 
            <a style="color:#8898aa;text-decoration:underline" href="https://vexblocks.com/privacy-policy">Privacy Policy</a>.
          </p>
        </div>
        <div></div>
      </td>
    </tr>
  </tbody>
</table>
`
