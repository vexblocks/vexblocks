import {
	createContent,
	getContent,
	listContent,
	updateContent,
} from "./content-tools"
import {
	createSchema,
	getSchema,
	listSchemas,
	updateSchema,
} from "./schema-tools"
import {
	getSchemaStats,
	previewChanges,
	searchContent,
	validateContent,
} from "./utility-tools"

export const tools = {
	// Schema tools
	listSchemas,
	getSchema,
	createSchema,
	updateSchema,
	getSchemaStats,

	// Content tools
	listContent,
	getContent,
	createContent,
	updateContent,

	// Utility tools
	validateContent,
	searchContent,
	previewChanges,
}
