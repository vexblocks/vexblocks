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
\`\`\``;

	if (schemas && schemas.length > 0) {
		context += `

## Current Schemas Summary

${formatSchemasSummary(schemas)}`;
	}

	return context;
}

/**
 * Format schemas into a readable summary
 */
function formatSchemasSummary(schemas: unknown[]): string {
	return (schemas as SchemaInfo[])
		.map((schema) => {
			const fieldCount = schema.fields?.length ?? 0;
			const fieldNames =
				schema.fields?.map((f: FieldInfo) => f.name).join(", ") ?? "";

			return `- **${schema.displayName}** (\`${schema.name}\`)
  - Type: ${schema.type}
  - Fields (${fieldCount}): ${fieldNames || "none"}
  - ID: \`${schema._id}\``;
		})
		.join("\n\n");
}

type FieldInfo = {
	name: string;
	type: string;
	label?: string;
	required?: boolean;
};

type SchemaInfo = {
	_id: string;
	name: string;
	displayName: string;
	type: "global" | "page" | "collection";
	description?: string;
	fields?: FieldInfo[];
};
