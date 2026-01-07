# VexBlocks CLI Architecture

## Overview

VexBlocks CLI is a command-line tool similar to Shadcn that allows developers to add a headless CMS to their Turborepo projects. Unlike traditional npm packages, VexBlocks uses a **copy-paste approach** where source files are copied into the developer's project, giving them full ownership while still allowing managed updates.

## Core Principles

1. **Copy, not install** - Files are copied into the project, not installed as dependencies
2. **Version-tracked updates** - Each package tracks its version in a manifest file
3. **Non-destructive updates** - CLI warns about conflicts, doesn't overwrite custom changes
4. **Turborepo-first** - Designed specifically for monorepo architecture
5. **Modular packages** - Can add components independently

---

## CLI Commands

### `npx @vexblocks/cli init`

Initializes a new VexBlocks project or adds VexBlocks to an existing Turborepo.

```bash
npx @vexblocks/cli init
```

**Prompts:**
1. Is this a new project or existing Turborepo? (new/existing)
2. Project name (if new)
3. Do you want to use TypeScript? (always yes, just confirmation)
4. Do you want to add the CMS now? (y/n)

**Actions (new project):**
- Creates Turborepo structure
- Sets up `package.json` with workspaces
- Creates `turbo.json`
- Creates `vexblocks.json` manifest
- Installs base dependencies

**Actions (existing project):**
- Validates Turborepo structure
- Creates `vexblocks.json` manifest
- Shows next steps

---

### `npx @vexblocks/cli add <package>`

Adds a VexBlocks package to the project.

```bash
npx @vexblocks/cli add cms           # Adds the CMS dashboard
npx @vexblocks/cli add backend       # Adds Convex backend with CMS functions
npx @vexblocks/cli add shared        # Adds shared utilities
npx @vexblocks/cli add types         # Adds type generator
npx @vexblocks/cli add all           # Adds everything
```

**For `@vexblocks/cli add backend`:**

1. Checks if `packages/backend` exists
2. If exists, asks if user has existing Convex setup:
   - **Yes**: Merges CMS schema tables into existing schema
   - **No**: Creates full backend structure
3. Copies:
   - `convex/cms/` folder (all CMS functions)
   - `convex/cms/schema.cms.ts` (CMS-only schema)
   - `convex/auth.ts` (Better Auth setup)
   - `better-auth/` folder
   - `emails/` folder
   - Config files

**For `@vexblocks/cli add cms`:**

1. Checks dependencies (backend must exist)
2. Copies entire `apps/cms` folder
3. Updates root `package.json` workspaces if needed
4. Shows required environment variables

---

### `npx @vexblocks/cli upgrade`

Upgrades VexBlocks packages to the latest version.

```bash
npx @vexblocks/cli upgrade           # Upgrade all packages
npx @vexblocks/cli upgrade cms       # Upgrade specific package
npx @vexblocks/cli upgrade --check   # Check for updates without upgrading
```

**Process:**
1. Reads `vexblocks.json` manifest
2. Fetches latest versions from registry
3. For each outdated package:
   - Computes file diff
   - Shows what changed
   - Asks for confirmation
   - Creates backup of modified files
   - Applies update
4. Updates manifest version

---

### `npx @vexblocks/cli diff <package>`

Shows differences between local files and the latest template version.

```bash
npx @vexblocks/cli diff cms
npx @vexblocks/cli diff backend
```

---

## Package Structure

### Source Repository (vexblocks/vexblocks)

```
vexblocks/
├── apps/
│   ├── cms/                    # CMS Dashboard (locked package)
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   └── web/                    # Example frontend (not distributed)
│
├── packages/
│   ├── backend/                # Convex Backend
│   │   ├── convex/
│   │   │   ├── cms/            # CMS functions (distributed)
│   │   │   │   ├── blocks.ts
│   │   │   │   ├── content.ts
│   │   │   │   ├── media.ts
│   │   │   │   ├── mediaActions.ts
│   │   │   │   ├── mediaTags.ts
│   │   │   │   ├── schemas.ts
│   │   │   │   └── webhooks.ts
│   │   │   │   └── schema.cms.ts   # CMS-only schema (distributed)
│   │   │   ├── schema.ts       # Full schema (not distributed)
│   │   │   ├── auth.ts
│   │   │   ├── auth.config.ts
│   │   │   └── http.ts
│   │   ├── better-auth/
│   │   │   ├── client.ts
│   │   │   ├── handlers.ts
│   │   │   └── server.ts
│   │   └── emails/
│   │
│   ├── cms-shared/             # Shared utilities (locked package)
│   │   └── src/
│   │       ├── components/
│   │       ├── preview/
│   │       ├── types/
│   │       └── utils.ts
│   │
│   ├── type-generator/         # Type generator (locked package)
│   │   └── src/
│   │       └── generator.ts
│   │
│   └── cli/                    # CLI package (npm published)
│       ├── src/
│       │   ├── index.ts
│       │   ├── commands/
│       │   └── utils/
│       └── package.json
│
├── templates/                  # Template manifest and checksums
│   └── manifest.json
│
├── CHANGELOG.md
└── vexblocks.json              # Root manifest (for internal use)
```

---

## Manifest Files

### `vexblocks.json` (in developer's project)

```json
{
  "$schema": "https://vexblocks.com/schema/vexblocks.json",
  "version": "1.0.0",
  "packages": {
    "cms": {
      "version": "1.2.0",
      "installedAt": "2024-12-08T00:00:00Z",
      "path": "apps/cms"
    },
    "backend": {
      "version": "1.2.0",
      "installedAt": "2024-12-08T00:00:00Z",
      "path": "packages/backend",
      "config": {
        "mergedSchema": true,
        "existingSchemaPath": "packages/backend/convex/schema.ts"
      }
    },
    "shared": {
      "version": "1.2.0",
      "installedAt": "2024-12-08T00:00:00Z",
      "path": "packages/cms-shared"
    },
    "types": {
      "version": "1.2.0",
      "installedAt": "2024-12-08T00:00:00Z",
      "path": "packages/type-generator"
    }
  }
}
```

### `templates/manifest.json` (in source repo)

```json
{
  "version": "1.2.0",
  "packages": {
    "cms": {
      "version": "1.2.0",
      "files": [
        { "path": "app/**/*", "checksum": "abc123" },
        { "path": "components/**/*", "checksum": "def456" }
      ],
      "dependencies": {
        "@convex-dev/better-auth": "0.9.11",
        "convex": "^1.30.0",
        "next": "16.0.7",
        "lexical": "^0.38.2"
      },
      "peerDependencies": ["backend", "shared"]
    },
    "backend": {
      "version": "1.2.0",
      "files": [
        { "path": "convex/cms/**/*", "checksum": "ghi789" },
        { "path": "convex/schema.cms.ts", "checksum": "jkl012" },
        { "path": "better-auth/**/*", "checksum": "mno345" }
      ]
    },
    "shared": {
      "version": "1.2.0",
      "files": [
        { "path": "src/**/*", "checksum": "pqr678" }
      ]
    },
    "types": {
      "version": "1.2.0",
      "files": [
        { "path": "src/**/*", "checksum": "stu901" }
      ]
    }
  },
  "changelog": {
    "1.2.0": [
      "Added multi-language support",
      "Fixed media upload bug",
      "New flexible blocks feature"
    ],
    "1.1.0": [
      "Added preview mode",
      "Performance improvements"
    ]
  }
}
```

---

## Schema Separation Strategy

### Current `schema.ts` (full, not distributed)

Contains:
- `users` table (CMS users)
- `todos` table (example, not CMS)
- CMS tables (cmsSchemas, cmsContent, cmsMedia, etc.)

### New `schema.cms.ts` (distributed)

Contains ONLY CMS tables that get merged:
- `cmsSchemas`
- `cmsContent`
- `cmsMedia`
- `cmsMediaTags`
- `cmsBlocks`
- `cmsSettings`

### Merge Strategy

When developer already has a Convex project:

**Their existing `schema.ts`:**
```typescript
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const products = defineTable({
  name: v.string(),
  price: v.number(),
})

export default defineSchema({
  products,
})
```

**After running `npx @vexblocks/cli add backend`:**

```typescript
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

// User's existing tables
const products = defineTable({
  name: v.string(),
  price: v.number(),
})

// === VEXBLOCKS CMS TABLES (DO NOT EDIT) ===
// These tables are managed by VexBlocks CLI
// Run `npx @vexblocks/cli upgrade` to update
import { 
  cmsSchemas, 
  cmsContent, 
  cmsMedia, 
  cmsMediaTags, 
  cmsBlocks, 
  cmsSettings,
  users as cmsUsers 
} from "./schema.cms"
// === END VEXBLOCKS CMS TABLES ===

export default defineSchema({
  products,
  // VexBlocks CMS
  cmsSchemas,
  cmsContent,
  cmsMedia,
  cmsMediaTags,
  cmsBlocks,
  cmsSettings,
  users: cmsUsers, // CMS requires users table
})
```

---

## Distribution Model

### Option A: GitHub Raw (Recommended - Shadcn approach)

- Templates stored in GitHub repo under `templates/` branch or folder
- CLI fetches directly from GitHub raw URLs
- Versioning via git tags
- Free, simple, transparent

**Pros:**
- Simple setup
- Transparent (users can see source)
- No npm publish step for templates
- Git-based versioning

**Cons:**
- Depends on GitHub availability
- Slightly slower than npm

### Option B: npm Registry

- Publish templates as npm packages
- CLI downloads and extracts from npm

**Pros:**
- Faster downloads (CDN)
- Standard versioning

**Cons:**
- More complex publish workflow
- Less transparent

### Recommended: Hybrid

- **CLI** → Published to npm as `@vexblocks/cli`
- **Templates** → Hosted on GitHub, fetched directly

---

## File Locking Strategy

Since developers shouldn't edit `cms`, `cms-shared`, and `type-generator`:

1. **Visual indicator**: Add a header comment to all files:
   ```typescript
   /**
    * @vexblocks-managed
    * This file is managed by VexBlocks CLI.
    * DO NOT EDIT - Changes will be overwritten on upgrade.
    * Version: 1.2.0
    */
   ```

2. **Checksum validation**: CLI stores checksums of distributed files
   - On upgrade, compare current checksum with stored
   - If different, warn user about local modifications
   - Offer to show diff or backup

3. **Git integration**: Suggest adding to `.gitattributes`:
   ```
   apps/cms/** linguist-vendored
   packages/cms-shared/** linguist-vendored
   packages/type-generator/** linguist-vendored
   ```

---

## Environment Variables

### Required for CMS

```bash
# Convex
CONVEX_DEPLOYMENT=your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Better Auth
SITE_URL=http://localhost:3001

# Media (Cloudflare Images)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_SECRET_TOKEN=your-api-token

# Revalidation (for ISR)
REVALIDATE_SECRET=your-secret
FRONTEND_URL=http://localhost:3000
```

---

## CLI Implementation Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Commander.js for CLI
- **Prompts**: @inquirer/prompts
- **HTTP**: native fetch
- **Diff**: diff package
- **Colors**: picocolors
- **Spinner**: ora
- **File ops**: fs-extra

---

## Next Steps

1. [ ] Create `packages/cli` folder structure
2. [ ] Create `schema.cms.ts` with separated CMS tables
3. [ ] Implement `init` command
4. [ ] Implement `add` command with merge logic
5. [ ] Implement `upgrade` command
6. [ ] Create GitHub workflow for releases
7. [ ] Write CHANGELOG.md template
8. [ ] Create documentation site

---

## Version 1.0 Scope

**MVP Features:**
- `init` - Create new Turborepo project
- `add cms|backend|shared|types|all` - Add packages
- `upgrade` - Update to latest version
- `diff` - Show changes

**Post-MVP:**
- `eject` - Remove VexBlocks management (convert to regular files)
- `doctor` - Diagnose issues
- Plugin system for custom blocks
