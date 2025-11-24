"use client"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { useMutation } from "convex/react"
import { Check, X } from "lucide-react"
import { useState } from "react"

type Schema = {
	_id: string
	name: string
	displayName: string
	type: string
	fields: Array<{
		name: string
		label: string
		type: string
	}>
	viewConfig?: {
		previewField?: string
		additionalFields?: string[]
	}
}

type ViewConfigModalProps = {
	schema: Schema
	onClose: () => void
}

export function ViewConfigModal({ schema, onClose }: ViewConfigModalProps) {
	const updateSchema = useMutation(api.cms.schemas.update)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")

	const [previewField, setPreviewField] = useState(
		schema.viewConfig?.previewField || "",
	)
	const [additionalFields, setAdditionalFields] = useState<string[]>(
		schema.viewConfig?.additionalFields || [],
	)

	// Get displayable fields (exclude certain types)
	const displayableFields = schema.fields.filter(
		(f) =>
			f.type !== "richText" &&
			f.type !== "flexibleBlocks" &&
			f.type !== "repeater" &&
			f.type !== "group",
	)

	const toggleAdditionalField = (fieldName: string) => {
		if (additionalFields.includes(fieldName)) {
			setAdditionalFields(additionalFields.filter((f) => f !== fieldName))
		} else {
			// Limit to 3 additional fields
			if (additionalFields.length < 3) {
				setAdditionalFields([...additionalFields, fieldName])
			}
		}
	}

	const handleSave = async () => {
		setLoading(true)
		setError("")

		try {
			await updateSchema({
				id: schema._id as Id<"cmsSchemas">,
				viewConfig: {
					previewField: previewField || undefined,
					additionalFields:
						additionalFields.length > 0 ? additionalFields : undefined,
				},
			})
			onClose()
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to save configuration",
			)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-grey-200 border-b p-6">
					<div>
						<h2 className="font-semibold text-primary text-xl">
							Configure View
						</h2>
						<p className="mt-1 text-grey-500 text-sm">
							Customize how {schema.displayName} content is displayed
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-2 text-grey-500 transition-colors hover:bg-grey-100"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Body */}
				<div className="max-h-[60vh] overflow-y-auto p-6">
					{error && (
						<div className="mb-4 rounded-lg bg-red-50 p-4">
							<p className="text-error text-sm">{error}</p>
						</div>
					)}

					<div className="space-y-6">
						{/* Preview Field */}
						<div>
							<label
								htmlFor="preview-field"
								className="mb-2 block font-medium text-grey-700 text-sm"
							>
								Main Preview Field
							</label>
							<p className="mb-3 text-grey-500 text-sm">
								Select which field to display in the main content column
							</p>
							<select
								id="preview-field"
								value={previewField}
								onChange={(e) => setPreviewField(e.target.value)}
								className="w-full rounded-lg border border-grey-300 px-4 py-2 text-grey-700 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							>
								<option value="">Auto (first text field)</option>
								{displayableFields.map((field) => (
									<option key={field.name} value={field.name}>
										{field.label} ({field.type})
									</option>
								))}
							</select>
						</div>

						{/* Additional Fields */}
						<div>
							<div className="mb-2 block font-medium text-grey-700 text-sm">
								Additional Columns
							</div>
							<p className="mb-3 text-grey-500 text-sm">
								Select up to 3 additional fields to show as columns (max 3)
							</p>
							<div className="space-y-2">
								{displayableFields.map((field) => {
									const isSelected = additionalFields.includes(field.name)
									const isDisabled = !isSelected && additionalFields.length >= 3

									return (
										<button
											key={field.name}
											type="button"
											onClick={() => toggleAdditionalField(field.name)}
											disabled={isDisabled}
											className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
												isSelected
													? "border-primary bg-primary/5"
													: isDisabled
														? "border-grey-200 bg-grey-50 opacity-50"
														: "border-grey-200 hover:border-grey-300"
											}`}
										>
											<div
												className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
													isSelected
														? "border-primary bg-primary"
														: "border-grey-300"
												}`}
											>
												{isSelected && <Check className="h-3 w-3 text-white" />}
											</div>
											<div className="flex-1">
												<div className="font-medium text-grey-900 text-sm">
													{field.label}
												</div>
												<div className="text-grey-500 text-xs">
													{field.name} • {field.type}
												</div>
											</div>
										</button>
									)
								})}
							</div>
							{additionalFields.length >= 3 && (
								<p className="mt-2 text-orange text-xs">
									Maximum of 3 additional fields reached
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 border-grey-200 border-t p-6">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-grey-300 px-6 py-2 text-grey-700 transition-colors hover:bg-grey-100"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={loading}
						className="rounded-lg bg-primary px-6 py-2 text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
					>
						{loading ? "Saving..." : "Save Configuration"}
					</button>
				</div>
			</div>
		</div>
	)
}
