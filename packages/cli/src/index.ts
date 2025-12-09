#!/usr/bin/env node

/**
 * VexBlocks CLI
 *
 * A CLI tool for adding VexBlocks Headless CMS to your Turborepo project.
 * Similar to Shadcn, it copies source files into your project for full ownership.
 */

import { Command } from "commander"
import pc from "picocolors"
import { initCommand } from "./commands/init.js"
import { addCommand } from "./commands/add.js"
import { upgradeCommand } from "./commands/upgrade.js"
import { diffCommand } from "./commands/diff.js"
import { getPackageInfo } from "./utils/package-info.js"

async function main() {
	const packageInfo = await getPackageInfo()

	const program = new Command()
		.name("vexblocks")
		.description("Add VexBlocks Headless CMS to your Turborepo project")
		.version(packageInfo.version, "-v, --version", "Display the version number")

	// Init command - Create new project or initialize in existing
	program
		.command("init")
		.description(
			"Initialize a new VexBlocks project or add to existing Turborepo",
		)
		.option("-y, --yes", "Skip confirmation prompts")
		.option("--cwd <path>", "Working directory (defaults to current directory)")
		.action(initCommand)

	// Add command - Add specific packages
	program
		.command("add [packages...]")
		.description("Add VexBlocks packages to your project")
		.option("-y, --yes", "Skip confirmation prompts")
		.option("--cwd <path>", "Working directory (defaults to current directory)")
		.option("--overwrite", "Overwrite existing files without prompting")
		.addHelpText(
			"after",
			`
${pc.bold("Available packages:")}
  cms        The CMS dashboard (Next.js app)
  backend    Convex backend with CMS functions
  shared     Shared utilities and components
  types      TypeScript type generator
  all        All packages

${pc.bold("Examples:")}
  $ vexblocks add cms
  $ vexblocks add backend shared
  $ vexblocks add all
		`,
		)
		.action(addCommand)

	// Upgrade command - Update packages to latest version
	program
		.command("upgrade [packages...]")
		.description("Upgrade VexBlocks packages to the latest version")
		.option("-y, --yes", "Skip confirmation prompts")
		.option("--cwd <path>", "Working directory (defaults to current directory)")
		.option("--check", "Check for updates without upgrading")
		.option("--force", "Force upgrade even if local changes detected")
		.action(upgradeCommand)

	// Diff command - Show differences between local and remote
	program
		.command("diff [package]")
		.description("Show differences between local files and latest version")
		.option("--cwd <path>", "Working directory (defaults to current directory)")
		.action(diffCommand)

	program.parse()
}

main().catch((error) => {
	console.error(pc.red("Error:"), error.message)
	process.exit(1)
})
