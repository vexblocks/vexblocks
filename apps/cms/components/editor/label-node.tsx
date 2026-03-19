import {
	$applyNodeReplacement,
	$createParagraphNode,
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
	type EditorConfig,
	ElementNode,
	type LexicalNode,
	type RangeSelection,
	type SerializedElementNode,
	type Spread,
} from "lexical"

export type SerializedLabelNode = Spread<
	{ type: "label"; version: 1 },
	SerializedElementNode
>

function $convertLabelElement(): DOMConversionOutput {
	return { node: $createLabelNode() }
}

export class LabelNode extends ElementNode {
	static getType(): string {
		return "label"
	}

	static clone(node: LabelNode): LabelNode {
		return new LabelNode(node.__key)
	}

	createDOM(config: EditorConfig): HTMLElement {
		const element = document.createElement("p")
		const theme = (config.theme as Record<string, string>).label
		if (theme) {
			element.className = theme
		}
		return element
	}

	updateDOM(): boolean {
		return false
	}

	static importDOM(): DOMConversionMap | null {
		return {
			p: (node: Node) => {
				const el = node as HTMLElement
				if (el.dataset.lexicalLabel === "true") {
					return { conversion: $convertLabelElement, priority: 1 }
				}
				return null
			},
		}
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement("p")
		element.dataset.lexicalLabel = "true"
		return { element }
	}

	static importJSON(_serializedNode: SerializedLabelNode): LabelNode {
		return $createLabelNode()
	}

	exportJSON(): SerializedLabelNode {
		return {
			...super.exportJSON(),
			type: "label",
			version: 1,
		}
	}

	insertNewAfter(_selection: RangeSelection): LexicalNode {
		const newBlock = $createParagraphNode()
		this.insertAfter(newBlock)
		return newBlock
	}

	collapseAtStart(): boolean {
		return true
	}
}

export function $createLabelNode(): LabelNode {
	return $applyNodeReplacement(new LabelNode())
}

export function $isLabelNode(
	node: LexicalNode | null | undefined,
): node is LabelNode {
	return node instanceof LabelNode
}
