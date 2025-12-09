import path from "node:path"
import fs from "fs-extra"
import { GITHUB_BRANCH, GITHUB_RAW_URL, GITHUB_REPO } from "./constants.js"

/**
 * Remote manifest structure from GitHub
 */
export interface RemoteManifest {
	version: string
	packages: {
		[key: string]: {
			version: string
			files: { path: string; checksum: string }[]
			dependencies?: Record<string, string>
			peerDependencies?: string[]
		}
	}
	changelog: Record<string, string[]>
}

/**
 * Fetch the remote manifest from GitHub
 */
export async function fetchRemoteManifest(): Promise<RemoteManifest> {
	const url = `${GITHUB_RAW_URL}/templates/manifest.json`

	const response = await fetch(url)

	if (!response.ok) {
		throw new Error(`Failed to fetch manifest: ${response.statusText}`)
	}

	return response.json()
}

/**
 * Fetch a single file from GitHub
 */
export async function fetchFile(filePath: string): Promise<string> {
	const url = `${GITHUB_RAW_URL}/${filePath}`

	const response = await fetch(url)

	if (!response.ok) {
		throw new Error(`Failed to fetch file ${filePath}: ${response.statusText}`)
	}

	return response.text()
}

/**
 * Download a file from GitHub and save it locally
 */
export async function downloadFile(
	remotePath: string,
	localPath: string,
): Promise<void> {
	const url = `${GITHUB_RAW_URL}/${remotePath}`

	const response = await fetch(url)

	if (!response.ok) {
		throw new Error(`Failed to download ${remotePath}: ${response.statusText}`)
	}

	// Ensure directory exists
	await fs.ensureDir(path.dirname(localPath))

	// Write file
	const content = await response.text()
	await fs.writeFile(localPath, content, "utf-8")
}

/**
 * Download the repository archive and extract specific paths
 */
export async function downloadAndExtractPackage(
	packagePath: string,
	targetDir: string,
	onProgress?: (file: string) => void,
): Promise<void> {
	// Get file list from GitHub tree API
	const treeUrl = `https://api.github.com/repos/${GITHUB_REPO}/git/trees/${GITHUB_BRANCH}?recursive=1`

	const response = await fetch(treeUrl, {
		headers: {
			Accept: "application/vnd.github.v3+json",
			"User-Agent": "vexblocks-cli",
		},
	})

	if (!response.ok) {
		throw new Error(`Failed to fetch repository tree: ${response.statusText}`)
	}

	const data = (await response.json()) as {
		tree: { path: string; type: string; sha: string }[]
	}

	// Filter files that match the package path
	const files = data.tree.filter(
		(item) => item.type === "blob" && item.path.startsWith(`${packagePath}/`),
	)

	// Download each file
	for (const file of files) {
		const relativePath = file.path.slice(packagePath.length + 1)
		const localPath = path.join(targetDir, relativePath)

		onProgress?.(relativePath)
		await downloadFile(file.path, localPath)
	}
}

/**
 * Get the list of files in a package from GitHub
 */
export async function getPackageFiles(packagePath: string): Promise<string[]> {
	const treeUrl = `https://api.github.com/repos/${GITHUB_REPO}/git/trees/${GITHUB_BRANCH}?recursive=1`

	const response = await fetch(treeUrl, {
		headers: {
			Accept: "application/vnd.github.v3+json",
			"User-Agent": "vexblocks-cli",
		},
	})

	if (!response.ok) {
		throw new Error(`Failed to fetch repository tree: ${response.statusText}`)
	}

	const data = (await response.json()) as {
		tree: { path: string; type: string }[]
	}

	return data.tree
		.filter(
			(item) => item.type === "blob" && item.path.startsWith(`${packagePath}/`),
		)
		.map((item) => item.path.slice(packagePath.length + 1))
}

/**
 * Get latest version from GitHub releases
 */
export async function getLatestVersion(): Promise<string> {
	const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`

	try {
		const response = await fetch(url, {
			headers: {
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "vexblocks-cli",
			},
		})

		if (response.ok) {
			const data = (await response.json()) as { tag_name: string }
			return data.tag_name.replace(/^v/, "")
		}
	} catch {
		// Fallback to manifest
	}

	// Fallback: fetch from manifest
	try {
		const manifest = await fetchRemoteManifest()
		return manifest.version
	} catch {
		return "1.0.0"
	}
}

/**
 * Get changelog entries between two versions
 */
export async function getChangelog(
	fromVersion: string,
	toVersion: string,
): Promise<Record<string, string[]>> {
	const manifest = await fetchRemoteManifest()

	const changelog: Record<string, string[]> = {}

	const versions = Object.keys(manifest.changelog).sort((a, b) => {
		// Simple semver comparison
		const [aMajor, aMinor, aPatch] = a.split(".").map(Number)
		const [bMajor, bMinor, bPatch] = b.split(".").map(Number)

		if (aMajor !== bMajor) return aMajor - bMajor
		if (aMinor !== bMinor) return aMinor - bMinor
		return aPatch - bPatch
	})

	const fromIndex = versions.indexOf(fromVersion)
	const toIndex = versions.indexOf(toVersion)

	if (fromIndex === -1 || toIndex === -1) {
		return changelog
	}

	for (let i = fromIndex + 1; i <= toIndex; i++) {
		const version = versions[i]
		if (manifest.changelog[version]) {
			changelog[version] = manifest.changelog[version]
		}
	}

	return changelog
}

/**
 * Compare two semver versions
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
	const [aMajor, aMinor, aPatch] = a.split(".").map(Number)
	const [bMajor, bMinor, bPatch] = b.split(".").map(Number)

	if (aMajor !== bMajor) return aMajor < bMajor ? -1 : 1
	if (aMinor !== bMinor) return aMinor < bMinor ? -1 : 1
	if (aPatch !== bPatch) return aPatch < bPatch ? -1 : 1
	return 0
}
