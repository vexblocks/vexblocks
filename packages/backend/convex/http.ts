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

// =============================================================================
// REST API — public content endpoints
// Authenticated via: Authorization: Bearer <api_key>
// Routes:
//   GET /api/v1/content/:schema          — list published entries
//   GET /api/v1/content/:schema/:id      — single entry by Convex id or slug
// =============================================================================

async function hashApiKey(rawKey: string): Promise<string> {
	const encoder = new TextEncoder()
	const data = encoder.encode(rawKey)
	const hashBuffer = await crypto.subtle.digest("SHA-256", data)
	return Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")
}

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
		},
	})
}

http.route({
	pathPrefix: "/api/v1/content/",
	method: "GET",
	handler: httpAction(async (ctx, request) => {
		try {
			// --- Auth ---
			const authHeader = request.headers.get("Authorization") ?? ""
			const rawKey = authHeader.startsWith("Bearer ")
				? authHeader.slice(7).trim()
				: ""

			if (!rawKey) {
				return jsonResponse(
					{
						error: "Unauthorized",
						message: "Missing Authorization: Bearer <key> header",
					},
					401,
				)
			}

			const keyHash = await hashApiKey(rawKey)
			const apiKey = await ctx.runQuery(internal.cms.apiKeys.validateAndTouch, {
				keyHash,
			})

			if (!apiKey || apiKey.revokedAt) {
				return jsonResponse(
					{ error: "Unauthorized", message: "Invalid or revoked API key" },
					401,
				)
			}

			// Touch lastUsedAt asynchronously (best-effort)
			ctx
				.runMutation(internal.cms.apiKeys.touchLastUsed, { id: apiKey._id })
				.catch(() => {})

			// --- Parse path: /api/v1/content/:schema[/:id] ---
			const url = new URL(request.url)
			const parts = url.pathname
				.replace(/^\/api\/v1\/content\//, "")
				.split("/")
				.filter(Boolean)

			const schemaName = parts[0]
			const idOrSlug = parts[1] ?? null

			if (!schemaName) {
				return jsonResponse(
					{ error: "Bad Request", message: "Schema name is required" },
					400,
				)
			}

			const schema = await ctx.runQuery(internal.cms.rest.getSchemaByName, {
				name: schemaName,
			})

			if (!schema) {
				return jsonResponse(
					{ error: "Not Found", message: `Schema '${schemaName}' not found` },
					404,
				)
			}

			// --- Single entry ---
			if (idOrSlug) {
				// Try as slug first, then as Convex id
				let content = await ctx.runQuery(
					internal.cms.rest.getPublishedContentBySlug,
					{ slug: idOrSlug, schemaId: schema._id },
				)

				if (!content) {
					// Try as Convex id (ids are 32-char strings)
					try {
						content = await ctx.runQuery(
							internal.cms.rest.getPublishedContent,
							{
								id: idOrSlug as any,
								schemaId: schema._id,
							},
						)
					} catch {
						// Invalid id format — not found
					}
				}

				if (!content) {
					return jsonResponse(
						{
							error: "Not Found",
							message: `Content '${idOrSlug}' not found or not published`,
						},
						404,
					)
				}

				return jsonResponse({ data: content })
			}

			// --- List entries ---
			const limitParam = url.searchParams.get("limit")
			const limit = limitParam
				? Math.min(Number.parseInt(limitParam, 10) || 100, 500)
				: 100

			const items = await ctx.runQuery(internal.cms.rest.listPublishedContent, {
				schemaId: schema._id,
				limit,
			})

			return jsonResponse({
				data: items,
				meta: {
					schema: schemaName,
					count: items.length,
				},
			})
		} catch (error) {
			return jsonResponse(
				{
					error: "Internal Server Error",
					message: error instanceof Error ? error.message : "Unknown error",
				},
				500,
			)
		}
	}),
})

// Handle preflight CORS for the REST API
http.route({
	pathPrefix: "/api/v1/",
	method: "OPTIONS",
	handler: httpAction(async () => {
		return new Response(null, {
			status: 204,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, OPTIONS",
				"Access-Control-Allow-Headers": "Authorization, Content-Type",
				"Access-Control-Max-Age": "86400",
			},
		})
	}),
})

export default http
