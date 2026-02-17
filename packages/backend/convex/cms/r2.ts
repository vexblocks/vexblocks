import { R2 } from "@convex-dev/r2"
import { ConvexError, v } from "convex/values"
import { components } from "../_generated/api"
import type { DataModel } from "../_generated/dataModel"
import { action } from "../_generated/server"
import { getAuthenticatedContentUser } from "./utils"

export const r2 = new R2(components.r2)

export const { generateUploadUrl, syncMetadata, deleteObject, getMetadata } =
	r2.clientApi<DataModel>({
		checkUpload: async (ctx) => {
			const user = await getAuthenticatedContentUser(ctx as any)
			if (!user) {
				throw new ConvexError("Unauthorized")
			}
		},
		checkDelete: async (ctx) => {
			const user = await getAuthenticatedContentUser(ctx as any)
			if (!user) {
				throw new ConvexError("Unauthorized")
			}
		},
	})

/**
 * Get a signed download URL for an R2 file.
 * Expires in 1 hour by default.
 */
export const getFileUrl = action({
	args: {
		key: v.string(),
	},
	returns: v.string(),
	handler: async (_ctx, args) => {
		return await r2.getUrl(args.key, { expiresIn: 3600 })
	},
})
