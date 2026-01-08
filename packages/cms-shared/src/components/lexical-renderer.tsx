"use client"

import { type ReactNode, useState } from "react"
import { usePreview } from "../preview/preview-context"

// Sanitize content to remove unusual line terminators before parsing
function _sanitizeContent(content: string): string {
	return content.replace(/\u2028/g, "\n").replace(/\u2029/g, "\n")
}

type LexicalNode = {
	type: string
	version: number
	[key: string]: any
}

type TextNode = LexicalNode & {
	type: "text"
	text: string
	format?: number
	detail?: number
	mode?: string
	style?: string
}

type ElementNode = LexicalNode & {
	children?: LexicalNode[]
	direction?: string | null
	format?: string | number
	indent?: number
	tag?: string
}

type ParagraphNode = ElementNode & {
	type: "paragraph"
}

type HeadingNode = ElementNode & {
	type: "heading"
	tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

type ListNode = ElementNode & {
	type: "list"
	listType: "bullet" | "number"
	start?: number
}

type ListItemNode = ElementNode & {
	type: "listitem"
	value?: number
}

type QuoteNode = ElementNode & {
	type: "quote"
}

type CodeNode = ElementNode & {
	type: "code"
	language?: string
}

type LinkNode = ElementNode & {
	type: "link"
	url: string
	rel?: string
	target?: string
	title?: string
}

type LexicalContent = {
	root: ElementNode
}

type LexicalRendererProps = {
	content: string
	className?: string
	/** Field path for preview mode - enables paragraph-level selection */
	fieldPath?: string
}

// Track element indices for preview mode
type ElementCounters = {
	paragraph: number
	heading: number
	list: number
	quote: number
	code: number
}

// Wrapper component for editable elements in preview mode
function EditableElement({
	children,
	fieldPath,
	elementIndex,
	elementType,
}: {
	children: ReactNode
	fieldPath: string
	elementIndex: number
	elementType: string
}) {
	const { isPreviewMode, highlightedField, onFieldClick, onFieldHover } =
		usePreview()
	const [isHovered, setIsHovered] = useState(false)

	// Create a unique field path for this element (e.g., "blocks[0].p[2]")
	const elementFieldPath = `${fieldPath}.${elementType}[${elementIndex}]`
	const isHighlighted = highlightedField === elementFieldPath

	const handleClick = (e: React.MouseEvent) => {
		if (!isPreviewMode) return
		e.preventDefault()
		e.stopPropagation()
		onFieldClick(elementFieldPath)
	}

	const handleMouseEnter = () => {
		if (isPreviewMode) {
			setIsHovered(true)
			onFieldHover(elementFieldPath)
		}
	}

	const handleMouseLeave = () => {
		if (isPreviewMode) {
			setIsHovered(false)
			onFieldHover(null)
		}
	}

	if (!isPreviewMode) {
		return <>{children}</>
	}

	const getOutlineStyle = () => {
		if (isHighlighted) return "2px solid #6366f1"
		if (isHovered) return "2px dashed #6366f1"
		return "none"
	}

	// Use span for paragraph elements to avoid <div> wrapping <p> which causes hydration errors
	const WrapperTag = elementType === "p" ? "span" : "div"

	return (
		<WrapperTag
			data-cms-field={elementFieldPath}
			data-cms-editable="true"
			onClick={handleClick}
			role="button"
			tabIndex={0}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			style={{
				cursor: "pointer",
				outline: getOutlineStyle(),
				outlineOffset: "2px",
				display: elementType === "p" ? "block" : undefined,
				borderRadius: "4px",
				transition: "outline 0.15s ease-in-out",
			}}
		>
			{children}
		</WrapperTag>
	)
}

export function LexicalRenderer({
	content,
	className,
	fieldPath,
}: LexicalRendererProps) {
	try {
		const sanitized = _sanitizeContent(content)
		const parsed: LexicalContent = JSON.parse(sanitized)
		const counters: ElementCounters = {
			paragraph: 0,
			heading: 0,
			list: 0,
			quote: 0,
			code: 0,
		}
		return (
			<div className={className}>
				{renderNode(parsed.root, "root", fieldPath, counters)}
			</div>
		)
	} catch (error) {
		console.error("Error parsing Lexical content:", error)
		return <div className={className}>Failed to load content</div>
	}
}

function renderNode(
	node: LexicalNode,
	key: string,
	fieldPath?: string,
	counters: ElementCounters = {
		paragraph: 0,
		heading: 0,
		list: 0,
		quote: 0,
		code: 0,
	},
): ReactNode {
	if (!node) return null

	switch (node.type) {
		case "root":
			return renderChildren(
				(node as ElementNode).children,
				key,
				fieldPath,
				counters,
			)

		case "paragraph": {
			const paragraphNode = node as ParagraphNode
			const isEmpty =
				!paragraphNode.children ||
				paragraphNode.children.length === 0 ||
				(paragraphNode.children.length === 1 &&
					paragraphNode.children[0].type === "text" &&
					!(paragraphNode.children[0] as TextNode).text)

			// Check if paragraph contains block nodes (which shouldn't be wrapped in <p>)
			const hasBlockChild = paragraphNode.children?.some(
				(child) => child.type === "block",
			)

			// If paragraph contains block nodes, render children without <p> wrapper
			if (hasBlockChild) {
				return (
					<div key={key} className="mb-6">
						{renderChildren(paragraphNode.children, key, undefined, counters)}
					</div>
				)
			}

			const elementIndex = counters.paragraph++
			const paragraphElement = (
				<p key={key} className={isEmpty ? "mb-6" : "mb-0"}>
					{renderChildren(paragraphNode.children, key, undefined, counters)}
				</p>
			)

			// Wrap with editable element if in preview mode and has fieldPath
			if (fieldPath && !isEmpty) {
				return (
					<EditableElement
						key={key}
						fieldPath={fieldPath}
						elementIndex={elementIndex}
						elementType="p"
					>
						{paragraphElement}
					</EditableElement>
				)
			}

			return paragraphElement
		}

		case "heading": {
			const headingNode = node as HeadingNode
			// Convert all headings down one level: h1→h2, h2→h3, h3→h4, h4→h5, h5→h6, h6→h6
			const headingMap: Record<string, "h2" | "h3" | "h4" | "h5" | "h6"> = {
				h1: "h2",
				h2: "h3",
				h3: "h4",
				h4: "h5",
				h5: "h6",
				h6: "h6",
			}
			const Tag = headingMap[headingNode.tag] || "h2"
			const elementIndex = counters.heading++
			const headingElement = (
				<Tag key={key} className="mb-4">
					{renderChildren(headingNode.children, key, undefined, counters)}
				</Tag>
			)

			if (fieldPath) {
				return (
					<EditableElement
						key={key}
						fieldPath={fieldPath}
						elementIndex={elementIndex}
						elementType="h"
					>
						{headingElement}
					</EditableElement>
				)
			}

			return headingElement
		}

		case "list": {
			const listNode = node as ListNode
			const ListTag = listNode.listType === "number" ? "ol" : "ul"
			const elementIndex = counters.list++
			const listElement = (
				<ListTag key={key} className="mb-6 ml-6">
					{renderChildren(listNode.children, key, undefined, counters)}
				</ListTag>
			)

			if (fieldPath) {
				return (
					<EditableElement
						key={key}
						fieldPath={fieldPath}
						elementIndex={elementIndex}
						elementType="list"
					>
						{listElement}
					</EditableElement>
				)
			}

			return listElement
		}

		case "listitem": {
			const listItemNode = node as ListItemNode
			return (
				<li key={key} className="mb-2">
					{renderChildren(listItemNode.children, key, undefined, counters)}
				</li>
			)
		}

		case "quote": {
			const quoteNode = node as QuoteNode
			const elementIndex = counters.quote++
			const quoteElement = (
				<blockquote
					key={key}
					className="mb-6 border-gray-300 border-l-4 pl-4 text-gray-700 italic"
				>
					{renderChildren(quoteNode.children, key, undefined, counters)}
				</blockquote>
			)

			if (fieldPath) {
				return (
					<EditableElement
						key={key}
						fieldPath={fieldPath}
						elementIndex={elementIndex}
						elementType="quote"
					>
						{quoteElement}
					</EditableElement>
				)
			}

			return quoteElement
		}

		case "code": {
			const codeNode = node as CodeNode
			const elementIndex = counters.code++
			const codeElement = (
				<pre
					key={key}
					className="mb-6 overflow-x-auto rounded-lg bg-gray-900 p-4 text-gray-100"
				>
					<code>
						{renderChildren(codeNode.children, key, undefined, counters)}
					</code>
				</pre>
			)

			if (fieldPath) {
				return (
					<EditableElement
						key={key}
						fieldPath={fieldPath}
						elementIndex={elementIndex}
						elementType="code"
					>
						{codeElement}
					</EditableElement>
				)
			}

			return codeElement
		}

		case "link": {
			const linkNode = node as LinkNode
			return (
				<a
					key={key}
					href={linkNode.url}
					target={linkNode.target}
					rel={linkNode.rel || "noopener noreferrer"}
					className="text-purple-600 hover:underline"
				>
					{renderChildren(linkNode.children, key, undefined, counters)}
				</a>
			)
		}

		case "text": {
			const textNode = node as TextNode
			let text: ReactNode = textNode.text

			// Format flags (bitwise)
			// 1 = bold, 2 = italic, 4 = strikethrough, 8 = underline, 16 = code
			const format = textNode.format || 0

			if (format & 1) {
				text = <strong key={`${key}-bold`}>{text}</strong>
			}
			if (format & 2) {
				text = <em key={`${key}-italic`}>{text}</em>
			}
			if (format & 4) {
				text = (
					<span key={`${key}-strike`} className="line-through">
						{text}
					</span>
				)
			}
			if (format & 8) {
				text = (
					<span key={`${key}-underline`} className="underline">
						{text}
					</span>
				)
			}
			if (format & 16) {
				text = (
					<code
						key={`${key}-code`}
						className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm"
					>
						{text}
					</code>
				)
			}

			// Parse inline styles (e.g., color)
			const inlineStyle: Record<string, string> = {}
			if (textNode.style) {
				const styleString = textNode.style
				const styleMatches = styleString.match(/([^:;\s]+)\s*:\s*([^;]+)/g)
				if (styleMatches) {
					for (const match of styleMatches) {
						const [property, value] = match.split(":").map((s) => s.trim())
						if (property && value) {
							// Convert CSS property to camelCase for React
							const camelCaseProperty = property.replace(/-([a-z])/g, (g) =>
								g[1].toUpperCase(),
							)
							inlineStyle[camelCaseProperty] = value
						}
					}
				}
			}

			// Apply inline styles if present
			if (Object.keys(inlineStyle).length > 0) {
				return (
					<span key={key} style={inlineStyle}>
						{text}
					</span>
				)
			}

			return <span key={key}>{text}</span>
		}

		case "linebreak":
			return <br key={key} />

		case "block": {
			// Block nodes are custom CMS blocks embedded in rich text
			// Skip rendering them here - they should be extracted and rendered separately
			// by the parent component that knows how to render specific block types
			return null
		}

		default:
			console.warn(`Unknown Lexical node type: ${node.type}`)
			return null
	}
}

function renderChildren(
	children: LexicalNode[] | undefined,
	parentKey: string,
	fieldPath?: string,
	counters?: ElementCounters,
): ReactNode[] {
	if (!children || !Array.isArray(children)) return []

	return children.map((child, index) =>
		renderNode(child, `${parentKey}-${index}`, fieldPath, counters),
	)
}
