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

export const tools = {
	// Schema tools
	listSchemas,
	getSchema,
	createSchema,
	updateSchema,

	// Content tools
	listContent,
	getContent,
	createContent,
	updateContent,
}
