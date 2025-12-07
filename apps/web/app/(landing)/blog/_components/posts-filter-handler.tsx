"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

/**
 * PostsFilterHandler - Client Component
 *
 * Reads URL searchParams and applies CSS-based filtering to posts.
 * No data fetching - just reads data-post-tags attributes and hides/shows.
 */
export function PostsFilterHandler() {
	const searchParams = useSearchParams()
	const tagsParam = searchParams.get("tags")

	useEffect(() => {
		const selectedTags = tagsParam?.split(",").filter(Boolean) ?? []
		const grid = document.querySelector("[data-posts-grid]")
		const featuredPost = document.querySelector("[data-featured-post]")

		if (!grid) return

		const posts = grid.querySelectorAll("[data-post-tags]")

		if (selectedTags.length === 0) {
			// No filters - show all posts and featured
			posts.forEach((post) => {
				;(post as HTMLElement).style.display = ""
			})
			if (featuredPost) {
				;(featuredPost as HTMLElement).style.display = ""
			}
		} else {
			// Hide featured post when filtering
			if (featuredPost) {
				;(featuredPost as HTMLElement).style.display = "none"
			}

			// Filter posts
			posts.forEach((post) => {
				const postTags = (post as HTMLElement).dataset.postTags?.split(",") ?? []
				const matches = selectedTags.some((tag) => postTags.includes(tag))
				;(post as HTMLElement).style.display = matches ? "" : "none"
			})
		}
	}, [tagsParam])

	// This component renders nothing - it only handles side effects
	return null
}

