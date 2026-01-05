import { v } from "convex/values"
import { internalMutation } from "../_generated/server"

/**
 * Migration to add isActive field to existing users
 *
 * This migration sets isActive=true for all existing users.
 *
 * Run from Convex dashboard: cms/migrations:addIsActiveToUsers
 */
export const addIsActiveToUsers = internalMutation({
	args: {},
	returns: v.object({
		updatedCount: v.number(),
		errors: v.array(v.string()),
	}),
	handler: async (ctx) => {
		const allUsers = await ctx.db.query("users").collect()

		let updatedCount = 0
		const errors: string[] = []

		for (const user of allUsers) {
			try {
				if (user.isActive === undefined) {
					await ctx.db.patch(user._id, { isActive: true })
					updatedCount++
				}
			} catch (error) {
				errors.push(
					`Failed to update user ${user._id}: ${error instanceof Error ? error.message : String(error)}`,
				)
			}
		}

		return {
			updatedCount,
			errors,
		}
	},
})

/**
 * Migration to add blockName to existing blockReference blocks in content
 *
 * This migration iterates through all cmsContent documents and updates
 * any blockReference blocks in flexibleBlocks fields to include the blockName
 * alongside the blockId.
 *
 * Run from Convex dashboard: cms/migrations:addBlockNameToExistingBlocks
 */
export const addBlockNameToExistingBlocks = internalMutation({
	args: {},
	returns: v.object({
		updatedCount: v.number(),
		processedCount: v.number(),
		errors: v.array(v.string()),
	}),
	handler: async (ctx) => {
		// Get all blocks to create a lookup map
		const allBlocks = await ctx.db.query("cmsBlocks").collect()
		const blockIdToName = new Map<string, string>()
		for (const block of allBlocks) {
			blockIdToName.set(block._id, block.name)
		}

		// Get all content
		const allContent = await ctx.db.query("cmsContent").collect()

		let updatedCount = 0
		let processedCount = 0
		const errors: string[] = []

		for (const content of allContent) {
			processedCount++

			if (!content.data || typeof content.data !== "object") {
				continue
			}

			let wasUpdated = false
			const updatedData = { ...content.data }

			// Process all fields in the data looking for flexibleBlocks arrays
			for (const [fieldName, fieldValue] of Object.entries(updatedData)) {
				if (Array.isArray(fieldValue)) {
					const updatedBlocks = fieldValue.map((block: any) => {
						// Check if this is a blockReference block
						if (
							block?.type === "blockReference" &&
							block?.data?.blockId &&
							!block?.data?.blockName
						) {
							const blockName = blockIdToName.get(block.data.blockId)
							if (blockName) {
								wasUpdated = true
								return {
									...block,
									data: {
										...block.data,
										blockName,
									},
								}
							}
							errors.push(
								`Content ${content._id}: Block ID ${block.data.blockId} not found in cmsBlocks`,
							)
						}
						return block
					})
					updatedData[fieldName] = updatedBlocks
				}
			}

			if (wasUpdated) {
				await ctx.db.patch(content._id, { data: updatedData })
				updatedCount++
			}
		}

		return {
			updatedCount,
			processedCount,
			errors,
		}
	},
})

/**
 * Dry run version of the migration - shows what would be updated without making changes
 *
 * Run from Convex dashboard: cms/migrations:dryRunAddBlockNameToExistingBlocks
 */
export const dryRunAddBlockNameToExistingBlocks = internalMutation({
	args: {},
	returns: v.object({
		wouldUpdateCount: v.number(),
		processedCount: v.number(),
		details: v.array(
			v.object({
				contentId: v.string(),
				slug: v.optional(v.string()),
				blocksToUpdate: v.number(),
			}),
		),
		errors: v.array(v.string()),
	}),
	handler: async (ctx) => {
		// Get all blocks to create a lookup map
		const allBlocks = await ctx.db.query("cmsBlocks").collect()
		const blockIdToName = new Map<string, string>()
		for (const block of allBlocks) {
			blockIdToName.set(block._id, block.name)
		}

		// Get all content
		const allContent = await ctx.db.query("cmsContent").collect()

		let wouldUpdateCount = 0
		let processedCount = 0
		const details: Array<{
			contentId: string
			slug?: string
			blocksToUpdate: number
		}> = []
		const errors: string[] = []

		for (const content of allContent) {
			processedCount++

			if (!content.data || typeof content.data !== "object") {
				continue
			}

			let blocksToUpdate = 0

			// Process all fields in the data looking for flexibleBlocks arrays
			for (const [_fieldName, fieldValue] of Object.entries(content.data)) {
				if (Array.isArray(fieldValue)) {
					for (const block of fieldValue) {
						// Check if this is a blockReference block that needs updating
						if (
							block?.type === "blockReference" &&
							block?.data?.blockId &&
							!block?.data?.blockName
						) {
							const blockName = blockIdToName.get(block.data.blockId)
							if (blockName) {
								blocksToUpdate++
							} else {
								errors.push(
									`Content ${content._id}: Block ID ${block.data.blockId} not found in cmsBlocks`,
								)
							}
						}
					}
				}
			}

			if (blocksToUpdate > 0) {
				wouldUpdateCount++
				details.push({
					contentId: content._id,
					slug: content.slug,
					blocksToUpdate,
				})
			}
		}

		return {
			wouldUpdateCount,
			processedCount,
			details,
			errors,
		}
	},
})
