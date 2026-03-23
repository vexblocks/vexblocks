"use client"

import { useState } from "react"
import { usePreview } from "./preview-context"
import type { EditableFieldProps } from "./types"

/**
 * EditableField - Wraps content to make it editable in preview mode
 *
 * When preview mode is active:
 * - Adds visual indicators (border on hover)
 * - Clicking opens the field in the CMS editor
 * - Shows highlight when the field is selected in CMS
 *
 * When not in preview mode:
 * - Renders children without any modifications
 *
 * @example
 * ```tsx
 * <EditableField field="title">
 *   <h1>{post.data.title}</h1>
 * </EditableField>
 * ```
 */
export function EditableField({
	field,
	children,
	className = "",
}: EditableFieldProps) {
	const { isPreviewMode, highlightedField, onFieldClick, onFieldHover } =
		usePreview()
	const [isHovered, setIsHovered] = useState(false)

	const isHighlighted = highlightedField === field

	const handleClick = (e: React.MouseEvent) => {
		if (!isPreviewMode) return

		// Prevent default link navigation in preview mode
		e.preventDefault()
		e.stopPropagation()

		onFieldClick(field)
	}

	const handleMouseEnter = () => {
		if (isPreviewMode) {
			setIsHovered(true)
			onFieldHover(field)
		}
	}

	const handleMouseLeave = () => {
		if (isPreviewMode) {
			setIsHovered(false)
			onFieldHover(null)
		}
	}

	// If not in preview mode, just render children
	if (!isPreviewMode) {
		return <>{children}</>
	}

	const getOutlineStyle = () => {
		if (isHighlighted) return "2px solid #6366f1"
		if (isHovered) return "2px dashed #6366f1"
		return "none"
	}

	// In preview mode, wrap with interactive container
	return (
		<div
			data-cms-field={field}
			data-cms-editable="true"
			onClick={handleClick}
			role="button"
			tabIndex={0}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className={`cms-editable-field ${isHighlighted ? "cms-editable-field--highlighted" : ""} ${className}`}
			style={{
				position: "relative",
				cursor: "pointer",
				outline: getOutlineStyle(),
				outlineOffset: "2px",
				borderRadius: "4px",
				transition: "outline 0.15s ease-in-out",
			}}
		>
			{children}
		</div>
	)
}

/**
 * EditableText - Simplified wrapper for text content
 *
 * @example
 * ```tsx
 * <EditableText field="title" as="h1" className="text-2xl">
 *   {post.data.title}
 * </EditableText>
 * ```
 */
type EditableTextProps = EditableFieldProps & {
	as?: React.ElementType
}

export function EditableText({
	field,
	children,
	className = "",
	as: Component = "span",
}: EditableTextProps) {
	const { isPreviewMode, highlightedField, onFieldClick, onFieldHover } =
		usePreview()
	const [isHovered, setIsHovered] = useState(false)

	const isHighlighted = highlightedField === field

	const handleClick = (e: React.MouseEvent) => {
		if (!isPreviewMode) return
		e.preventDefault()
		e.stopPropagation()
		onFieldClick(field)
	}

	const handleMouseEnter = () => {
		if (isPreviewMode) {
			setIsHovered(true)
			onFieldHover(field)
		}
	}

	const handleMouseLeave = () => {
		if (isPreviewMode) {
			setIsHovered(false)
			onFieldHover(null)
		}
	}

	// If not in preview mode, render component directly
	if (!isPreviewMode) {
		return <Component className={className}>{children}</Component>
	}

	const getOutlineStyle = () => {
		if (isHighlighted) return "2px solid #6366f1"
		if (isHovered) return "2px dashed #6366f1"
		return "none"
	}

	// In preview mode, add data attributes and handlers
	return (
		<Component
			data-cms-field={field}
			data-cms-editable="true"
			onClick={handleClick}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className={className}
			style={{
				cursor: "pointer",
				outline: getOutlineStyle(),
				outlineOffset: "2px",
				borderRadius: "2px",
				transition: "outline 0.15s ease-in-out",
			}}
		>
			{children}
		</Component>
	)
}
