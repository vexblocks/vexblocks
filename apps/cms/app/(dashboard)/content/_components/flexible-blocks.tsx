"use client"

import { useRef } from "react"
import { Layers, Trash2 } from "lucide-react"
import type { Field } from "./types"
import { BasicFieldRenderer } from "./basic-field-renderer"

type FlexibleBlockItemProps = {
	block: { _id: string; type: string; data: any }
	index: number
	totalBlocks: number
	field: Field
	path: string
	onUpdate: (data: any) => void
	onRemove: () => void
	onMoveUp: () => void
	onMoveDown: () => void
	allSchemas?: any[]
	contentBySchema?: Record<string, any[]>
}

export function FlexibleBlockItem({
	block,
	index,
	totalBlocks,
	field,
	path,
	onUpdate,
	onRemove,
	onMoveUp,
	onMoveDown,
	allSchemas,
	contentBySchema,
}: FlexibleBlockItemProps) {
	// Generate stable fieldId using block._id which never changes
	const fieldId = `field-${path}-${block._id}`.replace(/[.\[\]]/g, "-")

	return (
		<div className="rounded-lg border border-red-300 bg-white p-4 shadow-sm">
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="rounded bg-red-100 px-2 py-0.5 font-mono text-red-600 text-xs">
						{block.type}
					</span>
					<span className="text-grey-500 text-xs">Block #{index + 1}</span>
				</div>
				<div className="flex items-center gap-1">
					{index > 0 && (
						<button
							type="button"
							onClick={onMoveUp}
							className="rounded p-1 text-grey-500 transition-colors hover:bg-grey-100"
							title="Move up"
						>
							↑
						</button>
					)}
					{index < totalBlocks - 1 && (
						<button
							type="button"
							onClick={onMoveDown}
							className="rounded p-1 text-grey-500 transition-colors hover:bg-grey-100"
							title="Move down"
						>
							↓
						</button>
					)}
					<button
						type="button"
						onClick={onRemove}
						className="text-error transition-colors hover:text-error/80"
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>
			</div>
			<BasicFieldRenderer
				field={{ ...field, type: block.type as any, required: false }}
				value={block.data}
				onChange={onUpdate}
				fieldId={fieldId}
				allSchemas={allSchemas}
				allContent={contentBySchema}
			/>
		</div>
	)
}

type FlexibleBlocksFieldProps = {
	field: Field
	value: any
	path: string
	onChange: (path: string, value: any) => void
	level?: number
	allSchemas?: any[]
	contentBySchema?: Record<string, any[]>
}

export function FlexibleBlocksField({
	field,
	value,
	path,
	onChange,
	level = 0,
	allSchemas,
	contentBySchema,
}: FlexibleBlocksFieldProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	
	const blocks = (value || []) as Array<{
		_id: string
		type: string
		data: any
	}>

	const allowedTypes = field.allowedBlocks || [
		"shortText",
		"longText",
		"richText",
		"media",
		"url",
		"boolean",
		"number",
		"date",
		"select",
		"group",
		"blockReference",
	]

	const addBlock = (blockType: string) => {
		const newBlock = {
			_id: `block_${Date.now()}`,
			type: blockType,
			data: blockType === "boolean" ? false : blockType === "number" ? 0 : "",
		}
		const newBlocks = [...blocks, newBlock]
		onChange(path, newBlocks)
		
		// Scroll to bottom of the flexible blocks container smoothly
		setTimeout(() => {
			if (containerRef.current) {
				const container = containerRef.current
				const containerRect = container.getBoundingClientRect()
				const absoluteBottom = window.scrollY + containerRect.bottom
				window.scrollTo({ top: absoluteBottom - window.innerHeight + 100, behavior: "smooth" })
			}
		}, 100)
	}

	const removeBlock = (blockId: string) => {
		onChange(
			path,
			blocks.filter((b) => b._id !== blockId),
		)
	}

	const updateBlock = (blockId: string, data: any) => {
		onChange(
			path,
			blocks.map((b) => (b._id === blockId ? { ...b, data } : b)),
		)
	}

	const moveBlock = (index: number, direction: "up" | "down") => {
		const newIndex = direction === "up" ? index - 1 : index + 1
		if (newIndex < 0 || newIndex >= blocks.length) return
		const newBlocks = [...blocks]
		;[newBlocks[index], newBlocks[newIndex]] = [
			newBlocks[newIndex],
			newBlocks[index],
		]
		onChange(path, newBlocks)
	}

	const canAddMore = !field.maxBlocks || blocks.length < field.maxBlocks

	return (
		<div
			ref={containerRef}
			className="rounded-lg border-2 border-red-200 bg-red-50 p-4"
			style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
		>
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Layers className="h-5 w-5 text-red-600" />
					<h3 className="font-semibold text-grey-900 text-lg">{field.label}</h3>
					<span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-600 text-xs">
						Flexible Blocks
					</span>
					{field.required && <span className="text-error text-sm">*</span>}
				</div>
				{canAddMore && (
					<div className="relative">
						<select
							onChange={(e) => {
								if (e.target.value) {
									addBlock(e.target.value)
									e.target.value = ""
								}
							}}
							className="rounded border border-red-300 bg-white px-3 py-1.5 text-red-600 text-sm transition-colors hover:bg-red-50"
						>
							<option value="">+ Add Block</option>
							{allowedTypes.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
					</div>
				)}
			</div>
			{field.helpText && (
				<p className="mb-4 text-grey-500 text-sm">{field.helpText}</p>
			)}
			{field.maxBlocks && (
				<p className="mb-4 text-grey-500 text-xs">
					Maximum: {field.maxBlocks} blocks ({blocks.length}/{field.maxBlocks}{" "}
					used)
				</p>
			)}

			{blocks.length === 0 ? (
				<div className="rounded-lg border-2 border-grey-300 border-dashed bg-white p-8 text-center">
					<p className="text-grey-400 text-sm">
						No blocks yet. Select a block type to add.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{blocks.map((block, index) => (
						<FlexibleBlockItem
							key={block._id}
							block={block}
							index={index}
							totalBlocks={blocks.length}
							field={field}
							path={path}
							onUpdate={(newData) => updateBlock(block._id, newData)}
							onRemove={() => removeBlock(block._id)}
							onMoveUp={() => moveBlock(index, "up")}
							onMoveDown={() => moveBlock(index, "down")}
							allSchemas={allSchemas}
							contentBySchema={contentBySchema}
						/>
					))}
				</div>
			)}
		</div>
	)
}

