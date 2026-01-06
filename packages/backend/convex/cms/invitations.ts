import { ConvexError, v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { sendEmail } from "../lib/email"
import { getAuthenticatedAdminUser } from "../utils"

/**
 * List all invitations (admin only)
 */
export const list = query({
	args: {},
	returns: v.union(
		v.array(
			v.object({
				_id: v.id("cmsUserInvitations"),
				_creationTime: v.number(),
				email: v.string(),
				role: v.union(
					v.literal("admin"),
					v.literal("editor"),
					v.literal("developer"),
					v.literal("user"),
				),
				status: v.union(v.literal("pending"), v.literal("accepted")),
				invitedAt: v.number(),
				acceptedAt: v.optional(v.number()),
				invitedBy: v.object({
					_id: v.id("users"),
					name: v.optional(v.string()),
					email: v.string(),
				}),
			}),
		),
		v.null(),
	),
	handler: async (ctx) => {
		const admin = await getAuthenticatedAdminUser(ctx)
		if (!admin) {
			return null
		}

		const invitations = await ctx.db.query("cmsUserInvitations").collect()

		// Fetch inviter details for each invitation
		const invitationsWithInviters = await Promise.all(
			invitations.map(async (invitation) => {
				const inviter = await ctx.db.get(invitation.invitedBy)
				return {
					...invitation,
					invitedBy: {
						_id: inviter!._id,
						name: inviter!.name,
						email: inviter!.email,
					},
				}
			}),
		)

		return invitationsWithInviters
	},
})

/**
 * Create a new invitation (admin only)
 */
export const create = mutation({
	args: {
		email: v.string(),
		role: v.union(
			v.literal("admin"),
			v.literal("editor"),
			v.literal("developer"),
			v.literal("user"),
		),
	},
	returns: v.id("cmsUserInvitations"),
	handler: async (ctx, args) => {
		const admin = await getAuthenticatedAdminUser(ctx)
		if (!admin) {
			throw new ConvexError("Unauthorized: Admin access required")
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(args.email)) {
			throw new ConvexError("Invalid email format")
		}

		// Check if user already exists
		const existingUser = await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", args.email))
			.unique()

		if (existingUser) {
			throw new ConvexError("User with this email already exists")
		}

		// Check if there's already a pending invitation
		const existingInvitation = await ctx.db
			.query("cmsUserInvitations")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.filter((q) => q.eq(q.field("status"), "pending"))
			.first()

		if (existingInvitation) {
			throw new ConvexError(
				"There is already a pending invitation for this email",
			)
		}

		// Create invitation
		const invitationId = await ctx.db.insert("cmsUserInvitations", {
			email: args.email,
			role: args.role,
			status: "pending",
			invitedBy: admin._id,
			invitedAt: Date.now(),
		})

		// Send invitation email
		await sendEmail(ctx, {
			to: args.email,
			subject: "You've been invited to VexBlocks CMS",
			html: generateInvitationEmail(args.email, args.role, admin.name),
		})

		return invitationId
	},
})

/**
 * Resend an invitation email (admin only)
 */
export const resend = mutation({
	args: {
		invitationId: v.id("cmsUserInvitations"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await getAuthenticatedAdminUser(ctx)
		if (!admin) {
			throw new ConvexError("Unauthorized: Admin access required")
		}

		const invitation = await ctx.db.get(args.invitationId)
		if (!invitation) {
			throw new ConvexError("Invitation not found")
		}

		if (invitation.status !== "pending") {
			throw new ConvexError("Can only resend pending invitations")
		}

		// Send invitation email
		await sendEmail(ctx, {
			to: invitation.email,
			subject: "Reminder: You've been invited to VexBlocks CMS",
			html: generateInvitationEmail(
				invitation.email,
				invitation.role,
				admin.name,
			),
		})

		return null
	},
})

/**
 * Delete an invitation (admin only)
 */
export const remove = mutation({
	args: {
		invitationId: v.id("cmsUserInvitations"),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await getAuthenticatedAdminUser(ctx)
		if (!admin) {
			throw new ConvexError("Unauthorized: Admin access required")
		}

		const invitation = await ctx.db.get(args.invitationId)
		if (!invitation) {
			throw new ConvexError("Invitation not found")
		}

		await ctx.db.delete(args.invitationId)
		return null
	},
})

/**
 * Check if an email has a pending invitation
 */
export const checkInvitation = query({
	args: {
		email: v.string(),
	},
	returns: v.union(
		v.object({
			exists: v.boolean(),
			role: v.optional(
				v.union(
					v.literal("admin"),
					v.literal("editor"),
					v.literal("developer"),
					v.literal("user"),
				),
			),
		}),
		v.null(),
	),
	handler: async (ctx, args) => {
		const invitation = await ctx.db
			.query("cmsUserInvitations")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.filter((q) => q.eq(q.field("status"), "pending"))
			.first()

		return {
			exists: !!invitation,
			role: invitation?.role,
		}
	},
})

/**
 * Generate invitation email HTML
 */
function generateInvitationEmail(
	email: string,
	role: string,
	inviterName?: string,
): string {
	const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
	const loginUrl = `${appUrl}/sign-in`

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>You've been invited to VexBlocks CMS</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
	<div style="background: linear-gradient(135deg, #14b3ab 0%, #108e88 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
		<h1 style="color: white; margin: 0; font-size: 28px;">VexBlocks CMS</h1>
	</div>

	<div style="background: #fff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
		<h2 style="color: #108e88; margin-top: 0;">You've Been Invited!</h2>

		<p style="font-size: 16px; line-height: 1.8;">
			${inviterName ? `<strong>${inviterName}</strong>` : "An administrator"} has invited you to join VexBlocks CMS as a <strong>${role}</strong>.
		</p>

		<p style="font-size: 16px; line-height: 1.8;">
			To get started, click the button below to sign in with your email address:
		</p>

		<div style="text-align: center; margin: 30px 0;">
			<a href="${loginUrl}" style="display: inline-block; background: #108e88; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
				Sign In to VexBlocks CMS
			</a>
		</div>

		<p style="font-size: 14px; color: #666; margin-top: 30px;">
			If the button doesn't work, copy and paste this link into your browser:
			<br>
			<a href="${loginUrl}" style="color: #108e88; word-break: break-all;">${loginUrl}</a>
		</p>

		<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

		<p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
			This invitation was sent to <strong>${email}</strong>. If you weren't expecting this invitation, you can safely ignore this email.
		</p>
	</div>
</body>
</html>
	`.trim()
}
