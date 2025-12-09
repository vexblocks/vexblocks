# VexBlocks CLI

A command-line tool for adding **VexBlocks Headless CMS** to your Turborepo project.

Similar to Shadcn, VexBlocks CLI copies source files into your project, giving you full ownership while allowing managed updates.

## Installation

```bash
# Using npx (recommended)
npx @vexblocks/cli init

# Or install globally
npm install -g @vexblocks/cli
```

## Quick Start

```bash
# 1. Initialize a new project
npx @vexblocks/cli init

# 2. Add all CMS packages
npx @vexblocks/cli add all

# 3. Install dependencies
pnpm install

# 4. Set up Convex
cd packages/backend && npx convex dev

# 5. Start development
pnpm dev
```

## Commands

### `@vexblocks/cli init`

Initialize a new VexBlocks project or add VexBlocks to an existing Turborepo.

```bash
npx @vexblocks/cli init
npx @vexblocks/cli init --cwd ./my-project
```

### `@vexblocks/cli add`

Add VexBlocks packages to your project.

```bash
# Add all packages
npx @vexblocks/cli add all

# Add specific packages
npx @vexblocks/cli add cms
npx @vexblocks/cli add backend shared

# Skip confirmation prompts
npx @vexblocks/cli add all --yes

# Overwrite existing files
npx @vexblocks/cli add cms --overwrite
```

**Available packages:**

| Package   | Description                                    | Path                      |
| --------- | ---------------------------------------------- | ------------------------- |
| `cms`     | CMS Dashboard (Next.js admin interface)        | `apps/cms`                |
| `backend` | Convex backend with CMS functions              | `packages/backend`        |
| `shared`  | Shared utilities and preview SDK               | `packages/cms-shared`     |
| `types`   | TypeScript type generator                      | `packages/type-generator` |
| `all`     | All packages                                   | -                         |

### `@vexblocks/cli upgrade`

Upgrade VexBlocks packages to the latest version.

```bash
# Check for updates
npx @vexblocks/cli upgrade --check

# Upgrade all packages
npx @vexblocks/cli upgrade

# Upgrade specific package
npx @vexblocks/cli upgrade cms

# Force upgrade (skip conflict detection)
npx @vexblocks/cli upgrade --force
```

### `@vexblocks/cli diff`

Show differences between local files and the latest version.

```bash
npx @vexblocks/cli diff cms
npx @vexblocks/cli diff backend
```

## Project Structure

After running `npx @vexblocks/cli add all`, your project will have:

```
your-project/
├── apps/
│   └── cms/                  # CMS Dashboard (managed)
│       ├── app/
│       ├── components/
│       └── lib/
├── packages/
│   ├── backend/              # Convex Backend
│   │   ├── convex/
│   │   │   ├── cms/          # CMS functions (managed)
│   │   │   └── schema.cms.ts # CMS schema tables
│   │   └── better-auth/
│   ├── cms-shared/           # Shared utilities (managed)
│   └── type-generator/       # Type generator (managed)
├── turbo.json
├── vexblocks.json            # VexBlocks manifest
└── package.json
```

## Managed Packages

The following packages are **managed** by VexBlocks and shouldn't be edited:

- `apps/cms` - CMS Dashboard
- `packages/cms-shared` - Shared utilities
- `packages/type-generator` - Type generator

These packages will be overwritten on upgrade. If you need to customize them:

1. Use the extension points provided (components, hooks)
2. Fork the package and manage it yourself

## Environment Variables

### Required

```bash
# Convex
CONVEX_DEPLOYMENT=your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Better Auth
SITE_URL=http://localhost:3001
```

### Optional (for media library)

```bash
# Cloudflare Images
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_SECRET_TOKEN=your-api-token

# ISR Revalidation
REVALIDATE_SECRET=your-secret
FRONTEND_URL=http://localhost:3000
```

## Existing Convex Projects

If you already have a Convex project with a `schema.ts`:

1. Run `npx @vexblocks/cli add backend`
2. The CLI will:
   - Create a backup of your schema
   - Add `schema.cms.ts` with CMS tables
   - Add instructions for merging

3. Update your `schema.ts`:

```typescript
import { defineSchema } from "convex/server"
import { cmsSchemaExports } from "./schema.cms"

export default defineSchema({
  // Your existing tables
  products,
  orders,
  
  // VexBlocks CMS tables
  ...cmsSchemaExports,
})
```

## Documentation

- [VexBlocks Documentation](https://vexblocks.com/docs)
- [CMS Usage Guide](./CMS_USAGE_GUIDE.md)
- [API Reference](https://vexblocks.com/docs/api)

## License

MIT
