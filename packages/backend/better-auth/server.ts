import { convex } from "@convex-dev/better-auth/plugins";
import { requireActionCtx } from "@convex-dev/better-auth/utils";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import type { GenericCtx } from "../convex/_generated/server";
import { authComponent } from "../convex/auth";
import { sendEmail } from "../convex/lib/email";
import { changeEmailTemplate } from "../emails/change-email-template";
import { deleteAccountTemplate } from "../emails/delete-account-template";
import { getOTPEmailTemplate } from "../emails/otp-email-template";

const createOptions = (ctx: GenericCtx) =>
  ({
    baseURL: process.env.SITE_URL as string,
    database: authComponent.adapter(ctx),
    account: {
      accountLinking: {
        enabled: true,
      },
    },
    user: {
      deleteUser: {
        enabled: true,

        sendDeleteAccountVerification: async ({ user, url }, _request) => {
          return await sendEmail(requireActionCtx(ctx), {
            from: "Vexblocks <noreply@julianux.com>",
            to: user.email,
            subject: "Confirm Account Deletion",
            html: deleteAccountTemplate(url),
          });
        },
      },
      changeEmail: {
        enabled: true,
        sendChangeEmailVerification: async ({ user, url }, _request) => {
          return await sendEmail(requireActionCtx(ctx), {
            from: "Vexblocks <noreply@julianux.com>",
            to: user.email,
            subject: "Verify your email change",
            html: changeEmailTemplate(url),
          });
        },
      },
    },
    plugins: [
      emailOTP({
        sendVerificationOTP: async ({ email, otp }, _request) => {
          // Ensure the promise is properly returned and awaited
          return await sendEmail(requireActionCtx(ctx), {
            from: "Vexblocks <noreply@julianux.com>",
            to: email,
            subject: "Your Vexblocks login code",
            html: getOTPEmailTemplate(otp),
          });
        },
        otpLength: 6,
        expiresIn: 300, // 5 minutes
      }),
    ],
  } satisfies BetterAuthOptions);

export const createAuth = (ctx: GenericCtx): ReturnType<typeof betterAuth> => {
  const options = createOptions(ctx);
  return betterAuth({
    ...options,
    plugins: [
      ...options.plugins,
      // Pass in options so plugin schema inference flows through. Only required
      // for plugins that customize the user or session schema.
      // See "Some caveats":
      // https://www.better-auth.com/docs/concepts/session-management#customizing-session-response
      convex(),
    ],
  });
};
