"use client"

import { useAtom } from "@lfades/atom"
import { api } from "@repo/backend/convex/_generated/api"
import { CFImage } from "@repo/cms-shared"
import { useMutation, useQuery } from "convex/react"
import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	Calendar,
	FileText,
	Folder,
	Hash,
	Image,
	Layers,
	Link as LinkIcon,
	List,
	MapPin,
	Plus,
	ToggleLeft,
	Trash2,
	Type,
	Video,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
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

// Helper to check for duplicate field names
const checkDuplicateFieldName = (
	fields: Field[],
	currentFieldId: string,
	fieldName: string,
): boolean => {
	return fields.some(
		(f) => f.id !== currentFieldId && f.name === fieldName && fieldName !== "",
	)
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
function BlockReferenceSelectorNew({
	field,
	fieldId,
	parentPath,
	availableBlocks,
	onUpdateField,
}: {
	field: Field
	fieldId: string
	parentPath: string[]
	availableBlocks: AvailableBlock[]
	onUpdateField: (
		id: string,
		updates: Partial<Field>,
		parentPath: string[],
	) => void
}) {
	const [showBlockSelector, setShowBlockSelector] = useState(false)

	const selectedBlock = availableBlocks.find((b) => b._id === field.blockId)

	return (
		<div className="md:col-span-2">
			<div className="mb-1 block font-medium text-grey-500 text-xs">
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
						onUpdateField(fieldId, { blockId: block._id }, parentPath)
						setShowBlockSelector(false)
					}}
					onClose={() => setShowBlockSelector(false)}
				/>
			)}
		</div>
	)
}

// Recursive component to render field editors (moved outside to prevent re-creation)
const FieldEditor = ({
	field,
	index,
	depth = 0,
	parentPath = [],
	onUpdateField,
	onRemoveField,
	onAddNestedField,
	onMoveField,
	totalFields,
	availableBlocks = [],
	allSchemas = [],
	allFields = [],
	hasLocales = false,
}: {
	field: Field
	index: number
	depth?: number
	parentPath?: string[]
	allFields?: Field[]
	onUpdateField: (
		id: string,
		updates: Partial<Field>,
		parentPath: string[],
	) => void
	onRemoveField: (id: string, parentPath: string[]) => void
	onAddNestedField: (parentId: string, parentPath: string[]) => void
	onMoveField?: (
		id: string,
		direction: "up" | "down",
		parentPath: string[],
	) => void
	totalFields?: number
	availableBlocks?: AvailableBlock[]
	allSchemas?: Array<{ _id: string; name: string; displayName: string }>
	hasLocales?: boolean
}) => {
	const currentPath = [...parentPath, field.id]
	const indentClass = depth > 0 ? `ml-${depth * 4}` : ""
	const borderColor =
		depth === 0
			? "border-grey-200"
			: depth === 1
				? "border-primary/30"
				: "border-accent/30"
	const bgColor =
		depth === 0 ? "bg-white" : depth === 1 ? "bg-primary/5" : "bg-accent/5"

	// Check if this field name is duplicated
	const isDuplicate = checkDuplicateFieldName(allFields, field.id, field.name)

	return (
		<div className={indentClass}>
			<div className={`rounded-lg border ${borderColor} ${bgColor} p-4`}>
				<div className="mb-3 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="font-medium text-grey-500 text-sm">
							Field #{index + 1}
							{depth > 0 && (
								<span className="ml-2 text-grey-400 text-xs">
									(Nested level {depth})
								</span>
							)}
						</span>
						{(field.type === "group" || field.type === "repeater") && (
							<span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
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
									onClick={() => onMoveField(field.id, "up", parentPath)}
									disabled={index === 0}
									className="rounded p-1 text-grey-500 transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-30"
									title="Move up"
								>
									<ArrowUp className="h-4 w-4" />
								</button>
								<button
									type="button"
									onClick={() => onMoveField(field.id, "down", parentPath)}
									disabled={index === totalFields - 1}
									className="rounded p-1 text-grey-500 transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-30"
									title="Move down"
								>
									<ArrowDown className="h-4 w-4" />
								</button>
							</div>
						)}
						<button
							type="button"
							onClick={() => onRemoveField(field.id, parentPath)}
							className="text-error transition-colors hover:text-error-light"
							title="Remove field"
						>
							<Trash2 className="h-4 w-4" />
						</button>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<label
							htmlFor={`field-label-${field.id}`}
							className="mb-1 block font-medium text-grey-500 text-xs"
						>
							Label
						</label>
						<input
							id={`field-label-${field.id}`}
							type="text"
							value={field.label}
							onChange={(e) => {
								const newLabel = e.target.value
								const updates: Partial<Field> = { label: newLabel }

								// Auto-generate field name if it hasn't been manually edited
								if (!field.nameManuallyEdited) {
									updates.name = generateFieldName(newLabel)
								}

								onUpdateField(field.id, updates, parentPath)
							}}
							placeholder="Post Title"
							className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
						/>
					</div>

					<div className="relative pb-6">
						<label
							htmlFor={`field-name-${field.id}`}
							className="mb-1 block font-medium text-grey-500 text-xs"
						>
							Field Name
						</label>
						<input
							id={`field-name-${field.id}`}
							type="text"
							value={field.name}
							onChange={(e) => {
								const newName = e.target.value
								// Validate and sanitize input
								const sanitizedName = newName
									.toLowerCase()
									.replace(/[^a-z0-9_]/g, "")
								onUpdateField(
									field.id,
									{ name: sanitizedName, nameManuallyEdited: true },
									parentPath,
								)
							}}
							placeholder="post_title"
							className={`w-full rounded border px-3 py-2 text-sm ${
								isDuplicate || (!validateFieldName(field.name) && field.name)
									? "border-red-500"
									: "border-grey-300"
							}`}
						/>
						<div className="absolute top-full left-0 -mt-3">
							{isDuplicate ? (
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

					<div>
						<label
							htmlFor={`field-type-${field.id}`}
							className="mb-1 block font-medium text-grey-500 text-xs"
						>
							Type
						</label>
						<select
							id={`field-type-${field.id}`}
							value={field.type}
							onChange={(e) =>
								onUpdateField(
									field.id,
									{
										type: e.target.value as FieldType,
									},
									parentPath,
								)
							}
							className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
						>
							<option value="shortText">Short Text</option>
							<option value="longText">Long Text</option>
							<option value="richText">Rich Text</option>
							<option value="number">Number</option>
							<option value="boolean">Boolean</option>
							<option value="date">Date</option>
							<option value="url">URL</option>
							<option value="youtubeUrl">YouTube URL</option>
							<option value="map">Map</option>
							<option value="media">Media</option>
							<option value="file">File</option>
							<option value="select">Select</option>
							<option value="reference">Reference</option>
							<option value="multiReference">Multi Reference</option>
							{depth < 2 && (
								<>
									<option value="group">Group</option>
									<option value="repeater">Repeater</option>
								</>
							)}
							{depth === 0 && (
								<>
									<option value="flexibleBlocks">Flexible Blocks</option>
									<option value="blockReference">Block Reference</option>
								</>
							)}
						</select>
						{depth >= 2 && (
							<p className="mt-1 text-grey-400 text-xs">
								Group and Repeater types not available at this nesting level
							</p>
						)}
					</div>

					<div className="flex items-end gap-6">
						<label
							htmlFor={`field-required-${field.id}`}
							className="flex items-center gap-2"
						>
							<input
								id={`field-required-${field.id}`}
								type="checkbox"
								checked={field.required}
								onChange={(e) =>
									onUpdateField(
										field.id,
										{
											required: e.target.checked,
										},
										parentPath,
									)
								}
								className="h-4 w-4 rounded border-grey-300"
							/>
							<span className="text-grey-500 text-sm">Required</span>
						</label>
						{hasLocales && isTranslatableFieldType(field.type) && (
							<label
								htmlFor={`field-translatable-${field.id}`}
								className="flex items-center gap-2"
							>
								<input
									id={`field-translatable-${field.id}`}
									type="checkbox"
									checked={field.translatable ?? false}
									onChange={(e) =>
										onUpdateField(
											field.id,
											{ translatable: e.target.checked },
											parentPath,
										)
									}
									className="h-4 w-4 rounded border-grey-300 accent-blue-600"
								/>
								<span className="text-blue-700 text-sm">Translatable</span>
							</label>
						)}
					</div>

					{field.type === "select" && (
						<div className="md:col-span-2">
							<label
								htmlFor={`field-options-${field.id}`}
								className="mb-1 block font-medium text-grey-500 text-xs"
							>
								Options (comma separated)
							</label>
							<SelectOptionsInput
								id={`field-options-${field.id}`}
								value={field.options ?? []}
								onChange={(options) =>
									onUpdateField(field.id, { options }, parentPath)
								}
							/>
						</div>
					)}

					{(field.type === "shortText" ||
						field.type === "longText" ||
						field.type === "select") && (
						<div className="md:col-span-2">
							<label
								htmlFor={`field-default-${field.id}`}
								className="mb-1 block font-medium text-grey-500 text-xs"
							>
								Default Value
							</label>
							{field.type === "select" && (field.options ?? []).length > 0 ? (
								<select
									id={`field-default-${field.id}`}
									value={field.defaultValue ?? ""}
									onChange={(e) =>
										onUpdateField(
											field.id,
											{ defaultValue: e.target.value || undefined },
											parentPath,
										)
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
										onUpdateField(
											field.id,
											{ defaultValue: e.target.value || undefined },
											parentPath,
										)
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
										onUpdateField(
											field.id,
											{ defaultValue: e.target.value || undefined },
											parentPath,
										)
									}
									placeholder="Optional default value..."
									className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
								/>
							)}
						</div>
					)}

					{(field.type === "reference" || field.type === "multiReference") && (
						<div className="md:col-span-2">
							<label
								htmlFor={`field-referenceSchema-${field.id}`}
								className="mb-1 block font-medium text-grey-500 text-xs"
							>
								Reference Schema <span className="text-error">*</span>
							</label>
							<select
								id={`field-referenceSchema-${field.id}`}
								value={field.referenceSchema || ""}
								onChange={(e) =>
									onUpdateField(
										field.id,
										{
											referenceSchema: e.target.value,
										},
										parentPath,
									)
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
									? "Enter the schema name to reference (e.g., 'authors' for author selection)"
									: "Enter the schema name to reference (e.g., 'tags' for selecting multiple tags)"}
							</p>
						</div>
					)}

					{field.type === "flexibleBlocks" && (
						<div className="space-y-3 md:col-span-2">
							<div>
								<div className="mb-2 block font-medium text-grey-500 text-xs">
									Allowed Block Types (leave empty for all types)
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
															: currentAllowed.filter(
																	(t) => t !== blockType.value,
																)

														onUpdateField(
															field.id,
															{
																allowedBlocks:
																	newAllowed.length === allBlockTypes.length
																		? undefined // All types selected = undefined (no restriction)
																		: (newAllowed as any),
															},
															parentPath,
														)
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
									htmlFor={`field-maxBlocks-${field.id}`}
									className="mb-1 block font-medium text-grey-500 text-xs"
								>
									Maximum Blocks (optional)
								</label>
								<input
									id={`field-maxBlocks-${field.id}`}
									type="number"
									min="1"
									value={field.maxBlocks || ""}
									onChange={(e) =>
										onUpdateField(
											field.id,
											{
												maxBlocks: e.target.value
													? Number.parseInt(e.target.value, 10)
													: undefined,
											},
											parentPath,
										)
									}
									placeholder="No limit"
									className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
								/>
							</div>
						</div>
					)}

					{field.type === "blockReference" && (
						<BlockReferenceSelectorNew
							field={field}
							fieldId={field.id}
							parentPath={parentPath}
							availableBlocks={availableBlocks}
							onUpdateField={onUpdateField}
						/>
					)}

					{field.type === "shortText" && depth === 0 && (
						<div className="space-y-3 md:col-span-2">
							<div className="flex items-center gap-3 rounded border border-blue-200 bg-blue-50 p-3">
								<input
									type="checkbox"
									id={`field-isSlug-${field.id}`}
									checked={field.isSlug || false}
									onChange={(e) => {
										const isChecked = e.target.checked
										onUpdateField(
											field.id,
											{
												isSlug: isChecked,
												slugSource: isChecked ? field.slugSource : undefined,
											},
											parentPath,
										)
									}}
									className="h-4 w-4"
								/>
								<label
									htmlFor={`field-isSlug-${field.id}`}
									className="cursor-pointer text-blue-800 text-sm"
								>
									<strong>Use as Slug Field</strong> - Auto-generate
									URL-friendly slugs
								</label>
							</div>

							{field.isSlug && (
								<div>
									<label
										htmlFor={`field-slugSource-${field.id}`}
										className="mb-1 block font-medium text-grey-500 text-xs"
									>
										Slug Source Field <span className="text-error">*</span>
									</label>
									<select
										id={`field-slugSource-${field.id}`}
										value={field.slugSource || ""}
										onChange={(e) =>
											onUpdateField(
												field.id,
												{ slugSource: e.target.value },
												parentPath,
											)
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
										The slug will be auto-generated from the selected field
										(e.g., "My Post Title" → "my-post-title")
									</p>
								</div>
							)}
						</div>
					)}

					<div className="md:col-span-2">
						<label
							htmlFor={`field-help-${field.id}`}
							className="mb-1 block font-medium text-grey-500 text-xs"
						>
							Help Text
						</label>
						<input
							id={`field-help-${field.id}`}
							type="text"
							value={field.helpText || ""}
							onChange={(e) =>
								onUpdateField(
									field.id,
									{
										helpText: e.target.value,
									},
									parentPath,
								)
							}
							placeholder="Optional hint for content editors"
							className="w-full rounded border border-grey-300 px-3 py-2 text-sm"
						/>
					</div>
				</div>

				{/* Nested fields for group and repeater */}
				{(field.type === "group" || field.type === "repeater") && (
					<div className="mt-4 space-y-3">
						<div className="flex items-center justify-between border-grey-200 border-t pt-4">
							<h4 className="font-medium text-grey-700 text-sm">
								{field.type === "group" ? "Group Fields" : "Repeater Fields"}
							</h4>
							<button
								type="button"
								onClick={() => onAddNestedField(field.id, parentPath)}
								className="flex items-center gap-1 rounded bg-primary/10 px-3 py-1.5 text-primary text-xs transition-colors hover:bg-primary/20"
								disabled={depth >= 2}
							>
								<Plus className="h-3 w-3" />
								Add Nested Field
							</button>
						</div>

						{field.fields && field.fields.length > 0 ? (
							<div className="space-y-3">
								{field.fields.map((nestedField, nestedIndex) => (
									<FieldEditor
										key={nestedField.id}
										field={nestedField}
										index={nestedIndex}
										depth={depth + 1}
										parentPath={currentPath}
										onUpdateField={onUpdateField}
										onRemoveField={onRemoveField}
										onAddNestedField={onAddNestedField}
										onMoveField={onMoveField}
										totalFields={field.fields?.length}
										availableBlocks={availableBlocks || []}
										allSchemas={allSchemas || []}
										allFields={allFields}
										hasLocales={hasLocales}
									/>
								))}
							</div>
						) : (
							<div className="rounded border-2 border-grey-300 border-dashed p-4 text-center">
								<p className="text-grey-400 text-xs">
									No nested fields yet. Click "Add Nested Field" to add one.
								</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	)
}

export default function NewSchemaPage() {
	const router = useRouter()

	// Wait for auth to be initialized before making queries
	const [auth] = useAtom(authAtom)
	const isReady = auth.isInitialized && auth.user !== null

	const createSchema = useMutation(api.cms.schemas.create)
	const availableBlocks = useQuery(api.cms.blocks.list, isReady ? {} : "skip")
	const allSchemas = useQuery(api.cms.schemas.list, isReady ? {} : "skip")
	const localizationSettings = useQuery(
		api.cms.settings.get,
		isReady ? { key: "localization" } : "skip",
	)

	// Check if locales are configured
	const hasLocales = (localizationSettings as any)?.locales?.length > 0 || false

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	// Schema basic info
	const [name, setName] = useState("")
	const [displayName, setDisplayName] = useState("")
	const [hasEditedName, setHasEditedName] = useState(false)
	const [type, setType] = useState<"global" | "collection">("collection")
	const [description, setDescription] = useState("")
	const [isSimple, setIsSimple] = useState(false)

	// Fields
	const [fields, setFields] = useState<Field[]>([])

	const handleDisplayNameChange = (value: string) => {
		setDisplayName(value)
		// Auto-generate name if it hasn't been manually edited
		if (!hasEditedName) {
			const generatedName = generateFieldName(value)
			setName(generatedName)
		}
	}

	const handleAddField = () => {
		const newField: Field = {
			id: `field_${Date.now()}`,
			name: "",
			label: "",
			type: "shortText",
			required: false,
		}
		setFields([...fields, newField])

		// Scroll to bottom smoothly after adding field
		setTimeout(() => {
			window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
		}, 100)
	}

	// Helper function to update nested fields recursively
	const updateNestedFields = useCallback(
		(
			fieldsArray: Field[],
			path: string[],
			updater: (field: Field) => Field,
		): Field[] => {
			if (path.length === 0) return fieldsArray

			const [currentId, ...restPath] = path

			return fieldsArray.map((field) => {
				if (field.id === currentId) {
					if (restPath.length === 0) {
						return updater(field)
					}
					if (field.fields) {
						return {
							...field,
							fields: updateNestedFields(field.fields, restPath, updater),
						}
					}
				}
				return field
			})
		},
		[],
	)

	const handleRemoveField = useCallback(
		(id: string, parentPath: string[] = []) => {
			if (parentPath.length === 0) {
				// Top-level field
				setFields((prev) => prev.filter((f) => f.id !== id))
			} else {
				// Nested field - recursively update
				setFields((prevFields) =>
					updateNestedFields(prevFields, parentPath, (parentField) => ({
						...parentField,
						fields: parentField.fields?.filter((f) => f.id !== id),
					})),
				)
			}
		},
		[updateNestedFields],
	)

	const handleUpdateField = useCallback(
		(id: string, updates: Partial<Field>, parentPath: string[] = []) => {
			if (parentPath.length === 0) {
				// Top-level field
				setFields((prevFields) =>
					prevFields.map((f) => {
						if (f.id === id) {
							const updated = { ...f, ...updates }
							// Reset nested fields if type changes from group/repeater
							if (
								(f.type === "group" || f.type === "repeater") &&
								updated.type !== "group" &&
								updated.type !== "repeater"
							) {
								delete updated.fields
							}
							// Initialize nested fields array if type changes to group/repeater
							if (
								(updated.type === "group" || updated.type === "repeater") &&
								!updated.fields
							) {
								updated.fields = []
							}
							return updated
						}
						return f
					}),
				)
			} else {
				// Nested field
				setFields((prevFields) =>
					updateNestedFields(prevFields, parentPath, (parentField) => ({
						...parentField,
						fields: parentField.fields?.map((f) => {
							if (f.id === id) {
								const updated = { ...f, ...updates }
								// Reset nested fields if type changes from group/repeater
								if (
									(f.type === "group" || f.type === "repeater") &&
									updated.type !== "group" &&
									updated.type !== "repeater"
								) {
									delete updated.fields
								}
								// Initialize nested fields array if type changes to group/repeater
								if (
									(updated.type === "group" || updated.type === "repeater") &&
									!updated.fields
								) {
									updated.fields = []
								}
								return updated
							}
							return f
						}),
					})),
				)
			}
		},
		[updateNestedFields],
	)

	const handleMoveField = useCallback(
		(id: string, direction: "up" | "down", parentPath: string[] = []) => {
			if (parentPath.length === 0) {
				// Top-level field
				setFields((prevFields) => {
					const index = prevFields.findIndex((f) => f.id === id)
					if (index === -1) return prevFields

					const newIndex = direction === "up" ? index - 1 : index + 1
					if (newIndex < 0 || newIndex >= prevFields.length) return prevFields

					const newFields = [...prevFields]
					const [removed] = newFields.splice(index, 1)
					newFields.splice(newIndex, 0, removed)
					return newFields
				})
			} else {
				// Nested field
				setFields((prevFields) =>
					updateNestedFields(prevFields, parentPath, (parentField) => {
						if (!parentField.fields) return parentField

						const index = parentField.fields.findIndex((f) => f.id === id)
						if (index === -1) return parentField

						const newIndex = direction === "up" ? index - 1 : index + 1
						if (newIndex < 0 || newIndex >= parentField.fields.length)
							return parentField

						const newFields = [...parentField.fields]
						const [removed] = newFields.splice(index, 1)
						newFields.splice(newIndex, 0, removed)

						return {
							...parentField,
							fields: newFields,
						}
					}),
				)
			}
		},
		[updateNestedFields],
	)

	const handleAddNestedField = useCallback(
		(parentId: string, parentPath: string[] = []) => {
			const newField: Field = {
				id: `field_${Date.now()}`,
				name: "",
				label: "",
				type: "shortText",
				required: false,
			}

			if (parentPath.length === 0) {
				// Adding to top-level field
				setFields((prevFields) =>
					prevFields.map((f) => {
						if (f.id === parentId) {
							return {
								...f,
								fields: [...(f.fields || []), newField],
							}
						}
						return f
					}),
				)
			} else {
				// Adding to nested field
				setFields((prevFields) =>
					updateNestedFields(prevFields, parentPath, (parentField) => ({
						...parentField,
						fields: parentField.fields?.map((f) => {
							if (f.id === parentId) {
								return {
									...f,
									fields: [...(f.fields || []), newField],
								}
							}
							return f
						}),
					})),
				)
			}

			// Scroll to bottom smoothly after adding nested field
			setTimeout(() => {
				window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
			}, 100)
		},
		[updateNestedFields],
	)

	const _getFieldIcon = (type: FieldType) => {
		switch (type) {
			case "shortText":
			case "longText":
				return <Type className="h-4 w-4" />
			case "richText":
				return <FileText className="h-4 w-4" />
			case "number":
				return <Hash className="h-4 w-4" />
			case "boolean":
				return <ToggleLeft className="h-4 w-4" />
			case "date":
				return <Calendar className="h-4 w-4" />
			case "url":
				return <LinkIcon className="h-4 w-4" />
			case "youtubeUrl":
				return <Video className="h-4 w-4" />
			case "map":
				return <MapPin className="h-4 w-4" />
			case "media":
				return <Image className="h-4 w-4" />
			case "file":
				return <FileText className="h-4 w-4" />
			case "select":
			case "reference":
				return <List className="h-4 w-4" />
			case "group":
				return <Folder className="h-4 w-4" />
			case "repeater":
				return <Layers className="h-4 w-4" />
			default:
				return <Type className="h-4 w-4" />
		}
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError("")

		try {
			// Validate
			if (!name.trim()) {
				throw new Error("Schema name is required")
			}
			if (!displayName.trim()) {
				throw new Error("Display name is required")
			}
			if (fields.length === 0) {
				throw new Error("At least one field is required")
			}

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

			// Validate schema name format
			if (!validateFieldName(name)) {
				throw new Error(
					"Schema name must contain only lowercase letters, numbers, and underscores",
				)
			}

			// Create schema with nested fields
			const schemaId = await createSchema({
				name,
				displayName,
				type,
				description: description || undefined,
				fields: mapFieldsForSave(fields),
				isSimple: type === "collection" ? isSimple : undefined,
			})

			// Trigger type generation in development
			triggerTypeGeneration()

			// Redirect to schema detail
			router.push(`/schemas/${schemaId}`)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create schema")
		} finally {
			setLoading(false)
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

			<div className="mb-6">
				<h1 className="font-bold text-3xl text-primary">Create New Schema</h1>
				<p className="mt-2 text-grey-500">
					Define a new content type for your CMS
				</p>
			</div>

			{error && (
				<div className="mb-6 rounded-lg bg-error-light/10 p-4">
					<p className="text-error text-sm">{error}</p>
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Basic Info */}
				<div className="rounded-lg bg-white p-6 shadow">
					<h2 className="mb-4 font-semibold text-lg text-primary">
						Basic Information
					</h2>

					<div className="space-y-4">
						<div>
							<label
								htmlFor="schema-display-name"
								className="mb-2 block font-medium text-grey-500 text-sm"
							>
								Display Name <span className="text-error">*</span>
							</label>
							<input
								id="schema-display-name"
								type="text"
								value={displayName}
								onChange={(e) => handleDisplayNameChange(e.target.value)}
								placeholder="Blog Posts"
								className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								required
							/>
						</div>

						<div className="relative pb-6">
							<label
								htmlFor="schema-name"
								className="mb-2 block font-medium text-grey-500 text-sm"
							>
								Schema Name <span className="text-error">*</span>
							</label>
							<input
								id="schema-name"
								type="text"
								value={name}
								onFocus={() => {
									setHasEditedName(true)
								}}
								onChange={(e) => {
									const newName = e.target.value
									// Validate and sanitize input
									const sanitizedName = newName
										.toLowerCase()
										.replace(/[^a-z0-9_]/g, "")
									setName(sanitizedName)
								}}
								placeholder="blog_posts"
								className={`w-full rounded-lg border px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
									!validateFieldName(name) && name
										? "border-red-500"
										: "border-grey-300"
								}`}
								required
							/>
							<div className="absolute top-full left-0 -mt-3">
								{name && !validateFieldName(name) ? (
									<p className="text-red-500 text-xs">
										Only lowercase letters, numbers, and underscores allowed
									</p>
								) : !hasEditedName && displayName ? (
									<p className="text-blue-600 text-xs">
										✨ Auto-generated from "Display Name"
									</p>
								) : (
									<p className="text-grey-400 text-xs">
										Unique identifier (lowercase, underscores only)
									</p>
								)}
							</div>
						</div>

						<div>
							<label
								htmlFor="schema-type"
								className="mb-2 block font-medium text-grey-500 text-sm"
							>
								Type <span className="text-error">*</span>
							</label>
							<select
								id="schema-type"
								value={type}
								onChange={(e) => setType(e.target.value as any)}
								className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							>
								<option value="collection">Collection</option>
								<option value="global">Global Component</option>
							</select>
							<p className="mt-1 text-grey-400 text-xs">
								{type === "global" &&
									"Single instance content (header, footer, settings)"}
								{type === "collection" &&
									"Repeatable content (blog posts, pages, products)"}
							</p>
						</div>

						<div>
							<label
								htmlFor="schema-description"
								className="mb-2 block font-medium text-grey-500 text-sm"
							>
								Description
							</label>
							<textarea
								id="schema-description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Describe what this schema is for..."
								rows={3}
								className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							/>
						</div>
					</div>
					{type === "collection" && (
						<div className="border-grey-200 border-t pt-4">
							<h3 className="mb-3 font-medium text-grey-700">Simple Schema</h3>
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
				</div>

				{/* Fields */}
				<div className="rounded-lg bg-white p-6 shadow">
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-semibold text-lg text-primary">
							Fields <span className="text-error">*</span>
						</h2>
						<button
							type="button"
							onClick={handleAddField}
							className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm text-white transition-colors hover:bg-secondary-dark"
						>
							<Plus className="h-4 w-4" />
							Add Field
						</button>
					</div>

					{fields.length === 0 ? (
						<div className="rounded-lg border-2 border-grey-300 border-dashed p-8 text-center">
							<p className="text-grey-500">
								No fields yet. Click "Add Field" to get started.
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{fields.map((field, index) => (
								<FieldEditor
									key={field.id}
									field={field}
									index={index}
									depth={0}
									parentPath={[]}
									onUpdateField={handleUpdateField}
									onRemoveField={handleRemoveField}
									onAddNestedField={handleAddNestedField}
									onMoveField={handleMoveField}
									totalFields={fields.length}
									availableBlocks={availableBlocks || []}
									allSchemas={allSchemas || []}
									allFields={fields}
									hasLocales={hasLocales}
								/>
							))}
						</div>
					)}
				</div>

				{/* Fixed bottom bar with action buttons */}
				<div className="fixed right-0 bottom-0 left-0 z-50 border-grey-200 border-t bg-white shadow-lg">
					<div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
						<button
							type="button"
							onClick={() => {
								setFields((prev) => [
									...prev,
									{
										id: `field_${Date.now()}`,
										name: "",
										label: "",
										type: "shortText",
										required: false,
									},
								])

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
							<Link
								href="/schemas"
								className="rounded-lg border border-grey-300 px-6 py-3 text-grey-500 transition-colors hover:bg-grey-100"
							>
								Cancel
							</Link>
							<button
								type="submit"
								disabled={loading || fields.length === 0}
								className="rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
							>
								{loading ? "Creating..." : "Create Schema"}
							</button>
						</div>
					</div>
				</div>

				{/* Spacer to prevent content from being hidden behind fixed bar */}
				<div className="h-24" />
			</form>
		</div>
	)
}
