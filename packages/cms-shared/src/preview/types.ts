/**
 * Types for the CMS Live Preview SDK
 */

// Message types for communication between CMS admin and preview iframe
export type PreviewMessageType =
	| "cms:init" // Initialize preview mode
	| "cms:update" // Content update from CMS
	| "cms:highlight" // Highlight a field in preview
	| "cms:unhighlight" // Remove highlight from a field
	| "preview:ready" // Preview is ready
	| "preview:click" // User clicked on an editable field
	| "preview:hover" // User hovered over an editable field

export type PreviewMessage = {
	type: PreviewMessageType
	payload?: any
}

// Context for preview mode
export type PreviewContextValue = {
	isPreviewMode: boolean
	contentId: string | null
	schemaId: string | null
	draftData: Record<string, any> | null
	highlightedField: string | null
	onFieldClick: (fieldPath: string) => void
	onFieldHover: (fieldPath: string | null) => void
}

// Props for EditableField component
export type EditableFieldProps = {
	field: string
	children: React.ReactNode
	className?: string
}

// Configuration for preview
export type PreviewConfig = {
	contentId: string
	schemaId: string
	initialData?: Record<string, any>
}
