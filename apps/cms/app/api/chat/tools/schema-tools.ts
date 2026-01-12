import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { tool } from "ai"
import { z } from "zod"
import { fetchAuthMutation, fetchAuthQuery } from "@/lib/auth-server"

export const listSchemas = tool({
	description:
		"List all CMS schemas in the database. Use this to see what schemas exist before creating or modifying content.",
	inputSchema: z.object({}),
	execute: async () => {
		try {
			const schemas = await fetchAuthQuery(api.cms.schemas.list, {})
			return {
				success: true,
				data: schemas,
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	},
})

export const getSchema = tool({
	description:
		"Get details of a specific schema by its ID or name. Use this to see the structure and fields of a schema before creating content. You can pass either the schema ID or the schema name (e.g., 'todos', 'blog_posts').",
	inputSchema: z.object({
		schemaId: z
			.string()
			.optional()
			.describe("The ID of the schema to retrieve"),
		schemaName: z
			.string()
			.optional()
			.describe(
				"The name of the schema to retrieve (e.g., 'todos', 'blog_posts')",
			),
	}),
	execute: async ({ schemaId, schemaName }) => {
		try {
			// Try by ID first if provided
			if (schemaId) {
				const schema = await fetchAuthQuery(api.cms.schemas.get, {
					id: schemaId as Id<"cmsSchemas">,
				})
				if (schema) {
					return {
						success: true,
						data: schema,
					}
				}
			}

			// If no ID or not found by ID, try by name
			if (schemaName) {
				const schema = await fetchAuthQuery(api.cms.schemas.getByName, {
					name: schemaName,
				})
				if (schema) {
					return {
						success: true,
						data: schema,
					}
				}
			}

			return {
				success: false,
				error: "Schema not found. Please provide a valid schema ID or name.",
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	},
})

export const createSchema = tool({
	description:
		"Create a new CMS schema. This defines the structure for content entries. Use this when the user wants to create a new content type.",
	inputSchema: z.object({
		name: z
			.string()
			.describe("Schema name in snake_case (e.g., 'blog_posts', 'products')"),
		displayName: z
			.string()
			.describe("Human-readable name (e.g., 'Blog Posts', 'Products')"),
		type: z
			.enum(["global", "page", "collection"])
			.describe(
				"Schema type: 'global' for singletons, 'page' for pages, 'collection' for multiple items",
			),
		description: z
			.string()
			.optional()
			.describe("Optional description of the schema"),
		fields: z
			.array(z.any())
			.describe(
				"Array of field definitions with name, type, label, required, etc.",
			),
		icon: z.string().optional().describe("Optional icon name"),
	}),
	execute: async (params) => {
		try {
			const schemaId = await fetchAuthMutation(api.cms.schemas.create, params)
			return {
				success: true,
				data: { schemaId },
				message: `Schema '${params.displayName}' created successfully with ID: ${schemaId}`,
			}
		} catch (error: unknown) {
			// Handle different error types from Convex
			let errorMessage = "Unknown error"
			if (error instanceof Error) {
				errorMessage = error.message
			} else if (typeof error === "object" && error !== null) {
				const errorObj = error as { message?: string; data?: string }
				errorMessage =
					errorObj.message || errorObj.data || JSON.stringify(error)
			} else if (typeof error === "string") {
				errorMessage = error
			}
			return {
				success: false,
				error: errorMessage,
			}
		}
	},
})

export const updateSchema = tool({
	description:
		"Update an existing schema. CRITICAL: This requires user confirmation. Ask the user to confirm TWICE before using this tool.",
	inputSchema: z.object({
		schemaId: z.string().describe("The ID of the schema to update"),
		displayName: z.string().optional().describe("New display name"),
		description: z.string().optional().describe("New description"),
		fields: z
			.array(z.any())
			.optional()
			.describe("Updated fields array (must include all fields)"),
		icon: z.string().optional().describe("New icon"),
		userConfirmed: z
			.boolean()
			.describe(
				"Set to true only after user has confirmed TWICE that they want to update the schema",
			),
	}),
	execute: async ({ schemaId, userConfirmed, ...params }) => {
		if (!userConfirmed) {
			return {
				success: false,
				error:
					"User confirmation required. Please ask the user to confirm this schema update twice before proceeding.",
				requiresConfirmation: true,
			}
		}

		try {
			await fetchAuthMutation(api.cms.schemas.update, {
				id: schemaId as Id<"cmsSchemas">,
				...params,
			})
			return {
				success: true,
				message: "Schema updated successfully",
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	},
})
