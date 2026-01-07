import { Check, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Callout, Step, Steps } from "@/components/docs/mdx-components"

export default function InstallationPage() {
	return (
		<div className="mx-auto w-full min-w-0">
			<div className="mb-8 space-y-4">
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Link href="/docs" className="hover:text-foreground">
						Documentation
					</Link>
					<ChevronRight className="h-4 w-4" />
					<span>Installation</span>
				</div>
				<h1 className="font-bold text-4xl tracking-tight">Installation</h1>
				<p className="text-muted-foreground text-xl">
					Get VexBlocks up and running in your project
				</p>
			</div>

			<h2>Requirements</h2>
			<p>Before you begin, make sure you have the following installed:</p>

			<div className="not-prose my-6 grid gap-3">
				<div className="flex items-center gap-3 rounded-lg border p-4">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
						<Check className="h-4 w-4 text-primary" />
					</div>
					<div>
						<div className="font-medium">Node.js 18.17 or higher</div>
						<div className="text-muted-foreground text-sm">
							Check with <code className="text-xs">node --version</code>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-3 rounded-lg border p-4">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
						<Check className="h-4 w-4 text-primary" />
					</div>
					<div>
						<div className="font-medium">pnpm 9.0 or higher</div>
						<div className="text-muted-foreground text-sm">
							Install with <code className="text-xs">npm install -g pnpm</code>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-3 rounded-lg border p-4">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
						<Check className="h-4 w-4 text-primary" />
					</div>
					<div>
						<div className="font-medium">Git</div>
						<div className="text-muted-foreground text-sm">
							For version control
						</div>
					</div>
				</div>
			</div>

			<h2>Installation Steps</h2>

			<Steps>
				<Step>
					<h3>Create a New Project</h3>
					<p>
						Run the VexBlocks CLI to create a new project. This will set up a
						complete Turborepo monorepo with all the necessary configuration:
					</p>
					<pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 dark:bg-zinc-900">
						<code className="font-mono text-sm text-white">
							npx @vexblocks/cli init
						</code>
					</pre>
					<p>Follow the interactive prompts to configure your project.</p>
				</Step>

				<Step>
					<h3>Navigate to Project</h3>
					<p>Change into your newly created project directory:</p>
					<pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 dark:bg-zinc-900">
						<code className="font-mono text-sm text-white">
							cd my-vexblocks-project
						</code>
					</pre>
				</Step>

				<Step>
					<h3>Install Dependencies</h3>
					<p>Install all required npm packages using pnpm:</p>
					<pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 dark:bg-zinc-900">
						<code className="font-mono text-sm text-white">pnpm install</code>
					</pre>
				</Step>

				<Step>
					<h3>Add VexBlocks Packages</h3>
					<p>Add the CMS dashboard, backend, and other packages:</p>
					<pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 dark:bg-zinc-900">
						<code className="font-mono text-sm text-white">
							npx @vexblocks/cli add all
						</code>
					</pre>
					<p>
						This installs the CMS dashboard, Convex backend, shared utilities,
						and type generator.
					</p>
				</Step>

				<Step>
					<h3>Set Up Convex</h3>
					<p>Create a Convex account and initialize your backend:</p>
					<pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 dark:bg-zinc-900">
						<code className="font-mono text-sm text-white">
							{`cd packages/backend
npx convex dev`}
						</code>
					</pre>
					<p>
						This will prompt you to log in and create a new Convex project. Copy
						the deployment URL when provided.
					</p>
				</Step>

				<Step>
					<h3>Configure Environment Variables</h3>
					<p>
						Copy the environment example file and fill in your Convex deployment
						details:
					</p>
					<pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 dark:bg-zinc-900">
						<code className="font-mono text-sm text-white">
							{`# In the root of your project
cp .env.example .env.local

# Add your Convex URL
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=your-deployment
SITE_URL=http://localhost:3001`}
						</code>
					</pre>
				</Step>

				<Step>
					<h3>Start Development</h3>
					<p>Run the development server for all packages:</p>
					<pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 dark:bg-zinc-900">
						<code className="font-mono text-sm text-white">pnpm dev</code>
					</pre>
					<p>This will start:</p>
					<ul>
						<li>
							CMS Dashboard at <code>http://localhost:3001</code>
						</li>
						<li>Convex backend (watching for changes)</li>
						<li>Any other apps in your workspace</li>
					</ul>
				</Step>
			</Steps>

			<Callout type="success">
				<p>
					<strong>Success!</strong> Your VexBlocks CMS is now running. Visit{" "}
					<code>http://localhost:3001</code> to access the dashboard.
				</p>
			</Callout>

			<h2>Adding to Existing Project</h2>
			<p>
				If you already have a Turborepo project and want to add VexBlocks to it:
			</p>

			<pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 dark:bg-zinc-900">
				<code className="font-mono text-sm text-white">
					{`# In your Turborepo root
npx @vexblocks/cli init

# Then add packages
npx @vexblocks/cli add all`}
				</code>
			</pre>

			<Callout type="info">
				<p>
					The CLI will detect your existing Turborepo and integrate VexBlocks
					seamlessly.
				</p>
			</Callout>

			<h2>Optional: Cloudflare Images</h2>
			<p>
				For the media library feature, you can optionally set up Cloudflare
				Images:
			</p>

			<ol>
				<li>Create a Cloudflare account</li>
				<li>Enable Cloudflare Images in your dashboard</li>
				<li>
					Add your account ID and API token to <code>.env.local</code>:
				</li>
			</ol>

			<pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 dark:bg-zinc-900">
				<code className="font-mono text-sm text-white">
					{`CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_SECRET_TOKEN=your-api-token`}
				</code>
			</pre>

			<h2>Troubleshooting</h2>

			<h3>Port Already in Use</h3>
			<p>
				If port 3001 is already in use, you can change it in{" "}
				<code>apps/cms/package.json</code>:
			</p>

			<pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 dark:bg-zinc-900">
				<code className="font-mono text-sm text-white">
					{`"scripts": {
  "dev": "next dev --port 3002"
}`}
				</code>
			</pre>

			<h3>Convex Connection Errors</h3>
			<p>Make sure:</p>
			<ul>
				<li>
					Your <code>NEXT_PUBLIC_CONVEX_URL</code> is correctly set
				</li>
				<li>
					The Convex backend is running (<code>npx convex dev</code> in{" "}
					<code>packages/backend</code>)
				</li>
				<li>You're logged in to Convex</li>
			</ul>

			<h3>pnpm Install Fails</h3>
			<p>Try clearing the pnpm cache and reinstalling:</p>

			<pre className="overflow-x-auto rounded-lg border bg-zinc-950 p-4 dark:bg-zinc-900">
				<code className="font-mono text-sm text-white">
					{`pnpm store prune
pnpm install`}
				</code>
			</pre>

			<h2>Next Steps</h2>
			<ul>
				<li>
					<Link href="/docs/quick-start">Follow the Quick Start guide</Link> to
					create your first schema
				</li>
				<li>
					<Link href="/docs/guides/creating-schemas">
						Learn about creating schemas
					</Link>
				</li>
				<li>
					<Link href="/docs/cli">Explore CLI commands</Link> for managing your
					project
				</li>
			</ul>
		</div>
	)
}
