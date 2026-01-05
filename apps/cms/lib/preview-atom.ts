import { atom } from "@lfades/atom"

export type PreviewState = {
	isPreviewActive: boolean
}

/**
 * Global atom for live preview state
 * This is the single source of truth for preview state across the app
 */
export const previewAtom = atom<PreviewState>({
	isPreviewActive: false,
})

/**
 * Helper to check if preview is active
 */
export const isPreviewActive = () => {
	return previewAtom.get().isPreviewActive
}

/**
 * Helper to set preview state
 */
export const setPreviewActive = (active: boolean) => {
	previewAtom.set({ isPreviewActive: active })
}

/**
 * Helper to toggle preview
 */
export const togglePreview = () => {
	const current = previewAtom.get()
	previewAtom.set({ isPreviewActive: !current.isPreviewActive })
}
