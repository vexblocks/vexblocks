import type { RunMutationCtx } from "@convex-dev/better-auth/utils"
import { Resend } from "@convex-dev/resend"
import "../polyfill"
import { components } from "../_generated/api"
import type { DataModel } from "../_generated/dataModel"
import config from "../cms/vexblocks.config"

export const resend: Resend = new Resend(components.resend, { testMode: false })

export const sendEmail = async (
	ctx: RunMutationCtx<DataModel>,
	{
		from,
		to,
		subject,
		cc,
		bcc,
		replyTo,
		html,
	}: {
		from?: string
		to: string
		subject: string
		cc?: string[]
		bcc?: string[]
		replyTo?: string[]
		html: string
	},
) => {
	const defaultFrom = `${config.email.fromName} <${config.email.fromAddress}>`

	await resend.sendEmail(ctx, {
		from: from || defaultFrom,
		to: to,
		subject,
		html,
		...(cc && { cc }),
		...(bcc && { bcc }),
		...(replyTo && { replyTo }),
	})
}
