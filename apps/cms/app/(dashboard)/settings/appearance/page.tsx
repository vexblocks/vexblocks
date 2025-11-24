"use client"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { CFImage } from "@repo/cms-shared/src"
import { useMutation, useQuery } from "convex/react"
import {
	Check,
	ChevronLeft,
	Image as ImageIcon,
	Loader2,
	Upload,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { MediaGallery } from "../../media/_components/media-gallery"
import { MediaUploader } from "../../media/_components/media-uploader"

export default function AppearanceSettingsPage() {
	const settings = useQuery(api.settings.getPublic, { key: "appearance" })
	const updateSettings = useMutation(api.settings.update)

	const [dashboardName, setDashboardName] = useState("VexBlocks")
	const [primaryColor, setPrimaryColor] = useState("#d60032") // Default red-600
	const [logoId, setLogoId] = useState<Id<"cmsMedia"> | null>(null)
	const [showMediaPicker, setShowMediaPicker] = useState(false)
	const [showUploader, setShowUploader] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	// Load settings when available
	useEffect(() => {
		if (settings) {
			if (settings.dashboardName) setDashboardName(settings.dashboardName)
			if (settings.primaryColor) setPrimaryColor(settings.primaryColor)
			if (settings.logoId) setLogoId(settings.logoId)
		}
	}, [settings])

	// Fetch logo media details if logoId is set
	const logoMedia = useQuery(
		api.cms.media.getPublic,
		logoId ? { id: logoId } : "skip",
	)

	const handleSave = async () => {
		setIsSaving(true)
		try {
			await updateSettings({
				key: "appearance",
				value: {
					dashboardName,
					primaryColor,
					logoId,
				},
			})
			toast.success("Appearance settings saved successfully")
		} catch (error) {
			console.error("Failed to save settings:", error)
			toast.error("Failed to save settings")
		} finally {
			setIsSaving(false)
		}
	}

	if (settings === undefined) {
		return (
			<div className="flex h-96 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-4xl">
			{/* Header */}
			<div className="mb-8">
				<Link
					href="/settings"
					className="mb-4 inline-flex items-center gap-2 text-grey-500 text-sm hover:text-primary"
				>
					<ChevronLeft className="h-4 w-4" />
					Back to Settings
				</Link>
				<h1 className="font-bold text-3xl">Appearance</h1>
				<p className="mt-2 text-grey-500">
					Customize the look and feel of your admin dashboard
				</p>
			</div>

			<div className="space-y-8">
				{/* Branding Section */}
				<section className="rounded-lg border border-grey-200 bg-white p-6 shadow-sm">
					<h2 className="mb-6 font-semibold text-grey-900 text-xl">Branding</h2>

					<div className="space-y-6">
						{/* Dashboard Name */}
						<div>
							<label
								htmlFor="dashboard-name"
								className="mb-2 block font-medium text-grey-700 text-sm"
							>
								Dashboard Name
							</label>
							<input
								id="dashboard-name"
								type="text"
								value={dashboardName}
								onChange={(e) => setDashboardName(e.target.value)}
								placeholder="e.g. My Company CMS"
								className="w-full max-w-md rounded-lg border border-grey-300 px-4 py-2 text-grey-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							/>
							<p className="mt-1 text-grey-500 text-xs">
								This name will be displayed in the sidebar and browser tab.
							</p>
						</div>

						{/* Logo */}
						<div>
							<p className="mb-2 block font-medium text-grey-700 text-sm">
								Dashboard Logo
							</p>
							<div className="flex items-start gap-6">
								<div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-grey-200 bg-grey-50">
									{logoMedia ? (
										<CFImage
											assetId={logoMedia.cloudflareId}
											alt="Dashboard Logo"
											fill
											className="object-contain p-2"
										/>
									) : (
										<ImageIcon className="h-10 w-10 text-grey-300" />
									)}{" "}
								</div>
								<div className="flex flex-col gap-3">
									<button
										type="button"
										onClick={() => setShowMediaPicker(true)}
										className="inline-flex items-center gap-2 rounded-lg border border-grey-300 bg-white px-4 py-2 text-grey-700 text-sm hover:bg-grey-50"
									>
										<ImageIcon className="h-4 w-4" />
										Select from Media
									</button>
									<button
										type="button"
										onClick={() => setShowUploader(true)}
										className="inline-flex items-center gap-2 rounded-lg border border-grey-300 bg-white px-4 py-2 text-grey-700 text-sm hover:bg-grey-50"
									>
										<Upload className="h-4 w-4" />
										Upload New
									</button>
									{logoId && (
										<button
											type="button"
											onClick={() => setLogoId(null)}
											className="text-left text-error text-sm hover:underline"
										>
											Remove Logo
										</button>
									)}
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Theme Section */}
				<section className="rounded-lg border border-grey-200 bg-white p-6 shadow-sm">
					<h2 className="mb-6 font-semibold text-grey-900 text-xl">Theme</h2>

					<div>
						<label
							htmlFor="primary-color"
							className="mb-2 block font-medium text-grey-700 text-sm"
						>
							Primary Color
						</label>
						<div className="flex items-center gap-4">
							<input
								id="primary-color"
								type="color"
								value={primaryColor}
								onChange={(e) => setPrimaryColor(e.target.value)}
								className="h-10 w-20 cursor-pointer rounded border border-grey-300 p-1"
							/>
							<input
								type="text"
								value={primaryColor}
								onChange={(e) => setPrimaryColor(e.target.value)}
								className="w-32 rounded-lg border border-grey-300 px-3 py-2 text-grey-900 uppercase focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
							/>
						</div>
						<p className="mt-1 text-grey-500 text-xs">
							This color will be used for buttons, links, and active states.
						</p>
					</div>
				</section>

				{/* Save Button */}
				<div className="flex justify-end">
					<button
						type="button"
						onClick={handleSave}
						disabled={isSaving}
						className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-primary-800 disabled:opacity-50"
					>
						{isSaving ? (
							<Loader2 className="h-5 w-5 animate-spin" />
						) : (
							<Check className="h-5 w-5" />
						)}
						{isSaving ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</div>

			{/* Media Picker Dialog */}
			{showMediaPicker && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="flex h-[80vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl">
						<div className="flex items-center justify-between border-grey-200 border-b p-4">
							<h3 className="font-semibold text-lg">Select Logo</h3>
							<button
								type="button"
								onClick={() => setShowMediaPicker(false)}
								className="text-grey-500 hover:text-grey-700"
							>
								Close
							</button>
						</div>
						<div className="flex-1 overflow-y-auto p-6">
							<MediaGallery
								selectionMode
								onSelect={(media) => {
									setLogoId(media.id)
									setShowMediaPicker(false)
								}}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Uploader Dialog */}
			{showUploader && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
						<h2 className="mb-4 font-semibold text-lg">Upload Logo</h2>
						<MediaUploader
							onUploadComplete={(media) => {
								setShowUploader(false)
								setLogoId(media.id)
								toast.success("Logo uploaded and selected")
							}}
							onCancel={() => setShowUploader(false)}
							showInline
						/>
					</div>
				</div>
			)}
		</div>
	)
}
