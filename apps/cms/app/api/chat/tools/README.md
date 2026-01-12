# AI Agent Tools

This directory contains all the tools available to the AI agent for managing the VexBlocks CMS.

## Structure

```
tools/
├── index.ts           # Exports all tools
├── schema-tools.ts    # Schema management tools
├── content-tools.ts   # Content management tools
└── README.md          # This file
```

## Adding New Tools

To add a new tool:

1. **Create or update a tool file** (e.g., `media-tools.ts`)
2. **Define the tool using AI SDK v6 syntax**:

```typescript
import { tool } from "ai"
import { z } from "zod"
import { fetchQuery, fetchMutation } from "convex/nextjs"
import { api } from "@repo/backend/convex/_generated/api"

export const myNewTool = tool({
  description: "Description of what this tool does",
  inputSchema: z.object({
    param: z.string().describe("Parameter description"),
  }),
  execute: async ({ param }) => {
    try {
      const result = await fetchQuery(api.cms.myFunction, { param })
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  },
})
```

3. **Export the tool in `index.ts`**:

```typescript
import { myNewTool } from "./my-tools"

export const tools = {
  // ... existing tools
  myNewTool,
}
```

## Tool Guidelines

### Input Schema
- Use `inputSchema` (not `parameters`) for AI SDK v6
- Use Zod for schema validation
- Add `.describe()` to all fields for better LLM understanding
- Use `z.record(z.string(), z.any())` for object types

### Execute Function
- Always return `{ success: boolean, data?, error?, message? }`
- Wrap in try-catch blocks
- Use proper TypeScript types from Convex
- Cast IDs appropriately: `schemaId as Id<"cmsSchemas">`

### Safety
- No delete operations should be exposed
- Sensitive operations should require confirmation
- Validate inputs before executing mutations
- Return clear error messages

### Best Practices
- Keep tools focused on a single responsibility
- Use descriptive names (verb + noun pattern)
- Document what the tool does in the description
- Group related tools in the same file
- Export all tools through `index.ts`

## Available Tools

### Schema Tools (`schema-tools.ts`)
- `listSchemas` - List all CMS schemas
- `getSchema` - Get schema details by ID
- `createSchema` - Create a new schema
- `updateSchema` - Update existing schema (requires confirmation)

### Content Tools (`content-tools.ts`)
- `listContent` - List content entries for a schema
- `getContent` - Get content entry by ID
- `createContent` - Create new content entry
- `updateContent` - Update existing content entry

## Testing Tools

To test a tool:

1. Start the dev server: `pnpm dev`
2. Open the CMS chat interface
3. Ask the AI to use the tool
4. Check the browser console for errors
5. Verify the Convex dashboard for API calls

## Common Issues

### TypeScript Errors
- Ensure all imports are correct
- Check that Convex types are properly imported
- Verify Zod schema syntax (use two arguments for `z.record()`)

### Tool Not Working
- Check that the tool is exported in `index.ts`
- Verify the Convex function exists and is accessible
- Check authentication is working
- Review error messages in the response

### LLM Not Using Tool
- Improve the tool description
- Add more context to parameter descriptions
- Check that the tool name is clear and descriptive
- Verify the system prompt mentions the tool capability
