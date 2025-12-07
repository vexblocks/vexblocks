// Preview SDK exports

// ============================================================================
// Server-First API (recommended for Next.js 15+)
// ============================================================================
// Server utilities for detecting preview mode
export { getPreviewParams, isPreviewRequest } from "./server-utils"
export type { PreviewParams } from "./server-utils"

// Visual editing (works with Server Components via data-cms-field attributes)
export { VisualEditing } from "./visual-editing"

// ============================================================================
// Client-Side API (for preview mode)
// ============================================================================
// PreviewProvider handles postMessage communication with CMS admin
// Use usePreview() in client components to get draftData for live updates
export { PreviewBanner } from "./preview-banner"
export {
	PreviewProvider,
	useIsPreviewMode,
	usePreview,
	usePreviewData,
} from "./preview-context"

// ============================================================================
// Legacy API (deprecated)
// ============================================================================
/**
 * @deprecated Use usePreview() from PreviewProvider instead
 */
export { CmsContent, useCmsContent, useIsPreview } from "./cms-content"

/**
 * @deprecated Use data-cms-field attributes on elements instead
 */
export { EditableField, EditableText } from "./editable-field"

/**
 * @deprecated Use PreviewProvider pattern instead
 */
export { PreviewWrapper } from "./preview-wrapper"

// Types
export type {
	EditableFieldProps,
	PreviewConfig,
	PreviewContextValue,
	PreviewMessage,
	PreviewMessageType,
} from "./types"
