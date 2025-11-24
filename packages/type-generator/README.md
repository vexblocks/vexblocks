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

- **Automatically**: Runs before `dev` and `build` scripts
- **Manually**: Run `pnpm generate-types` when schemas change

