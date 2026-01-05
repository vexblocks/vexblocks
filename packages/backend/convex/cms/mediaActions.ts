"use node"

import { ConvexError, v } from "convex/values"
import { internalAction } from "../_generated/server"
import { CLOUDFLARE_API } from "../constants"

/**
 * Internal action to delete image from Cloudflare
 */
export const deleteFromCloudflare = internalAction({
	args: {
		cloudflareId: v.string(),
	},
	returns: v.null(),
	handler: async (_ctx, args) => {
		try {
			const response = await fetch(
				`${CLOUDFLARE_API}/images/v1/${args.cloudflareId}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${process.env.CLOUDFLARE_SECRET_TOKEN}`,
					},
				},
			)

			const result = await response.json()

			if (!result.success) {
				console.error("Failed to delete from Cloudflare:", result)
				throw new ConvexError("Error deleting asset from Cloudflare")
			}

			return null
		} catch (error) {
			console.error("Error deleting from Cloudflare:", error)
			throw new ConvexError("Error deleting asset from Cloudflare")
		}
	},
})

