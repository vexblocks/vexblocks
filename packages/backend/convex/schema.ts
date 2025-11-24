import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

// =================================================================================================
// IDENTITY & ACCESS MANAGEMENT
// =================================================================================================

const users = defineTable({
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
})
	.index("email", ["email"])
	.index("authId", ["authId"])
	.index("by_role", ["role"])

const todos = defineTable({
	text: v.string(),
	isCompleted: v.boolean(),
})

// =================================================================================================
// HEADLESS CMS
// =================================================================================================

// Field type definition for schema builder
const fieldDefinition: any = v.object({
	name: v.string(), // Field identifier (e.g., "title", "content")
	label: v.string(), // Display name (e.g., "Post Title")
	type: v.union(
		v.literal("shortText"),
		v.literal("longText"),
		v.literal("richText"),
		v.literal("media"),
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

// Schema definitions (user-created content types)
const cmsSchemas = defineTable({
	name: v.string(), // Unique identifier (e.g., "blog_posts")
	displayName: v.string(), // Display name (e.g., "Blog Posts")
	type: v.union(
		v.literal("global"), // Singleton content (header, footer)
		v.literal("page"), // Single pages with unique URLs
		v.literal("collection"), // Repeatable content (blog posts)
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
	// Metadata
	icon: v.optional(v.string()), // Icon for UI
	createdBy: v.id("users"),
	updatedAt: v.number(),
})
	.index("by_name", ["name"])
	.index("by_type", ["type"])
	.index("by_created_by", ["createdBy"])

// Content entries (actual content created by users)
const cmsContent = defineTable({
	schemaId: v.id("cmsSchemas"),
	slug: v.optional(v.string()), // For pages and collections
	status: v.union(v.literal("draft"), v.literal("published")),
	data: v.any(), // Flexible JSON data matching schema fields
	// SEO metadata
	seo: v.optional(
		v.object({
			title: v.optional(v.string()),
			description: v.optional(v.string()),
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

// Media library
const cmsMedia = defineTable({
	cloudflareId: v.string(), // Cloudflare Images ID (required)
	filename: v.string(),
	mimeType: v.string(),
	size: v.number(), // File size in bytes
	width: v.optional(v.number()),
	height: v.optional(v.number()),
	// Metadata
	caption: v.string(), // Descriptive name/caption (required)
	alt: v.optional(v.string()), // Alt text for accessibility
	tags: v.optional(v.array(v.string())), // Array of tag names (optional)
	// Upload info
	uploadedBy: v.id("users"),
	uploadedAt: v.number(),
})
	.index("by_uploaded_by", ["uploadedBy"])
	.index("by_cloudflare_id", ["cloudflareId"])

// Media tags (for autocomplete and management)
const cmsMediaTags = defineTable({
	name: v.string(), // Tag name (unique)
	color: v.optional(v.string()), // Optional color for UI
	usageCount: v.number(), // How many images use this tag
	createdBy: v.id("users"),
	createdAt: v.number(),
})
	.index("by_name", ["name"])
	.index("by_usage_count", ["usageCount"])

// Reusable blocks (components that can be referenced in schemas)
const cmsBlocks = defineTable({
	name: v.string(), // Unique identifier (e.g., "call_to_action")
	displayName: v.string(), // Display name (e.g., "Call to Action")
	description: v.optional(v.string()),
	fields: v.array(fieldDefinition), // Fields that make up this block
	// Preview/thumbnail
	icon: v.optional(v.string()), // Icon for UI
	category: v.optional(v.string()), // Category for organization (e.g., "Marketing", "Content")
	// Metadata
	createdBy: v.id("users"),
	updatedAt: v.number(),
})
	.index("by_name", ["name"])
	.index("by_category", ["category"])
	.index("by_created_by", ["createdBy"])

// Global settings (appearance, site config, etc.)
const cmsSettings = defineTable({
	key: v.string(), // e.g., "appearance"
	value: v.any(), // JSON object with specific settings
	updatedBy: v.id("users"),
	updatedAt: v.number(),
}).index("by_key", ["key"])

const schema = defineSchema({
	users,
	todos,
	cmsSchemas,
	cmsContent,
	cmsMedia,
	cmsMediaTags,
	cmsBlocks,
	cmsSettings,
})

export default schema
