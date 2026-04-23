import { ChevronRight } from "lucide-react"
import Link from "next/link"
import {
	Callout,
	CodeBlock,
	InlineCode,
} from "@/components/docs/mdx-components"

export default function CLIDiffPage() {
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
					<span>diff</span>
				</div>
				<h1 className="text-4xl font-bold tracking-tight">
					<code className="font-mono">diff</code>
				</h1>
				<p className="text-xl text-muted-foreground">
					Compare local packages with the latest remote version
				</p>
			</div>

			<div className="prose prose-gray dark:prose-invert max-w-none">
				<h2>Usage</h2>
				<CodeBlock>npx @vexblocks/cli diff [packages...] [options]</CodeBlock>

				<h2>Description</h2>
				<p>
					The <InlineCode>diff</InlineCode> command compares your locally
					installed VexBlocks packages with the latest version available in the
					repository. It shows you exactly what files have changed, helping you
					make informed decisions before upgrading.
				</p>

				<h2>What It Shows</h2>
				<p>The diff command displays:</p>
				<ul>
					<li>Current installed version vs. latest available version</li>
					<li>List of files that have been added, modified, or deleted</li>
					<li>
						File-by-file comparison with context (similar to{" "}
						<InlineCode>git diff</InlineCode>)
					</li>
					<li>Which files are protected and won't be updated</li>
					<li>Summary of changes by package</li>
				</ul>

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
								<InlineCode>--file</InlineCode>, <InlineCode>-f</InlineCode>
							</td>
							<td>string</td>
							<td>Compare a specific file instead of all files</td>
						</tr>
						<tr>
							<td>
								<InlineCode>--summary</InlineCode>
							</td>
							<td>boolean</td>
							<td>Show only summary without detailed diff</td>
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

				<h3>Compare All Packages</h3>
				<CodeBlock>npx @vexblocks/cli diff</CodeBlock>
				<p>Shows differences for all installed packages.</p>

				<h3>Compare Specific Packages</h3>
				<CodeBlock>npx @vexblocks/cli diff cms backend</CodeBlock>
				<p>Only shows differences for the CMS and backend packages.</p>

				<h3>Compare a Specific File</h3>
				<CodeBlock>
					npx @vexblocks/cli diff --file apps/cms/app/layout.tsx
				</CodeBlock>
				<p>Shows detailed diff for a single file.</p>

				<h3>Summary Only</h3>
				<CodeBlock>npx @vexblocks/cli diff --summary</CodeBlock>
				<p>Shows a high-level summary without detailed file contents.</p>

				<h2>Output Format</h2>
				<p>The command outputs information in this format:</p>

				<CodeBlock>
					{`📦 Comparing VexBlocks Packages

Package: cms
Current: v1.0.0
Latest:  v1.2.0

Changed files:
  M  apps/cms/app/layout.tsx
  M  apps/cms/components/ui/button.tsx
  A  apps/cms/components/media-library.tsx
  D  apps/cms/lib/deprecated-util.ts

Protected files (won't be updated):
  -  packages/backend/vexblocks.config.ts
  -  packages/cms-shared/src/types/generated.ts

Summary:
  2 modified, 1 added, 1 deleted

Legend:
  M = Modified
  A = Added
  D = Deleted
  - = Protected`}
				</CodeBlock>

				<h2>Detailed File Diff</h2>
				<p>For modified files, you'll see a detailed diff:</p>

				<CodeBlock>
					{`--- apps/cms/app/layout.tsx (v1.0.0)
+++ apps/cms/app/layout.tsx (v1.2.0)
@@ -10,7 +10,8 @@
 export default function Layout({ children }) {
   return (
     <html lang="en">
-      <body>{children}</body>
+      <body className="min-h-screen">
+        {children}
+      </body>
     </html>
   )
 }`}
				</CodeBlock>

				<Callout type="info">
					<p>
						<strong>Tip:</strong> Use this before running{" "}
						<InlineCode>upgrade</InlineCode> to preview what will change.
					</p>
				</Callout>

				<h2>Color-Coded Output</h2>
				<p>In your terminal, the diff will be color-coded:</p>
				<ul>
					<li>
						<span className="text-green-600 dark:text-green-400">
							Green lines
						</span>{" "}
						- Additions
					</li>
					<li>
						<span className="text-red-600 dark:text-red-400">Red lines</span> -
						Deletions
					</li>
					<li>
						<span className="text-blue-600 dark:text-blue-400">Blue</span> -
						Modified files
					</li>
					<li>
						<span className="text-yellow-600 dark:text-yellow-400">Yellow</span>{" "}
						- Protected files
					</li>
				</ul>

				<h2>Understanding Changes</h2>

				<h3>Modified Files (M)</h3>
				<p>
					Files that exist in both your local version and the remote version but
					have different content. These will be updated during an upgrade.
				</p>

				<h3>Added Files (A)</h3>
				<p>
					New files in the latest version that don't exist in your local
					installation. These will be added during an upgrade.
				</p>

				<h3>Deleted Files (D)</h3>
				<p>
					Files that exist in your local version but have been removed in the
					latest version. These will be deleted during an upgrade.
				</p>

				<h3>Protected Files (-)</h3>
				<p>
					Files that are marked as protected and will never be modified by the
					CLI, regardless of changes in the remote version.
				</p>

				<Callout type="warning">
					<p>
						<strong>Important:</strong> If you've customized any managed files,
						they will be overwritten during upgrade. The diff helps you identify
						these cases.
					</p>
				</Callout>

				<h2>Use Cases</h2>

				<h3>Before Upgrading</h3>
				<p>Run diff to see what will change:</p>
				<CodeBlock>
					{`# Check what will change
npx @vexblocks/cli diff

# If satisfied, proceed with upgrade
npx @vexblocks/cli upgrade`}
				</CodeBlock>

				<h3>Debugging Issues</h3>
				<p>
					If something isn't working after an upgrade, compare specific files:
				</p>
				<CodeBlock>
					npx @vexblocks/cli diff --file apps/cms/app/\[schema\]/page.tsx
				</CodeBlock>

				<h3>Reviewing Customizations</h3>
				<p>See if you've accidentally modified managed files:</p>
				<CodeBlock>npx @vexblocks/cli diff --summary</CodeBlock>

				<h2>Working with Git</h2>
				<p>The diff command is complementary to git. Use them together:</p>

				<CodeBlock>
					{`# See what VexBlocks would change
npx @vexblocks/cli diff

# See your local changes
git diff

# Upgrade and review combined changes
npx @vexblocks/cli upgrade
git diff`}
				</CodeBlock>

				<Callout type="success">
					<p>
						<strong>Best Practice:</strong> Always commit your changes to git
						before running upgrades. This gives you an easy way to review or
						rollback changes.
					</p>
				</Callout>

				<h2>Exit Codes</h2>
				<p>The command uses these exit codes:</p>
				<table>
					<thead>
						<tr>
							<th>Code</th>
							<th>Meaning</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<InlineCode>0</InlineCode>
							</td>
							<td>Success, no errors</td>
						</tr>
						<tr>
							<td>
								<InlineCode>1</InlineCode>
							</td>
							<td>Error occurred (missing manifest, network error, etc.)</td>
						</tr>
					</tbody>
				</table>

				<h2>Limitations</h2>
				<ul>
					<li>
						Only compares files, not npm package dependencies in{" "}
						<InlineCode>package.json</InlineCode>
					</li>
					<li>
						Cannot diff binary files (images, etc.) - only shows if they changed
					</li>
					<li>Requires network access to fetch remote versions</li>
				</ul>

				<h2>Troubleshooting</h2>

				<h3>No Manifest File</h3>
				<p>If you see "No vexblocks.json found", initialize first:</p>
				<CodeBlock>npx @vexblocks/cli init</CodeBlock>

				<h3>Network Errors</h3>
				<p>
					If you can't connect to GitHub, check your internet connection or try
					again later.
				</p>

				<h3>Too Much Output</h3>
				<p>
					If the diff is overwhelming, use <InlineCode>--summary</InlineCode> or
					filter by package:
				</p>
				<CodeBlock>npx @vexblocks/cli diff cms --summary</CodeBlock>

				<h2>Related Commands</h2>
				<ul>
					<li>
						<Link href="/docs/cli/upgrade">
							<InlineCode>upgrade</InlineCode> - Apply the changes shown in diff
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
