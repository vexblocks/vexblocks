"use client"

import { useMutation } from "convex/react"
import { ArrowLeft, ExternalLink, Eye, Globe, Info, Save } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useCachedQuery } from "@/lib/use-cached-query"
import { api } from "@repo/backend/convex/_generated/api"

type PreviewSettings = {
	enabled: boolean
	baseUrl: string
	productionBaseUrl: string
}

export default function PreviewSettingsPage() {
	// Use cached query
	const { data: settings } = useCachedQuery(api.cms.settings.get, {
		key: "preview",
	})
	const updateSettings = useMutation(api.cms.settings.update)

	const [enabled, setEnabled] = useState(true)
	const [baseUrl, setBaseUrl] = useState("http://localhost:3000")
	const [productionBaseUrl, setProductionBaseUrl] = useState("")
	const [loading, setLoading] = useState(false)

	// Initialize from settings
	useEffect(() => {
		if (settings) {
			const previewSettings = settings as PreviewSettings
			setEnabled(previewSettings.enabled ?? true)
			setBaseUrl(previewSettings.baseUrl || "http://localhost:3000")
			setProductionBaseUrl(previewSettings.productionBaseUrl || "")
		}
	}, [settings])

	const handleSave = async () => {
		setLoading(true)

		try {
			// Validate URLs
			if (baseUrl && !isValidUrl(baseUrl)) {
				toast.error("Development URL is not valid")
				return
			}
			if (productionBaseUrl && !isValidUrl(productionBaseUrl)) {
				toast.error("Production URL is not valid")
				return
			}

			const previewSettings: PreviewSettings = {
				enabled,
				baseUrl: baseUrl.replace(/\/$/, ""), // Remove trailing slash
				productionBaseUrl: productionBaseUrl.replace(/\/$/, ""),
			}

			await updateSettings({
				key: "preview",
				value: previewSettings,
			})

			toast.success("Preview settings saved")
		} catch (error) {
			toast.error("Failed to save settings")
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	const isValidUrl = (url: string): boolean => {
		try {
			new URL(url)
			return true
		} catch {
			return false
		}
	}

	return (
		<div className="mx-auto max-w-4xl">
			{/* Header */}
			<div className="mb-6">
				<Link
					href="/settings"
					className="mb-4 inline-flex items-center gap-2 text-grey-500 hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Settings
				</Link>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-primary">Live Preview</h1>
						<p className="mt-2 text-grey-500">
							Configure live preview for your content
						</p>
					</div>
					<button
						type="button"
						onClick={handleSave}
						disabled={loading}
						className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
					>
						<Save className="h-4 w-4" />
						{loading ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</div>

			{/* Info Banner */}
			<div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
				<div className="flex items-start gap-3">
					<Eye className="mt-0.5 h-5 w-5 text-blue-600" />
					<div>
						<h4 className="font-semibold text-blue-900">About Live Preview</h4>
						<p className="mt-1 text-sm text-blue-700">
							Live Preview allows you to see your content changes in real-time
							on your website. Configure the base URLs below, and then set up
							preview URL patterns for each schema.
						</p>
					</div>
				</div>
			</div>

			{/* Enable Toggle */}
			<div className="mb-6 rounded-lg bg-white p-6 shadow">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-grey-900 text-lg font-semibold">
							Enable Live Preview
						</h2>
						<p className="mt-1 text-sm text-grey-500">
							Turn on live preview functionality across all schemas
						</p>
					</div>
					<label className="relative inline-flex cursor-pointer items-center">
						<input
							type="checkbox"
							checked={enabled}
							onChange={(e) => setEnabled(e.target.checked)}
							className="peer sr-only"
						/>
						<div className="peer h-6 w-11 rounded-full bg-grey-200 peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-grey-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
					</label>
				</div>
			</div>

			{/* URL Configuration */}
			<div className="mb-6 rounded-lg bg-white p-6 shadow">
				<h2 className="text-grey-900 mb-4 text-lg font-semibold">
					Preview URLs
				</h2>
				<div className="space-y-6">
					{/* Development URL */}
					<div>
						<label
							htmlFor="dev-url"
							className="text-grey-700 mb-1 block text-sm font-medium"
						>
							Development URL <span className="text-red-500">*</span>
						</label>
						<div className="relative">
							<input
								id="dev-url"
								type="url"
								value={baseUrl}
								onChange={(e) => setBaseUrl(e.target.value)}
								placeholder="http://localhost:3000"
								className="w-full rounded-lg border border-grey-300 px-3 py-2 pr-10 text-sm"
							/>
							<Globe className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-grey-400" />
						</div>
						<p className="mt-1 text-xs text-grey-500">
							The URL where your website runs in development mode (usually
							localhost:3000)
						</p>
					</div>

					{/* Production URL */}
					<div>
						<label
							htmlFor="prod-url"
							className="text-grey-700 mb-1 block text-sm font-medium"
						>
							Production URL <span className="text-grey-400">(optional)</span>
						</label>
						<div className="relative">
							<input
								id="prod-url"
								type="url"
								value={productionBaseUrl}
								onChange={(e) => setProductionBaseUrl(e.target.value)}
								placeholder="https://www.yoursite.com"
								className="w-full rounded-lg border border-grey-300 px-3 py-2 pr-10 text-sm"
							/>
							<ExternalLink className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-grey-400" />
						</div>
						<p className="mt-1 text-xs text-grey-500">
							Your production website URL. If not set, the development URL will
							be used.
						</p>
					</div>
				</div>
			</div>

			{/* Schema Configuration Info */}
			<div className="mb-6 rounded-lg bg-white p-6 shadow">
				<div className="flex items-start gap-4">
					<div className="rounded-lg bg-primary/10 p-3">
						<Info className="h-6 w-6 text-primary" />
					</div>
					<div>
						<h2 className="text-grey-900 text-lg font-semibold">
							Configuring Schemas for Preview
						</h2>
						<p className="text-grey-600 mt-2 text-sm">
							After setting up the base URLs, you need to configure a{" "}
							<strong>Preview URL Pattern</strong> for each schema that should
							support live preview. You can do this in the schema's edit page.
						</p>
						<div className="bg-grey-50 mt-4 rounded-lg p-4">
							<h4 className="text-grey-700 mb-2 text-sm font-medium">
								URL Pattern Examples:
							</h4>
							<ul className="text-grey-600 space-y-1 font-mono text-sm">
								<li>
									<code className="rounded bg-grey-200 px-2 py-0.5">
										/content-library/{"{slug}"}
									</code>{" "}
									<span className="font-sans text-grey-500">→ Blog posts</span>
								</li>
								<li>
									<code className="rounded bg-grey-200 px-2 py-0.5">
										/products/{"{slug}"}
									</code>{" "}
									<span className="font-sans text-grey-500">
										→ Product pages
									</span>
								</li>
								<li>
									<code className="rounded bg-grey-200 px-2 py-0.5">
										/about
									</code>{" "}
									<span className="font-sans text-grey-500">
										→ Static page (no placeholder)
									</span>
								</li>
							</ul>
						</div>
						<Link
							href="/schemas"
							className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
						>
							Go to Schemas →
						</Link>
					</div>
				</div>
			</div>

			{/* How it Works */}
			<div className="bg-grey-50 rounded-lg border border-grey-200 p-6">
				<h3 className="text-grey-900 mb-2 font-semibold">
					How Live Preview Works
				</h3>
				<ul className="text-grey-600 space-y-2 text-sm">
					<li className="flex items-start gap-2">
						<span className="mt-1 text-primary">1.</span>
						<span>
							When editing content, an iframe loads your website with the
							preview URL pattern.
						</span>
					</li>
					<li className="flex items-start gap-2">
						<span className="mt-1 text-primary">2.</span>
						<span>
							Your frontend detects preview mode via URL parameters and displays
							the draft content.
						</span>
					</li>
					<li className="flex items-start gap-2">
						<span className="mt-1 text-primary">3.</span>
						<span>
							Clicking on editable elements in the preview highlights the
							corresponding field in the editor.
						</span>
					</li>
					<li className="flex items-start gap-2">
						<span className="mt-1 text-primary">4.</span>
						<span>
							Changes in the editor are reflected in real-time in the preview
							iframe.
						</span>
					</li>
				</ul>
			</div>
		</div>
	)
}
