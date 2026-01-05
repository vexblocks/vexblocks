import { defineSchema } from "convex/server"
import { cmsSchemaExports } from "./schema.cms"

const schema = defineSchema({
	// VexBlocks CMS tables
	...cmsSchemaExports,
})

export default schema
