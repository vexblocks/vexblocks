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
 * Map CMS field type to TypeScript type
 */
function mapFieldType(field: any, indent = "", allSchemas: any[] = []): string {
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
			// Support both ID string and embedded object
			if (field.referenceSchema) {
				const referencedTypeName = toPascalCase(field.referenceSchema)
				return `string | ${referencedTypeName}Content`
			}
			return "string" // Fallback to ID only
		}

		case "multiReference": {
			// Support both array of IDs and array of embedded objects
			if (field.referenceSchema) {
				const referencedTypeName = toPascalCase(field.referenceSchema)
				return `Array<string | ${referencedTypeName}Content>`
			}
			return "string[]" // Fallback to IDs only
		}

		case "group": {
			if (!field.fields || field.fields.length === 0) {
				return "Record<string, any>"
			}
			const nestedIndent = `${indent}  `
			const fields = generateFieldTypes(field.fields, nestedIndent, allSchemas)
			return `{\n${fields}\n${indent}}`
		}

		case "repeater": {
			if (!field.fields || field.fields.length === 0) {
				return "Array<Record<string, any>>"
			}
			const nestedIndent = `${indent}  `
			const fields = generateFieldTypes(field.fields, nestedIndent, allSchemas)
			return `Array<{\n${fields}\n${indent}}>`
		}

		case "flexibleBlocks": {
			// Always allow all block types since content can have any block
			// regardless of allowedBlocks restrictions (which are UI-only)
			return "Array<FlexibleBlock>"
		}

		case "blockReference":
			return "any" // Could be more specific if block types are known

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
): string {
	return fields
		.map((field) => {
			const optional = field.required ? "" : "?"
			const fieldType = mapFieldType(field, indent, allSchemas)
			const comment = field.helpText
				? `\n${indent}/** ${field.helpText} */`
				: ""
			return `${comment}\n${indent}${field.name}${optional}: ${fieldType}`
		})
		.join("\n")
}

/**
 * Main type generation function
 */
async function generateTypes() {
	try {
		console.log("🔄 Fetching schemas from Convex...")
		console.log(`📍 Using Convex URL: ${CONVEX_URL}`)

		const schemas = await client.query(api.cms.schemas.listPublic, {})

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
${generateFieldTypes(schema.fields, "    ", schemas)}
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

		const output = `
/**
 * Auto-generated types from CMS schemas
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
		`.trim()

		const outputPath = path.join(
			__dirname,
			"../../cms-shared/src/types/generated.ts",
		)

		fs.writeFileSync(outputPath, output)

		console.log("\n✅ Types generated successfully!")
		console.log(`📄 Output: ${outputPath}`)
		console.log(`\n📊 Generated ${schemas.length} content type(s)`)
	} catch (error) {
		console.error("\n❌ Error generating types:")
		console.error(error)
		process.exit(1)
	}
}

// Run generator
generateTypes()
