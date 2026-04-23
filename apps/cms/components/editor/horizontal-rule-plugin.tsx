"use client"

import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/extension"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
	$applyNodeReplacement,
	$createNodeSelection,
	$createParagraphNode,
	$getRoot,
	$getSelection,
	$isNodeSelection,
	$isRangeSelection,
	$setSelection,
	COMMAND_PRIORITY_EDITOR,
	DecoratorNode,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
	type LexicalNode,
	type NodeKey,
	type SerializedLexicalNode,
} from "lexical"
import { useEffect } from "react"

// HorizontalRuleComponent — handles click-to-select and visual feedback
function HorizontalRuleComponent({ nodeKey }: { nodeKey: NodeKey }) {
	const [editor] = useLexicalComposerContext()

	const handleClick = () => {
		editor.update(() => {
			const selection = $createNodeSelection()
			selection.add(nodeKey)
			$setSelection(selection)
		})
	}

	return (
		<button
			type="button"
			className="w-full cursor-pointer border-none bg-transparent p-0 focus:outline-none"
			onClick={handleClick}
			aria-label="Divider"
		>
			<hr className="my-4 border-t border-grey-300" />
		</button>
	)
}

// Custom HorizontalRuleNode — uses React's decorate() for selection support
export class HorizontalRuleNode extends DecoratorNode<React.ReactElement> {
	static getType(): string {
		return "horizontalrule"
	}

	static clone(node: HorizontalRuleNode): HorizontalRuleNode {
		return new HorizontalRuleNode(node.__key)
	}

	static importJSON(_node: SerializedLexicalNode): HorizontalRuleNode {
		return $createHorizontalRuleNode()
	}

	exportJSON(): SerializedLexicalNode {
		return { type: "horizontalrule", version: 1 }
	}

	createDOM(): HTMLElement {
		return document.createElement("div")
	}

	updateDOM(): false {
		return false
	}

	isInline(): false {
		return false
	}

	decorate(): React.ReactElement {
		return <HorizontalRuleComponent nodeKey={this.__key} />
	}
}

export function $createHorizontalRuleNode(): HorizontalRuleNode {
	return $applyNodeReplacement(new HorizontalRuleNode())
}

export function $isHorizontalRuleNode(
	node: LexicalNode | null | undefined,
): node is HorizontalRuleNode {
	return node instanceof HorizontalRuleNode
}

// Plugin — registers insert command and keyboard deletion
export function HorizontalRulePlugin() {
	const [editor] = useLexicalComposerContext()

	useEffect(() => {
		const removeInsert = editor.registerCommand(
			INSERT_HORIZONTAL_RULE_COMMAND,
			() => {
				const selection = $getSelection()
				if (!$isRangeSelection(selection)) return false

				const focusNode = selection.focus.getNode()
				const topLevel = focusNode.getTopLevelElementOrThrow()

				const hr = $createHorizontalRuleNode()
				const paragraph = $createParagraphNode()

				topLevel.insertAfter(paragraph)
				topLevel.insertAfter(hr)
				paragraph.select()

				return true
			},
			COMMAND_PRIORITY_EDITOR,
		)

		const handleDelete = () => {
			const selection = $getSelection()
			if (!$isNodeSelection(selection)) return false

			let deleted = false
			for (const node of selection.getNodes()) {
				if ($isHorizontalRuleNode(node)) {
					const prev = node.getPreviousSibling()
					node.remove()
					if (prev) {
						prev.selectEnd()
					} else {
						const p = $createParagraphNode()
						$getRoot().append(p)
						p.select()
					}
					deleted = true
				}
			}
			return deleted
		}

		const removeBackspace = editor.registerCommand(
			KEY_BACKSPACE_COMMAND,
			handleDelete,
			COMMAND_PRIORITY_EDITOR,
		)
		const removeDelete = editor.registerCommand(
			KEY_DELETE_COMMAND,
			handleDelete,
			COMMAND_PRIORITY_EDITOR,
		)

		return () => {
			removeInsert()
			removeBackspace()
			removeDelete()
		}
	}, [editor])

	return null
}
