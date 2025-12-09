import path from "node:path"
import { fileURLToPath } from "node:url"
import fs from "fs-extra"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface PackageInfo {
	name: string
	version: string
}

export async function getPackageInfo(): Promise<PackageInfo> {
	// In development, we're in src/utils, so go up to packages/cli
	// In production (dist), we're in dist/utils, so also go up to packages/cli
	const packageJsonPath = path.resolve(__dirname, "../../package.json")

	try {
		const packageJson = await fs.readJson(packageJsonPath)
		return {
			name: packageJson.name || "vexblocks",
			version: packageJson.version || "0.0.0",
		}
	} catch {
		return {
			name: "vexblocks",
			version: "0.0.0",
		}
	}
}
