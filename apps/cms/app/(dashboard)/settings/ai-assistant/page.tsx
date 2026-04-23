"use client"

import {
	Bot,
	Database,
	FileText,
	Lightbulb,
	MessageSquare,
	Search,
	Shield,
	Wrench,
	Zap,
} from "lucide-react"

export default function AIAssistantDocsPage() {
	return (
		<div className="from-grey-50 min-h-screen bg-linear-to-b to-white">
			<div className="mx-auto max-w-5xl px-6 py-10">
				{/* Header */}
				<header className="mb-12 text-center">
					<div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/80 p-4 shadow-lg shadow-primary/20">
						<Bot className="h-10 w-10 text-white" />
					</div>
					<h1 className="mb-3 text-4xl font-bold tracking-tight text-primary">
						AI Assistant
					</h1>
					<p className="mx-auto max-w-2xl text-lg text-grey-500">
						Your intelligent CMS companion powered by AI. Manage schemas and
						content through natural language conversations.
					</p>
				</header>

				{/* Introduction Cards */}
				<section className="mb-12">
					<div className="grid gap-6 md:grid-cols-2">
						<FeatureCard
							title="Schema Management"
							description="Create, view, and modify content schemas with natural language commands"
							icon={<Database className="h-6 w-6" />}
							color="blue"
						/>
						<FeatureCard
							title="Content Operations"
							description="Add, update, and search content entries across all your schemas"
							icon={<FileText className="h-6 w-6" />}
							color="purple"
						/>
						<FeatureCard
							title="Smart Search"
							description="Find content quickly with intelligent text search across schemas"
							icon={<Search className="h-6 w-6" />}
							color="green"
						/>
						<FeatureCard
							title="Validation & Preview"
							description="Validate content before saving and preview changes before applying"
							icon={<Wrench className="h-6 w-6" />}
							color="orange"
						/>
					</div>
				</section>

				{/* Example Commands */}
				<section className="mb-12">
					<SectionHeader
						icon={<MessageSquare className="h-5 w-5" />}
						title="Example Commands"
						subtitle="Try these natural language commands to get started"
					/>
					<div className="mt-6 grid gap-6 lg:grid-cols-3">
						<CommandExample
							category="Schemas"
							icon={<Database className="h-4 w-4" />}
							examples={[
								"Show me all schemas",
								"Create a schema for products with name, price, description",
								"What fields does blog_posts have?",
								"Add an author field to articles",
							]}
						/>
						<CommandExample
							category="Content"
							icon={<FileText className="h-4 w-4" />}
							examples={[
								"List all blog posts",
								"Create a product called 'Premium Widget' at $99",
								"Search for content with 'welcome'",
								"Show me draft articles",
							]}
						/>
						<CommandExample
							category="Utilities"
							icon={<Wrench className="h-4 w-4" />}
							examples={[
								"Validate this content before saving",
								"Show stats for the products schema",
								"Preview changes before updating",
							]}
						/>
					</div>
				</section>

				{/* Safety Features */}
				<section className="mb-12">
					<SectionHeader
						icon={<Shield className="h-5 w-5" />}
						title="Safety Features"
						subtitle="Built-in protections to keep your data safe"
					/>
					<div className="mt-6 grid gap-4 sm:grid-cols-2">
						<SafetyItem
							title="No Delete Operations"
							description="The assistant cannot delete schemas or content"
						/>
						<SafetyItem
							title="No Field Removal"
							description="Schema fields can only be added or modified"
						/>
						<SafetyItem
							title="Double Confirmation"
							description="Schema updates require confirmation twice"
						/>
						<SafetyItem
							title="Validation First"
							description="Content is validated before creation"
						/>
					</div>
				</section>

				{/* Available Capabilities */}
				<section className="mb-12">
					<SectionHeader
						icon={<Zap className="h-5 w-5" />}
						title="Available Capabilities"
						subtitle="All the tools at your disposal"
					/>
					<div className="mt-6 space-y-6">
						<ToolCategory
							title="Schema Management"
							icon={<Database className="h-5 w-5" />}
							color="blue"
							tools={[
								{
									name: "List Schemas",
									description: "View all content schemas",
								},
								{
									name: "Get Schema Details",
									description: "See structure and fields",
								},
								{
									name: "Create Schema",
									description: "Create new content types",
								},
								{
									name: "Update Schema",
									description: "Modify existing schemas",
								},
								{
									name: "Schema Statistics",
									description: "Get content counts and summaries",
								},
							]}
						/>
						<ToolCategory
							title="Content Management"
							icon={<FileText className="h-5 w-5" />}
							color="purple"
							tools={[
								{
									name: "List Content",
									description: "View entries, filter by status",
								},
								{
									name: "Get Content",
									description: "View specific entry details",
								},
								{
									name: "Create Content",
									description: "Add new entries to schemas",
								},
								{
									name: "Update Content",
									description: "Modify existing entries",
								},
							]}
						/>
						<ToolCategory
							title="Utility Tools"
							icon={<Wrench className="h-5 w-5" />}
							color="green"
							tools={[
								{
									name: "Validate Content",
									description: "Check data against schema",
								},
								{
									name: "Search Content",
									description: "Find content by text search",
								},
								{
									name: "Preview Changes",
									description: "See changes before applying",
								},
							]}
						/>
					</div>
				</section>

				{/* Tips */}
				<section className="mb-8">
					<div className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-orange-50 p-8">
						<div className="mb-6 flex items-center gap-3">
							<div className="rounded-xl bg-amber-100 p-2.5">
								<Lightbulb className="h-6 w-6 text-amber-600" />
							</div>
							<h2 className="text-grey-900 text-xl font-semibold">
								Tips for Best Results
							</h2>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<TipItem text="Be specific about what you want to create or modify" />
							<TipItem text="Use exact schema names like 'blog_posts' not 'blog'" />
							<TipItem text="List schemas first if unsure what exists" />
							<TipItem text="Break complex operations into smaller steps" />
							<TipItem text="Use 'validate' before creating content" />
							<TipItem text="Ask for help if you're unsure about syntax" />
						</div>
					</div>
				</section>
			</div>
		</div>
	)
}

// Color variants for components
const colorVariants = {
	blue: {
		bg: "bg-blue-50",
		border: "border-blue-100",
		icon: "bg-blue-100 text-blue-600",
		accent: "bg-blue-500",
	},
	purple: {
		bg: "bg-purple-50",
		border: "border-purple-100",
		icon: "bg-purple-100 text-purple-600",
		accent: "bg-purple-500",
	},
	green: {
		bg: "bg-emerald-50",
		border: "border-emerald-100",
		icon: "bg-emerald-100 text-emerald-600",
		accent: "bg-emerald-500",
	},
	orange: {
		bg: "bg-orange-50",
		border: "border-orange-100",
		icon: "bg-orange-100 text-orange-600",
		accent: "bg-orange-500",
	},
} as const

type ColorVariant = keyof typeof colorVariants

// Component: Section Header
function SectionHeader({
	icon,
	title,
	subtitle,
}: {
	icon: React.ReactNode
	title: string
	subtitle: string
}) {
	return (
		<div className="flex items-start gap-4">
			<div className="rounded-xl bg-primary/10 p-3 text-primary">{icon}</div>
			<div>
				<h2 className="text-grey-900 text-xl font-semibold">{title}</h2>
				<p className="mt-1 text-grey-500">{subtitle}</p>
			</div>
		</div>
	)
}

// Component: Feature Card
function FeatureCard({
	title,
	description,
	icon,
	color,
}: {
	title: string
	description: string
	icon: React.ReactNode
	color: ColorVariant
}) {
	const variant = colorVariants[color]
	return (
		<div
			className={`rounded-2xl border ${variant.border} ${variant.bg} p-6 transition-all hover:shadow-md`}
		>
			<div className={`mb-4 inline-flex rounded-xl p-3 ${variant.icon}`}>
				{icon}
			</div>
			<h3 className="text-grey-900 mb-2 text-lg font-semibold">{title}</h3>
			<p className="text-grey-600 leading-relaxed">{description}</p>
		</div>
	)
}

// Component: Command Example
function CommandExample({
	category,
	icon,
	examples,
}: {
	category: string
	icon: React.ReactNode
	examples: string[]
}) {
	return (
		<div className="rounded-2xl border border-grey-200 bg-white p-5 shadow-sm">
			<div className="mb-4 flex items-center gap-2">
				<div className="text-grey-600 rounded-lg bg-grey-100 p-2">{icon}</div>
				<h3 className="text-grey-900 font-semibold">{category}</h3>
			</div>
			<div className="space-y-2">
				{examples.map((example) => (
					<div
						key={example}
						className="bg-grey-50 text-grey-700 rounded-xl px-4 py-3 font-mono text-sm leading-relaxed"
					>
						&quot;{example}&quot;
					</div>
				))}
			</div>
		</div>
	)
}

// Component: Safety Item
function SafetyItem({
	title,
	description,
}: {
	title: string
	description: string
}) {
	return (
		<div className="flex items-start gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
			<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
				<Shield className="h-4 w-4 text-emerald-600" />
			</div>
			<div>
				<h4 className="text-grey-900 font-medium">{title}</h4>
				<p className="text-grey-600 mt-0.5 text-sm">{description}</p>
			</div>
		</div>
	)
}

// Component: Tool Category
function ToolCategory({
	title,
	icon,
	color,
	tools,
}: {
	title: string
	icon: React.ReactNode
	color: ColorVariant
	tools: { name: string; description: string }[]
}) {
	const variant = colorVariants[color]
	return (
		<div className={`rounded-2xl border ${variant.border} ${variant.bg} p-6`}>
			<div className="mb-5 flex items-center gap-3">
				<div className={`rounded-xl p-2.5 ${variant.icon}`}>{icon}</div>
				<h3 className="text-grey-900 text-lg font-semibold">{title}</h3>
			</div>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{tools.map((tool) => (
					<div key={tool.name} className="rounded-xl bg-white/80 p-4 shadow-sm">
						<div className="mb-1 flex items-center gap-2">
							<div className={`h-2 w-2 rounded-full ${variant.accent}`} />
							<span className="text-grey-900 text-sm font-medium">
								{tool.name}
							</span>
						</div>
						<p className="text-sm text-grey-500">{tool.description}</p>
					</div>
				))}
			</div>
		</div>
	)
}

// Component: Tip Item
function TipItem({ text }: { text: string }) {
	return (
		<div className="flex items-start gap-3">
			<div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
			<span className="text-grey-700 leading-relaxed">{text}</span>
		</div>
	)
}
