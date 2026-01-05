"use client"

import { CFImage } from "@repo/cms-shared"
import { X } from "lucide-react"

type BlockPreviewModalProps = {
	isOpen: boolean
	onClose: () => void
	blockDisplayName: string
	previewImageId: string
}

export function BlockPreviewModal({
	isOpen,
	onClose,
	blockDisplayName,
	previewImageId,
}: BlockPreviewModalProps) {
	if (!isOpen) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose()
			}}
			role="button"
			tabIndex={0}
		>
			<div
				role="dialog"
				aria-modal="true"
				className="relative max-h-[95vh] w-full max-w-6xl overflow-auto rounded-lg bg-white shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="sticky top-0 z-10 flex items-center justify-between border-grey-200 border-b bg-white px-4 py-3">
					<div>
						<h3 className="font-semibold text-grey-900 text-lg">
							{blockDisplayName}
						</h3>
						<p className="text-grey-500 text-sm">Block Preview</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-2 text-grey-500 transition-colors hover:bg-grey-100"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
				<div className="max-h-[80vh] p-6">
					<CFImage
						assetId={previewImageId}
						alt={blockDisplayName}
						width={1600}
						height={1200}
						variant="public"
						className="h-auto max-h-[60vh] w-full rounded-lg object-contain"
					/>
				</div>
			</div>
		</div>
	)
}
