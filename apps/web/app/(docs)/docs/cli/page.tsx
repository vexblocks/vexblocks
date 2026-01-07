import { ChevronRight, Terminal } from "lucide-react"
import Link from "next/link"
import {
	Callout,
	CodeBlock,
	InlineCode,
} from "@/components/docs/mdx-components"

export default function CLIOverviewPage() {
	return (
		<div className="mx-auto w-full min-w-0">
			<div className="mb-8 space-y-4">
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Link href="/docs" className="hover:text-foreground">
						Documentation
					</Link>
					<ChevronRight className="h-4 w-4" />
					<span>CLI Reference</span>
				</div>
				<h1 className="font-bold text-4xl tracking-tight">VexBlocks CLI</h1>
				<p className="text-muted-foreground text-xl">
					Command-line interface for managing your VexBlocks projects
				</p>
			</div>

			<div className="prose prose-gray dark:prose-invert max-w-none">
				<h2>Overview</h2>
				<p>
					The VexBlocks CLI is a powerful tool that helps you scaffold, manage,
					and upgrade your VexBlocks CMS projects. It handles everything from
					initial setup to package management and updates.
				</p>

				<h2>Installation</h2>
				<p>
					The CLI is distributed via npm and can be run using{" "}
					<InlineCode>npx</InlineCode> without installation:
				</p>

				<CodeBlock>npx @vexblocks/cli [command]</CodeBlock>

				<p>Or install it globally for frequent use:</p>

				<CodeBlock>npm install -g @vexblocks/cli</CodeBlock>

				<Callout type="info">
					<p>
						<strong>Note:</strong> We recommend using{" "}
						<InlineCode>npx</InlineCode> to always use the latest version.
					</p>
				</Callout>

				<h2>Available Commands</h2>

				<div className="not-prose my-8 grid gap-4">
					<Link
						href="/docs/cli/init"
						className="group block rounded-lg border p-6 transition-colors hover:border-foreground/50"
					>
						<div className="mb-2 flex items-center gap-2">
							<Terminal className="h-5 w-5" />
							<h3 className="font-mono font-semibold text-lg">init</h3>
						</div>
						<p className="mb-3 text-muted-foreground text-sm">
							Initialize a new VexBlocks project with Turborepo structure
						</p>
						<code className="text-muted-foreground text-xs">
							npx @vexblocks/cli init
						</code>
					</Link>

					<Link
						href="/docs/cli/add"
						className="group block rounded-lg border p-6 transition-colors hover:border-foreground/50"
					>
						<div className="mb-2 flex items-center gap-2">
							<Terminal className="h-5 w-5" />
							<h3 className="font-mono font-semibold text-lg">add</h3>
						</div>
						<p className="mb-3 text-muted-foreground text-sm">
							Add VexBlocks packages (CMS, backend, shared utilities) to your
							project
						</p>
						<code className="text-muted-foreground text-xs">
							npx @vexblocks/cli add [package]
						</code>
					</Link>

					<Link
						href="/docs/cli/upgrade"
						className="group block rounded-lg border p-6 transition-colors hover:border-foreground/50"
					>
						<div className="mb-2 flex items-center gap-2">
							<Terminal className="h-5 w-5" />
							<h3 className="font-mono font-semibold text-lg">upgrade</h3>
						</div>
						<p className="mb-3 text-muted-foreground text-sm">
							Upgrade VexBlocks packages to the latest version
						</p>
						<code className="text-muted-foreground text-xs">
							npx @vexblocks/cli upgrade
						</code>
					</Link>

					<Link
						href="/docs/cli/diff"
						className="group block rounded-lg border p-6 transition-colors hover:border-foreground/50"
					>
						<div className="mb-2 flex items-center gap-2">
							<Terminal className="h-5 w-5" />
							<h3 className="font-mono font-semibold text-lg">diff</h3>
						</div>
						<p className="mb-3 text-muted-foreground text-sm">
							Compare your local packages with the latest version from the
							repository
						</p>
						<code className="text-muted-foreground text-xs">
							npx @vexblocks/cli diff
						</code>
					</Link>
				</div>

				<h2>Global Options</h2>
				<p>All commands support the following global options:</p>

				<table>
					<thead>
						<tr>
							<th>Option</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<InlineCode>--yes</InlineCode>, <InlineCode>-y</InlineCode>
							</td>
							<td>Skip all prompts and use default values</td>
						</tr>
						<tr>
							<td>
								<InlineCode>--cwd</InlineCode>
							</td>
							<td>Set the working directory for the command</td>
						</tr>
						<tr>
							<td>
								<InlineCode>--help</InlineCode>, <InlineCode>-h</InlineCode>
							</td>
							<td>Display help for the command</td>
						</tr>
					</tbody>
				</table>

				<h2>Project Structure</h2>
				<p>VexBlocks projects follow a Turborepo monorepo structure:</p>

				<CodeBlock>
					{`my-project/
├── apps/
│   └── cms/                    # CMS Dashboard (Next.js)
├── packages/
│   ├── backend/               # Convex backend
│   ├── cms-shared/            # Shared utilities & types
│   └── type-generator/        # Type generation tool
├── package.json
├── turbo.json
└── vexblocks.json            # VexBlocks manifest`}
				</CodeBlock>

				<h2>Manifest File</h2>
				<p>
					The <InlineCode>vexblocks.json</InlineCode> file tracks installed
					packages and versions:
				</p>

				<CodeBlock>
					{`{
  "version": "1.0.0",
  "packages": {
    "cms": {
      "version": "1.0.0",
      "installedAt": "2024-01-15T10:30:00.000Z",
      "path": "apps/cms"
    },
    "backend": {
      "version": "1.0.0",
      "installedAt": "2024-01-15T10:30:00.000Z",
      "path": "packages/backend"
    }
  }
}`}
				</CodeBlock>

				<Callout type="warning">
					<p>
						<strong>Important:</strong> Some files are protected and won't be
						overwritten during upgrades:
					</p>
					<ul className="mt-2">
						<li>
							<InlineCode>packages/backend/vexblocks.config.ts</InlineCode>
						</li>
						<li>
							<InlineCode>packages/backend/.env</InlineCode>
						</li>
						<li>
							<InlineCode>
								packages/cms-shared/src/types/generated.ts
							</InlineCode>
						</li>
					</ul>
				</Callout>

				<h2>Next Steps</h2>
				<ul>
					<li>
						<Link href="/docs/cli/init">Initialize a new project</Link>
					</li>
					<li>
						<Link href="/docs/cli/add">Add packages to your project</Link>
					</li>
					<li>
						<Link href="/docs/guides/creating-schemas">
							Learn about creating schemas
						</Link>
					</li>
				</ul>
			</div>
		</div>
	)
}
