"use client"

import { useAtom } from "@lfades/atom"
import { api } from "@repo/backend/convex/_generated/api"
import { useQuery } from "convex/react"
import {
	Check,
	ExternalLink,
	Eye,
	EyeOff,
	Maximize2,
	Minimize2,
	Monitor,
	RefreshCw,
	Send,
	Smartphone,
	Tablet,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { authAtom } from "@/lib/auth-atom"
import { previewAtom } from "@/lib/preview-atom"

type PreviewMessage = {
	type: string
	payload?: any
}

type DeviceType = "desktop" | "tablet" | "mobile"

type LivePreviewPanelProps = {
	contentId: string
	schemaId: string
	contentData: Record<string, any>
	contentStatus: "draft" | "published"
	slug?: string
	urlPattern?: string
	enabled?: boolean
	onPublish?: () => Promise<void>
	/** Whether the content was just saved - triggers iframe refresh */
	justSaved?: boolean
}

const DEVICE_SIZES: Record<DeviceType, { width: string; label: string }> = {
	desktop: { width: "100%", label: "Desktop" },
	tablet: { width: "820px", label: "Tablet" },
	mobile: { width: "390px", label: "Mobile" },
}

export function LivePreviewPanel({
	contentId,
	schemaId,
	contentData,
	contentStatus,
	slug,
	urlPattern,
	enabled = true,
	onPublish,
	justSaved = false,
}: LivePreviewPanelProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const [isReady, setIsReady] = useState(false)
	const [isExpanded, setIsExpanded] = useState(false)
	const [showPreview, setShowPreview] = useState(true)
	const [device, setDevice] = useState<DeviceType>("desktop")
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [isPublishing, setIsPublishing] = useState(false)
	const [publishSuccess, setPublishSuccess] = useState(false)

	// Wait for auth to be initialized before making queries
	const [auth] = useAtom(authAtom)
	const isAuthReady = auth.isInitialized && auth.user !== null

	// Handle publish action
	const handlePublish = useCallback(async () => {
		if (!onPublish) return
		setIsPublishing(true)
		try {
			await onPublish()
			setPublishSuccess(true)
			setTimeout(() => setPublishSuccess(false), 3000)
		} catch (error) {
			console.error("Failed to publish:", error)
		} finally {
			setIsPublishing(false)
		}
	}, [onPublish])

	// Get preview settings
	const previewSettings = useQuery(
		api.settings.get,
		isAuthReady ? { key: "preview" } : "skip",
	) as {
		enabled: boolean
		baseUrl: string
		productionBaseUrl: string
	} | null

	// Build the preview URL
	const buildPreviewUrl = useCallback(() => {
		if (!urlPattern || !previewSettings?.baseUrl) return null

		let url = urlPattern

		// Replace {slug} placeholder with actual slug
		if (slug) {
			url = url.replace("{slug}", slug)
		}

		// Replace other field placeholders
		for (const [key, value] of Object.entries(contentData)) {
			if (typeof value === "string") {
				url = url.replace(`{${key}}`, value)
			}
		}

		// Determine if we're in production (not localhost)
		const isProduction =
			typeof window !== "undefined" &&
			!window.location.hostname.includes("localhost") &&
			!window.location.hostname.includes("127.0.0.1")

		// Use production URL if available and in production, otherwise use dev URL
		const targetBaseUrl =
			isProduction && previewSettings.productionBaseUrl
				? previewSettings.productionBaseUrl
				: previewSettings.baseUrl

		// Add preview params
		const baseUrl = targetBaseUrl.replace(/\/$/, "")
		const separator = url.includes("?") ? "&" : "?"
		const previewParams = `preview=true&contentId=${contentId}&schemaId=${schemaId}`

		return `${baseUrl}${url}${separator}${previewParams}`
	}, [urlPattern, slug, contentData, contentId, schemaId, previewSettings])

	const previewUrl = buildPreviewUrl()

	// Update preview atom when preview visibility changes
	const [, setPreviewState] = useAtom(previewAtom)
	useEffect(() => {
		// Only set preview as active if it's enabled, has URL, and showPreview is true
		const shouldBeActive =
			enabled &&
			!!urlPattern &&
			!!previewSettings?.enabled &&
			!!previewUrl &&
			showPreview

		setPreviewState({ isPreviewActive: shouldBeActive })

		// Cleanup: set to false when component unmounts
		return () => {
			setPreviewState({ isPreviewActive: false })
		}
	}, [
		showPreview,
		enabled,
		urlPattern,
		previewSettings?.enabled,
		previewUrl,
		setPreviewState,
	])

	// Send message to iframe
	const sendToIframe = useCallback((message: PreviewMessage) => {
		if (iframeRef.current?.contentWindow) {
			iframeRef.current.contentWindow.postMessage(message, "*")
		}
	}, [])

	// Track content changes for comparison
	const contentDataRef = useRef<string>("")

	// Send content updates to iframe when data changes
	useEffect(() => {
		if (!isReady) return

		const newDataString = JSON.stringify(contentData)

		// Only send update if data actually changed
		if (newDataString !== contentDataRef.current) {
			contentDataRef.current = newDataString
			sendToIframe({
				type: "cms:update",
				payload: { data: contentData },
			})
		}
	}, [contentData, isReady, sendToIframe])

	// Handle messages from iframe
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data as PreviewMessage

			if (!message?.type?.startsWith("preview:")) return

			switch (message.type) {
				case "preview:ready":
					setIsReady(true)
					// Send initial data
					sendToIframe({
						type: "cms:init",
						payload: {
							contentId,
							schemaId,
							data: contentData,
						},
					})
					break

				case "preview:click":
					// User clicked on an editable field in the preview
					if (message.payload?.field) {
						const fieldPath = message.payload.field

						// Check if this is a paragraph-level selection (e.g., "blocks[0].p[2]")
						const paragraphMatch = fieldPath.match(
							/^(.+)\.(p|h|list|quote|code)\[(\d+)\]$/,
						)

						if (paragraphMatch) {
							// Paragraph-level selection for RichText
							const [, blockPath, elementType, elementIndex] = paragraphMatch
							const escapedBlockPath = CSS.escape(blockPath)

							// Find the block container
							const blockElement = document.querySelector(
								`[data-field-path="${escapedBlockPath}"]`,
							)

							if (blockElement) {
								blockElement.scrollIntoView({
									behavior: "smooth",
									block: "center",
								})
								blockElement.classList.add(
									"ring-2",
									"ring-primary",
									"ring-offset-2",
								)

								// Find the contenteditable (Lexical editor) inside
								const editorElement = blockElement.querySelector<HTMLElement>(
									'[contenteditable="true"]',
								)

								if (editorElement) {
									setTimeout(() => {
										editorElement.focus()

										// Find the specific paragraph/element by index
										const paragraphIndex = Number.parseInt(elementIndex, 10)
										const selector =
											elementType === "p"
												? "p"
												: elementType === "h"
													? "h1, h2, h3, h4, h5, h6"
													: elementType === "list"
														? "ul, ol"
														: elementType === "quote"
															? "blockquote"
															: elementType === "code"
																? "pre"
																: "p"

										const paragraphs = editorElement.querySelectorAll(selector)
										const targetParagraph = paragraphs[paragraphIndex]

										if (targetParagraph) {
											// Move cursor to end of the specific paragraph
											const selection = window.getSelection()
											if (selection) {
												const range = document.createRange()
												range.selectNodeContents(targetParagraph)
												range.collapse(false) // false = collapse to end
												selection.removeAllRanges()
												selection.addRange(range)

												// Scroll the paragraph into view within the editor
												targetParagraph.scrollIntoView({
													behavior: "smooth",
													block: "center",
												})
											}
										} else {
											// Fallback: move to end of editor
											const selection = window.getSelection()
											if (selection) {
												const range = document.createRange()
												range.selectNodeContents(editorElement)
												range.collapse(false)
												selection.removeAllRanges()
												selection.addRange(range)
											}
										}
									}, 300)
								}

								setTimeout(() => {
									blockElement.classList.remove(
										"ring-2",
										"ring-primary",
										"ring-offset-2",
									)
								}, 2000)
							}
						} else {
							// Regular field selection (non-paragraph)
							const escapedFieldPath = CSS.escape(fieldPath)

							const fieldElement = document.querySelector(
								`[data-field-path="${escapedFieldPath}"]`,
							)
							if (fieldElement) {
								fieldElement.scrollIntoView({
									behavior: "smooth",
									block: "center",
								})
								fieldElement.classList.add(
									"ring-2",
									"ring-primary",
									"ring-offset-2",
								)

								// Find the first input/textarea/contenteditable inside and focus it
								const inputElement = fieldElement.querySelector<
									HTMLInputElement | HTMLTextAreaElement | HTMLElement
								>(
									'input:not([type="radio"]):not([type="checkbox"]), textarea, [contenteditable="true"]',
								)
								if (inputElement) {
									setTimeout(() => {
										inputElement.focus()
										// For text inputs, move cursor to end instead of selecting all
										if (
											inputElement instanceof HTMLInputElement ||
											inputElement instanceof HTMLTextAreaElement
										) {
											const length = inputElement.value.length
											inputElement.setSelectionRange(length, length)
										} else if (
											inputElement.getAttribute("contenteditable") === "true"
										) {
											// For contenteditable (Lexical RichText), move cursor to end
											const selection = window.getSelection()
											if (selection) {
												const range = document.createRange()
												range.selectNodeContents(inputElement)
												range.collapse(false)
												selection.removeAllRanges()
												selection.addRange(range)
											}
										}
									}, 300)
								}

								setTimeout(() => {
									fieldElement.classList.remove(
										"ring-2",
										"ring-primary",
										"ring-offset-2",
									)
								}, 2000)
							}
						}
					}
					break

				case "preview:hover":
					// User hovered over an editable field
					// Could add visual feedback here
					break
			}
		}

		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [contentId, schemaId, contentData, sendToIframe])

	// Refresh iframe
	const handleRefresh = useCallback(() => {
		setIsRefreshing(true)
		setIsReady(false)
		if (iframeRef.current) {
			iframeRef.current.src = previewUrl || ""
		}
		setTimeout(() => setIsRefreshing(false), 1000)
	}, [previewUrl])

	// Auto-refresh iframe when content is saved (for ISR pages)
	useEffect(() => {
		if (justSaved && previewUrl) {
			// Refresh after a short delay to let the server update
			const timer = setTimeout(() => {
				handleRefresh()
			}, 500)
			return () => clearTimeout(timer)
		}
	}, [justSaved, previewUrl, handleRefresh])

	// Open in new tab
	const handleOpenInNewTab = useCallback(() => {
		if (previewUrl) {
			window.open(previewUrl, "_blank")
		}
	}, [previewUrl])

	// If preview is not enabled or no URL pattern
	if (!enabled || !urlPattern || !previewSettings?.enabled) {
		return null
	}

	if (!previewUrl) {
		return (
			<div className="rounded-lg border border-grey-200 bg-grey-50 p-4">
				<div className="flex items-center gap-2 text-grey-500">
					<EyeOff className="h-5 w-5" />
					<span>
						Preview URL cannot be generated. Check URL pattern and content data.
					</span>
				</div>
			</div>
		)
	}

	return (
		<div
			className={`rounded-lg border border-grey-200 bg-white shadow-md transition-all ${
				isExpanded
					? "fixed inset-4 z-50"
					: "sticky top-22 max-h-[calc(100vh-3rem)]"
			}`}
		>
			{/* Preview Header */}
			<div className="flex items-center justify-between border-grey-200 border-b px-4 py-2">
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						<Eye className="h-4 w-4 text-primary" />
						<span className="font-medium text-grey-900 text-sm">
							Live Preview
						</span>
					</div>

					{/* Status Badge */}
					{contentStatus === "draft" ? (
						<span className="flex items-center gap-1 rounded-full bg-orange/10 px-2 py-0.5 text-orange text-xs">
							<span className="h-1.5 w-1.5 rounded-full bg-orange" />
							Draft
						</span>
					) : (
						<span className="flex items-center gap-1 rounded-full bg-green/10 px-2 py-0.5 text-green text-xs">
							<span className="h-1.5 w-1.5 rounded-full bg-green" />
							Published
						</span>
					)}

					{/* Connection Status */}
					{!isReady && (
						<span className="flex items-center gap-1 text-grey-500 text-xs">
							<span className="h-2 w-2 animate-pulse rounded-full bg-grey-400" />
							Connecting...
						</span>
					)}
					{isReady && (
						<span className="flex items-center gap-1 text-grey-500 text-xs">
							<span className="h-2 w-2 rounded-full bg-green" />
							Synced
						</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* Publish Button */}
					{onPublish && contentStatus === "draft" && (
						<button
							type="button"
							onClick={handlePublish}
							disabled={isPublishing}
							className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-sm transition-colors ${
								publishSuccess
									? "bg-green text-white"
									: "bg-primary text-white hover:bg-primary-800"
							} disabled:opacity-50`}
						>
							{publishSuccess ? (
								<>
									<Check className="h-4 w-4" />
									Published!
								</>
							) : isPublishing ? (
								<>
									<RefreshCw className="h-4 w-4 animate-spin" />
									Publishing...
								</>
							) : (
								<>
									<Send className="h-4 w-4" />
									Publish
								</>
							)}
						</button>
					)}
					{/* Device Selector */}
					<div className="flex rounded-lg border border-grey-200 p-0.5">
						<button
							type="button"
							onClick={() => setDevice("desktop")}
							className={`rounded-md p-1.5 transition-colors ${
								device === "desktop"
									? "bg-primary text-white"
									: "text-grey-500 hover:bg-grey-100"
							}`}
							title="Desktop"
						>
							<Monitor className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={() => setDevice("tablet")}
							className={`rounded-md p-1.5 transition-colors ${
								device === "tablet"
									? "bg-primary text-white"
									: "text-grey-500 hover:bg-grey-100"
							}`}
							title="Tablet"
						>
							<Tablet className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={() => setDevice("mobile")}
							className={`rounded-md p-1.5 transition-colors ${
								device === "mobile"
									? "bg-primary text-white"
									: "text-grey-500 hover:bg-grey-100"
							}`}
							title="Mobile"
						>
							<Smartphone className="h-4 w-4" />
						</button>
					</div>

					{/* Actions */}
					<button
						type="button"
						onClick={handleRefresh}
						className="rounded-lg p-1.5 text-grey-500 transition-colors hover:bg-grey-100"
						title="Refresh preview"
					>
						<RefreshCw
							className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
						/>
					</button>
					<button
						type="button"
						onClick={handleOpenInNewTab}
						className="rounded-lg p-1.5 text-grey-500 transition-colors hover:bg-grey-100"
						title="Open in new tab"
					>
						<ExternalLink className="h-4 w-4" />
					</button>
					<button
						type="button"
						onClick={() => setShowPreview(!showPreview)}
						className="rounded-lg p-1.5 text-grey-500 transition-colors hover:bg-grey-100"
						title={showPreview ? "Hide preview" : "Show preview"}
					>
						{showPreview ? (
							<EyeOff className="h-4 w-4" />
						) : (
							<Eye className="h-4 w-4" />
						)}
					</button>
					<button
						type="button"
						onClick={() => setIsExpanded(!isExpanded)}
						className="rounded-lg p-1.5 text-grey-500 transition-colors hover:bg-grey-100"
						title={isExpanded ? "Minimize" : "Maximize"}
					>
						{isExpanded ? (
							<Minimize2 className="h-4 w-4" />
						) : (
							<Maximize2 className="h-4 w-4" />
						)}
					</button>
				</div>
			</div>

			{/* Preview Content */}
			{showPreview && (
				<div
					className={`overflow-hidden bg-grey-100 ${
						isExpanded ? "h-[calc(100%-48px)]" : "h-[calc(100vh-9rem)]"
					}`}
				>
					<div
						className={`h-full transition-all duration-300 ${device !== "desktop" ? "mx-auto" : ""}`}
						style={{
							width: DEVICE_SIZES[device].width,
						}}
					>
						<iframe
							ref={iframeRef}
							src={previewUrl}
							className="h-full w-full border-0 bg-white"
							title="Live Preview"
							sandbox="allow-scripts allow-same-origin allow-forms"
						/>
					</div>
				</div>
			)}

			{/* Collapsed state */}
			{!showPreview && (
				<div className="flex items-center justify-center p-8 text-grey-500">
					<button
						type="button"
						onClick={() => setShowPreview(true)}
						className="flex items-center gap-2 rounded-lg border border-grey-300 px-4 py-2 transition-colors hover:bg-grey-50"
					>
						<Eye className="h-4 w-4" />
						Show Preview
					</button>
				</div>
			)}
		</div>
	)
}
