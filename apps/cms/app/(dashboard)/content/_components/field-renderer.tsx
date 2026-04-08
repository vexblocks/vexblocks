"use client"

import { useAtom } from "@lfades/atom"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { useQuery } from "convex/react"
import {
	ArrowDown,
	ArrowUp,
	ChevronDown,
	Eye,
	Folder,
	Layers,
	Plus,
	Trash2,
} from "lucide-react"
import { useState } from "react"
import {
	getCollapsedBlockIds,
	setBlockCollapsed,
} from "@/lib/block-collapse-cookie"
import { previewAtom } from "@/lib/preview-atom"
import { BasicFieldRenderer } from "./basic-field-renderer"
import { BlockPreviewModal } from "./block-preview-modal"
import { FlexibleBlocksField } from "./flexible-blocks"
import { useLocale } from "./locale-context"
import type { Field } from "./types"
import {
	getEditorLocalizedValue,
	getFieldAtPath,
	getNestedValue,
	isLocaleKey,
	isLocaleMap,
	mergeLocalizedValue,
	normalizeFieldsDataForEditor,
	setNestedValue,
	shouldFieldBeTranslatable,
} from "./utils"

type FieldRendererProps = {
	field: Field
	path: string
	value: any
	onChange: (path: string, value: any) => void
	onAddRepeaterItem?: (path: string) => void
	onRemoveRepeaterItem?: (path: string, index: number) => void
	onMoveRepeaterItem?: (
		path: string,
		index: number,
		direction: "up" | "down",
	) => void
	level?: number
	allSchemas?: any[]
	contentBySchema?: Record<string, any[]>
	onRegenerateSlug?: (slugFieldName: string) => void
	isAutoSlugActive?: boolean
}

export function FieldRenderer({
	field,
	path,
	value,
	onChange,
	onAddRepeaterItem,
	onRemoveRepeaterItem,
	onMoveRepeaterItem,
	level = 0,
	allSchemas,
	contentBySchema,
	onRegenerateSlug,
	isAutoSlugActive,
}: FieldRendererProps) {
	// State for preview modal (must be at top level for hooks rules)
	const [showPreviewModal, setShowPreviewModal] = useState(false)
	const [isCollapsed, setIsCollapsed] = useState(() =>
		getCollapsedBlockIds().has(path),
	)
	const { currentLocale, defaultLocale, hasLocales } = useLocale()

	const getLocalizedFieldValue = (raw: any, translatable?: boolean) => {
		return getEditorLocalizedValue({
			rawValue: raw,
			translatable: Boolean(translatable),
			hasLocales,
			currentLocale,
			defaultLocale,
		})
	}

	const [previewState] = useAtom(previewAtom)
	const isPreviewActive = previewState.isPreviewActive

	// Load block data for blockReference fields (must be called unconditionally for hooks rules)
	const block = useQuery(
		api.cms.blocks.get,
		field.type === "blockReference" && field.blockId
			? { id: field.blockId as Id<"cmsBlocks"> }
			: "skip",
	)

	const handleToggleCollapse = () => {
		const next = !isCollapsed
		setIsCollapsed(next)
		setBlockCollapsed(path, next)
	}

	// Handle group fields (single nested object)
	if (field.type === "group") {
		const rawGroupValue = value || {}
		let groupValue = rawGroupValue
		let isGroupLocaleWrapped = false

		// First, check if the entire group is locale-wrapped (e.g., {en: {link: ..., text: ...}})
		if (
			groupValue &&
			typeof groupValue === "object" &&
			!Array.isArray(groupValue)
		) {
			const topKeys = Object.keys(groupValue)
			// Get expected field names from schema
			const expectedFieldNames = new Set(field.fields?.map((f) => f.name) || [])
			// Check if top keys are locale codes AND not expected field names
			isGroupLocaleWrapped =
				topKeys.length > 0 &&
				topKeys.every((key) => isLocaleKey(key) && !expectedFieldNames.has(key))

			if (isGroupLocaleWrapped) {
				// Unwrap the entire group for the current locale.
				// If this locale has no value yet, the editor falls back to the default locale.
				groupValue =
					getEditorLocalizedValue({
						rawValue: groupValue,
						translatable: false,
						hasLocales,
						currentLocale,
						defaultLocale,
					}) ?? {}
				// After unwrapping the group, the nested fields are already unwrapped
				// So we don't need to unwrap them again
			} else {
				// Group is not locale-wrapped at top level, but nested fields might be
				// Unwrap nested locale-wrapped fields within the group
				if (
					groupValue &&
					typeof groupValue === "object" &&
					!Array.isArray(groupValue)
				) {
					const unwrapped: any = {}
					for (const [key, val] of Object.entries(groupValue)) {
						unwrapped[key] = getEditorLocalizedValue({
							rawValue: val,
							translatable: shouldFieldBeTranslatable(
								field.fields?.find((nestedField) => nestedField.name === key) ??
									null,
								hasLocales,
							),
							hasLocales,
							currentLocale,
							defaultLocale,
						})
					}
					groupValue = unwrapped
				}
			}

			const updateLocaleWrappedGroup = (
				_relativePath: string,
				updater: (currentLocaleGroup: any) => any,
			) => {
				const currentLocaleGroup =
					rawGroupValue?.[currentLocale] &&
					typeof rawGroupValue[currentLocale] === "object" &&
					!Array.isArray(rawGroupValue[currentLocale])
						? rawGroupValue[currentLocale]
						: {}
				const nextGroupValue = updater(currentLocaleGroup)
				onChange(path, {
					...rawGroupValue,
					[currentLocale]: nextGroupValue,
				})
			}

			const handleNestedGroupChange = (fieldPath: string, newValue: any) => {
				if (!isGroupLocaleWrapped) {
					onChange(fieldPath, newValue)
					return
				}

				const relativePath = fieldPath.replace(`${path}.`, "")
				updateLocaleWrappedGroup(relativePath, (currentLocaleGroup) =>
					setNestedValue(currentLocaleGroup, relativePath, newValue),
				)
			}

			const handleNestedGroupAddRepeaterItem = (repeaterPath: string) => {
				if (!isGroupLocaleWrapped) {
					onAddRepeaterItem?.(repeaterPath)
					return
				}

				const relativePath = repeaterPath.replace(`${path}.`, "")
				updateLocaleWrappedGroup(relativePath, (currentLocaleGroup) => {
					const currentItems =
						getNestedValue(currentLocaleGroup, relativePath) || []
					return setNestedValue(currentLocaleGroup, relativePath, [
						...currentItems,
						{},
					])
				})
			}

			const handleNestedGroupRemoveRepeaterItem = (
				repeaterPath: string,
				index: number,
			) => {
				if (!isGroupLocaleWrapped) {
					onRemoveRepeaterItem?.(repeaterPath, index)
					return
				}

				const relativePath = repeaterPath.replace(`${path}.`, "")
				updateLocaleWrappedGroup(relativePath, (currentLocaleGroup) => {
					const currentItems =
						getNestedValue(currentLocaleGroup, relativePath) || []
					return setNestedValue(
						currentLocaleGroup,
						relativePath,
						currentItems.filter(
							(_: unknown, itemIndex: number) => itemIndex !== index,
						),
					)
				})
			}

			const handleNestedGroupMoveRepeaterItem = (
				repeaterPath: string,
				index: number,
				direction: "up" | "down",
			) => {
				if (!isGroupLocaleWrapped) {
					onMoveRepeaterItem?.(repeaterPath, index, direction)
					return
				}

				const relativePath = repeaterPath.replace(`${path}.`, "")
				updateLocaleWrappedGroup(relativePath, (currentLocaleGroup) => {
					const currentItems = [
						...(getNestedValue(currentLocaleGroup, relativePath) || []),
					]
					const nextIndex = direction === "up" ? index - 1 : index + 1
					if (nextIndex < 0 || nextIndex >= currentItems.length) {
						return currentLocaleGroup
					}

					;[currentItems[index], currentItems[nextIndex]] = [
						currentItems[nextIndex],
						currentItems[index],
					]

					return setNestedValue(currentLocaleGroup, relativePath, currentItems)
				})
			}

			return (
				<div
					data-field-path={field.name}
					className="rounded-lg border-2 border-grey-200 bg-grey-50 p-4 transition-all duration-200"
					style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
				>
					<div className="mb-3 flex items-center gap-2">
						<Folder className="h-5 w-5 text-primary" />
						<h3 className="font-semibold text-grey-900 text-lg">
							{field.label}
						</h3>
						<span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
							Group
						</span>
					</div>
					{field.helpText && (
						<p className="mb-2 text-grey-500 text-sm">{field.helpText}</p>
					)}
					<div
						className={`grid grid-cols-1 gap-4 ${isPreviewActive ? "" : "lg:grid-cols-2"}`}
					>
						{(() => {
							// Group consecutive small fields together
							const fieldGroups: any[][] = []
							let currentGroup: any[] = []

							const isSmallField = (fieldType: string) =>
								[
									"shortText",
									"select",
									"checkbox",
									"date",
									"datetime",
									"time",
									"number",
								].includes(fieldType)
							const isLargeField = (fieldType: string) =>
								[
									"richText",
									"flexibleBlocks",
									"repeater",
									"group",
									"blockReference",
								].includes(fieldType)

							field.fields?.forEach((nestedField: any, index: number) => {
								if (isSmallField(nestedField.type)) {
									currentGroup.push(nestedField)
									const nextField = field.fields?.[index + 1]
									if (!nextField || !isSmallField(nextField.type)) {
										fieldGroups.push([...currentGroup])
										currentGroup = []
									}
								} else {
									if (currentGroup.length > 0) {
										fieldGroups.push([...currentGroup])
										currentGroup = []
									}
									fieldGroups.push([nestedField])
								}
							})

							return fieldGroups.map((group, groupIndex) => {
								const isGroupOfSmallFields = group.every((f) =>
									isSmallField(f.type),
								)
								const hasOnlyOneField = group.length === 1
								const singleField = group[0]
								const isLarge =
									hasOnlyOneField && isLargeField(singleField.type)

								if (isGroupOfSmallFields && group.length > 1) {
									return (
										<div key={groupIndex} className="space-y-4">
											{group.map((nestedField: any) => {
												const nestedPath = `${path}.${nestedField.name}`
												// Group values are already unwrapped, use directly
												const nestedValue = groupValue[nestedField.name]
												return (
													<FieldRenderer
														key={nestedField.name}
														field={nestedField}
														path={nestedPath}
														value={nestedValue}
														onChange={handleNestedGroupChange}
														onAddRepeaterItem={handleNestedGroupAddRepeaterItem}
														onRemoveRepeaterItem={
															handleNestedGroupRemoveRepeaterItem
														}
														onMoveRepeaterItem={
															handleNestedGroupMoveRepeaterItem
														}
														level={level + 1}
														allSchemas={allSchemas}
														contentBySchema={contentBySchema}
													/>
												)
											})}
										</div>
									)
								}

								const nestedField = singleField
								const nestedPath = `${path}.${nestedField.name}`
								// Group values are already unwrapped, use directly
								const nestedValue = groupValue[nestedField.name]

								return (
									<div
										key={nestedField.name}
										className={
											isLarge && !isPreviewActive ? "lg:col-span-2" : ""
										}
									>
										<FieldRenderer
											field={nestedField}
											path={nestedPath}
											value={nestedValue}
											onChange={handleNestedGroupChange}
											onAddRepeaterItem={handleNestedGroupAddRepeaterItem}
											onRemoveRepeaterItem={handleNestedGroupRemoveRepeaterItem}
											onMoveRepeaterItem={handleNestedGroupMoveRepeaterItem}
											level={level + 1}
											allSchemas={allSchemas}
											contentBySchema={contentBySchema}
										/>
									</div>
								)
							})
						})()}
					</div>
				</div>
			)
		}
	}

	// Handle flexibleBlocks fields
	if (field.type === "flexibleBlocks") {
		return (
			<FlexibleBlocksField
				field={field}
				value={value}
				path={path}
				onChange={onChange}
				level={level}
				allSchemas={allSchemas}
				contentBySchema={contentBySchema}
			/>
		)
	}

	// Handle blockReference fields
	if (field.type === "blockReference" && field.blockId) {
		if (!block) {
			return (
				<div
					className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4"
					style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
				>
					<div className="mb-3 flex items-center gap-2">
						<Layers className="h-5 w-5 text-blue-600" />
						<h3 className="font-semibold text-grey-900 text-lg">
							{field.label}
						</h3>
						<span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-600 text-xs">
							Block Reference
						</span>
						{field.required && <span className="text-error text-sm">*</span>}
					</div>
					<div className="rounded-lg border border-blue-300 bg-white p-4 text-center">
						<div className="mb-2 inline-block h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
						<p className="text-grey-500 text-sm">Loading block...</p>
					</div>
				</div>
			)
		}

		// Initialize block data if not set
		const blockValue = normalizeFieldsDataForEditor(block.fields, value || {})

		const handleBlockReferenceFieldChange = (
			fieldPath: string,
			newValue: any,
		) => {
			const relativePath = fieldPath.replace(`${path}.`, "")
			const blockField = getFieldAtPath(block.fields, relativePath)
			const currentRaw = getNestedValue(blockValue, relativePath)
			const isTranslatableField = shouldFieldBeTranslatable(
				blockField,
				hasLocales,
			)
			const shouldMergeByLocale =
				isTranslatableField ||
				isLocaleMap(currentRaw, { excludeKeys: ["url", "newWindow"] })

			const nextFieldValue = shouldMergeByLocale
				? mergeLocalizedValue({
						currentValue: currentRaw,
						nextValue: newValue,
						currentLocale,
						defaultLocale,
					})
				: newValue

			onChange(path, setNestedValue(blockValue, relativePath, nextFieldValue))
		}

		return (
			<>
				<div
					className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4"
					style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
				>
					<div
						className={`flex items-center justify-between ${isCollapsed ? "" : "mb-2"}`}
					>
						<div className="flex items-center gap-2">
							<Layers className="h-5 w-5 text-blue-600" />
							<h3 className="font-semibold text-grey-900 text-lg">
								{field.label}
							</h3>
							<span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-600 text-xs">
								Block: {block.displayName}
							</span>
							{field.required && <span className="text-error text-sm">*</span>}
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={handleToggleCollapse}
								className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-blue-700 text-sm transition-all hover:bg-blue-50"
								title={isCollapsed ? "Expand block" : "Collapse block"}
							>
								<ChevronDown
									className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
								/>
								{isCollapsed ? "Expand" : "Collapse"}
							</button>
							{block.previewImage && (
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
					</div>
					{field.helpText && !isCollapsed && (
						<p className="mb-2 text-grey-500 text-sm">{field.helpText}</p>
					)}
					{!isCollapsed && (
						<div
							className={`grid grid-cols-1 gap-4 rounded-lg border border-blue-300 bg-white p-4 ${isPreviewActive ? "" : "lg:grid-cols-2"}`}
						>
							{(() => {
								// Group consecutive small fields together
								const fieldGroups: any[][] = []
								let currentGroup: any[] = []

								const isSmallField = (fieldType: string) =>
									[
										"shortText",
										"select",
										"checkbox",
										"date",
										"number",
									].includes(fieldType)
								const isLargeField = (fieldType: string) =>
									[
										"richText",
										"flexibleBlocks",
										"repeater",
										"group",
										"blockReference",
									].includes(fieldType)

								block.fields.forEach((blockField: Field, index: number) => {
									if (isSmallField(blockField.type)) {
										currentGroup.push(blockField)
										const nextField = block.fields[index + 1]
										if (!nextField || !isSmallField(nextField.type)) {
											fieldGroups.push([...currentGroup])
											currentGroup = []
										}
									} else {
										if (currentGroup.length > 0) {
											fieldGroups.push([...currentGroup])
											currentGroup = []
										}
										fieldGroups.push([blockField])
									}
								})

								return fieldGroups.map((group, groupIndex) => {
									const isGroupOfSmallFields = group.every((f) =>
										isSmallField(f.type),
									)
									const hasOnlyOneField = group.length === 1
									const singleField = group[0]
									const isLarge =
										hasOnlyOneField && isLargeField(singleField.type)

									if (isGroupOfSmallFields && group.length > 1) {
										return (
											<div key={groupIndex} className="space-y-4">
												{group.map((blockField: Field) => {
													const blockFieldPath = `${path}.${blockField.name}`
													const blockFieldValue = getLocalizedFieldValue(
														blockValue[blockField.name],
														shouldFieldBeTranslatable(blockField, hasLocales),
													)
													return (
														<FieldRenderer
															key={blockField.name}
															field={blockField}
															path={blockFieldPath}
															value={blockFieldValue}
															onChange={handleBlockReferenceFieldChange}
															onAddRepeaterItem={onAddRepeaterItem}
															onRemoveRepeaterItem={onRemoveRepeaterItem}
															onMoveRepeaterItem={onMoveRepeaterItem}
															level={level + 1}
															allSchemas={allSchemas}
															contentBySchema={contentBySchema}
														/>
													)
												})}
											</div>
										)
									}

									const blockField = singleField
									const blockFieldPath = `${path}.${blockField.name}`
									const blockFieldValue = getLocalizedFieldValue(
										blockValue[blockField.name],
										shouldFieldBeTranslatable(blockField, hasLocales),
									)

									return (
										<div
											key={blockField.name}
											className={
												isLarge && !isPreviewActive ? "lg:col-span-2" : ""
											}
										>
											<FieldRenderer
												field={blockField}
												path={blockFieldPath}
												value={blockFieldValue}
												onChange={handleBlockReferenceFieldChange}
												onAddRepeaterItem={onAddRepeaterItem}
												onRemoveRepeaterItem={onRemoveRepeaterItem}
												onMoveRepeaterItem={onMoveRepeaterItem}
												level={level + 1}
												allSchemas={allSchemas}
												contentBySchema={contentBySchema}
											/>
										</div>
									)
								})
							})()}
						</div>
					)}
				</div>

				{/* Preview Modal */}
				<BlockPreviewModal
					isOpen={showPreviewModal && !!block.previewImage}
					onClose={() => setShowPreviewModal(false)}
					blockDisplayName={block.displayName}
					previewImageId={block.previewImage || ""}
				/>
			</>
		)
	}

	// Handle repeater fields
	if (field.type === "repeater") {
		const items = (value || []) as any[]

		return (
			<div
				data-field-path={field.name}
				className="rounded-lg border-2 border-green-200 bg-green-50 p-2 transition-all duration-200"
				style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
			>
				<div className="mb-2 flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Layers className="h-5 w-5 text-primary" />
						<h3 className="font-semibold text-grey-900 text-lg">
							{field.label}
						</h3>
						<span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
							Repeater
						</span>
						{field.required && <span className="text-error text-sm">*</span>}
					</div>
					<button
						type="button"
						onClick={() => onAddRepeaterItem?.(path)}
						className="flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-sm text-white transition-colors hover:bg-primary-800"
					>
						<Plus className="h-4 w-4" />
						Add Item
					</button>
				</div>
				{field.helpText && (
					<p className="mb-2 text-grey-500 text-sm">{field.helpText}</p>
				)}

				{items.length === 0 ? (
					<div className="rounded-lg border-2 border-grey-300 border-dashed bg-white p-8 text-center">
						<p className="text-grey-400 text-sm">
							No items yet. Click "Add Item" to get started.
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{items.map((item, index) => (
							<div
								key={index}
								className="rounded-lg border border-grey-300 bg-white p-1.5 shadow-sm"
							>
								<div className="mb-2 flex items-center justify-between">
									<h4 className="font-medium text-grey-700 text-sm">
										Item #{index + 1}
									</h4>
									<div className="flex items-center gap-2">
										{items.length > 1 && (
											<div className="flex gap-1">
												<button
													type="button"
													onClick={() =>
														onMoveRepeaterItem?.(path, index, "up")
													}
													disabled={index === 0}
													className="rounded p-1 text-grey-500 transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-30"
													title="Move up"
												>
													<ArrowUp className="h-4 w-4" />
												</button>
												<button
													type="button"
													onClick={() =>
														onMoveRepeaterItem?.(path, index, "down")
													}
													disabled={index === items.length - 1}
													className="rounded p-1 text-grey-500 transition-colors hover:bg-grey-100 disabled:cursor-not-allowed disabled:opacity-30"
													title="Move down"
												>
													<ArrowDown className="h-4 w-4" />
												</button>
											</div>
										)}
										<button
											type="button"
											onClick={() => onRemoveRepeaterItem?.(path, index)}
											className="text-error transition-colors hover:text-error/80"
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
								</div>
								<div
									className={`grid grid-cols-1 gap-4 ${isPreviewActive ? "" : "lg:grid-cols-2"}`}
								>
									{(() => {
										// Group consecutive small fields together
										const fieldGroups: any[][] = []
										let currentGroup: any[] = []

										const isSmallField = (fieldType: string) =>
											[
												"shortText",
												"select",
												"checkbox",
												"date",
												"number",
											].includes(fieldType)
										const isLargeField = (fieldType: string) =>
											[
												"richText",
												"flexibleBlocks",
												"repeater",
												"group",
												"blockReference",
											].includes(fieldType)

										field.fields?.forEach(
											(nestedField: any, fieldIndex: number) => {
												if (isSmallField(nestedField.type)) {
													currentGroup.push(nestedField)
													const nextField = field.fields?.[fieldIndex + 1]
													if (!nextField || !isSmallField(nextField.type)) {
														fieldGroups.push([...currentGroup])
														currentGroup = []
													}
												} else {
													if (currentGroup.length > 0) {
														fieldGroups.push([...currentGroup])
														currentGroup = []
													}
													fieldGroups.push([nestedField])
												}
											},
										)

										return fieldGroups.map((group, groupIndex) => {
											const isGroupOfSmallFields = group.every((f) =>
												isSmallField(f.type),
											)
											const hasOnlyOneField = group.length === 1
											const singleField = group[0]
											const isLarge =
												hasOnlyOneField && isLargeField(singleField.type)

											if (isGroupOfSmallFields && group.length > 1) {
												return (
													<div key={groupIndex} className="space-y-4">
														{group.map((nestedField: any) => {
															const nestedPath = `${path}[${index}].${nestedField.name}`
															// For group fields, pass raw value - FieldRenderer will handle unwrapping
															const nestedValue =
																nestedField.type === "group"
																	? item?.[nestedField.name]
																	: getLocalizedFieldValue(
																			item?.[nestedField.name],
																			shouldFieldBeTranslatable(
																				nestedField,
																				hasLocales,
																			),
																		)

															return (
																<FieldRenderer
																	key={nestedField.name}
																	field={nestedField}
																	path={nestedPath}
																	value={nestedValue}
																	onChange={onChange}
																	onAddRepeaterItem={onAddRepeaterItem}
																	onRemoveRepeaterItem={onRemoveRepeaterItem}
																	onMoveRepeaterItem={onMoveRepeaterItem}
																	level={level + 1}
																	allSchemas={allSchemas}
																	contentBySchema={contentBySchema}
																	onRegenerateSlug={onRegenerateSlug}
																/>
															)
														})}
													</div>
												)
											}

											const nestedField = singleField
											const nestedPath = `${path}[${index}].${nestedField.name}`
											// For group fields, pass raw value - FieldRenderer will handle unwrapping
											const nestedValue =
												nestedField.type === "group"
													? item?.[nestedField.name]
													: getLocalizedFieldValue(
															item?.[nestedField.name],
															shouldFieldBeTranslatable(
																nestedField,
																hasLocales,
															),
														)

											return (
												<div
													key={nestedField.name}
													className={
														isLarge && !isPreviewActive ? "lg:col-span-2" : ""
													}
												>
													<FieldRenderer
														field={nestedField}
														path={nestedPath}
														value={nestedValue}
														onChange={onChange}
														onAddRepeaterItem={onAddRepeaterItem}
														onRemoveRepeaterItem={onRemoveRepeaterItem}
														onMoveRepeaterItem={onMoveRepeaterItem}
														level={level + 1}
														allSchemas={allSchemas}
														contentBySchema={contentBySchema}
														onRegenerateSlug={onRegenerateSlug}
													/>
												</div>
											)
										})
									})()}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		)
	}

	// Handle regular fields
	const fieldId = `field-${path.replace(/\./g, "-").replace(/\[/g, "-").replace(/\]/g, "")}`

	// Ensure value has a default based on field type
	const fieldValue =
		value ??
		(field.type === "number" ? 0 : field.type === "boolean" ? false : "")

	return (
		<div
			data-field-path={field.name}
			className="transition-all duration-200"
			style={{ marginLeft: level > 0 ? `${level * 0.5}rem` : "0" }}
		>
			<label
				htmlFor={fieldId}
				className="mb-2 block font-medium text-grey-500 text-sm"
			>
				{field.label}
				{field.required && <span className="text-error"> *</span>}
			</label>
			<BasicFieldRenderer
				field={field}
				value={fieldValue}
				onChange={(val) => onChange(path, val)}
				fieldId={fieldId}
				allSchemas={allSchemas}
				allContent={contentBySchema}
				onRegenerateSlug={
					field.isSlug && onRegenerateSlug
						? () => onRegenerateSlug(field.name)
						: undefined
				}
				isAutoSlugActive={field.isSlug ? isAutoSlugActive : undefined}
			/>
			{field.helpText && (
				<p className="mt-1 text-grey-400 text-xs">{field.helpText}</p>
			)}
		</div>
	)
}
