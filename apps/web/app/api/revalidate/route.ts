import { revalidatePath, revalidateTag } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Builds a path from a URL pattern by replacing placeholders with actual values
 * Example: "/pdp/{slug}" with slug "my-page" becomes "/pdp/my-page"
 */
function buildPathFromPattern(
	urlPattern: string,
	slug?: string,
	data?: Record<string, string>,
): string {
	let path = urlPattern

	// Replace {slug} placeholder
	if (slug) {
		path = path.replace("{slug}", slug)
	}

	// Replace any other placeholders from data
	if (data) {
		for (const [key, value] of Object.entries(data)) {
			path = path.replace(`{${key}}`, value)
		}
	}

	return path
}

/**
 * Converts a URL pattern to a Next.js dynamic route pattern
 * Example: "/pdp/{slug}" becomes "/pdp/[slug]"
 */
function patternToDynamicRoute(urlPattern: string): string {
	return urlPattern.replace(/\{(\w+)\}/g, "[$1]")
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const {
			contentId,
			secret,
			slug,
			schemaName,
			schemaType,
			urlPattern,
			isDeleted,
		} = body

		// Validate secret
		if (secret !== process.env.REVALIDATE_SECRET) {
			return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
		}

		if (!contentId) {
			return NextResponse.json(
				{ message: "Missing contentId" },
				{ status: 400 },
			)
		}

		// Add a small delay to ensure data propagation/consistency
		await new Promise((resolve) => setTimeout(resolve, 1000))

		// Revalidate the CMS cache tag (clears all cached Convex queries)
		revalidateTag("cms", "max")

		const revalidatedPaths: string[] = []
		const revalidatedTags: string[] = ["cms"]

		// Global schemas affect the layout — revalidate all pages
		if (schemaType === "global") {
			revalidatePath("/", "layout")
			revalidatedPaths.push("/")
			console.log(`Revalidated layout for global schema: ${schemaName}`)
		}

		// If urlPattern is provided, use it to build the path (more flexible approach)
		if (urlPattern && slug) {
			const specificPath = buildPathFromPattern(urlPattern, slug)
			revalidatePath(specificPath)
			revalidatedPaths.push(specificPath)
			console.log(
				`Revalidated path from urlPattern: ${specificPath}${isDeleted ? " (deleted)" : ""}`,
			)

			// Also revalidate the dynamic route pattern
			const dynamicRoute = patternToDynamicRoute(urlPattern)
			revalidatePath(dynamicRoute, "page")
			revalidatedPaths.push(dynamicRoute)

			// Revalidate a tag based on the first segment of the path
			const pathSegments = urlPattern.split("/").filter(Boolean)
			if (pathSegments.length > 0) {
				const firstSegment = pathSegments[0]
				if (!firstSegment.includes("{")) {
					revalidateTag(firstSegment, "max")
					revalidatedTags.push(firstSegment)
				}
			}

			// Also revalidate specific tag for this slug
			if (slug) {
				const slugTag = `${pathSegments[0]}-${slug}`
				revalidateTag(slugTag, "max")
				revalidatedTags.push(slugTag)
			}
		}
		// Fallback: Handle revalidation based on schema name (legacy support)
		else if (schemaName === "pdp") {
			// Revalidate PDP pages
			if (slug) {
				const path = `/pdp/${slug}`
				revalidatePath(path)
				revalidatedPaths.push(path)
			}

			// Revalidate the PDP cache tag
			revalidateTag("pdp", "max")
			revalidatedTags.push("pdp")

			// Also revalidate specific tag for this slug
			if (slug) {
				revalidateTag(`pdp-${slug}`, "max")
				revalidatedTags.push(`pdp-${slug}`)
			}

			// Revalidate the dynamic route pattern for PDP
			revalidatePath("/pdp/[slug]", "page")
			revalidatedPaths.push("/pdp/[slug]")
		} else if (schemaName === "content_library") {
			// Revalidate Content Library pages
			if (slug) {
				const path = `/content-library/${slug}`
				revalidatePath(path)
				revalidatedPaths.push(path)
			}

			// Revalidate the main content library page
			revalidatePath("/content-library")

			// Revalidate content library cache tag
			revalidateTag("content-library", "max")
			revalidatedTags.push("content-library")

			// Also revalidate specific tag for this slug
			if (slug) {
				revalidateTag(`post-${slug}`, "max")
				revalidatedTags.push(`post-${slug}`)
			}

			// Also revalidate the dynamic route pattern to clear all cached posts
			revalidatePath("/content-library/[slug]", "page")
			revalidatedPaths.push("/content-library/[slug]")
		} else {
			// Default: revalidate content-library for backward compatibility
			if (slug) {
				const path = `/content-library/${slug}`
				revalidatePath(path)
				revalidatedPaths.push(path)
				console.log(`Revalidated path: ${path}`)
			}

			revalidatePath("/content-library")

			// Revalidate content library cache tag
			revalidateTag("content-library", "max")
			revalidatedTags.push("content-library")

			// Also revalidate specific tag for this slug
			if (slug) {
				revalidateTag(`post-${slug}`, "max")
				revalidatedTags.push(`post-${slug}`)
			}

			revalidatePath("/content-library/[slug]", "page")
		}

		return NextResponse.json({
			revalidated: true,
			now: Date.now(),
			schemaName,
			isDeleted,
			revalidatedPaths,
			revalidatedTags,
		})
	} catch (err) {
		console.error("Revalidation error:", err)
		return NextResponse.json({ message: "Error revalidating" }, { status: 500 })
	}
}
