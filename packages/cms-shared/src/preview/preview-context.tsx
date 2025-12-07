"use client"

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react"
import type {
	PreviewConfig,
	PreviewContextValue,
	PreviewMessage,
} from "./types"

const PreviewContext = createContext<PreviewContextValue | null>(null)

// Check if we're in preview mode based on URL params
function getPreviewParams(): {
	isPreview: boolean
	contentId: string | null
	schemaId: string | null
} {
	if (typeof window === "undefined") {
		return { isPreview: false, contentId: null, schemaId: null }
	}

	const params = new URLSearchParams(window.location.search)
	const isPreview = params.get("preview") === "true"
	const contentId = params.get("contentId")
	const schemaId = params.get("schemaId")

	return { isPreview, contentId, schemaId }
}

type PreviewProviderProps = {
	children: React.ReactNode
	config?: PreviewConfig
}

export function PreviewProvider({ children, config }: PreviewProviderProps) {
	const [isPreviewMode, setIsPreviewMode] = useState(false)
	const [contentId, setContentId] = useState<string | null>(
		config?.contentId ?? null,
	)
	const [schemaId, setSchemaId] = useState<string | null>(
		config?.schemaId ?? null,
	)
	const [draftData, setDraftData] = useState<Record<string, any> | null>(
		config?.initialData ?? null,
	)
	const [highlightedField, setHighlightedField] = useState<string | null>(null)

	// Initialize from URL params
	useEffect(() => {
		const {
			isPreview,
			contentId: urlContentId,
			schemaId: urlSchemaId,
		} = getPreviewParams()
		setIsPreviewMode(isPreview)
		if (urlContentId) setContentId(urlContentId)
		if (urlSchemaId) setSchemaId(urlSchemaId)
	}, [])

	// Send message to parent (CMS admin)
	const sendToParent = useCallback((message: PreviewMessage) => {
		if (typeof window === "undefined") return
		if (window.parent && window.parent !== window) {
			window.parent.postMessage(message, "*")
		}
	}, [])

	// Handle messages from parent (CMS admin)
	useEffect(() => {
		if (typeof window === "undefined" || !isPreviewMode) return

		const handleMessage = (event: MessageEvent) => {
			const message = event.data as PreviewMessage

			if (!message?.type?.startsWith("cms:")) return

			switch (message.type) {
				case "cms:init":
					// Initialize with config from parent
					if (message.payload?.contentId)
						setContentId(message.payload.contentId)
					if (message.payload?.schemaId) setSchemaId(message.payload.schemaId)
					if (message.payload?.data) setDraftData(message.payload.data)
					// Confirm ready
					sendToParent({ type: "preview:ready" })
					break

				case "cms:update":
					// Update draft data
					if (message.payload?.data) {
						setDraftData(message.payload.data)
					}
					break

				case "cms:highlight":
					// Highlight a specific field
					setHighlightedField(message.payload?.field ?? null)
					break

				case "cms:unhighlight":
					// Remove highlight
					setHighlightedField(null)
					break
			}
		}

		window.addEventListener("message", handleMessage)

		// Notify parent that preview is ready
		sendToParent({ type: "preview:ready" })

		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [isPreviewMode, sendToParent])

	// Handler for field click
	const onFieldClick = useCallback(
		(fieldPath: string) => {
			sendToParent({
				type: "preview:click",
				payload: { field: fieldPath, contentId, schemaId },
			})
		},
		[contentId, schemaId, sendToParent],
	)

	// Handler for field hover
	const onFieldHover = useCallback(
		(fieldPath: string | null) => {
			sendToParent({
				type: "preview:hover",
				payload: { field: fieldPath, contentId, schemaId },
			})
		},
		[contentId, schemaId, sendToParent],
	)

	const value = useMemo<PreviewContextValue>(
		() => ({
			isPreviewMode,
			contentId,
			schemaId,
			draftData,
			highlightedField,
			onFieldClick,
			onFieldHover,
		}),
		[
			isPreviewMode,
			contentId,
			schemaId,
			draftData,
			highlightedField,
			onFieldClick,
			onFieldHover,
		],
	)

	return (
		<PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>
	)
}

// Hook to use preview context
export function usePreview(): PreviewContextValue {
	const context = useContext(PreviewContext)

	// Return default values if not in preview context (makes it optional)
	if (!context) {
		return {
			isPreviewMode: false,
			contentId: null,
			schemaId: null,
			draftData: null,
			highlightedField: null,
			onFieldClick: () => {},
			onFieldHover: () => {},
		}
	}

	return context
}

// Hook to check if in preview mode
export function useIsPreviewMode(): boolean {
	const { isPreviewMode } = usePreview()
	return isPreviewMode
}

// Hook to get draft data with fallback to original data
export function usePreviewData<T extends Record<string, any>>(
	originalData: T,
): T {
	const { isPreviewMode, draftData } = usePreview()

	if (!isPreviewMode || !draftData) {
		return originalData
	}

	// Merge draft data over original data
	return { ...originalData, ...draftData } as T
}
