"use client"

import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

type NavItem = {
	title: string
	href?: string
	items?: NavItem[]
}

const docsConfig: NavItem[] = [
	{
		title: "Getting Started",
		items: [
			{
				title: "Introduction",
				href: "/docs",
			},
			{
				title: "Installation",
				href: "/docs/installation",
			},
			{
				title: "Quick Start",
				href: "/docs/quick-start",
			},
		],
	},
	{
		title: "CLI Reference",
		items: [
			{
				title: "Overview",
				href: "/docs/cli",
			},
			{
				title: "init",
				href: "/docs/cli/init",
			},
			{
				title: "add",
				href: "/docs/cli/add",
			},
			{
				title: "upgrade",
				href: "/docs/cli/upgrade",
			},
			{
				title: "diff",
				href: "/docs/cli/diff",
			},
		],
	},
	{
		title: "Guides",
		items: [
			{
				title: "Creating Schemas",
				href: "/docs/guides/creating-schemas",
			},
			{
				title: "Content Management",
				href: "/docs/guides/content-management",
			},
			{
				title: "Type Generation",
				href: "/docs/guides/type-generation",
			},
			{
				title: "Authentication",
				href: "/docs/guides/authentication",
			},
		],
	},
	{
		title: "Advanced",
		items: [
			{
				title: "Custom Fields",
				href: "/docs/advanced/custom-fields",
			},
			{
				title: "Webhooks",
				href: "/docs/advanced/webhooks",
			},
			{
				title: "Media Library",
				href: "/docs/advanced/media-library",
			},
		],
	},
]

function NavGroup({ item, level = 0 }: { item: NavItem; level?: number }) {
	const pathname = usePathname()
	const [isOpen, setIsOpen] = useState(true)

	if (item.items) {
		return (
			<div className="pb-6">
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="mb-2 flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent/50"
				>
					{item.title}
					<ChevronDown
						className={cn(
							"h-4 w-4 transition-transform duration-200",
							isOpen && "rotate-180",
						)}
					/>
				</button>
				{isOpen && (
					<div className="ml-3 space-y-0.5 border-l-2 border-border/40 pl-3">
						{item.items.map((child, index) => (
							<NavGroup key={index} item={child} level={level + 1} />
						))}
					</div>
				)}
			</div>
		)
	}

	if (!item.href) return null

	return (
		<Link
			href={item.href}
			className={cn(
				"group flex w-full items-center rounded-md px-3 py-2 text-sm transition-all duration-200",
				pathname === item.href
					? "bg-accent font-medium text-accent-foreground shadow-sm"
					: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
			)}
		>
			{item.title}
		</Link>
	)
}

export function DocsSidebar() {
	return (
		<aside className="fixed top-16 z-30 hidden h-[calc(100vh-4rem)] w-full shrink-0 border-r bg-background md:sticky md:block">
			<div className="relative h-full overflow-y-auto px-6 py-8">
				<div className="pb-8">
					<h4 className="mb-4 px-3 text-sm font-semibold text-foreground/60">
						Documentation
					</h4>
					<nav className="space-y-1">
						{docsConfig.map((item, index) => (
							<NavGroup key={index} item={item} />
						))}
					</nav>
				</div>
			</div>
		</aside>
	)
}
