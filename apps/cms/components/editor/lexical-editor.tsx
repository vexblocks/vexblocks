"use client"

import { LinkNode } from "@lexical/link"
import { ListItemNode, ListNode } from "@lexical/list"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	type EditorState,
} from "lexical"
import { useEffect } from "react"
import ToolbarPlugin from "./toolbar-plugin"

type LexicalEditorProps = {
	value: string
	onChange: (value: string) => void
	placeholder?: string
}

// Plugin to set initial content
function InitialContentPlugin({ content }: { content: string }) {
	const [editor] = useLexicalComposerContext()

	useEffect(() => {
		if (content) {
			editor.update(() => {
				try {
					const editorState = editor.parseEditorState(content)
					editor.setEditorState(editorState)
				} catch (_e) {
					// If parsing fails, set as plain text
					const root = $getRoot()
					root.clear()
					const paragraph = $createParagraphNode()
					paragraph.append($createTextNode(content))
					root.append(paragraph)
				}
			})
		}
	}, [editor, content])

	return null
}

export default function LexicalEditor({
	value,
	onChange,
	placeholder = "Enter some text...",
}: LexicalEditorProps) {
	const initialConfig = {
		namespace: "CMSEditor",
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
		onChange(json)
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
			<OnChangePlugin onChange={handleChange} />
			{value && <InitialContentPlugin content={value} />}
		</LexicalComposer>
	)
}
