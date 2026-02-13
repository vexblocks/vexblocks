import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { tool } from "ai"
import { z } from "zod"
import { fetchAuthMutation, fetchAuthQuery } from "@/lib/auth-server"

export const listContent = tool({
	description:
		"List all content entries for a specific schema. Use this to see existing content before creating or updating.",
	inputSchema: z.object({
		schemaId: z.string().describe("The ID of the schema"),
		status: z
			.enum(["draft", "published"])
			.optional()
			.describe("Filter by status (optional)"),
	}),
	execute: async ({ schemaId, status }) => {
		try {
			const content = await fetchAuthQuery(api.cms.content.listBySchema, {
				schemaId: schemaId as Id<"cmsSchemas">,
				status,
			})
			return {
				success: true,
				data: content,
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	},
})

export const getContent = tool({
	description:
		"Get a specific content entry by its ID. Use this to view details of a content item.",
	inputSchema: z.object({
		contentId: z.string().describe("The ID of the content entry"),
	}),
	execute: async ({ contentId }) => {
		try {
			const content = await fetchAuthQuery(api.cms.content.get, {
				id: contentId as Id<"cmsContent">,
			})
			return {
				success: true,
				data: content,
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	},
})

export const createContent = tool({
	description:
		"Create a new content entry for a schema. Use this to add new content items.",
	inputSchema: z.object({
		schemaId: z.string().describe("The ID of the schema"),
		slug: z
			.string()
			.optional()
			.describe("URL slug for the content (required for collections)"),
		status: z
			.enum(["draft", "published"])
			.describe("Content status: 'draft' or 'published'"),
		data: z
			.record(z.string(), z.any())
			.describe("Content data object matching the schema fields structure"),
	}),
	execute: async (params) => {
		try {
			const contentId = await fetchAuthMutation(api.cms.content.create, {
				schemaId: params.schemaId as Id<"cmsSchemas">,
				slug: params.slug,
				status: params.status,
				data: params.data,
			})
			return {
				success: true,
				data: { contentId },
				message: `Content created successfully with ID: ${contentId}`,
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	},
})

export const updateContent = tool({
	description:
		"Update an existing content entry. Use this to modify content data.",
	inputSchema: z.object({
		contentId: z.string().describe("The ID of the content to update"),
		slug: z.string().optional().describe("New slug (optional)"),
		status: z
			.enum(["draft", "published"])
			.optional()
			.describe("New status (optional)"),
		data: z
			.record(z.string(), z.any())
			.optional()
			.describe("Updated content data (optional)"),
	}),
	execute: async ({ contentId, ...params }) => {
		try {
			await fetchAuthMutation(api.cms.content.update, {
				id: contentId as Id<"cmsContent">,
				...params,
			})
			return {
				success: true,
				message: "Content updated successfully",
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	},
})
