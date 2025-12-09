import path from "node:path"
import { confirm, input, select } from "@inquirer/prompts"
import fs from "fs-extra"
import ora from "ora"
import pc from "picocolors"
import { MANIFEST_FILE } from "../utils/constants.js"
import { getPackageManager, isTurborepoProject } from "../utils/fs.js"
import { getLatestVersion } from "../utils/github.js"
import { logger } from "../utils/logger.js"
import { createManifest, writeManifest } from "../utils/manifest.js"

interface InitOptions {
	yes?: boolean
	cwd?: string
}

export async function initCommand(options: InitOptions): Promise<void> {
	const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd()

	logger.title("🚀 VexBlocks CMS Setup")

	// Check if already initialized
	const manifestPath = path.join(cwd, MANIFEST_FILE)
	if (await fs.pathExists(manifestPath)) {
		logger.warn("VexBlocks is already initialized in this directory.")

		const continueAnyway =
			options.yes ||
			(await confirm({
				message: "Do you want to reinitialize?",
				default: false,
			}))

		if (!continueAnyway) {
			logger.info("Run `vexblocks add <package>` to add packages.")
			return
		}
	}

	// Check if this is a Turborepo project
	const isTurbo = await isTurborepoProject(cwd)

	let projectType: "new" | "existing"

	if (isTurbo) {
		logger.success("Detected existing Turborepo project")
		projectType = "existing"
	} else {
		projectType = await select({
			message: "What would you like to do?",
			choices: [
				{
					name: "Create a new Turborepo project with VexBlocks",
					value: "new" as const,
				},
				{
					name: "Add VexBlocks to this directory (I'll set up Turborepo manually)",
					value: "existing" as const,
				},
			],
		})
	}

	if (projectType === "new") {
		await createNewProject(cwd, options)
	} else {
		await initializeExisting(cwd, options)
	}
}

async function createNewProject(
	cwd: string,
	options: InitOptions,
): Promise<void> {
	const projectName = await input({
		message: "Project name:",
		default: path.basename(cwd),
		validate: (value) => {
			if (!value) return "Project name is required"
			if (!/^[a-z0-9-_]+$/.test(value)) {
				return "Project name can only contain lowercase letters, numbers, hyphens, and underscores"
			}
			return true
		},
	})

	const projectDir = path.join(cwd, projectName)

	// Check if directory exists
	if (await fs.pathExists(projectDir)) {
		const overwrite = await confirm({
			message: `Directory ${projectName} already exists. Overwrite?`,
			default: false,
		})

		if (!overwrite) {
			logger.info("Aborted.")
			return
		}

		await fs.remove(projectDir)
	}

	const spinner = ora("Creating project structure...").start()

	try {
		// Create directory structure
		await fs.ensureDir(projectDir)
		await fs.ensureDir(path.join(projectDir, "apps"))
		await fs.ensureDir(path.join(projectDir, "packages"))

		// Create root package.json
		const packageJson = {
			name: projectName,
			version: "0.1.0",
			private: true,
			packageManager: "pnpm@9.15.0",
			workspaces: ["apps/*", "packages/*"],
			scripts: {
				dev: "turbo run dev",
				build: "turbo run build",
				lint: "turbo run lint",
				"generate-types": "pnpm --filter @repo/type-generator generate",
			},
			devDependencies: {
				turbo: "^2.6.1",
			},
		}

		await fs.writeJson(path.join(projectDir, "package.json"), packageJson, {
			spaces: 2,
		})

		// Create turbo.json
		const turboJson = {
			$schema: "https://turbo.build/schema.json",
			globalDependencies: ["**/.env.*local"],
			globalEnv: [
				"CONVEX_DEPLOYMENT",
				"NEXT_PUBLIC_CONVEX_URL",
				"NEXT_PUBLIC_CONVEX_SITE_URL",
				"SITE_URL",
				"CLOUDFLARE_ACCOUNT_ID",
				"CLOUDFLARE_SECRET_TOKEN",
			],
			ui: "tui",
			tasks: {
				dev: {
					cache: false,
					persistent: true,
				},
				build: {
					dependsOn: ["^build"],
					inputs: ["$TURBO_DEFAULT$", ".env*"],
					outputs: [".next/**", "dist/**"],
				},
				lint: {
					outputs: [],
				},
			},
		}

		await fs.writeJson(path.join(projectDir, "turbo.json"), turboJson, {
			spaces: 2,
		})

		// Create pnpm-workspace.yaml
		const pnpmWorkspace = `packages:
  - "apps/*"
  - "packages/*"
`
		await fs.writeFile(
			path.join(projectDir, "pnpm-workspace.yaml"),
			pnpmWorkspace,
		)

		// Create .gitignore
		const gitignore = `# Dependencies
node_modules
.pnpm-store

# Build outputs
dist
.next
.turbo

# Environment files
.env
.env.local
.env.*.local

# IDE
.idea
.vscode
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# Convex
.convex
`
		await fs.writeFile(path.join(projectDir, ".gitignore"), gitignore)

		// Create .env.example
		const envExample = `# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Better Auth
SITE_URL=http://localhost:3001

# Cloudflare Images (optional, for media library)
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_SECRET_TOKEN=

# Revalidation (optional, for ISR)
REVALIDATE_SECRET=
FRONTEND_URL=http://localhost:3000
`
		await fs.writeFile(path.join(projectDir, ".env.example"), envExample)

		// Create vexblocks.json manifest
		const version = await getLatestVersion()
		const manifest = createManifest(version)
		await writeManifest(projectDir, manifest)

		spinner.succeed("Project structure created")

		// Show next steps
		logger.break()
		logger.box("✅ Project created successfully!", [
			`Directory: ${pc.cyan(projectDir)}`,
			"",
			pc.bold("Next steps:"),
			`1. ${pc.cyan(`cd ${projectName}`)}`,
			`2. ${pc.cyan("pnpm install")}`,
			`3. ${pc.cyan("npx vexblocks add all")}`,
			"4. Set up your Convex project",
			`5. ${pc.cyan("pnpm dev")}`,
		])

		// Ask if user wants to add packages now
		const addPackages =
			options.yes ||
			(await confirm({
				message: "Would you like to add VexBlocks packages now?",
				default: true,
			}))

		if (addPackages) {
			logger.break()
			logger.info(`Run: ${pc.cyan("npx vexblocks add all")}`)
			logger.info("After navigating to your project directory.")
		}
	} catch (error) {
		spinner.fail("Failed to create project")
		throw error
	}
}

async function initializeExisting(
	cwd: string,
	_options: InitOptions,
): Promise<void> {
	const spinner = ora("Initializing VexBlocks...").start()

	try {
		// Check for Turborepo
		const hasTurbo = await isTurborepoProject(cwd)

		if (!hasTurbo) {
			spinner.warn("No turbo.json found")
			logger.warn(
				"VexBlocks requires Turborepo. Please set up Turborepo first.",
			)
			logger.info(`Run: ${pc.cyan("npx create-turbo@latest")}`)
			return
		}

		// Get version
		const version = await getLatestVersion()

		// Create manifest
		const manifest = createManifest(version)
		await writeManifest(cwd, manifest)

		spinner.succeed("VexBlocks initialized")

		// Detect package manager
		const packageManager = await getPackageManager(cwd)

		// Show next steps
		logger.break()
		logger.box("✅ VexBlocks initialized!", [
			`Manifest: ${pc.cyan(MANIFEST_FILE)}`,
			`Version: ${pc.cyan(version)}`,
			"",
			pc.bold("Next steps:"),
			`1. ${pc.cyan("npx vexblocks add all")} - Add all CMS packages`,
			"2. Configure your environment variables",
			`3. ${pc.cyan(`${packageManager} install`)}`,
			`4. ${pc.cyan(`${packageManager === "npm" ? "npm run" : packageManager} dev`)}`,
		])
	} catch (error) {
		spinner.fail("Failed to initialize")
		throw error
	}
}
