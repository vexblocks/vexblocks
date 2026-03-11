import fs from "node:fs"

import path from "node:path"
import { fileURLToPath } from "node:url"
import { ConvexHttpClient } from "convex/browser"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env files
function loadEnvFile(filepath: string): void {
	if (!fs.existsSync(filepath)) return

	const content = fs.readFileSync(filepath, "utf-8")
	const lines = content.split("\n")

	for (const line of lines) {
		const trimmed = line.trim()
		// Skip comments and empty lines
		if (!trimmed || trimmed.startsWith("#")) continue

		const match = trimmed.match(/^([^=]+)=(.*)$/)
		if (match) {
			const [, key, value] = match
			// Only set if not already set (env vars take precedence)
			if (!process.env[key.trim()]) {
				process.env[key.trim()] = value.trim()
			}
		}
	}
}

// Try to load .env files from various locations
const rootDir = path.join(__dirname, "../../..")
const possibleEnvFiles = [
	path.join(rootDir, ".env.local"),
	path.join(rootDir, ".env"),
	path.join(rootDir, "packages/backend/.env.local"),
	path.join(rootDir, "packages/backend/.env"),
	path.join(rootDir, "apps/admin/.env.local"),
]

for (const envFile of possibleEnvFiles) {
	loadEnvFile(envFile)
}

// Dynamically import the Convex API
const backendPath = path.join(
	__dirname,
	"../../backend/convex/_generated/api.js",
)
const { api } = await import(backendPath)

// Get Convex URL from environment
const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL

if (!CONVEX_URL) {
	console.error("❌ Error: CONVEX_URL or NEXT_PUBLIC_CONVEX_URL not found")
	console.error("Please set one of these environment variables")
	console.error("\nSearched in:")
	for (const envFile of possibleEnvFiles) {
		console.error(`  - ${envFile} ${fs.existsSync(envFile) ? "✓" : "✗"}`)
	}
	process.exit(1)
}

const client = new ConvexHttpClient(CONVEX_URL)

/**
 * Convert snake_case to PascalCase
 */
function toPascalCase(str: string): string {
	return str
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join("")
}

/**
 * Primitive block type names (field types that can appear in allowedBlocks)
 * mapped to their corresponding FlexibleBlock discriminated union member.
 */
const PRIMITIVE_BLOCK_TYPES: Record<string, string> = {
	shortText: '{ type: "shortText"; value: string }',
	longText: '{ type: "longText"; value: string }',
	richText: '{ type: "richText"; value: string }',
	url: '{ type: "url"; value: string }',
	youtubeUrl: '{ type: "youtubeUrl"; value: string }',
	number: '{ type: "number"; value: number }',
	boolean: '{ type: "boolean"; value: boolean }',
	date: '{ type: "date"; value: string }',
	media: '{ type: "media"; value: string }',
	select: '{ type: "select"; value: string }',
	group: '{ type: "group"; value: any }',
	blockReference: '{ type: "blockReference"; value: any }',
}

/**
 * Map CMS field type to TypeScript type
 */
function mapFieldType(
	field: any,
	indent = "",
	allSchemas: any[] = [],
	allBlocks: any[] = [],
): string {
	switch (field.type) {
		case "shortText":
		case "longText":
		case "richText":
		case "url":
		case "youtubeUrl":
			return "string"

		case "number":
			return "number"

		case "boolean":
			return "boolean"

		case "date":
			return "string" // ISO date string

		case "media":
			return "string" // Cloudflare ID

		case "select":
			if (field.options?.length) {
				return field.options.map((o: string) => `"${o}"`).join(" | ")
			}
			return "string"

		case "reference": {
			// Returns the Convex document ID string at runtime.
			// Public queries do not auto-resolve references; resolution must be
			// done manually in the application layer (e.g. by fetching the
			// referenced content and extracting its slug/data).
			return "string"
		}

		case "multiReference": {
			// Same as "reference" — always an array of ID strings at runtime.
			return "string[]"
		}

		case "group": {
			if (!field.fields || field.fields.length === 0) {
				return "Record<string, any>"
			}
			const nestedIndent = `${indent}  `
			const fields = generateFieldTypes(
				field.fields,
				nestedIndent,
				allSchemas,
				allBlocks,
			)
			return `{\n${fields}\n${indent}}`
		}

		case "repeater": {
			if (!field.fields || field.fields.length === 0) {
				return "Array<Record<string, any>>"
			}
			const nestedIndent = `${indent}  `
			const fields = generateFieldTypes(
				field.fields,
				nestedIndent,
				allSchemas,
				allBlocks,
			)
			return `Array<{\n${fields}\n${indent}}>`
		}

		case "flexibleBlocks": {
			// When allowedBlocks is specified, narrow the type to only named reusable
			// blocks that exist in the system, or to specific FlexibleBlock members
			// for primitive types. Falls back to FlexibleBlock for unknowns.
			if (field.allowedBlocks?.length) {
				const seen = new Set<string>()
				const blockTypeNames = (field.allowedBlocks as string[])
					.map((name) => {
						if (allBlocks.some((b: any) => b.name === name)) {
							return `${toPascalCase(name)}Block`
						}
						if (PRIMITIVE_BLOCK_TYPES[name]) {
							return PRIMITIVE_BLOCK_TYPES[name]
						}
						return "FlexibleBlock"
					})
					.filter((t) => {
						if (seen.has(t)) return false
						seen.add(t)
						return true
					})
				return `Array<${blockTypeNames.join(" | ")}>`
			}
			return "Array<FlexibleBlock>"
		}

		case "blockReference": {
			// Use the specific block type when the block name is known.
			if (
				field.blockName &&
				allBlocks.some((b: any) => b.name === field.blockName)
			) {
				return `${toPascalCase(field.blockName)}Block`
			}
			return "FlexibleBlock"
		}

		default:
			return "any"
	}
}

/**
 * Generate TypeScript field definitions
 */
function generateFieldTypes(
	fields: any[],
	indent = "",
	allSchemas: any[] = [],
	allBlocks: any[] = [],
): string {
	return fields
		.map((field) => {
			const optional = field.required ? "" : "?"
			const fieldType = mapFieldType(field, indent, allSchemas, allBlocks)
			const comment = field.helpText
				? `\n${indent}/** ${field.helpText} */`
				: ""
			return `${comment}\n${indent}${field.name}${optional}: ${fieldType}`
		})
		.join("\n")
}

/**
 * Generate TypeScript type for a block
 */
function generateBlockType(block: any, allBlocks: any[] = []): string {
	const typeName = toPascalCase(block.name)
	const description = block.description ? `\n * ${block.description}` : ""

	return `
/**
 * ${block.displayName}${description}
 * @block ${block.name}
 */
export type ${typeName}Block = {
${generateFieldTypes(block.fields, "  ", [], allBlocks)}
}
	`.trim()
}

/**
 * Main type generation function
 */
async function generateTypes() {
	try {
		console.log("🔄 Fetching schemas and blocks from Convex...")
		console.log(`📍 Using Convex URL: ${CONVEX_URL}`)

		const [schemas, blocks] = await Promise.all([
			client.query(api.cms.schemas.listPublic, {}),
			client.query(api.cms.blocks.listPublic, {}),
		])

		if (!schemas || schemas.length === 0) {
			console.log("⚠️  No schemas found. Creating placeholder types...")

			const placeholderOutput = `
/**
 * Auto-generated types from CMS schemas
 * Generated at: ${new Date().toISOString()}
 * 
 * DO NOT EDIT THIS FILE MANUALLY
 * Run 'pnpm generate-types' to regenerate
 */

// No schemas found yet
export type CMSSchemaName = never
export type CMSContent = never
export type CMSContentBySchema<T extends string> = never
			`.trim()

			const outputPath = path.join(
				__dirname,
				"../../cms-shared/src/types/generated.ts",
			)
			fs.writeFileSync(outputPath, placeholderOutput)
			console.log(`✅ Placeholder types created at: ${outputPath}`)
			return
		}

		console.log(`📝 Found ${schemas.length} schema(s):`)
		for (const schema of schemas) {
			console.log(`   - ${schema.name} (${schema.displayName})`)
		}

		console.log(`\n📦 Found ${blocks?.length || 0} block(s):`)
		for (const block of blocks || []) {
			console.log(`   - ${block.name} (${block.displayName})`)
		}

		// Generate type for each schema
		const types = schemas
			.map((schema: any) => {
				const typeName = toPascalCase(schema.name)
				const description = schema.description
					? `\n * ${schema.description}`
					: ""

				return `
/**
 * ${schema.displayName}${description}
 * @schema ${schema.name}
 */
export type ${typeName}Content = {
	_id: string
	_creationTime: number
	schemaId: string
	slug?: string
	status: "draft" | "published"
	data: {
${generateFieldTypes(schema.fields, "    ", schemas, blocks || [])}
	}
}
			`.trim()
			})
			.join("\n\n")

		// Generate union types
		const schemaNames = schemas.map((s: any) => `"${s.name}"`).join(" | ")
		const contentTypes = schemas
			.map((s: any) => `${toPascalCase(s.name)}Content`)
			.join(" | ")

		// Generate type mapping
		const typeMapping = schemas
			.map(
				(s: any) => `  T extends "${s.name}" ? ${toPascalCase(s.name)}Content`,
			)
			.join(" :\n")

		// Generate types for blocks
		const blockTypes =
			blocks && blocks.length > 0
				? blocks
						.map((block: any) => generateBlockType(block, blocks))
						.join("\n\n")
				: ""

		// Generate block union types
		const blockNames =
			blocks && blocks.length > 0
				? blocks.map((b: any) => `"${b.name}"`).join(" | ")
				: "never"

		const blockTypeUnion =
			blocks && blocks.length > 0
				? blocks.map((b: any) => `${toPascalCase(b.name)}Block`).join(" | ")
				: "never"

		// Generate block type mapping
		const blockTypeMapping =
			blocks && blocks.length > 0
				? blocks
						.map(
							(b: any) =>
								`  T extends "${b.name}" ? ${toPascalCase(b.name)}Block`,
						)
						.join(" :\n")
				: "  never"

		const output = `
/**
 * Auto-generated types from CMS schemas and blocks
 * Generated at: ${new Date().toISOString()}
 *
 * DO NOT EDIT THIS FILE MANUALLY
 * Run 'pnpm generate-types' to regenerate
 */

/**
 * Base flexible block type (used when no allowedBlocks are specified)
 */
export type FlexibleBlock =
  | { type: "shortText"; value: string }
  | { type: "longText"; value: string }
  | { type: "richText"; value: string }
  | { type: "url"; value: string }
  | { type: "youtubeUrl"; value: string }
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean }
  | { type: "date"; value: string }
  | { type: "media"; value: string }
  | { type: "select"; value: string }
  | { type: "group"; value: any }
  | { type: "blockReference"; value: any }

// =============================================================================
// SCHEMA CONTENT TYPES
// =============================================================================

${types}

/**
 * Union of all schema names
 */
export type CMSSchemaName = ${schemaNames}

/**
 * Union of all content types
 */
export type CMSContent = ${contentTypes}

/**
 * Helper type to get content type by schema name
 * @example
 * type BlogPost = CMSContentBySchema<'blog_posts'>
 */
export type CMSContentBySchema<T extends CMSSchemaName> =
${typeMapping} :
  never

// =============================================================================
// REUSABLE BLOCK TYPES
// =============================================================================

${blockTypes || "// No blocks defined yet"}

/**
 * Union of all block names
 */
export type CMSBlockName = ${blockNames}

/**
 * Union of all block types
 */
export type CMSBlock = ${blockTypeUnion}

/**
 * Helper type to get block type by block name
 * @example
 * type CallToAction = CMSBlockByName<'call_to_action'>
 */
export type CMSBlockByName<T extends CMSBlockName> =
${blockTypeMapping} :
  never
		`.trim()

		const outputPath = path.join(
			__dirname,
			"../../cms-shared/src/types/generated.ts",
		)

		// Check if file exists and compare content (ignoring the timestamp line)
		const stripTimestamp = (content: string) =>
			content.replace(/\* Generated at:.*\n/, "")

		let shouldWrite = true
		if (fs.existsSync(outputPath)) {
			const existingContent = fs.readFileSync(outputPath, "utf-8")
			if (stripTimestamp(existingContent) === stripTimestamp(output)) {
				shouldWrite = false
				console.log("\n✅ No changes detected, skipping file write")
			}
		}

		if (shouldWrite) {
			fs.writeFileSync(outputPath, output)
			console.log("\n✅ Types generated successfully!")
			console.log(`📄 Output: ${outputPath}`)
		}

		console.log(
			`\n📊 Generated ${schemas.length} content type(s) and ${blocks?.length || 0} block type(s)`,
		)
	} catch (error) {
		console.error("\n❌ Error generating types:")
		console.error(error)
		process.exit(1)
	}
}

// Run generator
generateTypes()
