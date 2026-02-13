import { httpRouter } from "convex/server"
import { createAuth } from "../better-auth/server"
import { internal } from "./_generated/api"
import { httpAction } from "./_generated/server"
import { authComponent } from "./auth"

const http = httpRouter()

authComponent.registerRoutes(http, createAuth)

// CMS Revalidation webhook for Next.js
http.route({
	path: "/cms/revalidate",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		try {
			// Parse request body
			const body = await request.json()
			const { contentId, secret } = body

			// Validate secret
			const revalidateSecret = process.env.REVALIDATE_SECRET
			if (!revalidateSecret || secret !== revalidateSecret) {
				return new Response(
					JSON.stringify({
						error: "Unauthorized",
						message: "Invalid revalidation secret",
					}),
					{
						status: 401,
						headers: { "Content-Type": "application/json" },
					},
				)
			}

			// Validate contentId
			if (!contentId) {
				return new Response(
					JSON.stringify({
						error: "Bad Request",
						message: "contentId is required",
					}),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				)
			}

			// Get content and schema
			const content = await ctx.runQuery(
				internal.cms.webhooks.getContentForRevalidation,
				{
					contentId,
				},
			)

			if (!content) {
				return new Response(
					JSON.stringify({
						error: "Not Found",
						message: "Content not found",
					}),
					{
						status: 404,
						headers: { "Content-Type": "application/json" },
					},
				)
			}

			// Only revalidate published content
			if (content.status !== "published") {
				return new Response(
					JSON.stringify({
						message: "Content is not published, skipping revalidation",
						revalidated: false,
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				)
			}

			const schema = await ctx.runQuery(
				internal.cms.webhooks.getSchemaForRevalidation,
				{
					schemaId: content.schemaId,
				},
			)

			if (!schema) {
				return new Response(
					JSON.stringify({
						error: "Not Found",
						message: "Schema not found",
					}),
					{
						status: 404,
						headers: { "Content-Type": "application/json" },
					},
				)
			}

			// Determine paths to revalidate
			const pathsToRevalidate: string[] = []

			if (schema.type === "global") {
				pathsToRevalidate.push("/")
			} else if (schema.type === "collection" && content.slug) {
				pathsToRevalidate.push(`/${schema.name}/${content.slug}`)
				pathsToRevalidate.push(`/${schema.name}`)
			}

			// Get Next.js revalidation endpoint
			const revalidateEndpoint = process.env.NEXT_PUBLIC_REVALIDATE_ENDPOINT
			if (!revalidateEndpoint) {
				return new Response(
					JSON.stringify({
						error: "Configuration Error",
						message: "NEXT_PUBLIC_REVALIDATE_ENDPOINT not configured",
					}),
					{
						status: 500,
						headers: { "Content-Type": "application/json" },
					},
				)
			}

			// Call Next.js revalidation API for each path
			const results: Array<{ path: string; success: boolean; error?: string }> =
				[]

			for (const path of pathsToRevalidate) {
				try {
					const response = await fetch(`${revalidateEndpoint}/api/revalidate`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${revalidateSecret}`,
						},
						body: JSON.stringify({ path }),
					})

					if (!response.ok) {
						const errorText = await response.text()
						results.push({
							path,
							success: false,
							error: errorText,
						})
					} else {
						results.push({
							path,
							success: true,
						})
					}
				} catch (error) {
					results.push({
						path,
						success: false,
						error: error instanceof Error ? error.message : "Unknown error",
					})
				}
			}

			return new Response(
				JSON.stringify({
					message: "Revalidation completed",
					revalidated: true,
					results,
					timestamp: Date.now(),
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			)
		} catch (error) {
			return new Response(
				JSON.stringify({
					error: "Internal Server Error",
					message: error instanceof Error ? error.message : "Unknown error",
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				},
			)
		}
	}),
})

export default http
