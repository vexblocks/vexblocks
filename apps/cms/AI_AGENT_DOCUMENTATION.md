# AI Agent Documentation - VexBlocks CMS

## Overview

The AI agent is powered by **Gemini 2.5 Flash** using **Vercel AI SDK v6** with integrated tools that interact with Convex APIs. The agent helps users manage CMS schemas and content through natural language conversations.

## Architecture

### Key Components

- **Modular Prompts** (`/app/api/chat/prompts/`) - System prompts split into reusable modules
- **Context Manager** (`/lib/ai-chat/`) - State management using `@lfades/atom` for React
- **Convex Client** (`/app/api/chat/utils/convex-client.ts`) - Retry logic, caching, and logging
- **Chat Persistence** (`/lib/ai-chat/use-chat-persistence.ts`) - Syncs chat history with Convex

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
     - `type` (enum): "global" | "collection"
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

5. **getSchemaStats** ✨ NEW
   - Get statistics about a schema
   - Parameters: `schemaId`
   - Returns: content count, draft/published breakdown, field summary

#### Content Management

6. **listContent**
   - List all content entries for a schema
   - Parameters:
     - `schemaId` (string)
     - `status` (optional enum): "draft" | "published"

7. **getContent**
   - Get a specific content entry by ID
   - Parameters: `contentId`

8. **createContent**
   - Create a new content entry
   - Parameters:
     - `schemaId` (string)
     - `slug` (optional string): Required for collections
     - `status` (enum): "draft" | "published"
     - `data` (object): Content data matching schema fields

9. **updateContent**
   - Update an existing content entry
   - Parameters:
     - `contentId` (string)
     - `slug` (optional string)
     - `status` (optional enum): "draft" | "published"
     - `data` (optional object)

#### Utility Tools ✨ NEW

10. **validateContent**
    - Validate content data against schema fields before creating/updating
    - Parameters: `schemaId`, `data`
    - Returns: validation errors and warnings

11. **searchContent**
    - Search for content across schemas
    - Parameters: `query`, `schemaId` (optional), `status` (optional), `limit`
    - Returns: matching content entries with preview

12. **previewChanges**
    - Preview what changes will be made before applying
    - Parameters: `contentId`, `newData`, `newSlug`, `newStatus`
    - Returns: diff of changes

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

```
apps/cms/
├── app/api/chat/
│   ├── route.ts                    # Main API endpoint
│   ├── prompts/                    # Modular system prompts
│   │   ├── index.ts                # Exports
│   │   ├── system.ts               # buildSystemPrompt()
│   │   ├── cms-guidelines.ts       # CMS-specific guidelines
│   │   ├── safety-rules.ts         # Safety restrictions
│   │   └── schema-context.ts       # Schema context builder
│   ├── tools/                      # AI agent tools
│   │   ├── index.ts                # Exports all tools
│   │   ├── schema-tools.ts         # Schema CRUD operations
│   │   ├── content-tools.ts        # Content CRUD operations
│   │   └── utility-tools.ts        # Validation, search, preview
│   └── utils/
│       └── convex-client.ts        # Retry logic, caching, logging
├── lib/ai-chat/                    # Client-side state management
│   ├── index.ts                    # Exports
│   ├── context-atoms.ts            # @lfades/atom state atoms
│   └── use-chat-persistence.ts     # Chat history sync with Convex
└── components/molecules/
    └── ai-chat.tsx                 # Chat UI component
```

### Technology Stack

- **AI Model**: Google Gemini 2.5 Flash
- **AI SDK**: Vercel AI SDK v6 (`ai` package)
- **State Management**: `@lfades/atom` for React
- **Schema Validation**: Zod
- **Backend**: Convex (serverless database)
- **Authentication**: Better Auth

### Key Modules

#### Convex Client (`utils/convex-client.ts`)

```typescript
// Retry logic with exponential backoff
await withRetries(() => fetchQuery(...), { maxRetries: 3 })

// Cached schema fetching (1 minute TTL)
const schemas = await getCachedSchemas()

// Structured logging
logger.debug("Message", { data })
logger.error("Error", error)
```

#### Context Atoms (`lib/ai-chat/context-atoms.ts`)

```typescript
import { atom } from "@lfades/atom"

// Available atoms
currentChatIdAtom // Current chat session ID
messagesAtom // Chat messages
isLoadingAtom // Loading state
recentOperationsAtom // Recent tool operations
cachedSchemaIdsAtom // Accessed schema IDs
chatSessionsAtom // All chat sessions
chatErrorAtom // Error state
```

#### Chat Persistence (`lib/ai-chat/use-chat-persistence.ts`)

```typescript
const {
	currentChatId,
	messages,
	sessions,
	createChat,
	addMessage,
	updateTitle,
	deleteChat,
	loadChat,
	startNewChat,
} = useChatPersistence()
```

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
