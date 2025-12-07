# CMS Type Generator

Generates TypeScript types from Convex CMS schemas.

## Setup

1. Make sure you have `CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL` environment variable set:

```bash
# Option 1: Set in your shell
export CONVEX_URL=https://your-deployment.convex.cloud

# Option 2: Create a .env file in the root
echo "CONVEX_URL=https://your-deployment.convex.cloud" > ../../.env
```

2. Run the generator:

```bash
pnpm generate-types
```

## Automatic Type Generation (Development)

In development mode, types are automatically regenerated when schemas are created, updated, or deleted in the admin panel.

### How it works

1. When a schema is created/updated/deleted in the admin panel
2. The admin frontend calls the `/api/generate-types` endpoint
3. The endpoint runs the type generator
4. Types are regenerated in `packages/cms-shared/src/types/generated.ts`

This happens automatically - no configuration needed!

## What it does

- Fetches all CMS schemas from Convex
- Generates TypeScript types for each schema
- Outputs to `packages/cms-shared/src/types/generated.ts`

## Generated Types

For each schema (e.g., `blog_posts`), generates:

```typescript
export type BlogPostsContent = {
  _id: string
  _creationTime: number
  schemaId: string
  slug?: string
  status: "draft" | "published"
  data: {
    // Your schema fields here
  }
}
```

Plus utility types:

```typescript
export type CMSSchemaName = "blog_posts" | "pages" | ...
export type CMSContent = BlogPostsContent | PagesContent | ...
export type CMSContentBySchema<T> = T extends "blog_posts" ? BlogPostsContent : ...
```

## Usage in Apps

```typescript
import type { BlogPostsContent, CMSContentBySchema } from '@repo/cms-shared'

// Use specific type
const post: BlogPostsContent = await fetchPost()

// Use dynamic type
function getContent<T extends CMSSchemaName>(
  schema: T
): CMSContentBySchema<T> {
  // ...
}
```

## When to Run

- **Automatically (Development)**: Types regenerate when schemas change in the admin panel
- **Manually**: Run `pnpm generate-types` when needed
- **Build time**: Runs before `dev` and `build` scripts
