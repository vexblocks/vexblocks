/**
 * Generate schema context for the AI agent
 */
export function getSchemaContext(
	generatedTypes: string,
	schemas?: unknown[],
): string {
	let context = `## Database Context

Here are the current CMS types and schemas in the database:

\`\`\`typescript
${generatedTypes}
\`\`\``

	if (schemas && schemas.length > 0) {
		context += `

## Current Schemas Summary

${formatSchemasSummary(schemas)}`
	}

	return context
}

/**
 * Format schemas into a readable summary with field details
 */
function formatSchemasSummary(schemas: unknown[]): string {
	return (schemas as SchemaInfo[])
		.map((schema) => {
			const fieldCount = schema.fields?.length ?? 0
			const fieldDetails =
				schema.fields
					?.map(
						(f: FieldInfo) =>
							`    - \`${f.name}\` (${f.type}${f.required ? ", required" : ""})`,
					)
					.join("\n") ?? "    - none"

			return `- **${schema.displayName}** (\`${schema.name}\`)
  - Type: ${schema.type}
  - ID: \`${schema._id}\`
  - Fields (${fieldCount}):
${fieldDetails}`
		})
		.join("\n\n")
}

type FieldInfo = {
	name: string
	type: string
	label?: string
	required?: boolean
}

type SchemaInfo = {
	_id: string
	name: string
	displayName: string
	type: "global" | "collection"
	description?: string
	fields?: FieldInfo[]
}
