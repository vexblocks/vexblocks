"use client"

import { TOGGLE_LINK_COMMAND } from "@lexical/link"
import {
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
	$createHeadingNode,
	$createQuoteNode,
	type HeadingTagType,
} from "@lexical/rich-text"
import { $wrapNodes } from "@lexical/selection"
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	FORMAT_TEXT_COMMAND,
	REDO_COMMAND,
	UNDO_COMMAND,
} from "lexical"
import {
	Bold,
	Heading1,
	Heading2,
	Heading3,
	Italic,
	Link as LinkIcon,
	List,
	ListOrdered,
	Quote,
	Redo,
	Type,
	Underline,
	Undo,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"

export default function ToolbarPlugin() {
	const [editor] = useLexicalComposerContext()
	const [isBold, setIsBold] = useState(false)
	const [isItalic, setIsItalic] = useState(false)
	const [isUnderline, setIsUnderline] = useState(false)
	const [_blockType, setBlockType] = useState("paragraph")

	const updateToolbar = useCallback(() => {
		const selection = $getSelection()
		if ($isRangeSelection(selection)) {
			setIsBold(selection.hasFormat("bold"))
			setIsItalic(selection.hasFormat("italic"))
			setIsUnderline(selection.hasFormat("underline"))
		}
	}, [])

	useEffect(() => {
		return editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				updateToolbar()
			})
		})
	}, [editor, updateToolbar])

	const formatHeading = (headingSize: HeadingTagType) => {
		editor.update(() => {
			const selection = $getSelection()
			if ($isRangeSelection(selection)) {
				$wrapNodes(selection, () => $createHeadingNode(headingSize))
			}
		})
		setBlockType(`h${headingSize.slice(1)}`)
	}

	const formatParagraph = () => {
		editor.update(() => {
			const selection = $getSelection()
			if ($isRangeSelection(selection)) {
				$wrapNodes(selection, () => $createParagraphNode())
			}
		})
		setBlockType("paragraph")
	}

	const formatQuote = () => {
		editor.update(() => {
			const selection = $getSelection()
			if ($isRangeSelection(selection)) {
				$wrapNodes(selection, () => $createQuoteNode())
			}
		})
		setBlockType("quote")
	}

	const insertLink = useCallback(() => {
		const url = prompt("Enter the URL:")
		if (url) {
			editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
		}
	}, [editor])

	return (
		<div className="flex flex-wrap items-center gap-1 border-grey-200 border-b p-2">
			{/* Undo/Redo */}
			<button
				type="button"
				onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
				className="rounded p-2 transition-colors hover:bg-grey-100"
				title="Undo"
			>
				<Undo className="h-4 w-4" />
			</button>
			<button
				type="button"
				onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
				className="rounded p-2 transition-colors hover:bg-grey-100"
				title="Redo"
			>
				<Redo className="h-4 w-4" />
			</button>

			<div className="mx-2 h-6 w-px bg-grey-300" />

			{/* Text Formatting */}
			<button
				type="button"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
				className={`rounded p-2 transition-colors ${
					isBold ? "bg-primary/10 text-primary" : "hover:bg-grey-100"
				}`}
				title="Bold"
			>
				<Bold className="h-4 w-4" />
			</button>
			<button
				type="button"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
				className={`rounded p-2 transition-colors ${
					isItalic ? "bg-primary/10 text-primary" : "hover:bg-grey-100"
				}`}
				title="Italic"
			>
				<Italic className="h-4 w-4" />
			</button>
			<button
				type="button"
				onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
				className={`rounded p-2 transition-colors ${
					isUnderline ? "bg-primary/10 text-primary" : "hover:bg-grey-100"
				}`}
				title="Underline"
			>
				<Underline className="h-4 w-4" />
			</button>

			<div className="mx-2 h-6 w-px bg-grey-300" />

			{/* Block Formatting */}
			<button
				type="button"
				onClick={formatParagraph}
				className="rounded p-2 transition-colors hover:bg-grey-100"
				title="Paragraph"
			>
				<Type className="h-4 w-4" />
			</button>
			<button
				type="button"
				onClick={() => formatHeading("h1")}
				className="rounded p-2 transition-colors hover:bg-grey-100"
				title="Heading 1"
			>
				<Heading1 className="h-4 w-4" />
			</button>
			<button
				type="button"
				onClick={() => formatHeading("h2")}
				className="rounded p-2 transition-colors hover:bg-grey-100"
				title="Heading 2"
			>
				<Heading2 className="h-4 w-4" />
			</button>
			<button
				type="button"
				onClick={() => formatHeading("h3")}
				className="rounded p-2 transition-colors hover:bg-grey-100"
				title="Heading 3"
			>
				<Heading3 className="h-4 w-4" />
			</button>

			<div className="mx-2 h-6 w-px bg-grey-300" />

			{/* Lists */}
			<button
				type="button"
				onClick={() => {
					editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
				}}
				className="rounded p-2 transition-colors hover:bg-grey-100"
				title="Bullet List"
			>
				<List className="h-4 w-4" />
			</button>
			<button
				type="button"
				onClick={() => {
					editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
				}}
				className="rounded p-2 transition-colors hover:bg-grey-100"
				title="Numbered List"
			>
				<ListOrdered className="h-4 w-4" />
			</button>

			<div className="mx-2 h-6 w-px bg-grey-300" />

			{/* Quote */}
			<button
				type="button"
				onClick={formatQuote}
				className="rounded p-2 transition-colors hover:bg-grey-100"
				title="Quote"
			>
				<Quote className="h-4 w-4" />
			</button>

			<div className="mx-2 h-6 w-px bg-grey-300" />

			{/* Link */}
			<button
				type="button"
				onClick={insertLink}
				className="rounded p-2 transition-colors hover:bg-grey-100"
				title="Insert Link"
			>
				<LinkIcon className="h-4 w-4" />
			</button>
		</div>
	)
}
