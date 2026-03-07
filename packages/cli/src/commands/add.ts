import path from "node:path"
import { checkbox, confirm } from "@inquirer/prompts"
import fs from "fs-extra"
import ora from "ora"
import pc from "picocolors"
import {
	MANIFEST_FILE,
	OPTIONAL_ENV_VARS,
	PACKAGE_DEPENDENCIES,
	PACKAGE_NAMES,
	PACKAGE_PATHS,
	REQUIRED_ENV_VARS,
} from "../utils/constants.js"
import { isTurborepoProject, mergePackageJson } from "../utils/fs.js"
import {
	downloadAndExtractPackage,
	fetchFile,
	getLatestVersion,
} from "../utils/github.js"
import { logger } from "../utils/logger.js"
import {
	createManifest,
	type PackageConfig,
	readManifest,
	writeManifest,
} from "../utils/manifest.js"

type PackageName = keyof typeof PACKAGE_PATHS

interface AddOptions {
	yes?: boolean
	cwd?: string
	overwrite?: boolean
}

const ALL_PACKAGES: PackageName[] = ["backend", "shared", "types", "cms"]

export async function addCommand(
	packages: string[],
	options: AddOptions,
): Promise<void> {
	const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd()

	logger.title("📦 Add VexBlocks Packages")

	// Validate Turborepo project
	const isTurbo = await isTurborepoProject(cwd)
	if (!isTurbo) {
		logger.error("This is not a Turborepo project.")
		logger.info(
			`Run ${pc.cyan("npx @vexblocks/cli init")} first to set up your project.`,
		)
		process.exit(1)
	}

	// Read or create manifest
	let manifest = await readManifest(cwd)
	if (!manifest) {
		const version = await getLatestVersion()
		manifest = createManifest(version)
		await writeManifest(cwd, manifest)
		logger.info(`Created ${MANIFEST_FILE}`)
	}

	// Determine which packages to add
	let packagesToAdd: PackageName[] = []

	if (packages.length === 0 || packages.includes("all")) {
		// Interactive selection or add all
		if (packages.includes("all")) {
			packagesToAdd = ALL_PACKAGES
		} else {
			const selectedPackages = await checkbox({
				message: "Which packages would you like to add?",
				choices: ALL_PACKAGES.map((pkg) => ({
					name: `${PACKAGE_NAMES[pkg]} (${PACKAGE_PATHS[pkg]})`,
					value: pkg,
					checked: true,
				})),
			})
			packagesToAdd = selectedPackages as PackageName[]
		}
	} else {
		// Validate package names
		for (const pkg of packages) {
			if (pkg !== "all" && !ALL_PACKAGES.includes(pkg as PackageName)) {
				logger.error(`Unknown package: ${pkg}`)
				logger.info(`Available packages: ${ALL_PACKAGES.join(", ")}, all`)
				process.exit(1)
			}
		}
		packagesToAdd = packages.filter((p) => p !== "all") as PackageName[]
	}

	if (packagesToAdd.length === 0) {
		logger.info("No packages selected.")
		return
	}

	// Resolve dependencies
	const resolvedPackages = resolveDependencies(packagesToAdd)

	if (resolvedPackages.length !== packagesToAdd.length) {
		const added = resolvedPackages.filter((p) => !packagesToAdd.includes(p))
		logger.info(
			`Adding dependencies: ${added.map((p) => PACKAGE_NAMES[p]).join(", ")}`,
		)
	}

	// Check for existing packages
	const existingPackages: PackageName[] = []
	for (const pkg of resolvedPackages) {
		const targetPath = getPackageTargetPath(cwd, pkg)
		if (await fs.pathExists(targetPath)) {
			existingPackages.push(pkg)
		}
	}

	if (existingPackages.length > 0 && !options.overwrite) {
		logger.warn(`These packages already exist: ${existingPackages.join(", ")}`)
		const overwrite =
			options.yes ||
			(await confirm({
				message: "Overwrite existing packages?",
				default: false,
			}))

		if (!overwrite) {
			// Filter out existing packages
			const newPackages = resolvedPackages.filter(
				(p) => !existingPackages.includes(p),
			)
			if (newPackages.length === 0) {
				logger.info("No new packages to add.")
				return
			}
			resolvedPackages.length = 0
			resolvedPackages.push(...newPackages)
		}
	}

	// Confirm installation
	logger.break()
	logger.log(pc.bold("Packages to install:"))
	for (const pkg of resolvedPackages) {
		const targetPath = getPackageTargetPath(cwd, pkg)
		const relativePath = path.relative(cwd, targetPath)
		logger.log(
			`  ${pc.green("+")} ${PACKAGE_NAMES[pkg]} → ${pc.dim(relativePath)}`,
		)
	}
	logger.break()

	const proceed =
		options.yes ||
		(await confirm({
			message: "Proceed with installation?",
			default: true,
		}))

	if (!proceed) {
		logger.info("Aborted.")
		return
	}

	// Download and install packages
	const version = await getLatestVersion()

	for (const pkg of resolvedPackages) {
		await installPackage(cwd, pkg, version, manifest)
	}

	// Save manifest
	await writeManifest(cwd, manifest)

	// Show next steps
	showNextSteps(resolvedPackages)
}

function resolveDependencies(packages: PackageName[]): PackageName[] {
	const resolved = new Set<PackageName>()
	const toProcess = [...packages]

	while (toProcess.length > 0) {
		const pkg = toProcess.pop()!
		if (resolved.has(pkg)) continue

		// Add dependencies first
		const deps = PACKAGE_DEPENDENCIES[pkg] || []
		for (const dep of deps) {
			if (!resolved.has(dep as PackageName)) {
				toProcess.push(dep as PackageName)
			}
		}

		resolved.add(pkg)
	}

	// Return in correct order (dependencies first)
	const orderedPackages: PackageName[] = []
	const order: PackageName[] = ["backend", "shared", "types", "cms"]

	for (const pkg of order) {
		if (resolved.has(pkg)) {
			orderedPackages.push(pkg)
		}
	}

	return orderedPackages
}

function getPackageTargetPath(cwd: string, pkg: PackageName): string {
	switch (pkg) {
		case "cms":
			return path.join(cwd, "apps", "cms")
		case "backend":
			return path.join(cwd, "packages", "backend")
		case "shared":
			return path.join(cwd, "packages", "cms-shared")
		case "types":
			return path.join(cwd, "packages", "type-generator")
		default:
			return path.join(cwd, PACKAGE_PATHS[pkg])
	}
}

async function installPackage(
	cwd: string,
	pkg: PackageName,
	version: string,
	manifest: ReturnType<typeof createManifest>,
): Promise<void> {
	const spinner = ora(`Installing ${PACKAGE_NAMES[pkg]}...`).start()

	try {
		const targetPath = getPackageTargetPath(cwd, pkg)
		const sourcePath = PACKAGE_PATHS[pkg]

		// Special handling for backend with existing Convex project
		if (pkg === "backend") {
			await installBackendPackage(targetPath, sourcePath, spinner)
		} else {
			// Standard package installation
			await fs.ensureDir(targetPath)

			// Download package files, removing any local files no longer in remote
			await downloadAndExtractPackage(
				sourcePath,
				targetPath,
				(file) => {
					spinner.text = `Installing ${PACKAGE_NAMES[pkg]}... ${pc.dim(file)}`
				},
				{ sync: true },
			)
		}

		// Update manifest
		const config: PackageConfig = {
			version,
			installedAt: new Date().toISOString(),
			path: path.relative(cwd, targetPath),
		}

		manifest.packages[pkg] = config

		spinner.succeed(`Installed ${PACKAGE_NAMES[pkg]}`)
	} catch (error) {
		spinner.fail(`Failed to install ${PACKAGE_NAMES[pkg]}`)
		throw error
	}
}

async function installBackendPackage(
	targetPath: string,
	sourcePath: string,
	spinner: ReturnType<typeof ora>,
): Promise<void> {
	const convexPath = path.join(targetPath, "convex")
	const existingSchemaPath = path.join(convexPath, "schema.ts")

	// Check if this is an existing Convex project with schema
	const hasSchema = await fs.pathExists(existingSchemaPath)

	if (hasSchema) {
		spinner.text = "Detected existing Convex schema, merging CMS tables..."

		// Download only the CMS-specific files
		// Directories are downloaded with downloadAndExtractPackage
		// Individual files are downloaded directly with fetchFile
		const cmsDirs = ["convex/cms", "better-auth", "emails"]

		const cmsIndividualFiles = [
			"convex/auth.ts",
			"convex/auth.config.ts",
			"convex/authJwks.ts",
			"convex/http.ts",
			"convex/convex.config.ts",
		]

		// Download directories
		for (const dir of cmsDirs) {
			const fullSourcePath = `${sourcePath}/${dir}`
			const fullTargetPath = path.join(targetPath, dir)

			spinner.text = `Downloading ${dir}...`

			try {
				await downloadAndExtractPackage(fullSourcePath, fullTargetPath)
			} catch {
				// Directory might not exist, skip
			}
		}

		// Download individual files directly
		for (const file of cmsIndividualFiles) {
			const fullSourcePath = `${sourcePath}/${file}`
			const fullTargetPath = path.join(targetPath, file)

			spinner.text = `Downloading ${file}...`

			try {
				const content = await fetchFile(fullSourcePath)
				await fs.ensureDir(path.dirname(fullTargetPath))
				await fs.writeFile(fullTargetPath, content)
			} catch {
				// File might not exist, skip
			}
		}

		// Auto-merge CMS imports into existing schema
		await mergeSchemaFile(existingSchemaPath, spinner)
	} else {
		// Fresh installation - download entire backend package
		await fs.ensureDir(targetPath)
		await downloadAndExtractPackage(
			sourcePath,
			targetPath,
			(file) => {
				spinner.text = `Installing backend... ${pc.dim(file)}`
			},
			{ sync: true },
		)
	}

	// Merge package.json intelligently (both fresh and existing installations)
	spinner.text = "Merging package.json..."
	try {
		const sourcePackageJsonContent = await fetchFile(
			`${sourcePath}/package.json`,
		)
		const sourcePackageJson = JSON.parse(sourcePackageJsonContent)
		const targetPackageJsonPath = path.join(targetPath, "package.json")

		await mergePackageJson(targetPackageJsonPath, sourcePackageJson)
	} catch {
		spinner.warn("Could not merge package.json, skipping")
	}
}

function showNextSteps(packages: PackageName[]): void {
	const packageManager = "pnpm" // Default for Turborepo

	logger.break()
	logger.box("✅ Packages installed successfully!", [
		"",
		pc.bold("Next steps:"),
		"",
		`1. Install dependencies: ${pc.cyan(`${packageManager} install`)}`,
		"",
		"2. Set up environment variables:",
		...getRequiredEnvVars(packages).map((v) => `   ${pc.dim(v)}`),
		"",
		"3. Set up Convex (if not already):",
		`   ${pc.cyan("npx convex dev")} in packages/backend`,
		"",
		"4. Start development:",
		`   ${pc.cyan(`${packageManager} dev`)}`,
		"",
		pc.dim("CMS will be available at http://localhost:3001"),
	])

	// Show optional env vars
	const optionalVars = getOptionalEnvVars(packages)
	if (optionalVars.length > 0) {
		logger.break()
		logger.log(pc.bold("Optional environment variables:"))
		for (const { name, description } of optionalVars) {
			logger.log(`  ${pc.yellow(name)}`)
			logger.log(`    ${pc.dim(description)}`)
		}
	}
}

function getRequiredEnvVars(packages: PackageName[]): string[] {
	const vars = new Set<string>()

	for (const pkg of packages) {
		const required = REQUIRED_ENV_VARS[pkg] || []
		for (const v of required) {
			vars.add(v)
		}
	}

	return Array.from(vars)
}

function getOptionalEnvVars(
	packages: PackageName[],
): { name: string; description: string }[] {
	const vars: { name: string; description: string }[] = []
	const seen = new Set<string>()

	for (const pkg of packages) {
		const optional = OPTIONAL_ENV_VARS[pkg] || []
		for (const v of optional) {
			if (!seen.has(v.name)) {
				seen.add(v.name)
				vars.push(v)
			}
		}
	}

	return vars
}

/**
 * Intelligently merge CMS schema imports into existing schema.ts
 */
async function mergeSchemaFile(
	schemaPath: string,
	spinner: ReturnType<typeof ora>,
): Promise<void> {
	const content = await fs.readFile(schemaPath, "utf-8")

	// Check if already merged - look for any import from schema.cms
	if (
		content.includes('from "./cms/schema.cms"') ||
		content.includes('from "./schema.cms"')
	) {
		spinner.text = "CMS schema already integrated"
		return
	}

	spinner.text = "Merging CMS schema into existing schema.ts..."

	let newContent = content

	// 1. Add import if not present
	const importStatement = 'import { cmsSchemaExports } from "./cms/schema.cms"'
	const hasImport = content.includes(importStatement)

	if (!hasImport) {
		// Find the last import statement
		const importRegex = /^import\s+.*from\s+['"].*['"];?\s*$/gm
		const imports = [...content.matchAll(importRegex)]

		if (imports.length > 0) {
			const lastImport = imports[imports.length - 1]
			const insertPosition = lastImport.index! + lastImport[0].length
			newContent =
				newContent.slice(0, insertPosition) +
				`\n${importStatement}` +
				newContent.slice(insertPosition)
		} else {
			// No imports found, add at the beginning
			newContent = `${importStatement}\n\n${newContent}`
		}
	}

	// 2. Add ...cmsSchemaExports to defineSchema if not present
	// Check for any CMS-related spreads (cmsSchemaExports, cmsTablesWithoutUsers, etc.)
	const hasCmsSpread =
		/defineSchema\s*\(\s*\{[^}]*\.\.\.(cmsSchemaExports|cmsTablesWithoutUsers|cmsTables)/s.test(
			newContent,
		)

	if (!hasCmsSpread) {
		// Find defineSchema({ and add the spread
		const defineSchemaRegex = /defineSchema\s*\(\s*\{(\s*)/

		if (defineSchemaRegex.test(newContent)) {
			newContent = newContent.replace(
				defineSchemaRegex,
				(_match, whitespace) => {
					return `defineSchema({${whitespace}// VexBlocks CMS tables${whitespace}...cmsSchemaExports,${whitespace}`
				},
			)
		}
	}

	// Write the merged content
	await fs.writeFile(schemaPath, newContent, "utf-8")
	spinner.text = "Successfully merged CMS schema"
}
