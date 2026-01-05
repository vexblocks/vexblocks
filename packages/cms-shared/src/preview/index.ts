// Preview SDK exports

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
/**
 * @deprecated Use PreviewProvider pattern instead
 */
export { PreviewWrapper } from "./preview-wrapper"
export type { PreviewParams } from "./server-utils"
// ============================================================================
// Server-First API (recommended for Next.js 15+)
// ============================================================================
// Server utilities for detecting preview mode
export { getPreviewParams, isPreviewRequest } from "./server-utils"
// Types
export type {
	EditableFieldProps,
	PreviewConfig,
	PreviewContextValue,
	PreviewMessage,
	PreviewMessageType,
} from "./types"
// Visual editing (works with Server Components via data-cms-field attributes)
export { VisualEditing } from "./visual-editing"
