/**
 * @vexblocks-managed
 * VexBlocks CMS Schema Tables
 * Version: 1.0.0
 *
 * This file contains all database tables required by VexBlocks CMS.
 * DO NOT EDIT - Changes will be overwritten on upgrade.
 *
 * To use with your existing schema, import and spread these tables:
 *
 * @example
 * ```ts
 * import { defineSchema } from "convex/server"
 * import { cmsSchemaExports } from "./schema.cms"
 *
 * export default defineSchema({
 *   // Your existing tables
 *   products,
 *   orders,
 *   // VexBlocks CMS tables
 *   ...cmsSchemaExports,
 * })
 * ```
 */

import { defineTable } from "convex/server"
import { v } from "convex/values"

// =============================================================================
// USERS TABLE (Required by CMS)
// =============================================================================

/**
 * Required fields for VexBlocks CMS users table.
 * Use this to extend your existing users table or create a new one.
 */
export const cmsUserFields = {
	name: v.optional(v.string()),
	email: v.string(),
	authId: v.string(),
	role: v.union(
		v.literal("admin"),
		v.literal("editor"),
		v.literal("developer"),
		v.literal("user"),
	),
	profilePictureUrl: v.optional(v.string()),
	isActive: v.optional(v.boolean()), // Whether the user account is active
}

/**
 * Default users table for CMS authentication and authorization.
 *
 * ⚠️ IMPORTANT: If you already have a users table in your schema,
 * DO NOT include this in cmsSchemaExports. Instead, extend your
 * existing users table with cmsUserFields.
 *
 * @example With existing users table:
 * ```ts
 * import { cmsUserFields } from "./cms/schema.cms"
 *
 * const users = defineTable({
 *   ...cmsUserFields,
 *   // Your custom fields
 *   companyId: v.id("companies"),
 *   preferences: v.object({ ... }),
 * })
 *   .index("email", ["email"])
 *   .index("authId", ["authId"])
 *   .index("by_role", ["role"])
 *   .index("by_active", ["isActive"])
 *   // Your custom indexes
 *   .index("by_company", ["companyId"])
 * ```
 */
export const cmsUsersTable = defineTable(cmsUserFields)
	.index("email", ["email"])
	.index("authId", ["authId"])
	.index("by_role", ["role"])
	.index("by_active", ["isActive"])

/**
 * User invitations table.
 * Stores pending invitations sent to users.
 */
export const cmsUserInvitations = defineTable({
	email: v.string(),
	role: v.union(
		v.literal("admin"),
		v.literal("editor"),
		v.literal("developer"),
		v.literal("user"),
	),
	status: v.union(
		v.literal("pending"), // Invitation sent, not yet accepted
		v.literal("accepted"), // User registered with this invitation
	),
	invitedBy: v.id("users"),
	invitedAt: v.number(),
	acceptedAt: v.optional(v.number()),
})
	.index("by_email", ["email"])
	.index("by_status", ["status"])
	.index("by_invited_by", ["invitedBy"])

// =============================================================================
// CMS FIELD DEFINITION
// =============================================================================

/**
 * Field type definition for schema builder.
 * Supports all CMS field types including nested structures.
 */
export const fieldDefinition: any = v.object({
	name: v.string(), // Field identifier (e.g., "title", "content")
	label: v.string(), // Display name (e.g., "Post Title")
	type: v.union(
		v.literal("shortText"),
		v.literal("longText"),
		v.literal("richText"),
		v.literal("media"),
		v.literal("file"),
		v.literal("url"),
		v.literal("youtubeUrl"),
		v.literal("boolean"),
		v.literal("number"),
		v.literal("date"),
		v.literal("select"),
		v.literal("reference"),
		v.literal("multiReference"), // Multiple references to another schema (e.g., tags, categories)
		v.literal("group"), // Group of fields (e.g., address with street, city, zip)
		v.literal("repeater"), // Array of repeated fields (e.g., menu items)
		v.literal("flexibleBlocks"), // Dynamic blocks - user can add any type of field
		v.literal("blockReference"), // Reference to a reusable block
		v.literal("map"), // Geographic point with coordinates
	),
	required: v.boolean(),
	defaultValue: v.optional(v.any()),
	// For select type
	options: v.optional(v.array(v.string())),
	// For reference type
	referenceSchema: v.optional(v.string()),
	// For group and repeater types - nested fields
	fields: v.optional(v.any()), // Will contain array of fieldDefinition
	// For flexibleBlocks type - which field types are allowed
	allowedBlocks: v.optional(
		v.array(
			v.union(
				v.literal("shortText"),
				v.literal("longText"),
				v.literal("richText"),
				v.literal("media"),
				v.literal("file"),
				v.literal("url"),
				v.literal("youtubeUrl"),
				v.literal("boolean"),
				v.literal("number"),
				v.literal("date"),
				v.literal("select"),
				v.literal("group"),
				v.literal("blockReference"),
			),
		),
	),
	// For flexibleBlocks type - maximum number of blocks allowed
	maxBlocks: v.optional(v.number()),
	// For blockReference type - which block to reference
	blockId: v.optional(v.string()),
	// For shortText type - slug configuration
	isSlug: v.optional(v.boolean()), // Mark this field as a slug field
	slugSource: v.optional(v.string()), // Which field to use as source for slug generation
	// Localization
	translatable: v.optional(v.boolean()), // Mark this field as translatable (for i18n)
	// Additional validation rules
	validation: v.optional(
		v.object({
			min: v.optional(v.number()),
			max: v.optional(v.number()),
			pattern: v.optional(v.string()),
		}),
	),
	// Help text for the field
	helpText: v.optional(v.string()),
})

// =============================================================================
// CMS TABLES
// =============================================================================

/**
 * Schema definitions (user-created content types).
 * Stores the structure of content types like Blog Posts, Products, etc.
 */
export const cmsSchemas = defineTable({
	name: v.string(), // Unique identifier (e.g., "blog_posts")
	displayName: v.string(), // Display name (e.g., "Blog Posts")
	type: v.union(
		v.literal("global"), // Singleton content (header, footer)
		v.literal("collection"), // Repeatable content (blog posts, pages)
	),
	description: v.optional(v.string()),
	fields: v.array(fieldDefinition),
	// View configuration for content list
	viewConfig: v.optional(
		v.object({
			previewField: v.optional(v.string()), // Field to show in main content column
			additionalFields: v.optional(v.array(v.string())), // Up to 3 additional fields to show as columns
		}),
	),
	// Live preview configuration
	previewConfig: v.optional(
		v.object({
			urlPattern: v.string(), // URL pattern with placeholders, e.g., "/blog/{slug}"
			enabled: v.optional(v.boolean()), // Whether preview is enabled for this schema
		}),
	),
	// Simple mode: disables SEO metadata on content entries
	isSimple: v.optional(v.boolean()),
	// Metadata
	icon: v.optional(v.string()), // Icon for UI
	createdBy: v.id("users"),
	updatedAt: v.number(),
})
	.index("by_name", ["name"])
	.index("by_type", ["type"])
	.index("by_created_by", ["createdBy"])

/**
 * Content entries (actual content created by users).
 * Stores the data for each content item.
 */
export const cmsContent = defineTable({
	schemaId: v.id("cmsSchemas"),
	slug: v.optional(v.string()), // For pages and collections
	status: v.union(v.literal("draft"), v.literal("published")),
	data: v.any(), // Flexible JSON data matching schema fields
	// SEO metadata
	seo: v.optional(
		v.object({
			title: v.optional(v.any()), // string or Record<locale, string> for i18n
			description: v.optional(v.any()), // string or Record<locale, string> for i18n
			ogImage: v.optional(v.string()),
		}),
	),
	// Metadata
	createdBy: v.id("users"),
	updatedBy: v.id("users"),
	publishedAt: v.optional(v.number()),
	updatedAt: v.number(),
})
	.index("by_schema", ["schemaId"])
	.index("by_slug", ["slug"])
	.index("by_status", ["status"])
	.index("by_schema_and_status", ["schemaId", "status"])
	.index("by_schema_and_slug", ["schemaId", "slug"])

/**
 * Media library for storing images and files.
 * Uses Cloudflare Images for storage.
 */
export const cmsMedia = defineTable({
	cloudflareId: v.string(), // Cloudflare Images ID or empty string for R2 files
	filename: v.string(),
	mimeType: v.string(),
	size: v.number(), // File size in bytes
	width: v.optional(v.number()),
	height: v.optional(v.number()),
	// Metadata
	caption: v.string(), // Descriptive name/caption (required)
	alt: v.optional(v.string()), // Alt text for accessibility
	tags: v.optional(v.array(v.string())), // Array of tag names (optional)
	// Storage type: "cloudflare-images" (default) or "r2"
	storageType: v.optional(v.string()),
	r2Key: v.optional(v.string()), // R2 object key (only for storageType "r2")
	// Upload info
	uploadedBy: v.id("users"),
	uploadedAt: v.number(),
})
	.index("by_uploaded_by", ["uploadedBy"])
	.index("by_cloudflare_id", ["cloudflareId"])
	.index("by_r2_key", ["r2Key"])

/**
 * Media tags for autocomplete and organization.
 */
export const cmsMediaTags = defineTable({
	name: v.string(), // Tag name (unique)
	color: v.optional(v.string()), // Optional color for UI
	usageCount: v.number(), // How many images use this tag
	createdBy: v.id("users"),
	createdAt: v.number(),
})
	.index("by_name", ["name"])
	.index("by_usage_count", ["usageCount"])

/**
 * Reusable blocks (components that can be referenced in schemas).
 * Think of these as pre-built content components.
 */
export const cmsBlocks = defineTable({
	name: v.string(), // Unique identifier (e.g., "call_to_action")
	displayName: v.string(), // Display name (e.g., "Call to Action")
	description: v.optional(v.string()),
	fields: v.array(fieldDefinition), // Fields that make up this block
	// Preview/thumbnail
	icon: v.optional(v.string()), // Icon for UI
	previewImage: v.optional(v.string()), // Cloudflare Image ID for visual preview
	category: v.optional(v.string()), // Category for organization (e.g., "Marketing", "Content")
	// Metadata
	createdBy: v.id("users"),
	updatedAt: v.number(),
})
	.index("by_name", ["name"])
	.index("by_category", ["category"])
	.index("by_created_by", ["createdBy"])

/**
 * API Keys for external REST API access.
 * Keys are hashed before storage — the raw key is only shown once at creation.
 */
export const cmsApiKeys = defineTable({
	name: v.string(), // User-given label (e.g., "Production", "Python client")
	keyHash: v.string(), // SHA-256 hex hash of the raw API key
	keyPrefix: v.string(), // First 16 chars of the raw key for display (e.g., "cb_live_xxxx...")
	createdBy: v.id("users"),
	createdAt: v.number(),
	lastUsedAt: v.optional(v.number()),
	revokedAt: v.optional(v.number()), // Set when revoked; null/undefined = active
})
	.index("by_key_hash", ["keyHash"])
	.index("by_created_by", ["createdBy"])
	.index("by_revoked_at", ["revokedAt"])

/**
 * Global settings (appearance, site config, localization, etc.).
 */
export const cmsSettings = defineTable({
	key: v.string(), // e.g., "appearance", "localization"
	value: v.any(), // JSON object with specific settings
	updatedBy: v.id("users"),
	updatedAt: v.number(),
}).index("by_key", ["key"])

/**
 * AI chat conversations and messages.
 * Stores chat history between users and the CMS AI assistant.
 */
export const cmsAIChats = defineTable({
	userId: v.id("users"), // Owner of the conversation
	messages: v.array(
		v.object({
			id: v.string(), // Message ID
			role: v.union(v.literal("user"), v.literal("assistant")),
			content: v.string(), // Message content
			createdAt: v.number(), // Timestamp
		}),
	),
	title: v.optional(v.string()), // Optional title for the conversation
	createdAt: v.number(),
	updatedAt: v.number(),
})
	.index("by_user", ["userId"])
	.index("by_created_at", ["createdAt"])

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * All CMS schema tables exported as an object.
 * Use this to spread into your defineSchema call.
 *
 * ⚠️ IMPORTANT: This includes a default users table (cmsUsersTable).
 * If you already have a users table in your schema, you have two options:
 *
 * Option 1: Use cmsTablesWithoutUsers and define your own users table
 * @example
 * ```ts
 * import { defineSchema, defineTable } from "convex/server"
 * import { cmsTablesWithoutUsers, cmsUserFields } from "./cms/schema.cms"
 *
 * const users = defineTable({
 *   ...cmsUserFields,
 *   // Your custom fields
 *   companyId: v.id("companies"),
 * })
 *   .index("email", ["email"])
 *   .index("authId", ["authId"])
 *   .index("by_role", ["role"])
 *   .index("by_active", ["isActive"])
 *
 * export default defineSchema({
 *   users,
 *   ...cmsTablesWithoutUsers,
 * })
 * ```
 *
 * Option 2: Use the default CMS users table (if you don't have one)
 * @example
 * ```ts
 * import { defineSchema } from "convex/server"
 * import { cmsSchemaExports } from "./cms/schema.cms"
 *
 * export default defineSchema({
 *   myTable: defineTable({ ... }),
 *   ...cmsSchemaExports,
 * })
 * ```
 */
export const cmsSchemaExports = {
	users: cmsUsersTable,
	cmsUserInvitations,
	cmsSchemas,
	cmsContent,
	cmsMedia,
	cmsMediaTags,
	cmsBlocks,
	cmsSettings,
	cmsAIChats,
	cmsApiKeys,
}

/**
 * CMS tables WITHOUT the users table.
 * Use this when you already have a users table and want to extend it.
 */
export const cmsTablesWithoutUsers = {
	cmsUserInvitations,
	cmsSchemas,
	cmsContent,
	cmsMedia,
	cmsMediaTags,
	cmsBlocks,
	cmsSettings,
	cmsAIChats,
	cmsApiKeys,
}

/**
 * Individual table exports for selective imports.
 * Use this if you need to customize which tables to include.
 */
export const cmsTables = {
	cmsSchemas,
	cmsContent,
	cmsMedia,
	cmsMediaTags,
	cmsBlocks,
	cmsSettings,
	cmsAIChats,
	cmsApiKeys,
}
