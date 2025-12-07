"use client"

import { useCallback, useEffect, useState } from "react"
import { usePreview } from "./preview-context"

/**
 * VisualEditing - Enables visual editing for Server Components
 *
 * This component should be rendered once in your layout (only in preview mode).
 * It listens for clicks on elements with `data-cms-field` attributes and
 * communicates with the CMS admin via postMessage.
 *
 * This pattern allows you to keep content components as Server Components
 * while still having live editing capabilities.
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * const { isEnabled: isDraftMode } = await draftMode()
 *
 * {isDraftMode && <VisualEditing />}
 * ```
 *
 * Then in your Server Components, use data attributes:
 * ```tsx
 * // Server Component
 * export function PostHeader({ post }) {
 *   return (
 *     <header data-cms-field="title">
 *       <h1>{post.data.title}</h1>
 *     </header>
 *   )
 * }
 * ```
 */
export function VisualEditing() {
	const { isPreviewMode, onFieldClick, onFieldHover, highlightedField } =
		usePreview()
	const [hoveredField, setHoveredField] = useState<string | null>(null)

	// Handle click on editable elements
	const handleClick = useCallback(
		(e: MouseEvent) => {
			if (!isPreviewMode) return

			const target = e.target as HTMLElement
			const editableElement = target.closest("[data-cms-field]") as HTMLElement

			if (editableElement) {
				e.preventDefault()
				e.stopPropagation()
				const field = editableElement.getAttribute("data-cms-field")
				if (field) {
					onFieldClick(field)
				}
			}
		},
		[isPreviewMode, onFieldClick],
	)

	// Handle hover on editable elements
	const handleMouseOver = useCallback(
		(e: MouseEvent) => {
			if (!isPreviewMode) return

			const target = e.target as HTMLElement
			const editableElement = target.closest("[data-cms-field]") as HTMLElement

			if (editableElement) {
				const field = editableElement.getAttribute("data-cms-field")
				if (field && field !== hoveredField) {
					setHoveredField(field)
					onFieldHover(field)
				}
			}
		},
		[isPreviewMode, hoveredField, onFieldHover],
	)

	const handleMouseOut = useCallback(
		(e: MouseEvent) => {
			if (!isPreviewMode) return

			const target = e.target as HTMLElement
			const editableElement = target.closest("[data-cms-field]") as HTMLElement

			if (editableElement) {
				setHoveredField(null)
				onFieldHover(null)
			}
		},
		[isPreviewMode, onFieldHover],
	)

	// Add/remove global event listeners
	useEffect(() => {
		if (!isPreviewMode) return

		document.addEventListener("click", handleClick, true)
		document.addEventListener("mouseover", handleMouseOver, true)
		document.addEventListener("mouseout", handleMouseOut, true)

		return () => {
			document.removeEventListener("click", handleClick, true)
			document.removeEventListener("mouseover", handleMouseOver, true)
			document.removeEventListener("mouseout", handleMouseOut, true)
		}
	}, [isPreviewMode, handleClick, handleMouseOver, handleMouseOut])

	// Apply visual styles to hovered/highlighted elements
	useEffect(() => {
		if (!isPreviewMode) return

		// Remove previous styles
		const styledElements = document.querySelectorAll("[data-cms-styled]")
		styledElements.forEach((el) => {
			;(el as HTMLElement).style.outline = ""
			;(el as HTMLElement).style.outlineOffset = ""
			;(el as HTMLElement).style.cursor = ""
			el.removeAttribute("data-cms-styled")
		})

		// Apply hover style
		if (hoveredField) {
			const hoveredElements = document.querySelectorAll(
				`[data-cms-field="${hoveredField}"]`,
			)
			hoveredElements.forEach((el) => {
				;(el as HTMLElement).style.outline = "2px dashed #6366f1"
				;(el as HTMLElement).style.outlineOffset = "2px"
				;(el as HTMLElement).style.cursor = "pointer"
				el.setAttribute("data-cms-styled", "true")
			})
		}

		// Apply highlight style (takes precedence)
		if (highlightedField) {
			const highlightedElements = document.querySelectorAll(
				`[data-cms-field="${highlightedField}"]`,
			)
			highlightedElements.forEach((el) => {
				;(el as HTMLElement).style.outline = "2px solid #6366f1"
				;(el as HTMLElement).style.outlineOffset = "2px"
				;(el as HTMLElement).style.cursor = "pointer"
				el.setAttribute("data-cms-styled", "true")
			})
		}
	}, [isPreviewMode, hoveredField, highlightedField])

	// This component doesn't render anything visible
	return null
}

