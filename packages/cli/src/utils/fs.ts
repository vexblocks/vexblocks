import fs from "fs-extra"
import path from "node:path"
import crypto from "node:crypto"

/**
 * Check if a directory is a Turborepo project
 */
export async function isTurborepoProject(cwd: string): Promise<boolean> {
	const turboJsonPath = path.join(cwd, "turbo.json")
	return fs.pathExists(turboJsonPath)
}

/**
 * Check if a directory is a Convex project
 */
export async function isConvexProject(cwd: string): Promise<boolean> {
	const convexJsonPath = path.join(cwd, "convex.json")
	const convexDirPath = path.join(cwd, "convex")

	return (
		(await fs.pathExists(convexJsonPath)) ||
		(await fs.pathExists(convexDirPath))
	)
}

/**
 * Check if a directory has an existing schema.ts file
 */
export async function hasExistingSchema(cwd: string): Promise<boolean> {
	const schemaPath = path.join(cwd, "convex", "schema.ts")
	return fs.pathExists(schemaPath)
}

/**
 * Get the package manager used in the project
 */
export async function getPackageManager(
	cwd: string,
): Promise<"pnpm" | "npm" | "yarn" | "bun"> {
	if (await fs.pathExists(path.join(cwd, "pnpm-lock.yaml"))) {
		return "pnpm"
	}
	if (await fs.pathExists(path.join(cwd, "yarn.lock"))) {
		return "yarn"
	}
	if (await fs.pathExists(path.join(cwd, "bun.lockb"))) {
		return "bun"
	}
	return "npm"
}

/**
 * Get install command for package manager
 */
export function getInstallCommand(packageManager: string): string {
	switch (packageManager) {
		case "pnpm":
			return "pnpm install"
		case "yarn":
			return "yarn install"
		case "bun":
			return "bun install"
		default:
			return "npm install"
	}
}

/**
 * Calculate checksum for a file
 */
export async function getFileChecksum(filePath: string): Promise<string> {
	const content = await fs.readFile(filePath)
	return crypto.createHash("md5").update(content).digest("hex")
}

/**
 * Check if a file has been modified from its original checksum
 */
export async function isFileModified(
	filePath: string,
	originalChecksum: string,
): Promise<boolean> {
	if (!(await fs.pathExists(filePath))) {
		return false
	}

	const currentChecksum = await getFileChecksum(filePath)
	return currentChecksum !== originalChecksum
}

/**
 * Recursively copy a directory
 */
export async function copyDirectory(
	src: string,
	dest: string,
	options?: {
		filter?: (src: string) => boolean
		overwrite?: boolean
	},
): Promise<void> {
	await fs.copy(src, dest, {
		overwrite: options?.overwrite ?? true,
		filter: options?.filter,
	})
}

/**
 * Create a backup of a file or directory
 */
export async function createBackup(filePath: string): Promise<string> {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
	const backupPath = `${filePath}.backup-${timestamp}`

	if (await fs.pathExists(filePath)) {
		await fs.copy(filePath, backupPath)
	}

	return backupPath
}

/**
 * Read JSON file safely
 */
export async function readJsonSafe<T>(filePath: string): Promise<T | null> {
	try {
		if (await fs.pathExists(filePath)) {
			return await fs.readJson(filePath)
		}
		return null
	} catch {
		return null
	}
}

/**
 * Merge package.json dependencies
 */
export async function mergePackageJsonDependencies(
	targetPath: string,
	dependencies: Record<string, string>,
	devDependencies?: Record<string, string>,
): Promise<void> {
	const packageJson = await fs.readJson(targetPath)

	packageJson.dependencies = {
		...packageJson.dependencies,
		...dependencies,
	}

	if (devDependencies) {
		packageJson.devDependencies = {
			...packageJson.devDependencies,
			...devDependencies,
		}
	}

	await fs.writeJson(targetPath, packageJson, { spaces: 2 })
}

/**
 * Check if workspaces are configured correctly
 */
export async function checkWorkspaces(
	cwd: string,
	requiredPaths: string[],
): Promise<{ configured: boolean; missing: string[] }> {
	const packageJsonPath = path.join(cwd, "package.json")
	const packageJson = await readJsonSafe<{
		workspaces?: string[]
	}>(packageJsonPath)

	if (!packageJson?.workspaces) {
		return { configured: false, missing: requiredPaths }
	}

	const missing: string[] = []

	for (const requiredPath of requiredPaths) {
		// Check if any workspace pattern matches
		const isConfigured = packageJson.workspaces.some((pattern) => {
			if (pattern.includes("*")) {
				// Handle glob patterns like "apps/*"
				const baseDir = pattern.replace("/*", "").replace("/**", "")
				return requiredPath.startsWith(baseDir)
			}
			return pattern === requiredPath
		})

		if (!isConfigured) {
			missing.push(requiredPath)
		}
	}

	return {
		configured: missing.length === 0,
		missing,
	}
}
