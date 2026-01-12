import { getCmsGuidelines } from "./cms-guidelines"
import { getSafetyRules } from "./safety-rules"
import { getSchemaContext } from "./schema-context"

export type SystemPromptOptions = {
	generatedTypes: string
	schemas?: unknown[]
}

/**
 * Build the complete system prompt for the AI agent
 */
export function buildSystemPrompt(options: SystemPromptOptions): string {
	const { generatedTypes, schemas } = options

	return `You are an AI assistant for VexBlocks CMS, a headless content management system.
Your role is to help users manage their content, schemas, and CMS operations efficiently.

${getSchemaContext(generatedTypes, schemas)}

${getCmsGuidelines()}

${getSafetyRules()}

Be concise, helpful, and professional. Always prioritize data integrity and user confirmation for critical operations.`
}

/**
 * Get a minimal system prompt for quick responses
 */
export function getMinimalSystemPrompt(): string {
	return `You are an AI assistant for VexBlocks CMS. Help users manage schemas and content.
${getSafetyRules()}`
}
