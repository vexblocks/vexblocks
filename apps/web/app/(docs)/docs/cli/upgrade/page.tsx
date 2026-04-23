import { ChevronRight } from "lucide-react"
import Link from "next/link"
import {
	Callout,
	CodeBlock,
	InlineCode,
	Step,
	Steps,
} from "@/components/docs/mdx-components"

export default function CLIUpgradePage() {
	return (
		<div className="mx-auto w-full min-w-0">
			<div className="mb-8 space-y-4">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Link href="/docs" className="hover:text-foreground">
						Documentation
					</Link>
					<ChevronRight className="h-4 w-4" />
					<Link href="/docs/cli" className="hover:text-foreground">
						CLI Reference
					</Link>
					<ChevronRight className="h-4 w-4" />
					<span>upgrade</span>
				</div>
				<h1 className="text-4xl font-bold tracking-tight">
					<code className="font-mono">upgrade</code>
				</h1>
				<p className="text-xl text-muted-foreground">
					Upgrade VexBlocks packages to the latest version
				</p>
			</div>

			<div className="prose prose-gray dark:prose-invert max-w-none">
				<h2>Usage</h2>
				<CodeBlock>
					npx @vexblocks/cli upgrade [packages...] [options]
				</CodeBlock>

				<h2>Description</h2>
				<p>
					The <InlineCode>upgrade</InlineCode> command updates your VexBlocks
					packages to the latest version from the repository. It intelligently
					handles file updates while preserving your custom configurations and
					data.
				</p>

				<h2>How It Works</h2>
				<Steps>
					<Step>
						<h3>Check Manifest</h3>
						<p>
							Reads <InlineCode>vexblocks.json</InlineCode> to see which
							packages are currently installed and their versions.
						</p>
					</Step>

					<Step>
						<h3>Fetch Latest Version</h3>
						<p>
							Queries the GitHub repository to get the latest release version.
						</p>
					</Step>

					<Step>
						<h3>Show Changes</h3>
						<p>
							Displays a changelog showing what's new in the latest version.
						</p>
					</Step>

					<Step>
						<h3>Confirm Upgrade</h3>
						<p>Prompts you to confirm before proceeding with the upgrade.</p>
					</Step>

					<Step>
						<h3>Update Files</h3>
						<p>
							Downloads and replaces managed files while protecting your custom
							configurations.
						</p>
					</Step>

					<Step>
						<h3>Update Manifest</h3>
						<p>
							Updates <InlineCode>vexblocks.json</InlineCode> with the new
							version numbers and timestamps.
						</p>
					</Step>
				</Steps>

				<h2>Options</h2>
				<table>
					<thead>
						<tr>
							<th>Option</th>
							<th>Type</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<InlineCode>--yes</InlineCode>, <InlineCode>-y</InlineCode>
							</td>
							<td>boolean</td>
							<td>Skip confirmation prompts</td>
						</tr>
						<tr>
							<td>
								<InlineCode>--force</InlineCode>
							</td>
							<td>boolean</td>
							<td>Force upgrade even if already on latest version</td>
						</tr>
						<tr>
							<td>
								<InlineCode>--cwd</InlineCode>
							</td>
							<td>string</td>
							<td>Working directory for the command</td>
						</tr>
					</tbody>
				</table>

				<h2>Examples</h2>

				<h3>Upgrade All Packages</h3>
				<CodeBlock>npx @vexblocks/cli upgrade</CodeBlock>
				<p>Checks for updates and upgrades all installed packages.</p>

				<h3>Upgrade Specific Packages</h3>
				<CodeBlock>npx @vexblocks/cli upgrade cms backend</CodeBlock>
				<p>Only upgrades the specified packages.</p>

				<h3>Skip Confirmation</h3>
				<CodeBlock>npx @vexblocks/cli upgrade --yes</CodeBlock>
				<p>Automatically proceeds with the upgrade without prompting.</p>

				<h3>Force Reinstall</h3>
				<CodeBlock>npx @vexblocks/cli upgrade --force</CodeBlock>
				<p>Reinstalls packages even if you're already on the latest version.</p>

				<h2>Protected Files</h2>
				<p>
					During upgrades, the following files are <strong>never</strong>{" "}
					overwritten to preserve your custom work:
				</p>

				<ul>
					<li>
						<InlineCode>packages/backend/vexblocks.config.ts</InlineCode> - Your
						CMS schema definitions
					</li>
					<li>
						<InlineCode>packages/backend/.env</InlineCode> - Environment
						variables
					</li>
					<li>
						<InlineCode>packages/backend/.env.local</InlineCode> - Local
						environment variables
					</li>
					<li>
						<InlineCode>packages/cms-shared/src/types/generated.ts</InlineCode>{" "}
						- Your generated types from schemas
					</li>
					<li>
						Any files in <InlineCode>convex/schema.ts</InlineCode> (your custom
						tables are preserved)
					</li>
				</ul>

				<Callout type="success">
					<p>
						<strong>Safe Upgrades:</strong> Your content schemas, generated
						types, and configurations are always protected during upgrades.
					</p>
				</Callout>

				<h2>Managed Files</h2>
				<p>
					Managed files are marked with a header and will be updated during
					upgrades:
				</p>

				<CodeBlock>
					{`/**
 * @vexblocks-managed
 * This file is managed by VexBlocks CLI.
 * DO NOT EDIT - Changes will be overwritten on upgrade.
 * Version: 1.0.0
 */`}
				</CodeBlock>

				<p>These include:</p>
				<ul>
					<li>CMS dashboard components and pages</li>
					<li>Shared utilities and hooks</li>
					<li>Type generator scripts</li>
					<li>Core CMS functions in the backend</li>
				</ul>

				<Callout type="warning">
					<p>
						<strong>Important:</strong> Avoid editing managed files. If you need
						custom behavior, extend or override them in non-managed files.
					</p>
				</Callout>

				<h2>Changelog</h2>
				<p>
					Before upgrading, you'll see a changelog of what's new. For example:
				</p>

				<CodeBlock>
					{`Upgrading from v1.0.0 to v1.2.0

Changes in v1.2.0:
  • Added media library with Cloudflare Images support
  • Improved type generation performance
  • Fixed schema validation edge cases

Changes in v1.1.0:
  • Added visual editing capabilities
  • New field types: URL and YouTube URL
  • Better error handling in CMS dashboard`}
				</CodeBlock>

				<h2>After Upgrading</h2>
				<p>After a successful upgrade:</p>
				<ol>
					<li>Review the changelog to see what's new</li>
					<li>
						Run <InlineCode>pnpm install</InlineCode> to update dependencies
					</li>
					<li>
						Regenerate types: <InlineCode>pnpm generate-types</InlineCode>
					</li>
					<li>
						Test your CMS locally with <InlineCode>pnpm dev</InlineCode>
					</li>
					<li>Check for any breaking changes in the changelog</li>
				</ol>

				<Callout type="info">
					<p>
						<strong>Tip:</strong> Always review the{" "}
						<Link href="/docs/cli/diff">
							<InlineCode>diff</InlineCode>
						</Link>{" "}
						before upgrading to see exactly what will change.
					</p>
				</Callout>

				<h2>Rollback</h2>
				<p>
					If you need to rollback after an upgrade, the CLI doesn't provide
					automatic rollback. Instead:
				</p>
				<ol>
					<li>Use version control (git) to restore previous versions</li>
					<li>
						Or reinstall the previous version using{" "}
						<InlineCode>npx @vexblocks/cli add --overwrite</InlineCode> with the
						old version
					</li>
				</ol>

				<Callout type="warning">
					<p>
						<strong>Recommendation:</strong> Always commit your changes to git
						before running upgrades.
					</p>
				</Callout>

				<h2>Troubleshooting</h2>

				<h3>Already on Latest Version</h3>
				<p>
					If you see "Already on the latest version", but want to reinstall:
				</p>
				<CodeBlock>npx @vexblocks/cli upgrade --force</CodeBlock>

				<h3>Conflicts with Local Changes</h3>
				<p>
					If you've modified managed files, the upgrade will overwrite them.
					Save your changes separately before upgrading.
				</p>

				<h3>Missing Manifest File</h3>
				<p>
					If <InlineCode>vexblocks.json</InlineCode> is missing, run:
				</p>
				<CodeBlock>npx @vexblocks/cli init</CodeBlock>
				<p>This will recreate the manifest based on existing packages.</p>

				<h2>Related Commands</h2>
				<ul>
					<li>
						<Link href="/docs/cli/diff">
							<InlineCode>diff</InlineCode> - Preview changes before upgrading
						</Link>
					</li>
					<li>
						<Link href="/docs/cli/add">
							<InlineCode>add</InlineCode> - Add new packages
						</Link>
					</li>
				</ul>
			</div>
		</div>
	)
}
