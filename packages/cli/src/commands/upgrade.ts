import path from "node:path"
import { confirm } from "@inquirer/prompts"
import fs from "fs-extra"
import ora from "ora"
import pc from "picocolors"
import { MANAGED_PACKAGES, PACKAGE_NAMES } from "../utils/constants.js"
import {
	compareVersions,
	downloadAndExtractPackage,
	fetchFile,
	getChangelog,
	getLatestVersion,
} from "../utils/github.js"
import { logger } from "../utils/logger.js"
import {
	type PackageConfig,
	readManifest,
	writeManifest,
} from "../utils/manifest.js"

type PackageName = "cms" | "backend" | "shared" | "types"

interface UpgradeOptions {
	yes?: boolean
	cwd?: string
	check?: boolean
	force?: boolean
}

export async function upgradeCommand(
	packages: string[],
	options: UpgradeOptions,
): Promise<void> {
	const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd()

	logger.title("⬆️  Upgrade VexBlocks Packages")

	// Read manifest
	const manifest = await readManifest(cwd)
	if (!manifest) {
		logger.error(
			"No vexblocks.json found. Run `npx @vexblocks/cli init` first.",
		)
		process.exit(1)
	}

	// Get latest version
	const spinner = ora("Checking for updates...").start()
	const latestVersion = await getLatestVersion()
	spinner.stop()

	// Determine which packages to check
	const installedPackages = Object.keys(manifest.packages) as PackageName[]

	if (installedPackages.length === 0) {
		logger.info(
			"No packages installed. Run `npx @vexblocks/cli add <package>` first.",
		)
		return
	}

	let packagesToUpgrade: PackageName[]

	if (packages.length === 0) {
		packagesToUpgrade = installedPackages
	} else {
		packagesToUpgrade = packages.filter((p) =>
			installedPackages.includes(p as PackageName),
		) as PackageName[]

		if (packagesToUpgrade.length === 0) {
			logger.error("None of the specified packages are installed.")
			return
		}
	}

	// Check for updates
	const updates: { pkg: PackageName; from: string; to: string }[] = []

	for (const pkg of packagesToUpgrade) {
		const config = manifest.packages[pkg]
		if (!config) continue

		const comparison = compareVersions(config.version, latestVersion)
		if (comparison < 0) {
			updates.push({
				pkg,
				from: config.version,
				to: latestVersion,
			})
		}
	}

	if (updates.length === 0) {
		logger.success("All packages are up to date!")
		logger.info(`Current version: ${pc.cyan(latestVersion)}`)
		return
	}

	// Show available updates
	logger.log(pc.bold("\nAvailable updates:"))
	logger.break()

	for (const update of updates) {
		const isManaged = MANAGED_PACKAGES.includes(update.pkg as any)
		const managedLabel = isManaged ? pc.yellow(" (managed)") : ""
		logger.log(
			`  ${PACKAGE_NAMES[update.pkg]} ${pc.dim(`${update.from} → `)}${pc.green(update.to)}${managedLabel}`,
		)
	}

	// Show changelog
	const changelog = await getChangelog(updates[0].from, latestVersion)
	if (Object.keys(changelog).length > 0) {
		logger.break()
		logger.log(pc.bold("Changelog:"))
		for (const [version, changes] of Object.entries(changelog)) {
			logger.log(`\n  ${pc.cyan(version)}`)
			for (const change of changes) {
				logger.log(`    ${pc.dim("•")} ${change}`)
			}
		}
	}

	// Check only mode
	if (options.check) {
		logger.break()
		logger.info(
			`Run ${pc.cyan("npx @vexblocks/cli upgrade")} to apply these updates.`,
		)
		return
	}

	// Confirm upgrade
	logger.break()
	const proceed =
		options.yes ||
		(await confirm({
			message: `Upgrade ${updates.length} package(s)?`,
			default: true,
		}))

	if (!proceed) {
		logger.info("Aborted.")
		return
	}

	// Perform upgrades
	for (const update of updates) {
		await upgradePackage(cwd, update.pkg, update.to, manifest, options)
	}

	// Update manifest version
	manifest.version = latestVersion
	await writeManifest(cwd, manifest)

	logger.break()
	logger.success(`Upgraded to version ${pc.cyan(latestVersion)}`)
	logger.info(
		"Run your package manager's install command to update dependencies.",
	)
}

async function upgradePackage(
	cwd: string,
	pkg: PackageName,
	version: string,
	manifest: ReturnType<typeof readManifest> extends Promise<infer T>
		? NonNullable<T>
		: never,
	options: UpgradeOptions,
): Promise<void> {
	const spinner = ora(`Upgrading ${PACKAGE_NAMES[pkg]}...`).start()

	try {
		const config = manifest.packages[pkg]
		if (!config) {
			spinner.info(`${PACKAGE_NAMES[pkg]} not installed`)
			return
		}

		const targetPath = path.join(cwd, config.path)

		// Check if package exists
		if (!(await fs.pathExists(targetPath))) {
			spinner.warn(
				`${PACKAGE_NAMES[pkg]} directory not found at ${config.path}`,
			)
			return
		}

		// For managed packages, replace entirely
		const isManaged = MANAGED_PACKAGES.includes(pkg as any)

		if (isManaged || options.force) {
			// Remove existing
			await fs.remove(targetPath)

			// Download new version
			const sourcePath = getSourcePath(pkg)
			await downloadAndExtractPackage(sourcePath, targetPath, (file) => {
				spinner.text = `Upgrading ${PACKAGE_NAMES[pkg]}... ${pc.dim(file)}`
			})
		} else {
			// For non-managed packages (backend), only update CMS-specific files
			spinner.text = `Upgrading CMS files in ${PACKAGE_NAMES[pkg]}...`

			// Directories to replace entirely
			const cmsDirs = ["convex/cms", "better-auth", "emails"]

			for (const dir of cmsDirs) {
				const targetFilePath = path.join(targetPath, dir)
				const sourceFilePath = `packages/backend/${dir}`

				try {
					await fs.remove(targetFilePath)
					await downloadAndExtractPackage(sourceFilePath, targetFilePath)
				} catch {
					// Skip if directory doesn't exist in source
				}
			}

			// Individual files to update
			const cmsIndividualFiles = [
				"convex/auth.ts",
				"convex/auth.config.ts",
				"convex/authJwks.ts",
				"convex/http.ts",
				"convex/convex.config.ts",
			]

			for (const file of cmsIndividualFiles) {
				const targetFilePath = path.join(targetPath, file)
				const sourceFilePath = `packages/backend/${file}`

				try {
					const content = await fetchFile(sourceFilePath)
					await fs.ensureDir(path.dirname(targetFilePath))
					await fs.writeFile(targetFilePath, content)
				} catch {
					// Skip if file doesn't exist in source
				}
			}
		}

		// Update manifest
		const newConfig: PackageConfig = {
			...config,
			version,
			installedAt: new Date().toISOString(),
		}

		manifest.packages[pkg] = newConfig

		spinner.succeed(`Upgraded ${PACKAGE_NAMES[pkg]} to ${version}`)
	} catch (error) {
		spinner.fail(`Failed to upgrade ${PACKAGE_NAMES[pkg]}`)
		throw error
	}
}

function getSourcePath(pkg: PackageName): string {
	switch (pkg) {
		case "cms":
			return "apps/cms"
		case "backend":
			return "packages/backend"
		case "shared":
			return "packages/cms-shared"
		case "types":
			return "packages/type-generator"
		default:
			throw new Error(`Unknown package: ${pkg}`)
	}
}
