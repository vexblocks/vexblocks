"use client"

import type { ReactNode } from "react"

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
}

export function LexicalRenderer({ content, className }: LexicalRendererProps) {
	try {
		const parsed: LexicalContent = JSON.parse(content)
		return <div className={className}>{renderNode(parsed.root, "root")}</div>
	} catch (error) {
		console.error("Error parsing Lexical content:", error)
		return <div className={className}>Failed to load content</div>
	}
}

function renderNode(node: LexicalNode, key: string): ReactNode {
	if (!node) return null

	switch (node.type) {
		case "root":
			return renderChildren((node as ElementNode).children, key)

		case "paragraph": {
			const paragraphNode = node as ParagraphNode
			const isEmpty =
				!paragraphNode.children ||
				paragraphNode.children.length === 0 ||
				(paragraphNode.children.length === 1 &&
					paragraphNode.children[0].type === "text" &&
					!(paragraphNode.children[0] as TextNode).text)

			// Empty paragraphs create spacing, non-empty paragraphs have minimal spacing
			return (
				<p key={key} className={isEmpty ? "mb-6" : "mb-0"}>
					{renderChildren(paragraphNode.children, key)}
				</p>
			)
		}

		case "heading": {
			const headingNode = node as HeadingNode
			const Tag = headingNode.tag || "h2"
			return (
				<Tag key={key} className="mt-8 mb-4">
					{renderChildren(headingNode.children, key)}
				</Tag>
			)
		}

		case "list": {
			const listNode = node as ListNode
			const ListTag = listNode.listType === "number" ? "ol" : "ul"
			return (
				<ListTag key={key} className="mb-6 ml-6">
					{renderChildren(listNode.children, key)}
				</ListTag>
			)
		}

		case "listitem": {
			const listItemNode = node as ListItemNode
			return (
				<li key={key} className="mb-2">
					{renderChildren(listItemNode.children, key)}
				</li>
			)
		}

		case "quote": {
			const quoteNode = node as QuoteNode
			return (
				<blockquote
					key={key}
					className="mb-6 border-gray-300 border-l-4 pl-4 text-gray-700 italic"
				>
					{renderChildren(quoteNode.children, key)}
				</blockquote>
			)
		}

		case "code": {
			const codeNode = node as CodeNode
			return (
				<pre
					key={key}
					className="mb-6 overflow-x-auto rounded-lg bg-gray-900 p-4 text-gray-100"
				>
					<code>{renderChildren(codeNode.children, key)}</code>
				</pre>
			)
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
					{renderChildren(linkNode.children, key)}
				</a>
			)
		}

		case "text": {
			const textNode = node as TextNode
			let text: ReactNode = textNode.text

			// Format flags (bitwise)
			// 1 = bold, 2 = italic, 4 = strikethrough, 8 = underline, 16 = code, 32 = subscript, 64 = superscript
			const format = textNode.format || 0

			if (format & 1) {
				// Bold
				text = <strong key={`${key}-bold`}>{text}</strong>
			}
			if (format & 2) {
				// Italic
				text = <em key={`${key}-italic`}>{text}</em>
			}
			if (format & 4) {
				// Strikethrough
				text = (
					<span key={`${key}-strike`} className="line-through">
						{text}
					</span>
				)
			}
			if (format & 8) {
				// Underline
				text = (
					<span key={`${key}-underline`} className="underline">
						{text}
					</span>
				)
			}
			if (format & 16) {
				// Code
				text = (
					<code
						key={`${key}-code`}
						className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm"
					>
						{text}
					</code>
				)
			}

			return <span key={key}>{text}</span>
		}

		case "linebreak":
			return <br key={key} />

		default:
			console.warn(`Unknown Lexical node type: ${node.type}`)
			return null
	}
}

function renderChildren(
	children: LexicalNode[] | undefined,
	parentKey: string,
): ReactNode[] {
	if (!children || !Array.isArray(children)) return []

	return children.map((child, index) =>
		renderNode(child, `${parentKey}-${index}`),
	)
}
