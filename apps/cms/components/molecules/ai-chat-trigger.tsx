"use client"

import { Bot } from "lucide-react"
import { useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { AIChat } from "./ai-chat"

export function AIChatTrigger() {
	const [isOpen, setIsOpen] = useState(false)

	// Register hotkey: Cmd/Ctrl + J
	useHotkeys(
		"mod+j",
		(e) => {
			e.preventDefault()
			setIsOpen((prev) => !prev)
		},
		{
			enableOnFormTags: true,
		},
	)

	return (
		<>
			{/* Floating trigger button */}
			{!isOpen && (
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-b from-secondary to-secondary-dark text-white shadow-[0px_8px_24px_rgba(81,192,177,0.32)] transition-all hover:scale-105 hover:from-secondary-dark hover:to-secondary-dark hover:shadow-[0px_12px_32px_rgba(81,192,177,0.4)]"
					aria-label="Open AI Chat"
					title="Open AI Chat (⌘J)"
				>
					<Bot className="h-6 w-6" />
				</button>
			)}

			{/* Chat component */}
			<AIChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</>
	)
}
