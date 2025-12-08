# Changelog

All notable changes to VexBlocks will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- VexBlocks CLI for easy project setup
- `vexblocks init` - Initialize new projects
- `vexblocks add` - Add packages to existing projects
- `vexblocks upgrade` - Update to latest version
- `vexblocks diff` - Show differences between versions

## [1.0.0] - 2024-12-08

### Added

#### CMS Dashboard (`apps/cms`)
- Schema builder with 15+ field types
- Content management with drafts and publishing
- Media library with Cloudflare Images integration
- Live preview support with PostMessage communication
- Multi-language (i18n) support for translatable fields
- Flexible blocks for dynamic page building
- Reusable block components
- User management with role-based access
- Appearance settings (light/dark mode)

#### Backend (`packages/backend`)
- Convex backend with all CMS functions
- Better Auth integration with email OTP
- Schema tables: cmsSchemas, cmsContent, cmsMedia, cmsMediaTags, cmsBlocks, cmsSettings
- Public queries for frontend consumption (getGlobal, getPage, getCollectionItem, listCollection)
- ISR revalidation webhooks
- Cloudflare Images upload/delete actions

#### Shared Utilities (`packages/cms-shared`)
- `CFImage` component for Cloudflare Images
- `LexicalRenderer` for rich text rendering
- Preview SDK with PostMessage communication
- `PreviewProvider` and `usePreview` hooks
- Type-safe content types
- Utility functions for localized content

#### Type Generator (`packages/type-generator`)
- Automatic TypeScript type generation from CMS schemas
- CLI command: `pnpm generate-types`
- Support for all field types including nested structures
- Reference type resolution

### Field Types Supported
- `shortText` - Single line text with optional slug generation
- `longText` - Multi-line text
- `richText` - WYSIWYG editor with Lexical
- `media` - Image/file upload via Cloudflare Images
- `url` - URL validation
- `youtubeUrl` - YouTube URL with embed support
- `boolean` - Toggle/checkbox
- `number` - Numeric input
- `date` - Date picker
- `select` - Dropdown with options
- `reference` - Link to other content
- `multiReference` - Multiple content references
- `group` - Nested field groups
- `repeater` - Repeatable field arrays
- `flexibleBlocks` - Dynamic block composition
- `blockReference` - Reusable block components

### Content Types
- **Global** - Singleton content (headers, footers)
- **Page** - Single pages with unique slugs
- **Collection** - Repeatable content (blog posts, products)

---

## Upgrade Guide

### From Pre-1.0 to 1.0.0

This is the initial release. For new installations, use:

```bash
npx vexblocks init
npx vexblocks add all
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
