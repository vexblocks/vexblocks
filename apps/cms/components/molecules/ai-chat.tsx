"use client"

import { useChat } from "@ai-sdk/react"
import { Bot, Send, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type AIChatProps = {
	isOpen: boolean
	onClose: () => void
}

export function AIChat({ isOpen, onClose }: AIChatProps) {
	const { messages, sendMessage, status } = useChat()

	const messagesEndRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLTextAreaElement>(null)
	const [input, setInput] = useState("")
	const [inputHeight, setInputHeight] = useState(56)

	const isLoading = status === "streaming" || status === "submitted"

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim() || isLoading) return
		sendMessage({ text: input })
		setInput("")
	}

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	})

	// Focus input when chat opens
	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus()
		}
	}, [isOpen])

	// Auto-resize textarea
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.style.height = "56px"
			const scrollHeight = inputRef.current.scrollHeight
			const newHeight = Math.min(Math.max(scrollHeight, 56), 200)
			setInputHeight(newHeight)
			inputRef.current.style.height = `${newHeight}px`
		}
	})

	if (!isOpen) return null

	return (
		<div className="fixed right-6 bottom-6 z-50 flex h-150 w-105 flex-col rounded-xl border border-grey-200 bg-white shadow-[0px_8px_32px_rgba(0,0,0,0.12)]">
			{/* Header */}
			<div className="flex items-center justify-between border-grey-200 border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-b from-secondary to-secondary-dark">
						<Bot className="h-5 w-5 text-white" />
					</div>
					<div>
						<h3 className="font-semibold text-primary text-sm">
							CMS Assistant
						</h3>
						<p className="text-grey-500 text-xs">
							Ask me anything about your CMS
						</p>
					</div>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="text-grey-400 transition-colors hover:text-grey-500"
					aria-label="Close chat"
				>
					<X className="h-5 w-5" />
				</button>
			</div>

			{/* Messages */}
			<div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
				{messages.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center px-6 text-center">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-grey-100">
							<Bot className="h-6 w-6 text-secondary" />
						</div>
						<h4 className="mb-2 font-semibold text-base text-primary">
							Welcome to CMS Assistant
						</h4>
						<p className="text-grey-500 text-sm leading-relaxed">
							I can help you manage schemas, create content, explain features,
							and answer questions about your CMS.
						</p>
					</div>
				) : (
					messages.map((message) => (
						<div
							key={message.id}
							className={cn(
								"flex gap-3",
								message.role === "user" ? "justify-end" : "justify-start",
							)}
						>
							{message.role === "assistant" && (
								<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-b from-secondary to-secondary-dark">
									<Bot className="h-4 w-4 text-white" />
								</div>
							)}
							<div
								className={cn(
									"max-w-70 rounded-lg px-3 py-2",
									message.role === "user"
										? "bg-linear-to-b from-primary to-primary-900 text-white"
										: "bg-grey-100 text-primary",
								)}
							>
								<p className="wrap-break-words whitespace-pre-wrap text-sm leading-relaxed">
									{message.parts?.map(
										(part, i) =>
											part.type === "text" && (
												<span key={`${message.id}-${i}`}>{part.text}</span>
											),
									)}
								</p>
							</div>
							{message.role === "user" && (
								<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-grey-300">
									<span className="font-semibold text-primary text-xs">
										You
									</span>
								</div>
							)}
						</div>
					))
				)}
				{isLoading && (
					<div className="flex justify-start gap-3">
						<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-b from-secondary to-secondary-dark">
							<Bot className="h-4 w-4 text-white" />
						</div>
						<div className="rounded-lg bg-grey-100 px-3 py-2">
							<div className="flex gap-1">
								<div className="h-2 w-2 animate-bounce rounded-full bg-grey-400 [animation-delay:-0.3s]" />
								<div className="h-2 w-2 animate-bounce rounded-full bg-grey-400 [animation-delay:-0.15s]" />
								<div className="h-2 w-2 animate-bounce rounded-full bg-grey-400" />
							</div>
						</div>
					</div>
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Input */}
			<form
				onSubmit={handleSubmit}
				className="border-grey-200 border-t p-3"
				style={{ minHeight: inputHeight + 24 }}
			>
				<div className="flex items-end gap-2">
					<textarea
						ref={inputRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault()
								handleSubmit(e)
							}
						}}
						placeholder="Type your message..."
						className="flex-1 resize-none rounded-lg border border-grey-200 px-3 py-2 text-primary text-sm transition-all placeholder:text-grey-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-secondary"
						rows={1}
						disabled={isLoading}
					/>
					<button
						type="submit"
						disabled={isLoading || !input.trim()}
						className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-b from-secondary to-secondary-dark text-white shadow-[0px_2px_8px_rgba(81,192,177,0.24)] transition-all hover:from-secondary-dark hover:to-secondary-dark disabled:cursor-not-allowed disabled:opacity-50"
						aria-label="Send message"
					>
						<Send className="h-4 w-4" />
					</button>
				</div>
				<p className="mt-2 text-grey-400 text-xs">
					Press Enter to send, Shift + Enter for new line
				</p>
			</form>
		</div>
	)
}
