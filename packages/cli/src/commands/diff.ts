import path from "node:path"
import fs from "fs-extra"
import pc from "picocolors"
import ora from "ora"
import { createTwoFilesPatch } from "diff"
import { logger } from "../utils/logger.js"
import { readManifest } from "../utils/manifest.js"
import { fetchFile, getPackageFiles, } from "../utils/github.js"
import { PACKAGE_NAMES } from "../utils/constants.js"

type PackageName = "cms" | "backend" | "shared" | "types"

interface DiffOptions {
	cwd?: string
}

export async function diffCommand(
	packageArg: string | undefined,
	options: DiffOptions,
): Promise<void> {
	const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd()

	logger.title("🔍 VexBlocks Diff")

	// Read manifest
	const manifest = await readManifest(cwd)
	if (!manifest) {
		logger.error("No vexblocks.json found. Run `vexblocks init` first.")
		process.exit(1)
	}

	const installedPackages = Object.keys(manifest.packages) as PackageName[]

	if (installedPackages.length === 0) {
		logger.info("No packages installed.")
		return
	}

	// Determine which package to diff
	let packageToDiff: PackageName

	if (packageArg) {
		if (!installedPackages.includes(packageArg as PackageName)) {
			logger.error(`Package "${packageArg}" is not installed.`)
			logger.info(`Installed packages: ${installedPackages.join(", ")}`)
			return
		}
		packageToDiff = packageArg as PackageName
	} else if (installedPackages.length === 1) {
		packageToDiff = installedPackages[0]
	} else {
		logger.error("Please specify a package to diff.")
		logger.info(`Usage: ${pc.cyan("vexblocks diff <package>")}`)
		logger.info(`Installed packages: ${installedPackages.join(", ")}`)
		return
	}

	const spinner = ora(`Comparing ${PACKAGE_NAMES[packageToDiff]}...`).start()

	try {
		const config = manifest.packages[packageToDiff]
		if (!config) {
			spinner.fail("Package configuration not found")
			return
		}

		const localPath = path.join(cwd, config.path)
		const remotePath = getSourcePath(packageToDiff)

		// Get list of files in remote
		const remoteFiles = await getPackageFiles(remotePath)

		let totalDiffs = 0
		let newFiles = 0
		let modifiedFiles = 0
		let deletedFiles = 0

		spinner.stop()

		// Compare each file
		for (const file of remoteFiles) {
			const localFilePath = path.join(localPath, file)
			const remoteFilePath = `${remotePath}/${file}`

			let localContent = ""
			let remoteContent = ""

			// Get local content
			if (await fs.pathExists(localFilePath)) {
				localContent = await fs.readFile(localFilePath, "utf-8")
			}

			// Get remote content
			try {
				remoteContent = await fetchFile(remoteFilePath)
			} catch {
				continue // Skip if remote file doesn't exist
			}

			// Compare
			if (!localContent && remoteContent) {
				newFiles++
				totalDiffs++
				logger.log(`${pc.green("+")} ${file} ${pc.dim("(new file)")}`)
			} else if (localContent !== remoteContent) {
				modifiedFiles++
				totalDiffs++
				logger.log(`${pc.yellow("~")} ${file} ${pc.dim("(modified)")}`)

				// Show diff preview
				const patch = createTwoFilesPatch(
					`local/${file}`,
					`remote/${file}`,
					localContent,
					remoteContent,
					"",
					"",
				)

				// Format and display diff
				const lines = patch.split("\n").slice(4) // Skip header
				const maxLines = 10
				let lineCount = 0

				for (const line of lines) {
					if (lineCount >= maxLines) {
						logger.log(pc.dim(`  ... (${lines.length - maxLines} more lines)`))
						break
					}

					if (line.startsWith("+") && !line.startsWith("+++")) {
						logger.log(pc.green(`  ${line}`))
						lineCount++
					} else if (line.startsWith("-") && !line.startsWith("---")) {
						logger.log(pc.red(`  ${line}`))
						lineCount++
					}
				}
				logger.break()
			}
		}

		// Check for local files not in remote (deleted)
		const localFiles = await getLocalFiles(localPath)
		for (const file of localFiles) {
			if (!remoteFiles.includes(file)) {
				// Skip node_modules, dist, and other build artifacts
				if (
					file.includes("node_modules") ||
					file.includes("dist") ||
					file.includes(".next") ||
					file.startsWith(".")
				) {
					continue
				}

				deletedFiles++
				totalDiffs++
				logger.log(`${pc.red("-")} ${file} ${pc.dim("(deleted in remote)")}`)
			}
		}

		// Summary
		logger.break()
		if (totalDiffs === 0) {
			logger.success("No differences found. Local files match the latest version.")
		} else {
			logger.log(pc.bold("Summary:"))
			if (newFiles > 0) logger.log(`  ${pc.green(`+${newFiles}`)} new files`)
			if (modifiedFiles > 0)
				logger.log(`  ${pc.yellow(`~${modifiedFiles}`)} modified files`)
			if (deletedFiles > 0)
				logger.log(`  ${pc.red(`-${deletedFiles}`)} files removed in remote`)

			logger.break()
			logger.info(
				`Run ${pc.cyan("npx vexblocks upgrade")} to update to the latest version.`,
			)
		}
	} catch (error) {
		spinner.fail("Failed to compare files")
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

async function getLocalFiles(dir: string, base = ""): Promise<string[]> {
	const files: string[] = []

	if (!(await fs.pathExists(dir))) {
		return files
	}

	const entries = await fs.readdir(dir, { withFileTypes: true })

	for (const entry of entries) {
		const relativePath = base ? `${base}/${entry.name}` : entry.name

		if (entry.isDirectory()) {
			// Skip certain directories
			if (
				["node_modules", "dist", ".next", ".turbo", ".git"].includes(
					entry.name,
				)
			) {
				continue
			}
			const subFiles = await getLocalFiles(
				path.join(dir, entry.name),
				relativePath,
			)
			files.push(...subFiles)
		} else {
			files.push(relativePath)
		}
	}

	return files
}
