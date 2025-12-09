import fs from "fs-extra"
import path from "node:path"
import { MANIFEST_FILE } from "./constants.js"

/**
 * Package configuration stored in manifest
 */
export interface PackageConfig {
	version: string
	installedAt: string
	path: string
	config?: {
		mergedSchema?: boolean
		existingSchemaPath?: string
	}
}

/**
 * VexBlocks manifest file structure
 */
export interface VexBlocksManifest {
	$schema?: string
	version: string
	packages: {
		cms?: PackageConfig
		backend?: PackageConfig
		shared?: PackageConfig
		types?: PackageConfig
	}
}

/**
 * Read the vexblocks.json manifest from a directory
 */
export async function readManifest(
	cwd: string,
): Promise<VexBlocksManifest | null> {
	const manifestPath = path.join(cwd, MANIFEST_FILE)

	try {
		if (await fs.pathExists(manifestPath)) {
			return await fs.readJson(manifestPath)
		}
		return null
	} catch {
		return null
	}
}

/**
 * Write the vexblocks.json manifest to a directory
 */
export async function writeManifest(
	cwd: string,
	manifest: VexBlocksManifest,
): Promise<void> {
	const manifestPath = path.join(cwd, MANIFEST_FILE)
	await fs.writeJson(manifestPath, manifest, { spaces: 2 })
}

/**
 * Create a new manifest with default values
 */
export function createManifest(version: string): VexBlocksManifest {
	return {
		$schema: "https://vexblocks.dev/schema/vexblocks.json",
		version,
		packages: {},
	}
}

/**
 * Update a specific package in the manifest
 */
export async function updateManifestPackage(
	cwd: string,
	packageName: keyof VexBlocksManifest["packages"],
	config: PackageConfig,
): Promise<void> {
	let manifest = await readManifest(cwd)

	if (!manifest) {
		manifest = createManifest(config.version)
	}

	manifest.packages[packageName] = config

	await writeManifest(cwd, manifest)
}

/**
 * Check if a package is installed according to manifest
 */
export async function isPackageInstalled(
	cwd: string,
	packageName: keyof VexBlocksManifest["packages"],
): Promise<boolean> {
	const manifest = await readManifest(cwd)
	return manifest?.packages[packageName] !== undefined
}

/**
 * Get installed version of a package
 */
export async function getInstalledVersion(
	cwd: string,
	packageName: keyof VexBlocksManifest["packages"],
): Promise<string | null> {
	const manifest = await readManifest(cwd)
	return manifest?.packages[packageName]?.version || null
}
