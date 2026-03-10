"use client"

import { useAtom } from "@lfades/atom"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { CFImage } from "@repo/cms-shared"
import { useQuery } from "convex/react"
import { ChevronDown, Copy, Eye, Layers, Plus, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { BlockSelectorDialog } from "@/app/(dashboard)/blocks/_components/block-selector-dialog"
import {
	getCollapsedBlockIds,
	setBlockCollapsed,
} from "@/lib/block-collapse-cookie"
import { previewAtom } from "@/lib/preview-atom"
import { BasicFieldRenderer } from "./basic-field-renderer"
import { BlockPreviewModal } from "./block-preview-modal"
import { FieldRenderer } from "./field-renderer"
import { useLocale } from "./locale-context"
import type { Field } from "./types"

type FlexibleBlockItemProps = {
	block: { _id: string; type: string; data: any }
	index: number
	totalBlocks: number
	field: Field
	path: string
	onUpdate: (data: any) => void
	onRemove: () => void
	onDuplicate: () => void
	onMoveUp: () => void
	onMoveDown: () => void
	canDuplicate: boolean
	allSchemas?: any[]
	contentBySchema?: Record<string, any[]>
}

// Component to render a block reference inside FlexibleBlocks
function BlockReferenceContent({
	blockId,
	blockName,
	data,
	onChange,
	path,
	allSchemas,
	contentBySchema,
}: {
	blockId: string
	blockName?: string
	data: any
	onChange: (data: any) => void
	path: string
	allSchemas?: any[]
	contentBySchema?: Record<string, any[]>
}) {
	const [showPreviewModal, setShowPreviewModal] = useState(false)
	const { currentLocale, defaultLocale, hasLocales } = useLocale()
	const referencedBlock = useQuery(api.cms.blocks.get, {
		id: blockId as Id<"cmsBlocks">,
	})

	if (!referencedBlock) {
		return (
			<div className="flex items-center justify-center rounded-lg border border-blue-300 bg-blue-50 p-4">
				<div className="flex items-center gap-2">
					<div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
					<span className="text-blue-600 text-sm">Loading block...</span>
				</div>
			</div>
		)
	}

	// The data for the block fields (excluding the blockId metadata)
	const blockFieldsData = data?.fields || {}

	// Handle field changes using path-based updates (supports nested paths like "items[0].details[0].text")
	const handleFieldChange = (fieldPath: string, value: any) => {
		// Remove the base path prefix to get the relative path within blockFieldsData
		const relativePath = fieldPath.replace(`${path}.`, "")
		let finalValue = value
		if (hasLocales && currentLocale) {
			const currentRaw = getNestedValue(blockFieldsData, relativePath)
			finalValue =
				currentRaw &&
				typeof currentRaw === "object" &&
				!Array.isArray(currentRaw)
					? { ...currentRaw, [currentLocale]: value }
					: { [currentLocale]: value }
		}

		const updatedFields = setNestedValue(
			blockFieldsData,
			relativePath,
			finalValue,
		)
		onChange({
			blockId,
			blockName,
			fields: updatedFields,
		})
	}

	// Handle adding repeater items (supports nested paths like "items[0].details")
	const handleAddRepeaterItem = (repeaterPath: string) => {
		// Remove the base path prefix to get the relative path within blockFieldsData
		const relativePath = repeaterPath.replace(`${path}.`, "")
		const currentArray = getNestedValue(blockFieldsData, relativePath) || []
		const updatedFields = setNestedValue(blockFieldsData, relativePath, [
			...currentArray,
			{},
		])
		onChange({
			blockId,
			blockName,
			fields: updatedFields,
		})
	}

	// Handle removing repeater items (supports nested paths like "items[0].details")
	const handleRemoveRepeaterItem = (repeaterPath: string, index: number) => {
		// Remove the base path prefix to get the relative path within blockFieldsData
		const relativePath = repeaterPath.replace(`${path}.`, "")
		const currentArray = getNestedValue(blockFieldsData, relativePath) || []
		const updatedFields = setNestedValue(
			blockFieldsData,
			relativePath,
			currentArray.filter((_: any, i: number) => i !== index),
		)
		onChange({
			blockId,
			blockName,
			fields: updatedFields,
		})
	}

	// Handle moving repeater items (supports nested paths)
	const handleMoveRepeaterItem = (
		repeaterPath: string,
		index: number,
		direction: "up" | "down",
	) => {
		const relativePath = repeaterPath.replace(`${path}.`, "")
		const currentArray = getNestedValue(blockFieldsData, relativePath) || []
		const newIndex = direction === "up" ? index - 1 : index + 1
		if (newIndex < 0 || newIndex >= currentArray.length) return
		const newArray = [...currentArray]
		;[newArray[index], newArray[newIndex]] = [
			newArray[newIndex],
			newArray[index],
		]
		const updatedFields = setNestedValue(
			blockFieldsData,
			relativePath,
			newArray,
		)
		onChange({
			blockId,
			blockName,
			fields: updatedFields,
		})
	}

	return (
		<>
			<div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{referencedBlock.previewImage ? (
							<CFImage
								assetId={referencedBlock.previewImage}
								alt={referencedBlock.displayName}
								width={48}
								height={32}
								variant="public"
								className="h-8 w-12 rounded object-cover"
							/>
						) : (
							<div className="flex h-8 w-12 items-center justify-center rounded bg-blue-100">
								<Layers className="h-4 w-4 text-blue-500" />
							</div>
						)}
						<div>
							<p className="font-medium text-blue-900 text-sm">
								{referencedBlock.displayName}
							</p>
							<p className="text-blue-600 text-xs">{referencedBlock.name}</p>
						</div>
					</div>
					{referencedBlock.previewImage && (
						<button
							type="button"
							onClick={() => setShowPreviewModal(true)}
							className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-blue-700 text-sm transition-colors hover:bg-blue-50"
							title="View block preview"
						>
							<Eye className="h-4 w-4" />
							Preview
						</button>
					)}
				</div>
				<BlockReferenceFields
					referencedBlock={referencedBlock}
					blockFieldsData={blockFieldsData}
					path={path}
					handleFieldChange={handleFieldChange}
					handleAddRepeaterItem={handleAddRepeaterItem}
					handleRemoveRepeaterItem={handleRemoveRepeaterItem}
					handleMoveRepeaterItem={handleMoveRepeaterItem}
					allSchemas={allSchemas}
					contentBySchema={contentBySchema}
				/>
			</div>

			{/* Preview Modal */}
			<BlockPreviewModal
				isOpen={showPreviewModal && !!referencedBlock.previewImage}
				onClose={() => setShowPreviewModal(false)}
				blockDisplayName={referencedBlock.displayName}
				previewImageId={referencedBlock.previewImage || ""}
			/>
		</>
	)
}

// Extracted component for block reference fields to use hooks
function BlockReferenceFields({
	referencedBlock,
	blockFieldsData,
	path,
	handleFieldChange,
	handleAddRepeaterItem,
	handleRemoveRepeaterItem,
	handleMoveRepeaterItem,
	allSchemas,
	contentBySchema,
}: {
	referencedBlock: any
	blockFieldsData: any
	path: string
	handleFieldChange: (fieldPath: string, value: any) => void
	handleAddRepeaterItem: (repeaterPath: string) => void
	handleRemoveRepeaterItem: (repeaterPath: string, index: number) => void
	handleMoveRepeaterItem: (
		repeaterPath: string,
		index: number,
		direction: "up" | "down",
	) => void
	allSchemas?: any[]
	contentBySchema?: Record<string, any[]>
}) {
	const [previewState] = useAtom(previewAtom)
	const isPreviewActive = previewState.isPreviewActive
	const { currentLocale, defaultLocale, hasLocales } = useLocale()

	const getDisplayValue = (blockField: Field) => {
		const raw = blockFieldsData[blockField.name]
		if (hasLocales && raw && typeof raw === "object" && !Array.isArray(raw)) {
			return raw[currentLocale] ?? raw[defaultLocale] ?? ""
		}
		return raw
	}

	// Group consecutive small fields together
	const fieldGroups: any[][] = []
	let currentGroup: any[] = []

	const isSmallField = (fieldType: string) =>
		["shortText", "select", "checkbox", "date", "number"].includes(fieldType)
	const isLargeField = (fieldType: string) =>
		[
			"richText",
			"flexibleBlocks",
			"repeater",
			"group",
			"blockReference",
		].includes(fieldType)

	referencedBlock.fields.forEach((field: Field, index: number) => {
		if (isSmallField(field.type)) {
			currentGroup.push(field)
			const nextField = referencedBlock.fields[index + 1]
			if (!nextField || !isSmallField(nextField.type)) {
				fieldGroups.push([...currentGroup])
				currentGroup = []
			}
		} else {
			if (currentGroup.length > 0) {
				fieldGroups.push([...currentGroup])
				currentGroup = []
			}
			fieldGroups.push([field])
		}
	})

	return (
		<div
			className={`grid grid-cols-1 gap-3 rounded-lg bg-white p-3 ${isPreviewActive ? "" : "lg:grid-cols-2"}`}
		>
			{fieldGroups.map((group, groupIndex) => {
				const isGroupOfSmallFields = group.every((f) => isSmallField(f.type))
				const hasOnlyOneField = group.length === 1
				const singleField = group[0]
				const isLarge = hasOnlyOneField && isLargeField(singleField.type)

				if (isGroupOfSmallFields && group.length > 1) {
					return (
						<div key={groupIndex} className="space-y-3">
							{group.map((blockField: Field) => {
								const fieldPath = `${path}.${blockField.name}`
								return (
									<FieldRenderer
										key={blockField.name}
										field={blockField}
										path={fieldPath}
										value={getDisplayValue(blockField)}
										onChange={handleFieldChange}
										onAddRepeaterItem={handleAddRepeaterItem}
										onRemoveRepeaterItem={handleRemoveRepeaterItem}
										onMoveRepeaterItem={handleMoveRepeaterItem}
										allSchemas={allSchemas}
										contentBySchema={contentBySchema}
									/>
								)
							})}
						</div>
					)
				}

				const blockField = singleField
				const fieldPath = `${path}.${blockField.name}`

				return (
					<div
						key={blockField.name}
						className={isLarge && !isPreviewActive ? "lg:col-span-2" : ""}
					>
						<FieldRenderer
							field={blockField}
							path={fieldPath}
							value={getDisplayValue(blockField)}
							onChange={handleFieldChange}
							onAddRepeaterItem={handleAddRepeaterItem}
							onRemoveRepeaterItem={handleRemoveRepeaterItem}
							onMoveRepeaterItem={handleMoveRepeaterItem}
							allSchemas={allSchemas}
							contentBySchema={contentBySchema}
						/>
					</div>
				)
			})}
		</div>
	)
}

// Helper to get nested value from object
function getNestedValue(obj: any, path: string): any {
	const parts = path.split(/[.[\]]/).filter(Boolean)
	let current = obj
	for (const part of parts) {
		if (current === undefined || current === null) return undefined
		current = current[part]
	}
	return current
}

// Helper to set nested value in object (returns new object)
function setNestedValue(obj: any, path: string, value: any): any {
	const parts = path.split(/[.[\]]/).filter(Boolean)
	const newObj = JSON.parse(JSON.stringify(obj || {}))
	let current = newObj

	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i]
		const nextPart = parts[i + 1]
		const isNextArray = /^\d+$/.test(nextPart)

		if (!(part in current)) {
			current[part] = isNextArray ? [] : {}
		}
		current = current[part]
	}

	current[parts[parts.length - 1]] = value
	return newObj
}

export function FlexibleBlockItem({
	block,
	index,
	totalBlocks,
	field,
	path,
	onUpdate,
	onRemove,
	onDuplicate,
	onMoveUp,
	onMoveDown,
	canDuplicate,
	allSchemas,
	contentBySchema,
}: FlexibleBlockItemProps) {
	// Generate stable fieldId using block._id which never changes
	const fieldId = `field-${path}-${block._id}`.replace(/[.[\]]/g, "-")

	// Check if this is a blockReference type
	const isBlockReference = block.type === "blockReference"
	const blockId = isBlockReference ? block.data?.blockId : null

	// Create the field path for this block (e.g., "blocks[0]")
	const blockFieldPath = `${path}[${index}]`

	const [isCollapsed, setIsCollapsed] = useState(() =>
		getCollapsedBlockIds().has(block._id),
	)

	const handleToggleCollapse = () => {
		const next = !isCollapsed
		setIsCollapsed(next)
		setBlockCollapsed(block._id, next)
	}

	return (
		<div
			className="rounded-lg border border-purple-300 bg-white p-4 shadow-sm"
			data-field-path={blockFieldPath}
		>
			<div
				className={`flex items-center justify-between ${isCollapsed ? "" : "mb-3"}`}
			>
				<div className="flex min-w-0 flex-1 items-center gap-2">
					<span className="rounded bg-purple-100 px-2 py-0.5 font-mono text-purple-600 text-xs">
						{isBlockReference ? "blockReference" : block.type}
					</span>
					<span className="text-grey-500 text-xs">Block #{index + 1}</span>
					{isBlockReference && block.data?.blockName && (
						<span className="truncate text-blue-600 text-xs">
							· {block.data.blockName}
						</span>
					)}
				</div>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={handleToggleCollapse}
						className="inline-flex items-center gap-1.5 rounded-lg border border-purple-300 bg-white px-2.5 py-1 text-purple-700 text-xs transition-all hover:bg-purple-50"
						title={isCollapsed ? "Expand block" : "Collapse block"}
					>
						<ChevronDown
							className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
						/>
						{isCollapsed ? "Expand" : "Collapse"}
					</button>
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
					{canDuplicate && (
						<button
							type="button"
							onClick={onDuplicate}
							className="rounded p-1 text-grey-500 transition-colors hover:bg-grey-100 hover:text-purple-600"
							title="Duplicate block"
						>
							<Copy className="h-4 w-4" />
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
			{!isCollapsed &&
				(isBlockReference && blockId ? (
					<BlockReferenceContent
						blockId={blockId}
						blockName={block.data?.blockName}
						data={block.data}
						onChange={onUpdate}
						path={`${path}.${block._id}`}
						allSchemas={allSchemas}
						contentBySchema={contentBySchema}
					/>
				) : (
					<BasicFieldRenderer
						field={{ ...field, type: block.type as any, required: false }}
						value={block.data}
						onChange={onUpdate}
						fieldId={fieldId}
						allSchemas={allSchemas}
						allContent={contentBySchema}
					/>
				))}
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

// Pretty type names for display
const typeLabels: Record<string, string> = {
	shortText: "Short Text",
	longText: "Long Text",
	richText: "Rich Text",
	media: "Media",
	file: "File",
	url: "URL",
	youtubeUrl: "YouTube URL",
	boolean: "Boolean",
	number: "Number",
	date: "Date",
	select: "Select",
	group: "Group",
	blockReference: "Block Reference",
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
	const headerRef = useRef<HTMLDivElement>(null)
	const [showAddMenu, setShowAddMenu] = useState(false)
	const [showBottomAddMenu, setShowBottomAddMenu] = useState(false)
	const [showBlockSelector, setShowBlockSelector] = useState(false)
	const [isHeaderVisible, setIsHeaderVisible] = useState(true)

	useEffect(() => {
		const el = headerRef.current
		if (!el) return
		const observer = new IntersectionObserver(
			([entry]) => setIsHeaderVisible(entry.isIntersecting),
			{ threshold: 0 },
		)
		observer.observe(el)
		return () => observer.disconnect()
	}, [])

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
		"file",
		"url",
		"boolean",
		"number",
		"date",
		"select",
		"group",
		"blockReference",
	]

	const addBlock = (
		blockType: string,
		blockId?: string,
		blockName?: string,
	) => {
		const newBlock = {
			_id: `block_${Date.now()}`,
			type: blockType,
			data:
				blockType === "boolean"
					? false
					: blockType === "number"
						? 0
						: blockType === "blockReference"
							? { blockId, blockName }
							: "",
		}
		const newBlocks = [...blocks, newBlock]
		onChange(path, newBlocks)
		setShowAddMenu(false)

		// Scroll to bottom of the flexible blocks container smoothly
		setTimeout(() => {
			if (containerRef.current) {
				const container = containerRef.current
				const containerRect = container.getBoundingClientRect()
				const absoluteBottom = window.scrollY + containerRect.bottom
				window.scrollTo({
					top: absoluteBottom - window.innerHeight + 100,
					behavior: "smooth",
				})
			}
		}, 100)
	}

	const handleAddBlockType = (blockType: string) => {
		setShowBottomAddMenu(false)
		if (blockType === "blockReference") {
			// Show block selector dialog for block references
			setShowBlockSelector(true)
			setShowAddMenu(false)
		} else {
			addBlock(blockType)
		}
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

	const duplicateBlock = (index: number) => {
		// Check if we can add more blocks
		if (!canAddMore) return

		const blockToDuplicate = blocks[index]
		// Deep clone the block data and generate a new unique ID
		const duplicatedBlock = {
			...blockToDuplicate,
			_id: `block_${Date.now()}`,
			data: JSON.parse(JSON.stringify(blockToDuplicate.data)),
		}
		// Insert the duplicated block right after the original
		const newBlocks = [
			...blocks.slice(0, index + 1),
			duplicatedBlock,
			...blocks.slice(index + 1),
		]
		onChange(path, newBlocks)

		// Scroll to the duplicated block
		setTimeout(() => {
			if (containerRef.current) {
				const container = containerRef.current
				const containerRect = container.getBoundingClientRect()
				const absoluteBottom = window.scrollY + containerRect.bottom
				window.scrollTo({
					top: absoluteBottom - window.innerHeight + 100,
					behavior: "smooth",
				})
			}
		}, 100)
	}

	return (
		<div
			ref={containerRef}
			data-field-path={field.name}
			className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4 transition-all duration-200"
			style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
		>
			<div ref={headerRef} className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Layers className="h-5 w-5 text-purple-600" />
					<h3 className="font-semibold text-grey-900 text-lg">{field.label}</h3>
					<span className="rounded-full bg-purple-100 px-2 py-0.5 font-medium text-purple-600 text-xs">
						Flexible Blocks
					</span>
					{field.required && <span className="text-error text-sm">*</span>}
				</div>
				{canAddMore && (
					<div className="relative">
						<button
							type="button"
							onClick={() => setShowAddMenu(!showAddMenu)}
							className="flex items-center gap-2 rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-purple-600 text-sm transition-colors hover:bg-purple-50"
						>
							<Plus className="h-4 w-4" />
							Add Block
						</button>

						{/* Dropdown menu for block types */}
						{showAddMenu && (
							<>
								<div
									className="fixed inset-0 z-10"
									tabIndex={-1}
									role="button"
									onClick={() => setShowAddMenu(false)}
								/>
								<div className="absolute top-full right-0 z-20 mt-1 min-w-48 rounded-lg border border-grey-200 bg-white py-1 shadow-lg">
									{allowedTypes.map((type) => (
										<button
											key={type}
											type="button"
											onClick={() => handleAddBlockType(type)}
											className="flex w-full items-center gap-2 px-4 py-2 text-left text-grey-700 text-sm transition-colors hover:bg-grey-50"
										>
											{type === "blockReference" && (
												<Layers className="h-4 w-4 text-purple-500" />
											)}
											<span>{typeLabels[type] || type}</span>
											{type === "blockReference" && (
												<span className="ml-auto text-grey-400 text-xs">→</span>
											)}
										</button>
									))}
								</div>
							</>
						)}
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
						No blocks yet. Click "Add Block" to add content.
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
							onDuplicate={() => duplicateBlock(index)}
							onMoveUp={() => moveBlock(index, "up")}
							onMoveDown={() => moveBlock(index, "down")}
							canDuplicate={canAddMore}
							allSchemas={allSchemas}
							contentBySchema={contentBySchema}
						/>
					))}
				</div>
			)}

			{/* Block Selector Dialog for blockReference */}
			{showBlockSelector && (
				<BlockSelectorDialog
					title="Select Reusable Block"
					onSelect={(block) => {
						addBlock("blockReference", block._id, block.name)
						setShowBlockSelector(false)
					}}
					onClose={() => setShowBlockSelector(false)}
				/>
			)}

			{/* Fixed floating "Add Block" button — visible when the header scrolls out of view */}
			{canAddMore &&
				!isHeaderVisible &&
				blocks.length > 0 &&
				!showBlockSelector &&
				createPortal(
					<div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
						<div className="relative">
							<button
								type="button"
								onClick={() => setShowBottomAddMenu(!showBottomAddMenu)}
								className="flex items-center gap-2 rounded-lg border border-purple-300 bg-white px-3 py-2 text-purple-600 text-sm shadow-lg transition-colors hover:bg-purple-50"
							>
								<Plus className="h-4 w-4" />
								Add Block
							</button>
							{showBottomAddMenu && (
								<>
									<div
										className="fixed inset-0 z-10"
										tabIndex={-1}
										role="button"
										onClick={() => setShowBottomAddMenu(false)}
									/>
									<div className="absolute bottom-full left-1/2 z-20 mb-1 min-w-48 -translate-x-1/2 rounded-lg border border-grey-200 bg-white py-1 shadow-lg">
										{allowedTypes.map((type) => (
											<button
												key={type}
												type="button"
												onClick={() => handleAddBlockType(type)}
												className="flex w-full items-center gap-2 px-4 py-2 text-left text-grey-700 text-sm transition-colors hover:bg-grey-50"
											>
												{type === "blockReference" && (
													<Layers className="h-4 w-4 text-purple-500" />
												)}
												<span>{typeLabels[type] || type}</span>
												{type === "blockReference" && (
													<span className="ml-auto text-grey-400 text-xs">
														→
													</span>
												)}
											</button>
										))}
									</div>
								</>
							)}
						</div>
					</div>,
					document.body,
				)}
		</div>
	)
}
