import { ChevronRight } from "lucide-react"
import Link from "next/link"
import {
	Callout,
	CodeBlock,
	InlineCode,
	Step,
	Steps,
} from "@/components/docs/mdx-components"

export default function CLIAddPage() {
	return (
		<div className="mx-auto w-full min-w-0">
			<div className="mb-8 space-y-4">
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Link href="/docs" className="hover:text-foreground">
						Documentation
					</Link>
					<ChevronRight className="h-4 w-4" />
					<Link href="/docs/cli" className="hover:text-foreground">
						CLI Reference
					</Link>
					<ChevronRight className="h-4 w-4" />
					<span>add</span>
				</div>
				<h1 className="font-bold text-4xl tracking-tight">
					<code className="font-mono">add</code>
				</h1>
				<p className="text-muted-foreground text-xl">
					Add VexBlocks packages to your project
				</p>
			</div>

			<div className="prose prose-gray dark:prose-invert max-w-none">
				<h2>Usage</h2>
				<CodeBlock>npx @vexblocks/cli add [packages...] [options]</CodeBlock>

				<h2>Description</h2>
				<p>
					The <InlineCode>add</InlineCode> command downloads and installs
					VexBlocks packages from the official repository into your Turborepo
					project. It handles dependencies automatically and can merge with
					existing Convex backends.
				</p>

				<h2>Available Packages</h2>
				<table>
					<thead>
						<tr>
							<th>Package</th>
							<th>Description</th>
							<th>Install Path</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<InlineCode>cms</InlineCode>
							</td>
							<td>CMS Dashboard (Next.js app)</td>
							<td>
								<InlineCode>apps/cms</InlineCode>
							</td>
						</tr>
						<tr>
							<td>
								<InlineCode>backend</InlineCode>
							</td>
							<td>Convex backend with CMS functions</td>
							<td>
								<InlineCode>packages/backend</InlineCode>
							</td>
						</tr>
						<tr>
							<td>
								<InlineCode>shared</InlineCode>
							</td>
							<td>Shared utilities and components</td>
							<td>
								<InlineCode>packages/cms-shared</InlineCode>
							</td>
						</tr>
						<tr>
							<td>
								<InlineCode>types</InlineCode>
							</td>
							<td>Type generator for schemas</td>
							<td>
								<InlineCode>packages/type-generator</InlineCode>
							</td>
						</tr>
						<tr>
							<td>
								<InlineCode>all</InlineCode>
							</td>
							<td>All packages above</td>
							<td>-</td>
						</tr>
					</tbody>
				</table>

				<h2>How It Works</h2>
				<Steps>
					<Step>
						<h3>Validate Project</h3>
						<p>
							Checks that you're in a Turborepo project by looking for{" "}
							<InlineCode>turbo.json</InlineCode>.
						</p>
					</Step>

					<Step>
						<h3>Resolve Dependencies</h3>
						<p>
							Automatically includes required dependencies. For example, adding{" "}
							<InlineCode>cms</InlineCode> will also add{" "}
							<InlineCode>backend</InlineCode> and{" "}
							<InlineCode>shared</InlineCode>.
						</p>
					</Step>

					<Step>
						<h3>Check for Conflicts</h3>
						<p>
							Prompts you if packages already exist, offering to overwrite or
							skip.
						</p>
					</Step>

					<Step>
						<h3>Download & Install</h3>
						<p>
							Downloads the latest version from GitHub and extracts to the
							appropriate directories.
						</p>
					</Step>

					<Step>
						<h3>Update Manifest</h3>
						<p>
							Records installed packages in{" "}
							<InlineCode>vexblocks.json</InlineCode> for tracking.
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
							<td>Skip all prompts and overwrite existing files</td>
						</tr>
						<tr>
							<td>
								<InlineCode>--overwrite</InlineCode>
							</td>
							<td>boolean</td>
							<td>Overwrite existing packages without prompting</td>
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

				<h3>Add All Packages</h3>
				<CodeBlock>npx @vexblocks/cli add all</CodeBlock>
				<p>
					This installs the CMS dashboard, backend, shared utilities, and type
					generator.
				</p>

				<h3>Add Specific Packages</h3>
				<CodeBlock>npx @vexblocks/cli add cms backend</CodeBlock>
				<p>
					Installs only the CMS and backend packages (plus their dependencies).
				</p>

				<h3>Interactive Selection</h3>
				<CodeBlock>npx @vexblocks/cli add</CodeBlock>
				<p>
					Running without arguments shows an interactive checkbox to select
					packages.
				</p>

				<h3>Force Overwrite</h3>
				<CodeBlock>npx @vexblocks/cli add all --overwrite</CodeBlock>
				<p>Overwrites existing packages without prompting.</p>

				<h2>Package Dependencies</h2>
				<p>Some packages have dependencies that are automatically included:</p>
				<ul>
					<li>
						<InlineCode>cms</InlineCode> requires{" "}
						<InlineCode>backend</InlineCode> and <InlineCode>shared</InlineCode>
					</li>
					<li>
						<InlineCode>types</InlineCode> requires{" "}
						<InlineCode>backend</InlineCode>
					</li>
				</ul>

				<Callout type="info">
					<p>
						The CLI will automatically inform you when additional packages are
						added to satisfy dependencies.
					</p>
				</Callout>

				<h2>Existing Convex Backend</h2>
				<p>
					If you already have a Convex project with a{" "}
					<InlineCode>schema.ts</InlineCode> file, the CLI will:
				</p>
				<ul>
					<li>Create a backup of your existing schema</li>
					<li>
						Download only CMS-specific files (
						<InlineCode>convex/cms</InlineCode>,{" "}
						<InlineCode>schema.cms.ts</InlineCode>, etc.)
					</li>
					<li>
						Automatically merge CMS tables into your schema by adding{" "}
						<InlineCode>...cmsSchemaExports</InlineCode>
					</li>
				</ul>

				<CodeBlock>
					{`// Your existing schema.ts
import { defineSchema } from "convex/server"
import { cmsSchemaExports } from "./schema.cms"

export default defineSchema({
  // VexBlocks CMS tables
  ...cmsSchemaExports,

  // Your existing tables
  users: defineTable({
    // ...
  }),
})`}
				</CodeBlock>

				<Callout type="success">
					<p>
						<strong>Smart Merging:</strong> The CLI detects existing schemas and
						merges safely without overwriting your custom tables.
					</p>
				</Callout>

				<h2>Protected Files</h2>
				<p>
					The following files are protected and will <strong>never</strong> be
					overwritten:
				</p>
				<ul>
					<li>
						<InlineCode>packages/backend/vexblocks.config.ts</InlineCode> - Your
						CMS configuration
					</li>
					<li>
						<InlineCode>packages/backend/.env</InlineCode> - Environment
						variables
					</li>
					<li>
						<InlineCode>packages/backend/.env.local</InlineCode> - Local
						environment overrides
					</li>
					<li>
						<InlineCode>packages/cms-shared/src/types/generated.ts</InlineCode>{" "}
						- Your generated types
					</li>
				</ul>

				<Callout type="warning">
					<p>
						<strong>Important:</strong> Your custom schema types in{" "}
						<InlineCode>generated.ts</InlineCode> are preserved to prevent loss
						of your content structure definitions.
					</p>
				</Callout>

				<h2>After Installation</h2>
				<p>Once packages are installed, you should:</p>
				<ol>
					<li>
						Install dependencies: <InlineCode>pnpm install</InlineCode>
					</li>
					<li>
						Configure VexBlocks settings in{" "}
						<InlineCode>packages/backend/vexblocks.config.ts</InlineCode> (set
						your app name and email settings)
					</li>
					<li>
						Configure environment variables in <InlineCode>.env</InlineCode>
					</li>
					<li>
						Set up Convex: <InlineCode>npx convex dev</InlineCode> in{" "}
						<InlineCode>packages/backend</InlineCode>
					</li>
					<li>
						Start development: <InlineCode>pnpm dev</InlineCode>
					</li>
				</ol>

				<h2>Related Commands</h2>
				<ul>
					<li>
						<Link href="/docs/cli/init">
							<InlineCode>init</InlineCode> - Initialize a new project
						</Link>
					</li>
					<li>
						<Link href="/docs/cli/upgrade">
							<InlineCode>upgrade</InlineCode> - Upgrade installed packages
						</Link>
					</li>
					<li>
						<Link href="/docs/cli/diff">
							<InlineCode>diff</InlineCode> - Compare local vs remote versions
						</Link>
					</li>
				</ul>
			</div>
		</div>
	)
}
