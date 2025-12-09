import {
	Blocks,
	Code2,
	Database,
	FileText,
	Globe,
	Layers,
	Lock,
	RefreshCw,
	Zap,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/atoms/button"
import { Container } from "@/components/atoms/container"
import { Heading } from "@/components/atoms/heading"
import { Text } from "@/components/atoms/text"

export default function HomePage() {
	return (
		<>
			{/* Hero Section */}
			<section className="bg-linear-to-b from-white to-teal-50 py-20 md:py-32">
				<Container>
					<div className="mx-auto max-w-4xl text-center">
						<Heading as="h1" size="6xl" className="mb-6">
							The Open Source Headless CMS
							<br />
							<span className="text-teal-700">Built for Convex</span>
						</Heading>
						<Text className="mx-auto mb-8 max-w-2xl text-gray-600 text-xl">
							VexBlocks is a powerful, type-safe headless CMS built on Convex
							and Next.js. Create, manage, and deliver content with real-time
							updates and zero configuration.
						</Text>
						<div className="flex justify-center gap-4">
							<Link href="/blog">
								<Button size="md">View Demo</Button>
							</Link>
							<Button size="md" variant="ghost">
								Read Documentation
							</Button>
						</div>
					</div>
				</Container>
			</section>

			{/* Features Grid */}
			<section className="bg-white py-20">
				<Container>
					<div className="mb-16 text-center">
						<Heading as="h2" className="mb-4 text-4xl">
							Everything you need to manage content
						</Heading>
						<Text className="text-gray-600 text-lg">
							Built with modern tools and best practices
						</Text>
					</div>

					<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
						{/* Feature 1 */}
						<div className="rounded-lg border border-gray-200 p-6 transition-all hover:border-teal-300 hover:shadow-lg">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50">
								<Database className="h-6 w-6 text-teal-700" />
							</div>
							<Heading as="h3" className="mb-2 text-xl">
								Powered by Convex
							</Heading>
							<Text className="text-gray-600">
								Real-time database with automatic sync, type safety, and
								serverless functions out of the box.
							</Text>
						</div>

						{/* Feature 2 */}
						<div className="rounded-lg border border-gray-200 p-6 transition-all hover:border-teal-300 hover:shadow-lg">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50">
								<Blocks className="h-6 w-6 text-teal-700" />
							</div>
							<Heading as="h3" className="mb-2 text-xl">
								Flexible Content Types
							</Heading>
							<Text className="text-gray-600">
								Create Global singletons, unique Pages, and repeatable
								Collections with custom fields and validation.
							</Text>
						</div>

						{/* Feature 3 */}
						<div className="rounded-lg border border-gray-200 p-6 transition-all hover:border-teal-300 hover:shadow-lg">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50">
								<Zap className="h-6 w-6 text-teal-700" />
							</div>
							<Heading as="h3" className="mb-2 text-xl">
								Real-time Updates
							</Heading>
							<Text className="text-gray-600">
								Content changes sync instantly across all clients with Convex's
								reactive queries.
							</Text>
						</div>

						{/* Feature 4 */}
						<div className="rounded-lg border border-gray-200 p-6 transition-all hover:border-teal-300 hover:shadow-lg">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50">
								<FileText className="h-6 w-6 text-teal-700" />
							</div>
							<Heading as="h3" className="mb-2 text-xl">
								Rich Text Editor
							</Heading>
							<Text className="text-gray-600">
								Built-in Lexical editor with formatting, media embeds, and
								custom blocks support.
							</Text>
						</div>

						{/* Feature 5 */}
						<div className="rounded-lg border border-gray-200 p-6 transition-all hover:border-teal-300 hover:shadow-lg">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50">
								<Lock className="h-6 w-6 text-teal-700" />
							</div>
							<Heading as="h3" className="mb-2 text-xl">
								Draft & Publish Workflow
							</Heading>
							<Text className="text-gray-600">
								Work on drafts privately and publish when ready. Full version
								control and content scheduling.
							</Text>
						</div>

						{/* Feature 6 */}
						<div className="rounded-lg border border-gray-200 p-6 transition-all hover:border-teal-300 hover:shadow-lg">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50">
								<RefreshCw className="h-6 w-6 text-teal-700" />
							</div>
							<Heading as="h3" className="mb-2 text-xl">
								ISR Revalidation
							</Heading>
							<Text className="text-gray-600">
								Automatic Next.js revalidation on content updates for optimal
								performance and SEO.
							</Text>
						</div>

						{/* Feature 7 */}
						<div className="rounded-lg border border-gray-200 p-6 transition-all hover:border-teal-300 hover:shadow-lg">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50">
								<Globe className="h-6 w-6 text-teal-700" />
							</div>
							<Heading as="h3" className="mb-2 text-xl">
								SEO Optimized
							</Heading>
							<Text className="text-gray-600">
								Built-in SEO metadata fields for pages and collections. Control
								titles, descriptions, and OG images.
							</Text>
						</div>

						{/* Feature 8 */}
						<div className="rounded-lg border border-gray-200 p-6 transition-all hover:border-teal-300 hover:shadow-lg">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50">
								<Code2 className="h-6 w-6 text-teal-700" />
							</div>
							<Heading as="h3" className="mb-2 text-xl">
								Type-Safe API
							</Heading>
							<Text className="text-gray-600">
								Full TypeScript support with auto-generated types from your
								Convex schema.
							</Text>
						</div>

						{/* Feature 9 */}
						<div className="rounded-lg border border-gray-200 p-6 transition-all hover:border-teal-300 hover:shadow-lg">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50">
								<Layers className="h-6 w-6 text-teal-700" />
							</div>
							<Heading as="h3" className="mb-2 text-xl">
								Turborepo Monorepo
							</Heading>
							<Text className="text-gray-600">
								Organized workspace with separate CMS admin and web apps,
								sharing backend logic.
							</Text>
						</div>
					</div>
				</Container>
			</section>

			{/* Content Types Section */}
			<section className="bg-linear-to-b from-teal-50 to-white py-20">
				<Container>
					<div className="mb-16 text-center">
						<Heading as="h2" className="mb-4 text-4xl">
							Three Content Types, Infinite Possibilities
						</Heading>
						<Text className="text-gray-600 text-lg">
							Choose the right content type for your use case
						</Text>
					</div>

					<div className="grid gap-8 md:grid-cols-3">
						<div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
							<div className="mb-2 font-bold text-sm text-teal-700">GLOBAL</div>
							<Heading as="h3" className="mb-4 text-2xl">
								Singleton Content
							</Heading>
							<Text className="mb-6 text-gray-600">
								Unique, site-wide content that appears across all pages. Perfect
								for headers, footers, and site settings.
							</Text>
							<ul className="space-y-2 text-gray-600 text-sm">
								<li className="flex items-start gap-2">
									<span className="mt-1 text-teal-700">✓</span>
									<span>Only 1 published instance</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="mt-1 text-teal-700">✓</span>
									<span>No slug required</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="mt-1 text-teal-700">✓</span>
									<span>Multiple drafts allowed</span>
								</li>
							</ul>
						</div>

						<div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
							<div className="mb-2 font-bold text-sm text-teal-700">PAGE</div>
							<Heading as="h3" className="mb-4 text-2xl">
								Unique Pages
							</Heading>
							<Text className="mb-6 text-gray-600">
								Static pages with unique content per slug. Ideal for About,
								Contact, and landing pages.
							</Text>
							<ul className="space-y-2 text-gray-600 text-sm">
								<li className="flex items-start gap-2">
									<span className="mt-1 text-teal-700">✓</span>
									<span>1 instance per unique slug</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="mt-1 text-teal-700">✓</span>
									<span>SEO metadata supported</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="mt-1 text-teal-700">✓</span>
									<span>Slug required and unique</span>
								</li>
							</ul>
						</div>

						<div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
							<div className="mb-2 font-bold text-sm text-teal-700">
								COLLECTION
							</div>
							<Heading as="h3" className="mb-4 text-2xl">
								Multiple Instances
							</Heading>
							<Text className="mb-6 text-gray-600">
								Repeatable content with multiple entries. Perfect for blog
								posts, products, and team members.
							</Text>
							<ul className="space-y-2 text-gray-600 text-sm">
								<li className="flex items-start gap-2">
									<span className="mt-1 text-teal-700">✓</span>
									<span>Unlimited instances</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="mt-1 text-teal-700">✓</span>
									<span>SEO metadata supported</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="mt-1 text-teal-700">✓</span>
									<span>Unique slug per instance</span>
								</li>
							</ul>
						</div>
					</div>
				</Container>
			</section>

			{/* CTA Section */}
			<section className="bg-primary py-20 text-white">
				<Container>
					<div className="mx-auto max-w-3xl text-center">
						<Heading as="h2" size="4xl" color="light" className="mb-4">
							Ready to build something amazing?
						</Heading>
						<Text className="mb-8 text-teal-100 text-xl">
							See VexBlocks in action with our blog demo, or start building your
							own content-driven application today.
						</Text>
						<div className="flex justify-center gap-4">
							<Link href="/blog">
								<Button size="md" variant="secondary">
									View Blog Demo
								</Button>
							</Link>
							<Button size="md">Get Started</Button>
						</div>
					</div>
				</Container>
			</section>
		</>
	)
}
