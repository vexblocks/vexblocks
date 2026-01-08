"use client"

import { LinkNode } from "@lexical/link"
import { ListItemNode, ListNode } from "@lexical/list"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import type { EditorState } from "lexical"
import SanitizePastePlugin from "./sanitize-paste-plugin"
import ToolbarPlugin from "./toolbar-plugin"

type LexicalEditorProps = {
	value: string
	onChange: (value: string) => void
	placeholder?: string
}

// Sanitize content to remove unusual line terminators before parsing
function sanitizeContent(content: string): string {
	// Remove Line Separator (U+2028) and Paragraph Separator (U+2029)
	// Convert them to standard newlines - JSON.stringify will escape them properly
	return content.replace(/\u2028/g, "\n").replace(/\u2029/g, "\n")
}

export default function LexicalEditor({
	value,
	onChange,
	placeholder = "Enter some text...",
}: LexicalEditorProps) {
	// Parse initial editor state from value
	const getInitialEditorState = () => {
		if (!value) return undefined

		try {
			// Sanitize content before using it
			const sanitized = sanitizeContent(value)
			// Try to parse as JSON (Lexical format)
			return sanitized
		} catch {
			// If parsing fails, return undefined and let Lexical handle it as empty
			return undefined
		}
	}

	const initialConfig = {
		namespace: "CMSEditor",
		editorState: getInitialEditorState(),
		theme: {
			paragraph: "mb-2",
			heading: {
				h1: "text-3xl font-bold mb-4",
				h2: "text-2xl font-bold mb-3",
				h3: "text-xl font-bold mb-2",
			},
			list: {
				ul: "list-disc ml-6 mb-2",
				ol: "list-decimal ml-6 mb-2",
				listitem: "mb-1",
			},
			quote: "border-l-4 border-grey-300 pl-4 italic my-4",
			link: "text-primary underline hover:text-primary-800",
		},
		onError: (error: Error) => {
			console.error("Lexical Error:", error)
		},
		nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
	}

	const handleChange = (editorState: EditorState) => {
		const json = JSON.stringify(editorState.toJSON())
		// Sanitize the JSON string to remove unusual line terminators
		const sanitized = sanitizeContent(json)
		onChange(sanitized)
	}

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<div className="relative rounded-lg border border-grey-300 bg-white">
				<ToolbarPlugin />
				<div className="relative">
					<RichTextPlugin
						contentEditable={
							<ContentEditable className="min-h-[300px] resize-none overflow-auto px-4 py-3 text-grey-500 outline-none" />
						}
						placeholder={
							<div className="pointer-events-none absolute top-3 left-4 text-grey-400">
								{placeholder}
							</div>
						}
						ErrorBoundary={LexicalErrorBoundary}
					/>
				</div>
			</div>
			<HistoryPlugin />
			<ListPlugin />
			<LinkPlugin />
			<SanitizePastePlugin />
			<OnChangePlugin onChange={handleChange} />
		</LexicalComposer>
	)
}
