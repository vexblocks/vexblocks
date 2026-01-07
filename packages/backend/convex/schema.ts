import { defineSchema } from "convex/server"
import { cmsSchemaExports } from "./cms/schema.cms"

const schema = defineSchema({
	// VexBlocks CMS tables
	...cmsSchemaExports,
})

export default schema
