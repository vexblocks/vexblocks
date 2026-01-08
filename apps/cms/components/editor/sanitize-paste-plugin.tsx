import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_HIGH,
	PASTE_COMMAND,
} from "lexical"
import { useEffect } from "react"

export default function SanitizePastePlugin(): null {
	const [editor] = useLexicalComposerContext()

	useEffect(() => {
		return editor.registerCommand(
			PASTE_COMMAND,
			(event: ClipboardEvent) => {
				const clipboardData = event.clipboardData
				if (!clipboardData) return false

				const text = clipboardData.getData("text/plain")
				if (!text) return false

				// Sanitize the pasted text to remove unusual line terminators
				const sanitized = text.replace(/\u2028/g, "\n").replace(/\u2029/g, "\n")

				// If the text was sanitized, prevent default paste and insert sanitized text
				if (sanitized !== text) {
					event.preventDefault()

					editor.update(() => {
						const selection = $getSelection()
						if ($isRangeSelection(selection)) {
							selection.insertText(sanitized)
						}
					})

					return true
				}

				return false
			},
			COMMAND_PRIORITY_HIGH,
		)
	}, [editor])

	return null
}
