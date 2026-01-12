# AI Agent Documentation - VexBlocks CMS

## Overview

The AI agent is powered by **Gemini 2.5 Flash** using **Vercel AI SDK v6** with integrated tools that interact with Convex APIs. The agent helps users manage CMS schemas and content through natural language conversations.

## Features

### 🔒 Safety Restrictions

The agent has built-in safety measures to protect your data:

- **NO DELETE operations** - Cannot delete schemas or content
- **NO FIELD REMOVAL** - Cannot remove fields from schemas (only add or modify)
- **Double confirmation for schema updates** - Requires user to confirm TWICE before updating schemas
- **Read-only by default** - Prioritizes viewing data before making changes

### 🛠️ Available Tools

#### Schema Management

1. **listSchemas**
   - Lists all CMS schemas in the database
   - No parameters required
   - Use this to see what schemas exist

2. **getSchema**
   - Get details of a specific schema by ID
   - Parameters: `schemaId`
   - Shows structure and fields of a schema

3. **createSchema**
   - Create a new CMS schema
   - Parameters:
     - `name` (string, snake_case): e.g., "blog_posts"
     - `displayName` (string): e.g., "Blog Posts"
     - `type` (enum): "global" | "page" | "collection"
     - `description` (optional string)
     - `fields` (array): Field definitions
     - `icon` (optional string)

4. **updateSchema** ⚠️ REQUIRES DOUBLE CONFIRMATION
   - Update an existing schema
   - Parameters:
     - `schemaId` (string)
     - `displayName` (optional string)
     - `description` (optional string)
     - `fields` (optional array)
     - `icon` (optional string)
     - `userConfirmed` (boolean): Must be true after double confirmation

#### Content Management

5. **listContent**
   - List all content entries for a schema
   - Parameters:
     - `schemaId` (string)
     - `status` (optional enum): "draft" | "published"

6. **getContent**
   - Get a specific content entry by ID
   - Parameters: `contentId`

7. **createContent**
   - Create a new content entry
   - Parameters:
     - `schemaId` (string)
     - `slug` (optional string): Required for pages/collections
     - `status` (enum): "draft" | "published"
     - `data` (object): Content data matching schema fields

8. **updateContent**
   - Update an existing content entry
   - Parameters:
     - `contentId` (string)
     - `slug` (optional string)
     - `status` (optional enum): "draft" | "published"
     - `data` (optional object)

## Context Awareness

The agent has access to:

- **Generated TypeScript types** from `@packages/cms-shared/src/types/generated.ts`
- **Current database schemas** via Convex queries
- **Schema field structures** to validate content data

This allows the agent to:
- Understand your current CMS structure
- Validate field types before creating/updating content
- Suggest appropriate field configurations
- Provide context-aware assistance

## Usage Examples

### Creating a New Schema

```
User: "Create a new schema for products with name, price, and description fields"

Agent will:
1. Use listSchemas to check existing schemas
2. Use createSchema with appropriate field definitions
3. Confirm creation with schema ID
```

### Adding Content

```
User: "Add a new blog post titled 'Hello World'"

Agent will:
1. Use listSchemas to find the blog_posts schema
2. Use createContent with the appropriate data structure
3. Confirm creation with content ID
```

### Updating a Schema (with double confirmation)

```
User: "Add an 'author' field to the blog_posts schema"

Agent will:
1. Ask for first confirmation
2. Ask for second confirmation
3. Only then use updateSchema with userConfirmed: true
```

## Technical Implementation

### File Structure

- **Route**: `/apps/cms/app/api/chat/route.ts` - Main API endpoint
- **Tools Directory**: `/apps/cms/app/api/chat/tools/`
  - `schema-tools.ts` - Schema management tools (list, get, create, update)
  - `content-tools.ts` - Content management tools (list, get, create, update)
  - `index.ts` - Exports all tools
- **Frontend**: `/apps/cms/components/molecules/ai-chat.tsx`
- **Convex APIs**: `/packages/backend/convex/cms/`

### Technology Stack

- **AI Model**: Google Gemini 2.5 Flash
- **AI SDK**: Vercel AI SDK v6 (`ai` package)
- **Schema Validation**: Zod
- **Backend**: Convex (serverless database)
- **Authentication**: Better Auth

### Tool Definition Pattern

```typescript
tool({
  description: "Tool description for the LLM",
  inputSchema: z.object({
    param: z.string().describe("Parameter description"),
  }),
  execute: async ({ param }) => {
    // Tool implementation
    return { success: true, data: result }
  },
})
```

## Best Practices

1. **Always check existing data first**
   - Use list/get tools before creating/updating

2. **Validate field types**
   - Ensure content data matches schema field types

3. **Use descriptive names**
   - Schema names in snake_case
   - Display names in Title Case

4. **Handle errors gracefully**
   - All tools return `{ success, data?, error? }` format

5. **Confirm critical operations**
   - Schema updates require double confirmation
   - Agent will ask before proceeding

## Security

- **Authentication required**: All API calls check `isAuthenticated()`
- **Role-based access**: Uses Convex authentication system
- **No destructive operations**: Delete operations are not exposed to the agent
- **Input validation**: Zod schemas validate all tool inputs
- **Type safety**: TypeScript ensures type correctness

## Limitations

- Cannot delete schemas or content (by design)
- Cannot remove fields from schemas (by design)
- Schema updates require explicit double confirmation
- Maximum 30 seconds per request (API timeout)
- Requires active Convex connection

## Future Enhancements

Potential improvements:
- [ ] Add media/file upload capabilities
- [ ] Support for bulk operations
- [ ] Schema migration suggestions
- [ ] Content validation against schema
- [ ] Draft/publish workflow automation
- [ ] Analytics and insights tools

## Troubleshooting

### Agent not responding
- Check Convex connection
- Verify GOOGLE_GEMINI_API_KEY is set
- Check browser console for errors

### Tool execution fails
- Verify user authentication
- Check Convex API permissions
- Review error messages in response

### Schema updates not working
- Ensure double confirmation was provided
- Check that userConfirmed parameter is true
- Verify schema ID is correct

## Support

For issues or questions:
1. Check the Convex dashboard for API errors
2. Review browser console logs
3. Check the generated types are up to date
4. Verify authentication status
