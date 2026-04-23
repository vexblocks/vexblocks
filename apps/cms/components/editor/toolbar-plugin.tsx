"use client"

import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/extension"
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
import { $patchStyleText, $wrapNodes } from "@lexical/selection"
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	FORMAT_TEXT_COMMAND,
	REDO_COMMAND,
	UNDO_COMMAND,
} from "lexical"
import {
	Bold,
	Heading1,
	Heading2,
	Heading3,
	Heading4,
	Italic,
	Link as LinkIcon,
	List,
	ListOrdered,
	Minus,
	Palette,
	Quote,
	Redo,
	Tag,
	Type,
	Underline,
	Undo,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { $createLabelNode } from "./label-node"

export default function ToolbarPlugin() {
	const [editor] = useLexicalComposerContext()
	const [isBold, setIsBold] = useState(false)
	const [isItalic, setIsItalic] = useState(false)
	const [isUnderline, setIsUnderline] = useState(false)
	const [_blockType, setBlockType] = useState("paragraph")
	const [isUnorderedList, setIsUnorderedList] = useState(false)
	const [isOrderedList, setIsOrderedList] = useState(false)
	const [currentColor, setCurrentColor] = useState<string | undefined>(
		undefined,
	)
	const [showColorPicker, setShowColorPicker] = useState(false)
	const colorPickerRef = useRef<HTMLDivElement>(null)

	const updateToolbar = useCallback(() => {
		const selection = $getSelection()
		if ($isRangeSelection(selection)) {
			setIsBold(selection.hasFormat("bold"))
			setIsItalic(selection.hasFormat("italic"))
			setIsUnderline(selection.hasFormat("underline"))

			// Check if we're in a list
			const anchorNode = selection.anchor.getNode()
			const element =
				anchorNode.getKey() === "root"
					? anchorNode
					: anchorNode.getTopLevelElementOrThrow()
			const elementKey = element.getKey()
			const elementDOM = editor.getElementByKey(elementKey)

			if (elementDOM !== null) {
				const parentList = elementDOM.closest("ul, ol")
				if (parentList) {
					setIsUnorderedList(parentList.tagName === "UL")
					setIsOrderedList(parentList.tagName === "OL")
				} else {
					setIsUnorderedList(false)
					setIsOrderedList(false)
				}
			}

			// Get color from selected text style
			const nodes = selection.getNodes()
			let color: string | undefined
			for (const node of nodes) {
				if ($isTextNode(node)) {
					const style = node.getStyle()
					const colorMatch = style.match(/color:\s*([^;]+)/)
					if (colorMatch) {
						color = colorMatch[1].trim()
						break
					}
				}
			}
			setCurrentColor(color)
		}
	}, [editor])

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

	const formatLabel = () => {
		editor.update(() => {
			const selection = $getSelection()
			if ($isRangeSelection(selection)) {
				$wrapNodes(selection, () => $createLabelNode())
			}
		})
		setBlockType("label")
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

	const applyColor = useCallback(
		(color: string | undefined) => {
			editor.update(() => {
				const selection = $getSelection()
				if ($isRangeSelection(selection)) {
					$patchStyleText(selection, {
						color: color || null,
					})
				}
			})
			setCurrentColor(color)
			setShowColorPicker(false)
		},
		[editor],
	)

	// Close color picker when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				colorPickerRef.current &&
				!colorPickerRef.current.contains(event.target as Node)
			) {
				setShowColorPicker(false)
			}
		}

		if (showColorPicker) {
			document.addEventListener("mousedown", handleClickOutside)
			return () => {
				document.removeEventListener("mousedown", handleClickOutside)
			}
		}
	}, [showColorPicker])

	return (
		<div className="flex flex-wrap items-center gap-1 border-b border-grey-200 p-2">
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

			{/* Color Picker */}
			<div className="relative" ref={colorPickerRef}>
				<button
					type="button"
					onClick={() => setShowColorPicker(!showColorPicker)}
					className={`rounded p-2 transition-colors ${
						currentColor ? "bg-primary/10 text-primary" : "hover:bg-grey-100"
					}`}
					title="Text Color"
				>
					<Palette className="h-4 w-4" />
					{currentColor && (
						<div
							className="absolute right-1 bottom-1 h-2 w-2 rounded-full border border-white"
							style={{ backgroundColor: currentColor }}
						/>
					)}
				</button>

				{showColorPicker && (
					<div className="absolute top-full left-0 z-10 mt-1 rounded-lg border border-grey-300 bg-white p-3 shadow-lg">
						<div className="text-grey-700 mb-2 text-sm font-medium">
							Text Color
						</div>
						<div className="grid grid-cols-6 gap-2">
							{/* Predefined colors */}
							{[
								"#000000",
								"#374151",
								"#6B7280",
								"#9CA3AF",
								"#D1D5DB",
								"#F3F4F6",
								"#EF4444",
								"#F97316",
								"#F59E0B",
								"#EAB308",
								"#84CC16",
								"#22C55E",
								"#10B981",
								"#14B8A6",
								"#06B6D4",
								"#0EA5E9",
								"#3B82F6",
								"#6366F1",
								"#8B5CF6",
								"#A855F7",
								"#D946EF",
								"#EC4899",
								"#F43F5E",
								"#DC2626",
							].map((color) => (
								<button
									key={color}
									type="button"
									onClick={() => applyColor(color)}
									className="h-6 w-6 rounded border border-grey-300 transition-transform hover:scale-110"
									style={{ backgroundColor: color }}
									title={color}
								/>
							))}
						</div>
						<div className="mt-3 flex items-center gap-2 border-t border-grey-200 pt-3">
							<input
								type="color"
								onChange={(e) => applyColor(e.target.value)}
								className="h-8 w-12 cursor-pointer rounded border border-grey-300"
								title="Custom color"
							/>
							<button
								type="button"
								onClick={() => applyColor(undefined)}
								className="flex-1 rounded border border-grey-300 px-3 py-1 text-sm transition-colors hover:bg-grey-100"
							>
								Reset
							</button>
						</div>
					</div>
				)}
			</div>

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
			<button
				type="button"
				onClick={() => formatHeading("h4")}
				className="rounded p-2 transition-colors hover:bg-grey-100"
				title="Heading 4"
			>
				<Heading4 className="h-4 w-4" />
			</button>
			<button
				type="button"
				onClick={formatLabel}
				className="rounded p-2 transition-colors hover:bg-grey-100"
				title="Label"
			>
				<Tag className="h-4 w-4" />
			</button>

			<div className="mx-2 h-6 w-px bg-grey-300" />

			{/* Lists */}
			<button
				type="button"
				onClick={() => {
					if (isUnorderedList) {
						formatParagraph()
					} else {
						editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
					}
				}}
				className={`rounded p-2 transition-colors ${
					isUnorderedList ? "bg-primary/10 text-primary" : "hover:bg-grey-100"
				}`}
				title="Bullet List"
			>
				<List className="h-4 w-4" />
			</button>
			<button
				type="button"
				onClick={() => {
					if (isOrderedList) {
						formatParagraph()
					} else {
						editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
					}
				}}
				className={`rounded p-2 transition-colors ${
					isOrderedList ? "bg-primary/10 text-primary" : "hover:bg-grey-100"
				}`}
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
			<button
				type="button"
				onClick={() =>
					editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
				}
				className="rounded p-2 transition-colors hover:bg-grey-100"
				title="Divider"
			>
				<Minus className="h-4 w-4" />
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
