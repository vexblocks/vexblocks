"use client"

import { File, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type SearchResult = {
	title: string
	href: string
	category: string
}

const allPages: SearchResult[] = [
	{ title: "Introduction", href: "/docs", category: "Getting Started" },
	{
		title: "Installation",
		href: "/docs/installation",
		category: "Getting Started",
	},
	{
		title: "Quick Start",
		href: "/docs/quick-start",
		category: "Getting Started",
	},
	{ title: "CLI Overview", href: "/docs/cli", category: "CLI Reference" },
	{ title: "init command", href: "/docs/cli/init", category: "CLI Reference" },
	{ title: "add command", href: "/docs/cli/add", category: "CLI Reference" },
	{
		title: "upgrade command",
		href: "/docs/cli/upgrade",
		category: "CLI Reference",
	},
	{ title: "diff command", href: "/docs/cli/diff", category: "CLI Reference" },
	{
		title: "Creating Schemas",
		href: "/docs/guides/creating-schemas",
		category: "Guides",
	},
	{
		title: "Content Management",
		href: "/docs/guides/content-management",
		category: "Guides",
	},
	{
		title: "Type Generation",
		href: "/docs/guides/type-generation",
		category: "Guides",
	},
	{
		title: "Authentication",
		href: "/docs/guides/authentication",
		category: "Guides",
	},
	{
		title: "Custom Fields",
		href: "/docs/advanced/custom-fields",
		category: "Advanced",
	},
	{ title: "Webhooks", href: "/docs/advanced/webhooks", category: "Advanced" },
	{
		title: "Media Library",
		href: "/docs/advanced/media-library",
		category: "Advanced",
	},
]

type DocsSearchDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function DocsSearchDialog({
	open,
	onOpenChange,
}: DocsSearchDialogProps) {
	const [query, setQuery] = useState("")
	const [results, setResults] = useState<SearchResult[]>([])
	const router = useRouter()

	useEffect(() => {
		if (!query) {
			setResults([])
			return
		}

		const filtered = allPages.filter(
			(page) =>
				page.title.toLowerCase().includes(query.toLowerCase()) ||
				page.category.toLowerCase().includes(query.toLowerCase()),
		)

		setResults(filtered)
	}, [query])

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				onOpenChange(!open)
			}
		}

		document.addEventListener("keydown", down)
		return () => document.removeEventListener("keydown", down)
	}, [open, onOpenChange])

	const handleSelect = (href: string) => {
		onOpenChange(false)
		router.push(href)
		setQuery("")
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
				<div className="flex items-center gap-3 border-b px-4 py-3">
					<Search className="h-5 w-5 shrink-0 text-muted-foreground" />
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search documentation..."
						autoFocus
						className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
					/>
				</div>
				{results.length > 0 && (
					<div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
						<div className="p-2">
							{results.map((result, index) => (
								<button
									type="button"
									key={index}
									onClick={() => handleSelect(result.href)}
									className="relative flex w-full cursor-pointer select-none items-center gap-3 rounded-md px-4 py-3 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
								>
									<File className="h-4 w-4 shrink-0 opacity-70" />
									<div className="flex flex-col items-start gap-0.5">
										<span className="font-medium">{result.title}</span>
										<span className="text-muted-foreground text-xs">
											{result.category}
										</span>
									</div>
								</button>
							))}
						</div>
					</div>
				)}
				{query && results.length === 0 && (
					<div className="py-12 text-center text-muted-foreground text-sm">
						No results found.
					</div>
				)}
				{!query && (
					<div className="p-4 text-center text-muted-foreground text-sm">
						Type to search documentation...
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
