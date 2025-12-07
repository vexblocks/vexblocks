"use client"

import { Folder, Layers, Plus, Trash2 } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import type { Field } from "./types"
import { getNestedValue } from "./utils"
import { BasicFieldRenderer } from "./basic-field-renderer"
import { FlexibleBlocksField } from "./flexible-blocks"

type FieldRendererProps = {
	field: Field
	path: string
	value: any
	onChange: (path: string, value: any) => void
	onAddRepeaterItem?: (path: string) => void
	onRemoveRepeaterItem?: (path: string, index: number) => void
	level?: number
	allSchemas?: any[]
	contentBySchema?: Record<string, any[]>
}

export function FieldRenderer({
	field,
	path,
	value,
	onChange,
	onAddRepeaterItem,
	onRemoveRepeaterItem,
	level = 0,
	allSchemas,
	contentBySchema,
}: FieldRendererProps) {
	// Handle group fields
	if (field.type === "group") {
		return (
			<div
				data-field-path={field.name}
				className="rounded-lg border-2 border-grey-200 bg-grey-50 p-4 transition-all duration-200"
				style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
			>
				<div className="mb-4 flex items-center gap-2">
					<Folder className="h-5 w-5 text-primary" />
					<h3 className="font-semibold text-grey-900 text-lg">{field.label}</h3>
					<span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
						Group
					</span>
				</div>
				{field.helpText && (
					<p className="mb-4 text-grey-500 text-sm">{field.helpText}</p>
				)}
				<div className="space-y-4">
					{field.fields?.map((nestedField) => {
						const nestedPath = `${path}.${nestedField.name}`
						const nestedValue = getNestedValue(value || {}, nestedPath)
						return (
							<FieldRenderer
								key={nestedField.name}
								field={nestedField}
								path={nestedPath}
								value={nestedValue}
								onChange={onChange}
								onAddRepeaterItem={onAddRepeaterItem}
								onRemoveRepeaterItem={onRemoveRepeaterItem}
								level={level + 1}
								allSchemas={allSchemas}
								contentBySchema={contentBySchema}
							/>
						)
					})}
				</div>
			</div>
		)
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
		// Load the referenced block
		const block = useQuery(api.cms.blocks.get, {
			id: field.blockId as Id<"cmsBlocks">,
		})

		if (!block) {
			return (
				<div
					className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4"
					style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
				>
					<div className="mb-4 flex items-center gap-2">
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
		const blockValue = value || {}

		return (
			<div
				className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4"
				style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
			>
				<div className="mb-4 flex items-center gap-2">
					<Layers className="h-5 w-5 text-blue-600" />
					<h3 className="font-semibold text-grey-900 text-lg">{field.label}</h3>
					<span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-600 text-xs">
						Block: {block.displayName}
					</span>
					{field.required && <span className="text-error text-sm">*</span>}
				</div>
				{field.helpText && (
					<p className="mb-4 text-grey-500 text-sm">{field.helpText}</p>
				)}
				<div className="space-y-4 rounded-lg border border-blue-300 bg-white p-4">
					{block.fields.map((blockField: Field) => {
						const blockFieldPath = `${path}.${blockField.name}`
						const blockFieldValue = blockValue[blockField.name]
						return (
							<FieldRenderer
								key={blockField.name}
								field={blockField}
								path={blockFieldPath}
								value={blockFieldValue}
								onChange={onChange}
								onAddRepeaterItem={onAddRepeaterItem}
								onRemoveRepeaterItem={onRemoveRepeaterItem}
								level={level + 1}
								allSchemas={allSchemas}
								contentBySchema={contentBySchema}
							/>
						)
					})}
				</div>
			</div>
		)
	}

	// Handle repeater fields
	if (field.type === "repeater") {
		const items = (value || []) as any[]

		return (
			<div
				data-field-path={field.name}
				className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 transition-all duration-200"
				style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
			>
				<div className="mb-4 flex items-center justify-between">
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
					<p className="mb-4 text-grey-500 text-sm">{field.helpText}</p>
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
								className="rounded-lg border border-grey-300 bg-white p-4 shadow-sm"
							>
								<div className="mb-3 flex items-center justify-between">
									<h4 className="font-medium text-grey-700 text-sm">
										Item #{index + 1}
									</h4>
									<button
										type="button"
										onClick={() => onRemoveRepeaterItem?.(path, index)}
										className="text-error transition-colors hover:text-error/80"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
								<div className="space-y-4">
									{field.fields?.map((nestedField) => {
										const nestedPath = `${path}[${index}].${nestedField.name}`
										const nestedValue = item?.[nestedField.name]
										return (
											<FieldRenderer
												key={`${nestedField.name}-${index}`}
												field={nestedField}
												path={nestedPath}
												value={nestedValue}
												onChange={onChange}
												onAddRepeaterItem={onAddRepeaterItem}
												onRemoveRepeaterItem={onRemoveRepeaterItem}
												level={level + 1}
												allSchemas={allSchemas}
												contentBySchema={contentBySchema}
											/>
										)
									})}
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
			style={{ marginLeft: level > 0 ? `${level}rem` : "0" }}
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
			/>
			{field.helpText && (
				<p className="mt-1 text-grey-400 text-xs">{field.helpText}</p>
			)}
		</div>
	)
}

