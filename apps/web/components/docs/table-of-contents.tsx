"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type Heading = {
	id: string
	text: string
	level: number
}

export function TableOfContents() {
	const [headings, setHeadings] = useState<Heading[]>([])
	const [activeId, setActiveId] = useState<string>("")

	useEffect(() => {
		const updateHeadings = () => {
			// Get all h2 and h3 headings from the page
			const elements = Array.from(
				document.querySelectorAll("article h2, article h3"),
			)

			const headingElements = elements.map((element) => ({
				id: element.id,
				text: element.textContent || "",
				level: Number(element.tagName.charAt(1)),
			}))

			setHeadings(headingElements)

			// Set up intersection observer for active heading
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							setActiveId(entry.target.id)
						}
					})
				},
				{ rootMargin: "-100px 0px -66%" },
			)

			elements.forEach((element) => {
				if (element.id) {
					observer.observe(element)
				}
			})

			return () => {
				elements.forEach((element) => {
					if (element.id) {
						observer.unobserve(element)
					}
				})
			}
		}

		// Initial update
		const cleanup = updateHeadings()

		// Update when DOM changes (for dynamic content)
		const mutationObserver = new MutationObserver(() => {
			cleanup?.()
			updateHeadings()
		})

		const article = document.querySelector("article")
		if (article) {
			mutationObserver.observe(article, {
				childList: true,
				subtree: true,
			})
		}

		return () => {
			cleanup?.()
			mutationObserver.disconnect()
		}
	}, [])

	if (headings.length === 0) {
		return null
	}

	return (
		<div className="hidden xl:block">
			<div className="sticky top-24 -mt-10 max-h-[calc(100vh-6rem)] overflow-y-auto pt-10">
				<div className="space-y-3">
					<p className="font-semibold text-sm">On This Page</p>
					<nav>
						<ul className="m-0 list-none space-y-2">
							{headings.map((heading) => (
								<li
									key={heading.id}
									className={cn(heading.level === 3 && "ml-4")}
								>
									<a
										href={`#${heading.id}`}
										className={cn(
											"inline-block border-l-2 py-1 text-sm no-underline transition-colors hover:text-foreground",
											activeId === heading.id
												? "border-foreground pl-3 font-medium text-foreground"
												: "border-transparent pl-3 text-muted-foreground hover:border-muted-foreground/40",
										)}
										onClick={(e) => {
											e.preventDefault()
											document.getElementById(heading.id)?.scrollIntoView({
												behavior: "smooth",
												block: "start",
											})
										}}
									>
										{heading.text}
									</a>
								</li>
							))}
						</ul>
					</nav>
				</div>
			</div>
		</div>
	)
}
