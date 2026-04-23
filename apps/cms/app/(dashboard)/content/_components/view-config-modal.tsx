"use client"

import { useMutation } from "convex/react"
import { Check, X } from "lucide-react"
import { useState } from "react"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"

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
				<div className="flex items-center justify-between border-b border-grey-200 p-6">
					<div>
						<h2 className="text-xl font-semibold text-primary">
							Configure View
						</h2>
						<p className="mt-1 text-sm text-grey-500">
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
							<p className="text-sm text-error">{error}</p>
						</div>
					)}

					<div className="space-y-6">
						{/* Preview Field */}
						<div>
							<label
								htmlFor="preview-field"
								className="text-grey-700 mb-2 block text-sm font-medium"
							>
								Main Preview Field
							</label>
							<p className="mb-3 text-sm text-grey-500">
								Select which field to display in the main content column
							</p>
							<select
								id="preview-field"
								value={previewField}
								onChange={(e) => setPreviewField(e.target.value)}
								className="text-grey-700 w-full rounded-lg border border-grey-300 px-4 py-2 transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
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
							<div className="text-grey-700 mb-2 block text-sm font-medium">
								Additional Columns
							</div>
							<p className="mb-3 text-sm text-grey-500">
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
														? "bg-grey-50 border-grey-200 opacity-50"
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
												<div className="text-grey-900 text-sm font-medium">
													{field.label}
												</div>
												<div className="text-xs text-grey-500">
													{field.name} • {field.type}
												</div>
											</div>
										</button>
									)
								})}
							</div>
							{additionalFields.length >= 3 && (
								<p className="mt-2 text-xs text-orange">
									Maximum of 3 additional fields reached
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 border-t border-grey-200 p-6">
					<button
						type="button"
						onClick={onClose}
						className="text-grey-700 rounded-lg border border-grey-300 px-6 py-2 transition-colors hover:bg-grey-100"
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
