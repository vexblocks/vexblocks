import { ChevronRight } from "lucide-react"
import Link from "next/link"
import {
	Callout,
	CodeBlock,
	InlineCode,
	Step,
	Steps,
} from "@/components/docs/mdx-components"

export default function CLIInitPage() {
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
					<span>init</span>
				</div>
				<h1 className="text-4xl font-bold tracking-tight">
					<code className="font-mono">init</code>
				</h1>
				<p className="text-xl text-muted-foreground">
					Initialize a new VexBlocks project
				</p>
			</div>

			<div className="prose prose-gray dark:prose-invert max-w-none">
				<h2>Usage</h2>
				<CodeBlock>npx @vexblocks/cli init [options]</CodeBlock>

				<h2>Description</h2>
				<p>
					The <InlineCode>init</InlineCode> command creates a new VexBlocks
					project with a complete Turborepo monorepo structure. It sets up all
					necessary configuration files and prepares your project for
					development.
				</p>

				<h2>What It Does</h2>
				<p>Running this command will:</p>
				<ul>
					<li>Detect if you're in an existing Turborepo project</li>
					<li>Create a new project directory (if creating a new project)</li>
					<li>Set up the monorepo structure with apps and packages folders</li>
					<li>
						Generate configuration files (<InlineCode>package.json</InlineCode>,{" "}
						<InlineCode>turbo.json</InlineCode>,{" "}
						<InlineCode>pnpm-workspace.yaml</InlineCode>)
					</li>
					<li>
						Create a <InlineCode>vexblocks.json</InlineCode> manifest file
					</li>
					<li>Set up environment variable templates</li>
				</ul>

				<h2>Interactive Setup</h2>
				<p>
					When you run <InlineCode>init</InlineCode>, you'll be guided through
					an interactive setup:
				</p>

				<Steps>
					<Step>
						<h3>Choose Project Type</h3>
						<p>
							Select whether to create a new Turborepo project or add VexBlocks
							to an existing one.
						</p>
						<Callout type="info">
							<p>
								If the CLI detects an existing{" "}
								<InlineCode>turbo.json</InlineCode> file, it will automatically
								skip to initializing in the current directory.
							</p>
						</Callout>
					</Step>

					<Step>
						<h3>Enter Project Name</h3>
						<p>
							If creating a new project, you'll be prompted for a project name.
							The name must contain only lowercase letters, numbers, hyphens,
							and underscores.
						</p>
					</Step>

					<Step>
						<h3>Confirm Setup</h3>
						<p>
							Review the setup and confirm to proceed. The CLI will create all
							necessary files and directories.
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
							<td>Skip all prompts and use defaults</td>
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

				<h3>Create a New Project</h3>
				<CodeBlock>npx @vexblocks/cli init</CodeBlock>
				<p>This will prompt you to create a new Turborepo project.</p>

				<h3>Initialize in Current Directory</h3>
				<p>
					If you already have a Turborepo project, navigate to its root and run:
				</p>
				<CodeBlock>npx @vexblocks/cli init</CodeBlock>

				<h3>Skip All Prompts</h3>
				<CodeBlock>npx @vexblocks/cli init --yes</CodeBlock>

				<h2>Generated Structure</h2>
				<p>After initialization, your project will have this structure:</p>

				<CodeBlock>
					{`my-vexblocks-project/
├── apps/                      # Application packages
├── packages/                  # Shared packages
├── .gitignore
├── .env.example              # Environment variables template
├── package.json              # Root package.json
├── pnpm-workspace.yaml       # pnpm workspace config
├── turbo.json                # Turborepo configuration
└── vexblocks.json            # VexBlocks manifest`}
				</CodeBlock>

				<h2>Environment Variables</h2>
				<p>
					The CLI creates an <InlineCode>.env.example</InlineCode> file with all
					required environment variables:
				</p>

				<CodeBlock>
					{`# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Better Auth
SITE_URL=http://localhost:3001

# Cloudflare Images (optional)
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_SECRET_TOKEN=

# Revalidation (optional)
REVALIDATE_SECRET=
FRONTEND_URL=http://localhost:3000`}
				</CodeBlock>

				<Callout type="warning">
					<p>
						<strong>Important:</strong> Copy{" "}
						<InlineCode>.env.example</InlineCode> to{" "}
						<InlineCode>.env.local</InlineCode> and fill in your actual values
						before running the project.
					</p>
				</Callout>

				<h2>Next Steps</h2>
				<p>After initialization, you should:</p>
				<ol>
					<li>
						Navigate to your project directory:{" "}
						<InlineCode>cd my-vexblocks-project</InlineCode>
					</li>
					<li>
						Install dependencies: <InlineCode>pnpm install</InlineCode>
					</li>
					<li>
						Add VexBlocks packages:{" "}
						<InlineCode>npx @vexblocks/cli add all</InlineCode>
					</li>
					<li>Set up your Convex project</li>
					<li>
						Start development: <InlineCode>pnpm dev</InlineCode>
					</li>
				</ol>

				<h2>Related Commands</h2>
				<ul>
					<li>
						<Link href="/docs/cli/add">
							<InlineCode>add</InlineCode> - Add packages to your project
						</Link>
					</li>
					<li>
						<Link href="/docs/cli/upgrade">
							<InlineCode>upgrade</InlineCode> - Upgrade VexBlocks packages
						</Link>
					</li>
				</ul>
			</div>
		</div>
	)
}
