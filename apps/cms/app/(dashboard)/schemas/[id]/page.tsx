"use client"

import { useAtom } from "@lfades/atom"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { CFImage } from "@repo/cms-shared"
import { useMutation, useQuery } from "convex/react"
import {
	AlertTriangle,
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	Folder,
	Layers,
	MapPin,
	Plus,
	Save,
	Trash2,
	Type,
	Video,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { use, useCallback, useEffect, useState } from "react"
import { BlockSelectorDialog } from "@/app/(dashboard)/blocks/_components/block-selector-dialog"
import { SelectOptionsInput } from "@/components/atoms/select-options-input"
import { authAtom } from "@/lib/auth-atom"
import { triggerTypeGeneration } from "@/lib/use-type-generation"

// Utility function to generate field name from label
function generateFieldName(label: string): string {
	return label
		.toLowerCase()
		.normalize("NFD") // Decompose accented characters
		.replace(/[\u0300-\u036f]/g, "") // Remove diacritics
		.replace(/[^a-z0-9\s_]/g, "") // Remove special characters
		.trim()
		.replace(/\s+/g, "_") // Replace spaces with underscores
}

// Validate field name format
function validateFieldName(name: string): boolean {
	return /^[a-z0-9_]+$/.test(name)
}

// Check if a field type can be translatable
// Only text-based fields make sense to translate
function isTranslatableFieldType(type: FieldType): boolean {
	return ["shortText", "longText", "richText", "select"].includes(type)
}

// Helper to check for duplicate field names
function checkDuplicateFieldName(
	fields: Field[],
	currentFieldId: string,
	fieldName: string,
): boolean {
	return fields.some(
		(f) => f.id !== currentFieldId && f.name === fieldName && fieldName !== "",
	)
}

type FieldType =
	| "shortText"
	| "longText"
	| "richText"
	| "media"
	| "file"
	| "url"
	| "youtubeUrl"
	| "boolean"
	| "number"
	| "date"
	| "datetime"
	| "time"
	| "select"
	| "reference"
	| "multiReference"
	| "group"
	| "repeater"
	| "flexibleBlocks"
	| "blockReference"
	| "map"

type Field = {
	id: string
	name: string
	label: string
	type: FieldType
	required: boolean
	helpText?: string
	options?: string[]
	referenceSchema?: string
	fields?: Field[] // Nested fields for group and repeater types
	isExisting?: boolean // True for fields loaded from DB, false for new fields
	// For flexibleBlocks
	allowedBlocks?: Array<
		| "shortText"
		| "longText"
		| "richText"
		| "media"
		| "file"
		| "url"
		| "youtubeUrl"
		| "boolean"
		| "number"
		| "date"
		| "select"
		| "group"
		| "blockReference"
		| "map"
	>
	maxBlocks?: number
	// For blockReference
	blockId?: string
	// For shortText slug
	isSlug?: boolean
	slugSource?: string
	// Track if field name has been manually edited
	nameManuallyEdited?: boolean
	// Localization
	translatable?: boolean
	defaultValue?: string
}

// Block type for selection
type AvailableBlock = {
	_id: string
	name: string
	displayName: string
	description?: string
	previewImage?: string
	category?: string
	fields: any[]
}

// BlockReferenceSelector component (to handle state for dialog)
function BlockReferenceSelector({
	field,
	path,
	availableBlocks,
	onUpdateField,
}: {
	field: Field
	path: number[]
	availableBlocks: AvailableBlock[]
	onUpdateField: (path: number[], updates: Partial<Field>) => void
}) {
	const [showBlockSelector, setShowBlockSelector] = useState(false)

	const selectedBlock = availableBlocks.find((b) => b._id === field.blockId)

	return (
		<div className="mt-4">
			<div className="mb-1 block font-medium text-grey-700 text-sm">
				Select Reusable Block <span className="text-error">*</span>
			</div>
			{selectedBlock ? (
				<div className="flex items-center gap-3 rounded-lg border border-grey-200 bg-grey-50 p-3">
					{selectedBlock.previewImage ? (
						<CFImage
							assetId={selectedBlock.previewImage}
							alt={selectedBlock.displayName}
							width={64}
							height={48}
							variant="public"
							className="h-12 w-16 rounded object-cover"
						/>
					) : (
						<div className="flex h-12 w-16 items-center justify-center rounded bg-grey-200">
							<Layers className="h-6 w-6 text-grey-400" />
						</div>
					)}
					<div className="flex-1">
						<p className="font-medium text-grey-900">
							{selectedBlock.displayName}
						</p>
						<p className="text-grey-500 text-xs">{selectedBlock.name}</p>
					</div>
					<button
						type="button"
						onClick={() => setShowBlockSelector(true)}
						className="rounded-lg border border-grey-300 bg-white px-3 py-1.5 text-grey-700 text-sm transition-colors hover:bg-grey-50"
					>
						Change
					</button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setShowBlockSelector(true)}
					className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-grey-300 border-dashed bg-grey-50 px-4 py-4 text-grey-600 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
				>
					<Layers className="h-5 w-5" />
					Click to select a block
				</button>
			)}
			{availableBlocks.length === 0 && (
				<p className="mt-1 text-grey-400 text-xs">
					No reusable blocks available.{" "}
					<Link href="/blocks/new" className="text-primary underline">
						Create one first
					</Link>
				</p>
			)}

			{showBlockSelector && (
				<BlockSelectorDialog
					selectedBlockId={field.blockId}
					onSelect={(block) => {
						onUpdateField(path, { blockId: block._id })
						setShowBlockSelector(false)
					}}
					onClose={() => setShowBlockSelector(false)}
				/>
			)}
		</div>
	)
}

// Recursive FieldEditor component (defined outside to prevent re-renders)
type FieldEditorProps = {
	field: Field
	level: number
	path: number[]
	onUpdateField: (path: number[], updates: Partial<Field>) => void
	onRemoveField: (path: number[]) => void
	onAddNestedField: (path: number[]) => void
	onMoveField?: (path: number[], direction: "up" | "down") => void
	totalFields?: number
	fieldIndex?: number
	isNameLocked?: boolean
	availableBlocks?: AvailableBlock[]
	allSchemas?: Array<{ _id: string; name: string; displayName: string }>
	allFields?: Field[]
	hasLocales?: boolean
}

function FieldEditor({
	field,
	level,
	path,
	onUpdateField,
	onRemoveField,
	onAddNestedField,
	onMoveField,
	totalFields,
	fieldIndex = 0,
	isNameLocked = false,
	availableBlocks = [],
	allSchemas = [],
	allFields = [],
	hasLocales = false,
}: FieldEditorProps) {
	const canNest =
		level < 3 && (field.type === "group" || field.type === "repeater")
	const hasNestedFields = canNest && field.fields && field.fields.length > 0

	// Check if this field name is duplicated
	const isDuplicate =
		!isNameLocked && checkDuplicateFieldName(allFields, field.id, field.name)

	const getFieldIcon = (type: FieldType) => {
		switch (type) {
			case "group":
				return <Folder className="h-4 w-4 text-primary" />
			case "repeater":
				return <Layers className="h-4 w-4 text-primary" />
			case "youtubeUrl":
				return <Video className="h-4 w-4" />
			case "map":
				return <MapPin className="h-4 w-4" />
			default:
				return <Type className="h-4 w-4" />
		}
	}

	return (
		<div
			className="rounded-lg border border-grey-200 bg-white p-4 shadow-sm"
			style={{ marginLeft: level > 0 ? `${level * 1.5}rem` : "0" }}
		>
			<div className="mb-4 flex items-start justify-between">
				<div className="flex items-center gap-2">
					{getFieldIcon(field.type)}
					<h3 className="font-semibold text-grey-900">
						Field #{path[path.length - 1] + 1}
					</h3>
					{(field.type === "group" || field.type === "repeater") && (
						<span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
							{field.type === "group" ? "Group" : "Repeater"}
						</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					{/* Reorder buttons */}
					{onMoveField && totalFields && totalFields > 1 && (
						<div className="flex gap-1">
							<button
								type="button"
								onClick={() => onMoveField(path, "up")}
								disabled={fieldIndex === 0}
								className="rounded p-1 text-grey-500 transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-30"
								title="Move up"
							>
								<ArrowUp className="h-4 w-4" />
							</button>
							<button
								type="button"
								onClick={() => onMoveField(path, "down")}
								disabled={fieldIndex === totalFields - 1}
								className="rounded p-1 text-grey-500 transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-30"
								title="Move down"
							>
								<ArrowDown className="h-4 w-4" />
							</button>
						</div>
					)}
					<button
						type="button"
						onClick={() => onRemoveField(path)}
						className="text-error hover:text-error/80"
						title="Remove field"
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<label
						htmlFor={`field-label-${field.id}`}
						className="mb-1 block font-medium text-grey-700 text-sm"
					>
						Label
					</label>
					<input
						type="text"
						id={`field-label-${field.id}`}
						value={field.label}
						onChange={(e) => {
							const newLabel = e.target.value
							const updates: Partial<Field> = { label: newLabel }

							// Auto-generate field name if it hasn't been manually edited and not locked
							if (!field.nameManuallyEdited && !isNameLocked) {
								updates.name = generateFieldName(newLabel)
							}

							onUpdateField(path, updates)
						}}
						placeholder="e.g. Post Title"
						className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
					/>
				</div>
				<div className="relative pb-6">
					<label
						htmlFor={`field-name-${field.id}`}
						className="mb-1 block font-medium text-grey-700 text-sm"
					>
						Field Name
						{isNameLocked && (
							<span className="ml-1 text-grey-500 text-xs">(locked)</span>
						)}
					</label>
					<input
						type="text"
						id={`field-name-${field.id}`}
						value={field.name}
						onChange={(e) => {
							const newName = e.target.value
							// Validate and sanitize input
							const sanitizedName = newName
								.toLowerCase()
								.replace(/[^a-z0-9_]/g, "")
							onUpdateField(path, {
								name: sanitizedName,
								nameManuallyEdited: true,
							})
						}}
						placeholder="e.g. post_title"
						disabled={isNameLocked}
						className={`w-full rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-grey-100 ${
							isDuplicate ||
							(!validateFieldName(field.name) && field.name && !isNameLocked)
								? "border-red-500"
								: "border-grey-300"
						}`}
					/>
					<div className="absolute top-full left-0 -mt-3">
						{isNameLocked ? (
							<p className="text-grey-500 text-xs">
								Field name cannot be changed to prevent data loss
							</p>
						) : isDuplicate ? (
							<p className="text-red-500 text-xs">
								⚠️ Duplicate field name - must be unique
							</p>
						) : field.name && !validateFieldName(field.name) ? (
							<p className="text-red-500 text-xs">
								Only lowercase letters, numbers, and underscores allowed
							</p>
						) : !field.nameManuallyEdited && field.label ? (
							<p className="text-blue-600 text-xs">
								✨ Auto-generated from "Label"
							</p>
						) : null}
					</div>
				</div>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-4">
				<div>
					<label
						htmlFor={`field-type-${field.id}`}
						className="mb-1 block font-medium text-grey-700 text-sm"
					>
						Type
					</label>
					<select
						id={`field-type-${field.id}`}
						value={field.type}
						onChange={(e) =>
							onUpdateField(path, { type: e.target.value as FieldType })
						}
						className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
					>
						<option value="shortText">Short Text</option>
						<option value="longText">Long Text</option>
						<option value="richText">Rich Text</option>
						<option value="number">Number</option>
						<option value="boolean">Boolean</option>
						<option value="date">Date</option>
						<option value="datetime">Date & Time</option>
						<option value="time">Time</option>
						<option value="url">URL</option>
						<option value="youtubeUrl">YouTube URL</option>
						<option value="map">Map</option>
						<option value="media">Media</option>
						<option value="file">File</option>
						<option value="select">Select</option>
						<option value="reference">Reference</option>
						<option value="multiReference">Multi Reference</option>
						{level < 2 && (
							<>
								<option value="group">Group</option>
								<option value="repeater">Repeater</option>
							</>
						)}
						{level === 0 && (
							<>
								<option value="flexibleBlocks">Flexible Blocks</option>
								<option value="blockReference">Block Reference</option>
							</>
						)}
					</select>
				</div>
				<div className="flex items-end gap-6">
					<label className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={field.required}
							onChange={(e) =>
								onUpdateField(path, { required: e.target.checked })
							}
							className="h-4 w-4"
						/>
						<span className="text-sm">Required</span>
					</label>
					{hasLocales && isTranslatableFieldType(field.type) && (
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={field.translatable ?? false}
								onChange={(e) =>
									onUpdateField(path, { translatable: e.target.checked })
								}
								className="h-4 w-4 accent-blue-600"
							/>
							<span className="text-blue-700 text-sm">Translatable</span>
						</label>
					)}
				</div>
			</div>

			{field.type === "select" && (
				<div className="mt-4">
					<label
						htmlFor={`field-options-${field.id}`}
						className="mb-1 block font-medium text-grey-700 text-sm"
					>
						Options (comma-separated)
					</label>
					<SelectOptionsInput
						id={`field-options-${field.id}`}
						value={field.options ?? []}
						onChange={(options) => onUpdateField(path, { options })}
					/>
				</div>
			)}

			{(field.type === "shortText" ||
				field.type === "longText" ||
				field.type === "select") && (
				<div className="mt-4">
					<label
						htmlFor={`field-default-${field.id}`}
						className="mb-1 block font-medium text-grey-700 text-sm"
					>
						Default Value
					</label>
					{field.type === "select" && (field.options ?? []).length > 0 ? (
						<select
							id={`field-default-${field.id}`}
							value={field.defaultValue ?? ""}
							onChange={(e) =>
								onUpdateField(path, {
									defaultValue: e.target.value || undefined,
								})
							}
							className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
						>
							<option value="">— No default —</option>
							{(field.options ?? []).map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
					) : field.type === "longText" ? (
						<textarea
							id={`field-default-${field.id}`}
							value={field.defaultValue ?? ""}
							onChange={(e) =>
								onUpdateField(path, {
									defaultValue: e.target.value || undefined,
								})
							}
							rows={3}
							placeholder="Optional default text..."
							className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
						/>
					) : (
						<input
							id={`field-default-${field.id}`}
							type="text"
							value={field.defaultValue ?? ""}
							onChange={(e) =>
								onUpdateField(path, {
									defaultValue: e.target.value || undefined,
								})
							}
							placeholder="Optional default value..."
							className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
						/>
					)}
				</div>
			)}

			{(field.type === "reference" || field.type === "multiReference") && (
				<div className="mt-4">
					<label
						htmlFor={`field-referenceSchema-${path.join("-")}`}
						className="mb-1 block font-medium text-grey-700 text-sm"
					>
						Reference Schema <span className="text-error">*</span>
					</label>
					<select
						id={`field-referenceSchema-${path.join("-")}`}
						value={field.referenceSchema || ""}
						onChange={(e) =>
							onUpdateField(path, { referenceSchema: e.target.value })
						}
						className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
						required
					>
						<option value="">-- Select a schema --</option>
						{allSchemas
							.filter((s) => s.name !== "")
							.map((s) => (
								<option key={s._id} value={s.name}>
									{s.displayName} ({s.name})
								</option>
							))}
					</select>
					{allSchemas.length === 0 && (
						<p className="mt-1 text-grey-400 text-xs">
							No schemas available.{" "}
							<Link href="/schemas/new" className="text-primary underline">
								Create one first
							</Link>
						</p>
					)}
					<p className="mt-1 text-grey-400 text-xs">
						{field.type === "reference"
							? "Select a schema to reference (e.g., 'authors' for author selection)"
							: "Select a schema to reference (e.g., 'tags' for selecting multiple tags)"}
					</p>
				</div>
			)}

			{field.type === "flexibleBlocks" && (
				<div className="mt-4 space-y-3">
					<div>
						<div className="mb-2 block font-medium text-grey-700 text-sm">
							Allowed Block Types (leave empty for all)
						</div>
						<div className="grid grid-cols-2 gap-2 rounded border border-grey-300 p-3 md:grid-cols-3">
							{[
								{ value: "shortText", label: "Short Text" },
								{ value: "longText", label: "Long Text" },
								{ value: "richText", label: "Rich Text" },
								{ value: "media", label: "Media" },
								{ value: "file", label: "File" },
								{ value: "url", label: "URL" },
								{ value: "youtubeUrl", label: "YouTube URL" },
								{ value: "boolean", label: "Boolean" },
								{ value: "number", label: "Number" },
								{ value: "date", label: "Date" },
								{ value: "select", label: "Select" },
								{ value: "group", label: "Group" },
								{ value: "blockReference", label: "Block Reference" },
							].map((blockType) => {
								const allBlockTypes = [
									"shortText",
									"longText",
									"richText",
									"media",
									"file",
									"url",
									"youtubeUrl",
									"boolean",
									"number",
									"date",
									"select",
									"group",
									"blockReference",
								]

								return (
									<label
										key={blockType.value}
										className="flex items-center gap-2 text-sm"
									>
										<input
											type="checkbox"
											checked={
												!field.allowedBlocks ||
												field.allowedBlocks.includes(blockType.value as any)
											}
											onChange={(e) => {
												// If allowedBlocks is undefined (all types allowed), initialize with all types
												const currentAllowed =
													field.allowedBlocks || (allBlockTypes as any[])

												const newAllowed = e.target.checked
													? [...currentAllowed, blockType.value]
													: currentAllowed.filter((t) => t !== blockType.value)

												onUpdateField(path, {
													allowedBlocks:
														newAllowed.length === allBlockTypes.length
															? undefined // All types selected = undefined (no restriction)
															: (newAllowed as any),
												})
											}}
											className="h-4 w-4"
										/>
										<span>{blockType.label}</span>
									</label>
								)
							})}
						</div>
					</div>
					<div>
						<label
							htmlFor={`field-maxBlocks-${path.join("-")}`}
							className="mb-1 block font-medium text-grey-700 text-sm"
						>
							Maximum Blocks (optional)
						</label>
						<input
							id={`field-maxBlocks-${path.join("-")}`}
							type="number"
							min="1"
							value={field.maxBlocks || ""}
							onChange={(e) =>
								onUpdateField(path, {
									maxBlocks: e.target.value
										? Number.parseInt(e.target.value, 10)
										: undefined,
								})
							}
							placeholder="No limit"
							className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
						/>
					</div>
				</div>
			)}

			{field.type === "blockReference" && (
				<BlockReferenceSelector
					field={field}
					path={path}
					availableBlocks={availableBlocks}
					onUpdateField={onUpdateField}
				/>
			)}

			{field.type === "shortText" && level === 0 && (
				<div className="mt-4 space-y-3">
					<div className="flex items-center gap-3 rounded border border-blue-200 bg-blue-50 p-3">
						<input
							type="checkbox"
							id={`field-isSlug-${path.join("-")}`}
							checked={field.isSlug || false}
							onChange={(e) => {
								const isChecked = e.target.checked
								onUpdateField(path, {
									isSlug: isChecked,
									slugSource: isChecked ? field.slugSource : undefined,
								})
							}}
							className="h-4 w-4"
						/>
						<label
							htmlFor={`field-isSlug-${path.join("-")}`}
							className="cursor-pointer text-blue-800 text-sm"
						>
							<strong>Use as Slug Field</strong> - Auto-generate URL-friendly
							slugs
						</label>
					</div>

					{field.isSlug && (
						<div>
							<label
								htmlFor={`field-slugSource-${path.join("-")}`}
								className="mb-1 block font-medium text-grey-700 text-sm"
							>
								Slug Source Field <span className="text-error">*</span>
							</label>
							<select
								id={`field-slugSource-${path.join("-")}`}
								value={field.slugSource || ""}
								onChange={(e) =>
									onUpdateField(path, { slugSource: e.target.value })
								}
								className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
								required={field.isSlug}
							>
								<option value="">-- Select a field --</option>
								{allFields
									.filter(
										(f: Field) =>
											f.id !== field.id &&
											(f.type === "shortText" || f.type === "longText"),
									)
									.map((f: Field) => (
										<option key={f.id} value={f.name}>
											{f.label} ({f.name})
										</option>
									))}
							</select>
							<p className="mt-1 text-blue-600 text-xs">
								The slug will be auto-generated from the selected field (e.g.,
								"My Post Title" → "my-post-title")
							</p>
						</div>
					)}
				</div>
			)}

			<div className="mt-4">
				<label
					htmlFor={`field-help-${field.id}`}
					className="mb-1 block font-medium text-grey-700 text-sm"
				>
					Help Text (optional)
				</label>
				<input
					type="text"
					id={`field-help-${field.id}`}
					value={field.helpText || ""}
					onChange={(e) => onUpdateField(path, { helpText: e.target.value })}
					placeholder="Helpful description for editors"
					className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
				/>
			</div>

			{/* Add nested fields button */}
			{canNest && (
				<div className="mt-4">
					<button
						type="button"
						onClick={() => onAddNestedField(path)}
						className="flex items-center gap-2 rounded bg-primary/10 px-3 py-2 font-medium text-primary text-sm transition-colors hover:bg-primary/20"
					>
						<Plus className="h-4 w-4" />
						Add Nested Field
					</button>
					{level === 3 && (
						<p className="mt-2 text-grey-500 text-xs">
							Maximum nesting level (3) reached
						</p>
					)}
				</div>
			)}

			{/* Render nested fields */}
			{hasNestedFields && (
				<div className="mt-4 space-y-3">
					<h4 className="font-medium text-grey-700 text-sm">
						Nested Fields ({field.fields?.length})
					</h4>
					{field.fields?.map((nestedField, index) => (
						<FieldEditor
							key={nestedField.id}
							field={nestedField}
							level={level + 1}
							path={[...path, index]}
							onUpdateField={onUpdateField}
							onRemoveField={onRemoveField}
							onAddNestedField={onAddNestedField}
							onMoveField={onMoveField}
							totalFields={field.fields?.length}
							fieldIndex={index}
							isNameLocked={nestedField.isExisting ?? false}
							availableBlocks={availableBlocks}
							allSchemas={allSchemas}
							allFields={allFields}
							hasLocales={hasLocales}
						/>
					))}
				</div>
			)}
		</div>
	)
}

// Helper functions for field manipulation (outside component to avoid re-creation)
function updateNestedFields(
	fieldsArray: Field[],
	path: number[],
	updates: Partial<Field>,
): Field[] {
	if (path.length === 1) {
		return fieldsArray.map((f, i) => (i === path[0] ? { ...f, ...updates } : f))
	}

	const [first, ...rest] = path
	return fieldsArray.map((f, i) => {
		if (i === first && f.fields) {
			return {
				...f,
				fields: updateNestedFields(f.fields, rest, updates),
			}
		}
		return f
	})
}

function removeNestedField(fieldsArray: Field[], path: number[]): Field[] {
	if (path.length === 1) {
		return fieldsArray.filter((_, i) => i !== path[0])
	}

	const [first, ...rest] = path
	return fieldsArray.map((f, i) => {
		if (i === first && f.fields) {
			return {
				...f,
				fields: removeNestedField(f.fields, rest),
			}
		}
		return f
	})
}

function addNestedField(fieldsArray: Field[], path: number[]): Field[] {
	if (path.length === 1) {
		return fieldsArray.map((f, i) => {
			if (i === path[0]) {
				const newField: Field = {
					id: `field_${Date.now()}_${Math.random()}`,
					name: "",
					label: "",
					type: "shortText",
					required: false,
					isExisting: false, // Mark as new field (not locked)
				}
				return {
					...f,
					fields: [...(f.fields || []), newField],
				}
			}
			return f
		})
	}

	const [first, ...rest] = path
	return fieldsArray.map((f, i) => {
		if (i === first && f.fields) {
			return {
				...f,
				fields: addNestedField(f.fields, rest),
			}
		}
		return f
	})
}

// Helper to mark fields as existing recursively (outside component)
function markFieldsAsExisting(fieldsArray: any[]): Field[] {
	return fieldsArray.map((f: any, i: number) => ({
		id: `field_${i}`,
		...f,
		isExisting: true, // Mark as existing (loaded from DB)
		fields: f.fields ? markFieldsAsExisting(f.fields) : undefined,
	}))
}

export default function SchemaDetailPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = use(params)
	const router = useRouter()
	const searchParams = useSearchParams()

	// Wait for auth to be initialized before making queries
	const [auth] = useAtom(authAtom)
	const isReady = auth.isInitialized && auth.user !== null

	const schema = useQuery(
		api.cms.schemas.get,
		isReady ? { id: id as Id<"cmsSchemas"> } : "skip",
	)
	const availableBlocks = useQuery(api.cms.blocks.list, isReady ? {} : "skip")
	const allSchemas = useQuery(api.cms.schemas.list, isReady ? {} : "skip")
	const localizationSettings = useQuery(
		api.cms.settings.get,
		isReady ? { key: "localization" } : "skip",
	)
	const updateSchema = useMutation(api.cms.schemas.update)
	const deleteSchema = useMutation(api.cms.schemas.remove)

	// Check if locales are configured
	const hasLocales = (localizationSettings as any)?.locales?.length > 0 || false

	// Use URL param to determine edit mode
	const editing = searchParams.get("mode") === "edit"

	const setEditing = (value: boolean) => {
		if (value) {
			router.push(`/schemas/${id}?mode=edit`)
		} else {
			router.push(`/schemas/${id}`)
		}
	}

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

	// Edit state
	const [displayName, setDisplayName] = useState("")
	const [description, setDescription] = useState("")
	const [fields, setFields] = useState<Field[]>([])
	// Preview configuration
	const [previewEnabled, setPreviewEnabled] = useState(false)
	const [previewUrlPattern, setPreviewUrlPattern] = useState("")
	// Simple schema mode
	const [isSimple, setIsSimple] = useState(false)

	// Initialize edit state when schema loads
	useEffect(() => {
		if (schema) {
			setDisplayName(schema.displayName)
			setDescription(schema.description || "")
			setFields(markFieldsAsExisting(schema.fields))
			// Initialize preview config
			setPreviewEnabled(schema.previewConfig?.enabled ?? false)
			setPreviewUrlPattern(schema.previewConfig?.urlPattern ?? "")
			setIsSimple(schema.isSimple ?? false)
		}
	}, [schema])

	const handleUpdateField = useCallback(
		(path: number[], updates: Partial<Field>) => {
			setFields((prev) => updateNestedFields(prev, path, updates))
		},
		[],
	)

	const handleRemoveField = useCallback((path: number[]) => {
		setFields((prev) => removeNestedField(prev, path))
	}, [])

	const handleAddNestedField = useCallback((path: number[]) => {
		setFields((prev) => addNestedField(prev, path))

		// Scroll to bottom smoothly after adding nested field
		setTimeout(() => {
			window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
		}, 100)
	}, [])

	const handleMoveField = useCallback(
		(path: number[], direction: "up" | "down") => {
			setFields((prev) => {
				if (path.length === 1) {
					// Top-level field
					const index = path[0]
					if (index === undefined) return prev

					const newIndex = direction === "up" ? index - 1 : index + 1
					if (newIndex < 0 || newIndex >= prev.length) return prev

					const newFields = [...prev]
					const [removed] = newFields.splice(index, 1)
					newFields.splice(newIndex, 0, removed)
					return newFields
				}

				// Nested field - need to manually traverse and rebuild
				const moveInNestedFields = (
					fields: Field[],
					currentPath: number[],
				): Field[] => {
					if (currentPath.length === 0) return fields

					const [first, ...rest] = currentPath

					return fields.map((f, i) => {
						if (i !== first) return f

						if (rest.length === 0) {
							// This is the parent, move the child
							if (!f.fields) return f

							const fieldIndex = path[path.length - 1]
							if (fieldIndex === undefined) return f

							const newIndex =
								direction === "up" ? fieldIndex - 1 : fieldIndex + 1
							if (newIndex < 0 || newIndex >= f.fields.length) return f

							const newFields = [...f.fields]
							const [removed] = newFields.splice(fieldIndex, 1)
							newFields.splice(newIndex, 0, removed)

							return { ...f, fields: newFields }
						}

						// Keep traversing
						if (!f.fields) return f
						return {
							...f,
							fields: moveInNestedFields(f.fields, rest),
						}
					})
				}

				const parentPath = path.slice(0, -1)
				return moveInNestedFields(prev, parentPath)
			})
		},
		[],
	)

	const handleAddField = () => {
		const newField: Field = {
			id: `field_${Date.now()}`,
			name: "",
			label: "",
			type: "shortText",
			required: false,
			isExisting: false, // Mark as new field (not locked)
		}
		setFields([...fields, newField])

		// Scroll to bottom smoothly after adding field
		setTimeout(() => {
			window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
		}, 100)
	}

	// Helper function to map fields recursively (including nested fields)
	const mapFieldsForSave = (fieldsArray: Field[]): any[] => {
		return fieldsArray.map((f) => {
			const mappedField: any = {
				name: f.name,
				label: f.label,
				type: f.type,
				required: f.required,
				helpText: f.helpText,
				options: f.options,
				referenceSchema: f.referenceSchema,
				defaultValue: f.defaultValue,
			}

			// For flexibleBlocks type
			if (f.type === "flexibleBlocks") {
				if (f.allowedBlocks) {
					mappedField.allowedBlocks = f.allowedBlocks
				}
				if (f.maxBlocks) {
					mappedField.maxBlocks = f.maxBlocks
				}
			}

			// For blockReference type
			if (f.type === "blockReference" && f.blockId) {
				mappedField.blockId = f.blockId
			}

			// For shortText type - slug configuration
			if (f.type === "shortText") {
				if (f.isSlug) {
					mappedField.isSlug = f.isSlug
				}
				if (f.slugSource) {
					mappedField.slugSource = f.slugSource
				}
			}

			// Localization - mark field as translatable
			if (f.translatable) {
				mappedField.translatable = f.translatable
			}

			// Recursively include nested fields for group and repeater types
			if ((f.type === "group" || f.type === "repeater") && f.fields) {
				mappedField.fields = mapFieldsForSave(f.fields)
			}

			return mappedField
		})
	}

	const handleSave = async () => {
		setLoading(true)
		setError("")

		try {
			// Validate fields recursively
			const validateFields = (fieldsArray: Field[], level = 0): void => {
				// Check for duplicate field names at this level
				const fieldNames = new Set<string>()
				for (const field of fieldsArray) {
					if (!field.name.trim()) {
						throw new Error("All fields must have a name")
					}
					if (!field.label.trim()) {
						throw new Error("All fields must have a label")
					}

					// Check for duplicate field name
					if (fieldNames.has(field.name)) {
						throw new Error(
							`Duplicate field name "${field.name}" found. Each field must have a unique name.`,
						)
					}
					fieldNames.add(field.name)

					if (
						field.type === "select" &&
						(!field.options || field.options.length === 0)
					) {
						throw new Error(
							`Field "${field.label}" requires at least one option`,
						)
					}
					if (
						(field.type === "reference" || field.type === "multiReference") &&
						!field.referenceSchema?.trim()
					) {
						throw new Error(
							`Field "${field.label}" requires a reference schema`,
						)
					}
					if (
						field.type === "shortText" &&
						field.isSlug &&
						!field.slugSource?.trim()
					) {
						throw new Error(
							`Field "${field.label}" is marked as slug but has no source field selected`,
						)
					}
					// Validate nested fields
					if (
						(field.type === "group" || field.type === "repeater") &&
						field.fields
					) {
						if (field.fields.length === 0) {
							throw new Error(
								`${field.type === "group" ? "Group" : "Repeater"} "${field.label}" must have at least one nested field`,
							)
						}
						validateFields(field.fields, level + 1)
					}
				}
			}

			validateFields(fields)

			await updateSchema({
				id: id as Id<"cmsSchemas">,
				displayName: displayName || undefined,
				description: description || undefined,
				fields: mapFieldsForSave(fields),
				previewConfig: previewUrlPattern
					? { urlPattern: previewUrlPattern, enabled: previewEnabled }
					: undefined,
				isSimple,
			})

			// Trigger type generation in development
			triggerTypeGeneration()

			setEditing(false)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update schema")
		} finally {
			setLoading(false)
		}
	}

	const handleDelete = async () => {
		setLoading(true)
		try {
			await deleteSchema({ id: id as Id<"cmsSchemas"> })

			// Trigger type generation in development
			triggerTypeGeneration()

			router.push("/schemas")
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete schema")
			setLoading(false)
		}
	}

	if (!schema) {
		return (
			<div className="flex min-h-[400px] items-center justify-center">
				<div className="text-center">
					<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-grey-500">Loading schema...</p>
				</div>
			</div>
		)
	}

	const getFieldIcon = (type: FieldType) => {
		switch (type) {
			case "group":
				return <Folder className="h-4 w-4 text-primary" />
			case "repeater":
				return <Layers className="h-4 w-4 text-primary" />
			case "youtubeUrl":
				return <Video className="h-4 w-4" />
			case "map":
				return <MapPin className="h-4 w-4" />
			default:
				return <Type className="h-4 w-4" />
		}
	}

	return (
		<div className="mx-auto max-w-4xl">
			<div className="mb-6">
				<Link
					href="/schemas"
					className="inline-flex items-center gap-2 text-grey-500 hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Schemas
				</Link>
			</div>

			<div className="mb-6 flex items-start justify-between">
				<div>
					<h1 className="font-bold text-3xl text-primary">
						{schema.displayName}
					</h1>
					<p className="mt-2 text-grey-500">
						{schema.type === "global" ? "Global Component" : "Collection Type"}
					</p>
				</div>
				<div className="flex gap-2">
					{!editing ? (
						<>
							<button
								type="button"
								onClick={() => setEditing(true)}
								className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
							>
								Edit Schema
							</button>
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(true)}
								className="rounded bg-error px-4 py-2 text-white hover:bg-error/90"
							>
								Delete
							</button>
						</>
					) : (
						<>
							<button
								type="button"
								onClick={() => {
									setEditing(false)
									setError("")
									// Reset fields
									if (schema) {
										setDisplayName(schema.displayName)
										setDescription(schema.description || "")
										setFields(
											schema.fields.map((f: any, i: number) => ({
												id: `field_${i}`,
												...f,
											})),
										)
										setPreviewEnabled(schema.previewConfig?.enabled ?? false)
										setPreviewUrlPattern(schema.previewConfig?.urlPattern ?? "")
										setIsSimple(schema.isSimple ?? false)
									}
								}}
								className="rounded border border-grey-300 px-4 py-2 text-grey-700 hover:bg-grey-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleSave}
								disabled={loading}
								className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
							>
								<Save className="h-4 w-4" />
								{loading ? "Saving..." : "Save Changes"}
							</button>
						</>
					)}
				</div>
			</div>

			{error && (
				<div className="mb-6 rounded-lg bg-red-50 p-4">
					<p className="text-error text-sm">{error}</p>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
						<div className="mb-4 flex items-center gap-3">
							<AlertTriangle className="h-6 w-6 text-error" />
							<h2 className="font-bold text-xl">Delete Schema?</h2>
						</div>
						<p className="mb-6 text-grey-600">
							Are you sure you want to delete this schema? This action cannot be
							undone. All content entries associated with this schema will also
							be permanently deleted.
						</p>
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(false)}
								className="rounded border border-grey-300 px-4 py-2 text-grey-700 hover:bg-grey-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleDelete}
								disabled={loading}
								className="rounded bg-error px-4 py-2 text-white hover:bg-error/90 disabled:opacity-50"
							>
								{loading ? "Deleting..." : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}

			<div className="rounded-sm border border-grey-200 bg-white p-6 shadow-md">
				<div className="mb-6">
					<h2 className="mb-4 font-semibold text-xl">Basic Information</h2>
					{editing ? (
						<div className="space-y-4">
							<div>
								<label
									htmlFor="edit-display-name"
									className="mb-1 block font-medium text-grey-700 text-sm"
								>
									Display Name
								</label>
								<input
									type="text"
									id="edit-display-name"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
								/>
							</div>
							<div>
								<label
									htmlFor="edit-description"
									className="mb-1 block font-medium text-grey-700 text-sm"
								>
									Description
								</label>
								<textarea
									id="edit-description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={3}
									className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
								/>
							</div>
						</div>
					) : (
						<div className="space-y-2">
							<p className="text-grey-600">
								<span className="font-medium">Name:</span> {schema.name}
							</p>
							{schema.description && (
								<p className="text-grey-600">
									<span className="font-medium">Description:</span>{" "}
									{schema.description}
								</p>
							)}
						</div>
					)}
				</div>

				{/* Simple Schema */}
				{editing && (
					<div className="mb-6 border-grey-200 border-t pt-6">
						<h2 className="mb-4 font-semibold text-xl">Simple Schema</h2>
						<div className="flex items-center gap-4">
							<label className="relative inline-flex cursor-pointer items-center">
								<input
									type="checkbox"
									checked={isSimple}
									onChange={(e) => setIsSimple(e.target.checked)}
									className="peer sr-only"
								/>
								<div className="peer h-6 w-11 rounded-full bg-grey-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-grey-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20" />
							</label>
							<span className="font-medium text-grey-700">
								Enable Simple Mode
							</span>
						</div>
						<p className="mt-2 text-grey-500 text-sm">
							Disables SEO metadata fields on content entries for this schema.
						</p>
					</div>
				)}

				{/* Preview Configuration */}
				{editing && (
					<div className="mb-6 border-grey-200 border-t pt-6">
						<h2 className="mb-4 font-semibold text-xl">Live Preview</h2>
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<label className="relative inline-flex cursor-pointer items-center">
									<input
										type="checkbox"
										checked={previewEnabled}
										onChange={(e) => setPreviewEnabled(e.target.checked)}
										className="peer sr-only"
									/>
									<div className="peer h-6 w-11 rounded-full bg-grey-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-grey-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20" />
								</label>
								<span className="font-medium text-grey-700">
									Enable Live Preview
								</span>
							</div>
							<div>
								<label
									htmlFor="preview-url-pattern"
									className="mb-1 block font-medium text-grey-700 text-sm"
								>
									Preview URL Pattern
								</label>
								<input
									type="text"
									id="preview-url-pattern"
									value={previewUrlPattern}
									onChange={(e) => setPreviewUrlPattern(e.target.value)}
									placeholder="/content-library/{slug}"
									className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
								/>
								<p className="mt-1 text-grey-500 text-xs">
									Use{" "}
									<code className="rounded bg-grey-100 px-1">{"{slug}"}</code>{" "}
									or{" "}
									<code className="rounded bg-grey-100 px-1">
										{"{fieldName}"}
									</code>{" "}
									as placeholders for dynamic values. Example:{" "}
									<code className="rounded bg-grey-100 px-1">
										/content-library/{"{slug}"}
									</code>
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Show preview config in read mode */}
				{!editing && schema.previewConfig?.urlPattern && (
					<div className="mb-6 border-grey-200 border-t pt-6">
						<h2 className="mb-4 font-semibold text-xl">Live Preview</h2>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<span
									className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
										schema.previewConfig.enabled
											? "bg-green-100 text-green-700"
											: "bg-grey-100 text-grey-600"
									}`}
								>
									{schema.previewConfig.enabled ? "Enabled" : "Disabled"}
								</span>
							</div>
							<p className="text-grey-600">
								<span className="font-medium">URL Pattern:</span>{" "}
								<code className="rounded bg-grey-100 px-2 py-0.5 font-mono text-sm">
									{schema.previewConfig.urlPattern}
								</code>
							</p>
						</div>
					</div>
				)}

				<div>
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-semibold text-xl">Fields</h2>
						{editing && (
							<button
								type="button"
								onClick={handleAddField}
								className="flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm text-white hover:bg-primary/90"
							>
								<Plus className="h-4 w-4" />
								Add Field
							</button>
						)}
					</div>
					<div className="space-y-4">
						{fields.map((field, index) => (
							<div key={field.id}>
								{editing ? (
									<FieldEditor
										field={field}
										level={0}
										path={[index]}
										onUpdateField={handleUpdateField}
										onRemoveField={handleRemoveField}
										onAddNestedField={handleAddNestedField}
										onMoveField={handleMoveField}
										totalFields={fields.length}
										fieldIndex={index}
										isNameLocked={field.isExisting ?? false} // Lock only existing fields to prevent data loss
										availableBlocks={availableBlocks || []}
										allSchemas={allSchemas || []}
										allFields={fields}
										hasLocales={hasLocales}
									/>
								) : (
									<div className="rounded-lg border border-grey-200 bg-white p-4 shadow-md">
										<div className="flex items-start justify-between">
											<div>
												<div className="flex items-center gap-2">
													{getFieldIcon(field.type)}
													<h3 className="font-semibold text-primary">
														{field.label}
													</h3>
													{(field.type === "group" ||
														field.type === "repeater") && (
														<span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
															{field.type === "group" ? "Group" : "Repeater"}
														</span>
													)}
												</div>
												<div className="mt-1 flex items-center gap-3 text-grey-500 text-sm">
													<code className="rounded bg-grey-100 px-2 py-0.5 font-mono">
														{field.name}
													</code>
													<span className="rounded bg-grey-200 px-2 py-0.5">
														{field.type}
													</span>
													{field.required && (
														<span className="text-error">Required</span>
													)}
													{field.translatable && (
														<span className="text-blue-600">Translatable</span>
													)}
												</div>
												{field.helpText && (
													<p className="mt-1 text-grey-400 text-sm">
														{field.helpText}
													</p>
												)}
												{/* Render nested fields in read-only mode */}
												{field.fields && field.fields.length > 0 && (
													<div className="mt-3 ml-6 space-y-2">
														<p className="font-medium text-grey-700 text-xs">
															Nested Fields:
														</p>
														{field.fields.map((nestedField, nestedIndex) => (
															<div
																key={`${field.id}-nested-${nestedIndex}`}
																className="rounded bg-grey-50 p-2 text-sm"
															>
																<div className="flex items-center gap-2">
																	<code className="rounded bg-white px-2 py-0.5 font-mono text-xs">
																		{nestedField.name}
																	</code>
																	<span className="text-grey-600">
																		{nestedField.label}
																	</span>
																	<span className="rounded bg-grey-200 px-1.5 py-0.5 text-xs">
																		{nestedField.type}
																	</span>
																</div>
															</div>
														))}
													</div>
												)}
											</div>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Ready to add content section */}
			{!editing && (
				<div className="mt-8 rounded-lg border-2 border-grey-300 border-dashed bg-grey-50 p-8 text-center">
					<h3 className="mb-2 font-semibold text-grey-900 text-lg">
						Ready to add content?
					</h3>
					<p className="mb-4 text-grey-600">
						Start creating content entries for this schema
					</p>
					<Link
						href={`/content?schema=${id}`}
						className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
					>
						Manage Content →
					</Link>
				</div>
			)}

			{/* Fixed bottom bar with action buttons (only in edit mode) */}
			{editing && (
				<>
					<div className="fixed right-0 bottom-0 left-0 z-50 border-grey-200 border-t bg-white shadow-lg">
						<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
							<button
								type="button"
								onClick={() => {
									handleAddField()
									// Scroll to bottom smoothly after adding field
									setTimeout(() => {
										window.scrollTo({
											top: document.body.scrollHeight,
											behavior: "smooth",
										})
									}, 100)
								}}
								className="inline-flex items-center gap-2 rounded-lg border border-primary bg-white px-4 py-2 text-primary transition-colors hover:bg-primary/5"
							>
								<Plus className="h-4 w-4" />
								Add Field
							</button>
							<div className="flex items-center gap-4">
								<button
									type="button"
									onClick={() => {
										setEditing(false)
										setError("")
										// Reset fields
										if (schema) {
											setDisplayName(schema.displayName)
											setDescription(schema.description || "")
											setFields(
												schema.fields.map((f: any, i: number) => ({
													id: `field_${i}`,
													...f,
												})),
											)
											setPreviewEnabled(schema.previewConfig?.enabled ?? false)
											setPreviewUrlPattern(
												schema.previewConfig?.urlPattern ?? "",
											)
											setIsSimple(schema.isSimple ?? false)
										}
									}}
									className="rounded-lg border border-grey-300 px-6 py-3 text-grey-700 hover:bg-grey-50"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleSave}
									disabled={loading}
									className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90 disabled:opacity-50"
								>
									<Save className="h-4 w-4" />
									{loading ? "Saving..." : "Save Changes"}
								</button>
							</div>
						</div>
					</div>

					{/* Spacer to prevent content from being hidden behind fixed bar */}
					<div className="h-24" />
				</>
			)}
		</div>
	)
}
