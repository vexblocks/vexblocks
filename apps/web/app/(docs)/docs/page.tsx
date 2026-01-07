import { ArrowRight, Code2, Puzzle, Shield, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/atoms/button"

export default function DocsPage() {
	return (
		<div className="mx-auto w-full min-w-0">
			<div className="mb-8 space-y-4">
				<h1 className="font-bold text-4xl tracking-tight">
					Welcome to VexBlocks
				</h1>
				<p className="text-muted-foreground text-xl">
					A modern, type-safe headless CMS built with Convex, Next.js, and
					TypeScript.
				</p>
			</div>

			<div className="mb-12 grid gap-4 md:grid-cols-2">
				<Link
					href="/docs/installation"
					className="group relative overflow-hidden rounded-lg border p-6 transition-colors hover:border-foreground/50"
				>
					<div className="flex items-start gap-4">
						<div className="rounded-lg bg-primary/10 p-2">
							<Zap className="h-6 w-6" />
						</div>
						<div className="flex-1">
							<h3 className="mb-1 flex items-center font-semibold">
								Quick Start
								<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
							</h3>
							<p className="text-muted-foreground text-sm">
								Get started with VexBlocks in minutes
							</p>
						</div>
					</div>
				</Link>

				<Link
					href="/docs/cli"
					className="group relative overflow-hidden rounded-lg border p-6 transition-colors hover:border-foreground/50"
				>
					<div className="flex items-start gap-4">
						<div className="rounded-lg bg-primary/10 p-2">
							<Code2 className="h-6 w-6" />
						</div>
						<div className="flex-1">
							<h3 className="mb-1 flex items-center font-semibold">
								CLI Reference
								<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
							</h3>
							<p className="text-muted-foreground text-sm">
								Learn about the VexBlocks CLI commands
							</p>
						</div>
					</div>
				</Link>
			</div>

			<div className="prose prose-gray dark:prose-invert max-w-none">
				<h2>What is VexBlocks?</h2>
				<p>
					VexBlocks is a powerful headless CMS that combines the best of modern
					web technologies. Built on top of Convex for real-time database
					capabilities, it offers:
				</p>

				<div className="not-prose my-8 grid gap-6 md:grid-cols-2">
					<div className="rounded-lg border p-6">
						<div className="mb-4 w-fit rounded-lg bg-primary/10 p-2">
							<Shield className="h-6 w-6" />
						</div>
						<h3 className="mb-2 font-semibold">Type Safety</h3>
						<p className="text-muted-foreground text-sm">
							Full TypeScript support with auto-generated types from your
							schemas. Catch errors at compile time, not runtime.
						</p>
					</div>

					<div className="rounded-lg border p-6">
						<div className="mb-4 w-fit rounded-lg bg-primary/10 p-2">
							<Zap className="h-6 w-6" />
						</div>
						<h3 className="mb-2 font-semibold">Real-time Updates</h3>
						<p className="text-muted-foreground text-sm">
							Built on Convex, your content updates in real-time across all
							connected clients without polling.
						</p>
					</div>

					<div className="rounded-lg border p-6">
						<div className="mb-4 w-fit rounded-lg bg-primary/10 p-2">
							<Puzzle className="h-6 w-6" />
						</div>
						<h3 className="mb-2 font-semibold">Flexible Schemas</h3>
						<p className="text-muted-foreground text-sm">
							Define custom content schemas with various field types including
							text, media, references, and more.
						</p>
					</div>

					<div className="rounded-lg border p-6">
						<div className="mb-4 w-fit rounded-lg bg-primary/10 p-2">
							<Code2 className="h-6 w-6" />
						</div>
						<h3 className="mb-2 font-semibold">Developer Experience</h3>
						<p className="text-muted-foreground text-sm">
							Powerful CLI tools, visual editing, and a modern dashboard make
							development a breeze.
						</p>
					</div>
				</div>

				<h2>Getting Started</h2>
				<p>
					The fastest way to get started with VexBlocks is using our CLI. It
					will set up everything you need:
				</p>

				<pre className="overflow-x-auto rounded-lg border bg-zinc-950 px-4 py-4 dark:bg-zinc-900">
					<code className="font-mono text-sm text-white">
						npx @vexblocks/cli init
					</code>
				</pre>

				<p>This command will:</p>
				<ul>
					<li>Create a new Turborepo project structure</li>
					<li>Set up the CMS dashboard</li>
					<li>Configure Convex backend</li>
					<li>Generate TypeScript types</li>
				</ul>

				<h2>Next Steps</h2>
				<div className="not-prose mt-4 flex flex-col gap-2">
					<Link href="/docs/installation">
						<Button variant="ghost" className="w-full justify-start">
							<ArrowRight className="mr-2 h-4 w-4" />
							Read the installation guide
						</Button>
					</Link>
					<Link href="/docs/cli">
						<Button variant="ghost" className="w-full justify-start">
							<ArrowRight className="mr-2 h-4 w-4" />
							Explore CLI commands
						</Button>
					</Link>
					<Link href="/docs/guides/creating-schemas">
						<Button variant="ghost" className="w-full justify-start">
							<ArrowRight className="mr-2 h-4 w-4" />
							Learn about schemas
						</Button>
					</Link>
				</div>
			</div>
		</div>
	)
}
