/**
 * VexBlocks CLI Constants
 */

// GitHub repository for fetching templates
export const GITHUB_REPO = "vexblocks/vexblocks"
export const GITHUB_BRANCH = "main"
export const GITHUB_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`

// Manifest file name in user's project
export const MANIFEST_FILE = "vexblocks.json"

// Package paths in the template repository
export const PACKAGE_PATHS = {
	cms: "apps/cms",
	backend: "packages/backend",
	shared: "packages/cms-shared",
	types: "packages/type-generator",
} as const

// Package display names
export const PACKAGE_NAMES = {
	cms: "CMS Dashboard",
	backend: "Convex Backend",
	shared: "Shared Utilities",
	types: "Type Generator",
} as const

// Files that should be marked as managed (not to be edited)
export const MANAGED_PACKAGES = ["cms", "shared", "types"] as const

// Files that should NEVER be overwritten (user configuration)
export const PROTECTED_FILES = [
	"packages/backend/convex/cms/vexblocks.config.ts",
	"packages/backend/.env",
	"packages/backend/.env.local",
	"packages/cms-shared/src/types/generated.ts",
	"packages/backend/emails/change-email-template.ts",
	"packages/backend/emails/otp-email-template.ts",
	"packages/backend/emails/delete-account-template.ts",
	"packages/backend/emails/invite-email-template.ts",
] as const

// Dependencies between packages
export const PACKAGE_DEPENDENCIES: Record<string, string[]> = {
	cms: ["backend", "shared"],
	backend: [],
	shared: [],
	types: ["backend"],
}

// Required environment variables per package
export const REQUIRED_ENV_VARS: Record<string, string[]> = {
	cms: ["CONVEX_DEPLOYMENT", "NEXT_PUBLIC_CONVEX_URL", "SITE_URL"],
	backend: ["CONVEX_DEPLOYMENT", "NEXT_PUBLIC_CONVEX_URL", "SITE_URL"],
	shared: [],
	types: ["CONVEX_URL"],
}

// Optional environment variables (for features like media)
export const OPTIONAL_ENV_VARS: Record<
	string,
	{ name: string; description: string }[]
> = {
	backend: [
		{
			name: "CLOUDFLARE_ACCOUNT_ID",
			description: "Required for media library (Cloudflare Images)",
		},
		{
			name: "CLOUDFLARE_SECRET_TOKEN",
			description: "Required for media library (Cloudflare Images)",
		},
		{
			name: "REVALIDATE_SECRET",
			description: "Required for ISR revalidation webhooks",
		},
		{
			name: "FRONTEND_URL",
			description: "Your frontend URL for revalidation",
		},
	],
}

// File header for managed files
export const MANAGED_FILE_HEADER = `/**
 * @vexblocks-managed
 * This file is managed by VexBlocks CLI.
 * DO NOT EDIT - Changes will be overwritten on upgrade.
 * Version: {{VERSION}}
 */

`

// Turborepo configuration
export const TURBO_CONFIG = {
	tasks: {
		dev: {
			cache: false,
			persistent: true,
		},
		build: {
			dependsOn: ["^build"],
			outputs: [".next/**", "dist/**"],
		},
		lint: {
			outputs: [],
		},
	},
}
