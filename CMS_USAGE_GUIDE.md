# VexBlocks Headless CMS - Usage Guide

## 📚 Content Types

### 1. **Global** (Singleton Content)
- **Purpose:** Unique, site-wide content that appears across all pages
- **Examples:** Header, Footer, Site Settings, Contact Information
- **Content Limit:** Only **1 published instance** allowed (multiple drafts OK)
- **Slug:** Not required
- **SEO:** Not applicable

**Use cases:**
```typescript
// Fetch header content
const header = await convex.query(api.cms.content.getGlobal, { 
  schemaName: "header" 
})

// Fetch footer content
const footer = await convex.query(api.cms.content.getGlobal, { 
  schemaName: "footer" 
})
```

---

### 2. **Page** (Unique Content per Slug)
- **Purpose:** Static pages with unique content
- **Examples:** About, Contact, Terms of Service, Privacy Policy
- **Content Limit:** **1 instance per unique slug**
- **Slug:** Required and must be unique
- **SEO:** Metadata supported

**Use cases:**
```typescript
// Fetch about page content
const aboutPage = await convex.query(api.cms.content.getPage, { 
  schemaName: "landing_page",
  slug: "about" 
})

// Fetch contact page content
const contactPage = await convex.query(api.cms.content.getPage, { 
  schemaName: "landing_page",
  slug: "contact" 
})
```

---

### 3. **Collection** (Multiple Instances)
- **Purpose:** Repeatable content with multiple entries
- **Examples:** Blog Posts, Products, Case Studies, Team Members
- **Content Limit:** **Unlimited instances**
- **Slug:** Required and must be unique per instance
- **SEO:** Metadata supported

**Use cases:**
```typescript
// Fetch all blog posts (with optional limit)
const blogPosts = await convex.query(api.cms.content.listCollection, { 
  schemaName: "blog_posts",
  limit: 10 // optional
})

// Fetch a specific blog post
const post = await convex.query(api.cms.content.getCollectionItem, { 
  schemaName: "blog_posts",
  slug: "my-first-post" 
})
```

---

## 🔌 API Reference

### Public Queries (for use in web apps)

#### `getGlobal`
Get a single global content by schema name.

```typescript
import { api } from "@repo/backend/convex/_generated/api"

const header = await convex.query(api.cms.content.getGlobal, { 
  schemaName: "header" 
})

// Returns: content object or null
```

**When to use:** Fetching headers, footers, site-wide settings

---

#### `getPage`
Get a page content by schema name and slug.

```typescript
const aboutPage = await convex.query(api.cms.content.getPage, { 
  schemaName: "landing_page",
  slug: "about" 
})

// Returns: content object or null
```

**When to use:** Fetching static pages like About, Contact, etc.

---

#### `getCollectionItem`
Get a single item from a collection by schema name and slug.

```typescript
const post = await convex.query(api.cms.content.getCollectionItem, { 
  schemaName: "blog_posts",
  slug: "my-first-post" 
})

// Returns: content object or null
```

**When to use:** Fetching individual blog posts, products, case studies

---

#### `listCollection`
List all published items in a collection.

```typescript
const posts = await convex.query(api.cms.content.listCollection, { 
  schemaName: "blog_posts",
  limit: 10 // optional
})

// Returns: array of content objects
```

**When to use:** Listing blog posts, products, team members

---

## 🧩 Content Structure

All content objects have the following structure:

```typescript
type Content = {
  _id: Id<"cmsContent">
  _creationTime: number
  schemaId: Id<"cmsSchemas">
  slug?: string // Only for pages and collections
  status: "draft" | "published"
  data: Record<string, any> // Your custom fields
  seo?: {
    title?: string
    description?: string
    ogImage?: string
  }
  createdBy: Id<"users">
  updatedBy: Id<"users">
  publishedAt?: number
  updatedAt: number
}
```

---

## 🎯 Best Practices

### Schema Naming
- Use snake_case: `blog_posts`, `landing_page`, `site_settings`
- Be descriptive: `header` not `h`, `footer` not `f`
- Plural for collections: `blog_posts`, `products`, `team_members`
- Singular for globals and pages: `header`, `footer`, `landing_page`

### Content Organization

| Type | Schema Name Example | Use Case |
|------|---------------------|----------|
| **Global** | `header`, `footer`, `site_settings` | Site-wide content |
| **Page** | `landing_page`, `legal_page` | Static pages with different content per slug |
| **Collection** | `blog_posts`, `products`, `team_members` | Multiple entries |

### Slug Format
- Use kebab-case: `my-first-post`, `about-us`, `contact-form`
- Keep it short and descriptive
- Avoid special characters
- Don't include leading slashes (stored as `about`, not `/about`)

---

## 📦 Example: Building a Blog

### Step 1: Create Schema (in CMS Admin)
- **Name:** `blog_posts`
- **Type:** Collection
- **Fields:**
  - `title` (Short Text, required)
  - `excerpt` (Long Text)
  - `content` (Rich Text, required)
  - `author` (Short Text)
  - `published_date` (Date)
  - `featured_image` (Media)

### Step 2: Create Content (in CMS Admin)
- Multiple blog posts with unique slugs:
  - `my-first-post`
  - `getting-started-with-nextjs`
  - `vexblocks-cms-guide`

### Step 3: Fetch in Web App

**Blog List Page (`/blog`):**
```typescript
import { useQuery } from "convex/react"
import { api } from "@repo/backend/convex/_generated/api"

export default function BlogPage() {
  const posts = useQuery(api.cms.content.listCollection, {
    schemaName: "blog_posts",
    limit: 20
  })

  return (
    <div>
      {posts?.map((post) => (
        <article key={post._id}>
          <h2>{post.data.title}</h2>
          <p>{post.data.excerpt}</p>
          <Link href={`/blog/${post.slug}`}>Read more</Link>
        </article>
      ))}
    </div>
  )
}
```

**Blog Post Page (`/blog/[slug]`):**
```typescript
import { useQuery } from "convex/react"
import { api } from "@repo/backend/convex/_generated/api"

export default function BlogPostPage({ params }) {
  const post = useQuery(api.cms.content.getCollectionItem, {
    schemaName: "blog_posts",
    slug: params.slug
  })

  if (!post) return <div>Post not found</div>

  return (
    <article>
      <h1>{post.data.title}</h1>
      <time>{new Date(post.data.published_date).toLocaleDateString()}</time>
      <div dangerouslySetInnerHTML={{ __html: post.data.content }} />
    </article>
  )
}
```

---

## 🔄 On-Demand Revalidation

When content is published or updated in the CMS, Next.js pages are automatically revalidated using **Incremental Static Regeneration (ISR)**.

### How it works:
1. Admin publishes/updates content in CMS
2. Convex triggers `triggerRevalidationAction`
3. Webhook calls Next.js API at `/api/revalidate`
4. Next.js revalidates affected paths:
   - **Global:** Revalidates `/` and `/*` (all pages)
   - **Page:** Revalidates `/{slug}`
   - **Collection:** Revalidates `/blog` and `/blog/{slug}`

### Configuration:
Set these environment variables in your Next.js app:

```bash
# .env.local
CONVEX_SITE_URL=http://localhost:3000
REVALIDATE_SECRET=your-secret-here
```

---

## ⚠️ Validation Rules

### Global Content
- ✅ Multiple drafts allowed
- ❌ Only 1 published instance per schema
- ❌ Cannot publish if another published instance exists

### Page Content
- ✅ Multiple pages with unique slugs
- ❌ Slug must be unique per schema
- ❌ Slug is required

### Collection Content
- ✅ Unlimited instances
- ❌ Slug must be unique per schema
- ❌ Slug is required

---

## 🚀 Quick Reference

```typescript
// Global (singleton)
const header = await convex.query(api.cms.content.getGlobal, { 
  schemaName: "header" 
})

// Page (unique per slug)
const aboutPage = await convex.query(api.cms.content.getPage, { 
  schemaName: "landing_page",
  slug: "about" 
})

// Collection item (one of many)
const post = await convex.query(api.cms.content.getCollectionItem, { 
  schemaName: "blog_posts",
  slug: "my-first-post" 
})

// Collection list (all items)
const posts = await convex.query(api.cms.content.listCollection, { 
  schemaName: "blog_posts",
  limit: 10 
})
```

---

## 📝 Summary Table

| Feature | Global | Page | Collection |
|---------|--------|------|------------|
| **Published Limit** | 1 | 1 per slug | Unlimited |
| **Slug Required** | No | Yes | Yes |
| **Slug Unique** | N/A | Yes (per schema) | Yes (per schema) |
| **SEO Metadata** | No | Yes | Yes |
| **Use Case** | Headers, Footers | About, Contact | Blog, Products |
| **Query Method** | `getGlobal` | `getPage` | `getCollectionItem`, `listCollection` |

---

**Need help?** Check the examples in `/apps/web` or review the schema definitions in `/packages/backend/convex/schema.ts`.

