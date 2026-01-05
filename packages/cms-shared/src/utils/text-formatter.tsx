import React from "react"

export type TextFormatConfig = {
	boldClassName?: string
	italicClassName?: string
	colorClassName?: string
}

type TextSegment = {
	text: string
	bold?: boolean
	italic?: boolean
	color?: boolean
}

/**
 * Parse formatted text with markdown-like syntax:
 * - **text** for bold
 * - *text* for italic
 * - ##text## for color marking
 */
export function parseFormattedText(text: string): TextSegment[] {
	const segments: TextSegment[] = []
	let currentIndex = 0

	// Combined regex to match all formatting patterns
	const formatRegex = /(\*\*.*?\*\*|\*.*?\*|##.*?##)/g
	const matches = text.matchAll(formatRegex)

	for (const match of matches) {
		const matchStart = match.index ?? 0
		const matchText = match[0]

		// Add plain text before the match
		if (matchStart > currentIndex) {
			segments.push({
				text: text.slice(currentIndex, matchStart),
			})
		}

		// Determine formatting type and extract content
		if (matchText.startsWith("**") && matchText.endsWith("**")) {
			// Bold text
			segments.push({
				text: matchText.slice(2, -2),
				bold: true,
			})
		} else if (matchText.startsWith("*") && matchText.endsWith("*")) {
			// Italic text
			segments.push({
				text: matchText.slice(1, -1),
				italic: true,
			})
		} else if (matchText.startsWith("##") && matchText.endsWith("##")) {
			// Color marked text
			segments.push({
				text: matchText.slice(2, -2),
				color: true,
			})
		}

		currentIndex = matchStart + matchText.length
	}

	// Add remaining plain text
	if (currentIndex < text.length) {
		segments.push({
			text: text.slice(currentIndex),
		})
	}

	return segments
}

/**
 * Render formatted text as React elements with custom styling
 */
export function FormattedText({
	text,
	config = {},
}: {
	text: string
	config?: TextFormatConfig
}) {
	const segments = parseFormattedText(text)

	return (
		<>
			{segments.map((segment, index) => {
				const classNames: string[] = []

				if (segment.bold && config.boldClassName) {
					classNames.push(config.boldClassName)
				}
				if (segment.italic && config.italicClassName) {
					classNames.push(config.italicClassName)
				}
				if (segment.color && config.colorClassName) {
					classNames.push(config.colorClassName)
				}

				if (classNames.length > 0) {
					return (
						<span key={index} className={classNames.join(" ")}>
							{segment.text}
						</span>
					)
				}

				return <React.Fragment key={index}>{segment.text}</React.Fragment>
			})}
		</>
	)
}

/**
 * Helper to render formatted text inline (returns string with HTML)
 * Use with dangerouslySetInnerHTML if needed
 */
export function formatTextToHTML(
	text: string,
	config: TextFormatConfig = {},
): string {
	const segments = parseFormattedText(text)

	return segments
		.map((segment) => {
			const classNames: string[] = []

			if (segment.bold && config.boldClassName) {
				classNames.push(config.boldClassName)
			}
			if (segment.italic && config.italicClassName) {
				classNames.push(config.italicClassName)
			}
			if (segment.color && config.colorClassName) {
				classNames.push(config.colorClassName)
			}

			if (classNames.length > 0) {
				return `<span class="${classNames.join(" ")}">${segment.text}</span>`
			}

			return segment.text
		})
		.join("")
}
