import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { tool } from "ai"
import { z } from "zod"
import { fetchAuthQuery } from "@/lib/auth-server"
import {
	getCachedSchema,
	getCachedSchemas,
	logger,
} from "../utils/convex-client"

// ================================
// VALIDATE CONTENT TOOL
// ================================

export const validateContent = tool({
	description:
		"Validate content data against a schema's field definitions before creating or updating. Use this to check if the data structure is correct.",
	inputSchema: z.object({
		schemaId: z.string().describe("The ID of the schema to validate against"),
		data: z
			.record(z.string(), z.unknown())
			.describe("The content data object to validate"),
	}),
	execute: async ({ schemaId, data }) => {
		try {
			const schema = await getCachedSchema(schemaId)

			if (!schema) {
				return {
					success: false,
					valid: false,
					error: "Schema not found",
				}
			}

			const errors: string[] = []
			const warnings: string[] = []

			// Check required fields
			for (const field of schema.fields) {
				const value = data[field.name]

				if (field.required && (value === undefined || value === null)) {
					errors.push(`Missing required field: ${field.name}`)
					continue
				}

				if (value !== undefined && value !== null) {
					// Type validation
					const typeError = validateFieldType(field, value)
					if (typeError) {
						errors.push(typeError)
					}
				}
			}

			// Check for unknown fields
			const fieldNames = new Set(schema.fields.map((f) => f.name))
			for (const key of Object.keys(data)) {
				if (!fieldNames.has(key)) {
					warnings.push(`Unknown field: ${key} (not in schema)`)
				}
			}

			logger.tool("validateContent", { schemaId, data }, { errors, warnings })

			return {
				success: true,
				valid: errors.length === 0,
				errors: errors.length > 0 ? errors : undefined,
				warnings: warnings.length > 0 ? warnings : undefined,
				schema: {
					name: schema.name,
					displayName: schema.displayName,
					fieldCount: schema.fields.length,
				},
			}
		} catch (error) {
			return {
				success: false,
				valid: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	},
})

function validateFieldType(
	field: { name: string; type: string },
	value: unknown,
): string | null {
	const { name, type } = field

	switch (type) {
		case "text":
		case "textarea":
		case "richtext":
		case "select":
			if (typeof value !== "string") {
				return `Field "${name}" should be a string, got ${typeof value}`
			}
			break

		case "number":
			if (typeof value !== "number") {
				return `Field "${name}" should be a number, got ${typeof value}`
			}
			break

		case "boolean":
			if (typeof value !== "boolean") {
				return `Field "${name}" should be a boolean, got ${typeof value}`
			}
			break

		case "date":
		case "datetime":
			if (typeof value !== "string" && typeof value !== "number") {
				return `Field "${name}" should be a date string or timestamp, got ${typeof value}`
			}
			break

		case "multiselect":
			if (!Array.isArray(value)) {
				return `Field "${name}" should be an array, got ${typeof value}`
			}
			break

		case "image":
		case "file":
			if (typeof value !== "string") {
				return `Field "${name}" should be a storage ID string, got ${typeof value}`
			}
			break

		case "reference":
			if (typeof value !== "string") {
				return `Field "${name}" should be a content ID string, got ${typeof value}`
			}
			break

		case "group":
			if (typeof value !== "object" || value === null || Array.isArray(value)) {
				return `Field "${name}" should be an object, got ${typeof value}`
			}
			break

		case "repeater":
		case "flexible":
			if (!Array.isArray(value)) {
				return `Field "${name}" should be an array, got ${typeof value}`
			}
			break
	}

	return null
}

// ================================
// SEARCH CONTENT TOOL
// ================================

export const searchContent = tool({
	description:
		"Search for content entries across schemas. Searches in content data fields for matching text.",
	inputSchema: z.object({
		query: z.string().describe("The search query text"),
		schemaId: z
			.string()
			.optional()
			.describe("Optional: limit search to a specific schema"),
		status: z
			.enum(["draft", "published"])
			.optional()
			.describe("Optional: filter by content status"),
		limit: z
			.number()
			.optional()
			.default(10)
			.describe("Maximum number of results to return (default: 10)"),
	}),
	execute: async ({ query, schemaId, status, limit }) => {
		try {
			const searchQuery = query.toLowerCase()
			let allContent: ContentItem[] = []

			if (schemaId) {
				// Search within specific schema
				const content = await fetchAuthQuery(api.cms.content.listBySchema, {
					schemaId: schemaId as Id<"cmsSchemas">,
					status,
				})
				allContent = (content ?? []) as ContentItem[]
			} else {
				// Get all schemas and search across all
				const schemas = await getCachedSchemas()

				for (const schema of schemas) {
					const content = await fetchAuthQuery(api.cms.content.listBySchema, {
						schemaId: schema._id as Id<"cmsSchemas">,
						status,
					})
					if (content) {
						allContent.push(...(content as ContentItem[]))
					}
				}
			}

			// Filter by search query
			const results = allContent
				.filter((item) => {
					const dataStr = JSON.stringify(item.data).toLowerCase()
					const slugMatch = item.slug?.toLowerCase().includes(searchQuery)
					return dataStr.includes(searchQuery) || slugMatch
				})
				.slice(0, limit)
				.map((item) => ({
					_id: item._id,
					schemaId: item.schemaId,
					slug: item.slug,
					status: item.status,
					preview: getContentPreview(item.data, searchQuery),
				}))

			logger.tool(
				"searchContent",
				{ query, schemaId, status },
				{ count: results.length },
			)

			return {
				success: true,
				data: results,
				totalFound: results.length,
				message:
					results.length > 0
						? `Found ${results.length} matching content entries`
						: "No matching content found",
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	},
})

type ContentItem = {
	_id: string
	schemaId: string
	slug?: string
	status: "draft" | "published"
	data: Record<string, unknown>
}

function getContentPreview(
	data: Record<string, unknown>,
	query: string,
): string {
	const dataStr = JSON.stringify(data)
	const lowerStr = dataStr.toLowerCase()
	const index = lowerStr.indexOf(query.toLowerCase())

	if (index === -1) {
		return dataStr.slice(0, 100) + (dataStr.length > 100 ? "..." : "")
	}

	const start = Math.max(0, index - 30)
	const end = Math.min(dataStr.length, index + query.length + 30)
	const preview = dataStr.slice(start, end)

	return (
		(start > 0 ? "..." : "") + preview + (end < dataStr.length ? "..." : "")
	)
}

// ================================
// GET SCHEMA STATS TOOL
// ================================

export const getSchemaStats = tool({
	description:
		"Get statistics about a schema including content count, last updated, and field summary.",
	inputSchema: z.object({
		schemaId: z.string().describe("The ID of the schema"),
	}),
	execute: async ({ schemaId }) => {
		try {
			const schema = await getCachedSchema(schemaId)

			if (!schema) {
				return {
					success: false,
					error: "Schema not found",
				}
			}

			// Get content counts
			const allContent = await fetchAuthQuery(api.cms.content.listBySchema, {
				schemaId: schemaId as Id<"cmsSchemas">,
			})

			const draftContent = await fetchAuthQuery(api.cms.content.listBySchema, {
				schemaId: schemaId as Id<"cmsSchemas">,
				status: "draft",
			})

			const publishedContent = await fetchAuthQuery(
				api.cms.content.listBySchema,
				{
					schemaId: schemaId as Id<"cmsSchemas">,
					status: "published",
				},
			)

			const totalCount = allContent?.length ?? 0
			const draftCount = draftContent?.length ?? 0
			const publishedCount = publishedContent?.length ?? 0

			// Field summary
			const fieldSummary = schema.fields.map((f) => ({
				name: f.name,
				type: f.type,
				required: f.required ?? false,
			}))

			logger.tool("getSchemaStats", { schemaId }, { totalCount })

			return {
				success: true,
				data: {
					schema: {
						id: schema._id,
						name: schema.name,
						displayName: schema.displayName,
						type: schema.type,
						description: schema.description,
					},
					stats: {
						totalContent: totalCount,
						draftContent: draftCount,
						publishedContent: publishedCount,
						fieldCount: schema.fields.length,
					},
					fields: fieldSummary,
					lastUpdated: new Date(schema.updatedAt).toISOString(),
				},
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	},
})

// ================================
// PREVIEW CHANGES TOOL
// ================================

export const previewChanges = tool({
	description:
		"Preview what changes will be made to content before applying them. Use this to show the user a diff of changes.",
	inputSchema: z.object({
		contentId: z
			.string()
			.describe("The ID of the content to preview changes for"),
		newData: z
			.record(z.string(), z.unknown())
			.optional()
			.describe("The new data to compare against current"),
		newSlug: z.string().optional().describe("New slug if changing"),
		newStatus: z
			.enum(["draft", "published"])
			.optional()
			.describe("New status if changing"),
	}),
	execute: async ({ contentId, newData, newSlug, newStatus }) => {
		try {
			const content = await fetchAuthQuery(api.cms.content.get, {
				id: contentId as Id<"cmsContent">,
			})

			if (!content) {
				return {
					success: false,
					error: "Content not found",
				}
			}

			const changes: ChangeItem[] = []

			// Check slug change
			if (newSlug !== undefined && newSlug !== content.slug) {
				changes.push({
					field: "slug",
					from: content.slug ?? "(none)",
					to: newSlug,
				})
			}

			// Check status change
			if (newStatus !== undefined && newStatus !== content.status) {
				changes.push({
					field: "status",
					from: content.status,
					to: newStatus,
				})
			}

			// Check data changes
			if (newData) {
				const currentData = content.data as Record<string, unknown>

				for (const [key, newValue] of Object.entries(newData)) {
					const currentValue = currentData[key]

					if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
						changes.push({
							field: `data.${key}`,
							from: formatValue(currentValue),
							to: formatValue(newValue),
						})
					}
				}
			}

			logger.tool(
				"previewChanges",
				{ contentId },
				{ changeCount: changes.length },
			)

			return {
				success: true,
				data: {
					contentId,
					currentSlug: content.slug,
					currentStatus: content.status,
					hasChanges: changes.length > 0,
					changeCount: changes.length,
					changes,
				},
				message:
					changes.length > 0
						? `${changes.length} change(s) will be made`
						: "No changes detected",
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	},
})

type ChangeItem = {
	field: string
	from: string
	to: string
}

function formatValue(value: unknown): string {
	if (value === undefined) return "(undefined)"
	if (value === null) return "(null)"
	if (typeof value === "string")
		return value.length > 50 ? `${value.slice(0, 50)}...` : value
	if (typeof value === "object")
		return `${JSON.stringify(value).slice(0, 50)}...`
	return String(value)
}
