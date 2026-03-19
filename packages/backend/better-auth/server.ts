import { convex } from "@convex-dev/better-auth/plugins"
import { type BetterAuthOptions, betterAuth } from "better-auth"
import { emailOTP } from "better-auth/plugins"
import type {
	GenericActionCtx,
	GenericMutationCtx,
	GenericQueryCtx,
} from "convex/server"
import type { DataModel } from "../convex/_generated/dataModel"
import type { ActionCtx } from "../convex/_generated/server"
import { authComponent } from "../convex/auth"
import authConfig from "../convex/auth.config"
import config from "../convex/cms/vexblocks.config"
import { sendEmail } from "../convex/lib/email"
import { changeEmailTemplate } from "../emails/change-email-template"
import { deleteAccountTemplate } from "../emails/delete-account-template"
import { getOTPEmailTemplate } from "../emails/otp-email-template"

// Union type for all Convex contexts
type GenericCtx =
	| GenericQueryCtx<DataModel>
	| GenericMutationCtx<DataModel>
	| GenericActionCtx<DataModel>

// Type guard to check if context is an ActionCtx
const isActionCtx = (ctx: GenericCtx): ctx is ActionCtx =>
	"runAction" in ctx && "runMutation" in ctx && "runQuery" in ctx

const getActionCtx = (ctx: GenericCtx): ActionCtx => {
	if (!isActionCtx(ctx)) {
		throw new Error("Expected ActionCtx but received a different context type")
	}
	return ctx
}

const createOptions = (ctx: GenericCtx) => {
	return {
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
					return await sendEmail(getActionCtx(ctx), {
						to: user.email,
						subject: "Confirm Account Deletion",
						html: deleteAccountTemplate(url),
						from: config.email.fromAddress, // Use the fromAddress from your config
					})
				},
			},
			changeEmail: {
				enabled: true,
				sendChangeEmailConfirmation: async ({ user, url }, _request) => {
					return await sendEmail(getActionCtx(ctx), {
						to: user.email,
						subject: "Verify your email change",
						html: changeEmailTemplate(url),
						from: config.email.fromAddress, // Use the fromAddress from your config
					})
				},
			},
		},
		plugins: [
			emailOTP({
				sendVerificationOTP: async ({ email, otp }, _request) => {
					// Ensure the promise is properly returned and awaited
					return await sendEmail(getActionCtx(ctx), {
						to: email,
						subject: `Your ${config.appName} login code`,
						html: getOTPEmailTemplate(otp),
						from: config.email.fromAddress, // Use the fromAddress from your config
					})
				},
				otpLength: 6,
				expiresIn: 300, // 5 minutes
			}),
		],
	} satisfies BetterAuthOptions
}

export const createAuth = (ctx: GenericCtx) => {
	const options = createOptions(ctx)
	return betterAuth({
		...options,
		plugins: [
			...options.plugins,
			// Pass in options so plugin schema inference flows through. Only required
			// for plugins that customize the user or session schema.
			// See "Some caveats":
			// https://www.better-auth.com/docs/concepts/session-management#customizing-session-response
			convex({
				authConfig,
				jwks: process.env.JWKS,
			}),
		],
	})
}
