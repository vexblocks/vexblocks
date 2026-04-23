"use client"

import { useMutation } from "convex/react"
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
import { usePublicCachedQuery } from "@/lib/use-cached-query"
import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { CFImage } from "@repo/cms-shared/src"
import { MediaGallery } from "../../media/_components/media-gallery"
import { MediaUploader } from "../../media/_components/media-uploader"

export default function AppearanceSettingsPage() {
	// Use cached queries
	const { data: settings, isPending: settingsLoading } = usePublicCachedQuery(
		api.cms.settings.getPublic,
		{ key: "appearance" },
	)
	const updateSettings = useMutation(api.cms.settings.update)

	const [dashboardName, setDashboardName] = useState("VexBlocks")
	const [primaryColor, setPrimaryColor] = useState("#3b82f6") // Default blue-500
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
	const { data: logoMedia } = usePublicCachedQuery(
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

	// Show loading only on initial load
	if (settingsLoading && !settings) {
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
					className="mb-4 inline-flex items-center gap-2 text-sm text-grey-500 hover:text-primary"
				>
					<ChevronLeft className="h-4 w-4" />
					Back to Settings
				</Link>
				<h1 className="text-3xl font-bold text-primary">Appearance</h1>
				<p className="mt-2 text-grey-500">
					Customize the look and feel of your admin dashboard
				</p>
			</div>

			<div className="space-y-8">
				{/* Branding Section */}
				<section className="rounded-lg border border-grey-200 bg-white p-6 shadow-sm">
					<h2 className="text-grey-900 mb-6 text-xl font-semibold">Branding</h2>

					<div className="space-y-6">
						{/* Dashboard Name */}
						<div>
							<label
								htmlFor="dashboard-name"
								className="text-grey-700 mb-2 block text-sm font-medium"
							>
								Dashboard Name
							</label>
							<input
								id="dashboard-name"
								type="text"
								value={dashboardName}
								onChange={(e) => setDashboardName(e.target.value)}
								placeholder="e.g. My Company CMS"
								className="text-grey-900 w-full max-w-md rounded-lg border border-grey-300 px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
							/>
							<p className="mt-1 text-xs text-grey-500">
								This name will be displayed in the sidebar and browser tab.
							</p>
						</div>

						{/* Logo */}
						<div>
							<p className="text-grey-700 mb-2 block text-sm font-medium">
								Dashboard Logo
							</p>
							<div className="flex items-start gap-6">
								<div className="bg-grey-50 relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-grey-200">
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
										className="text-grey-700 hover:bg-grey-50 inline-flex items-center gap-2 rounded-lg border border-grey-300 bg-white px-4 py-2 text-sm"
									>
										<ImageIcon className="h-4 w-4" />
										Select from Media
									</button>
									<button
										type="button"
										onClick={() => setShowUploader(true)}
										className="text-grey-700 hover:bg-grey-50 inline-flex items-center gap-2 rounded-lg border border-grey-300 bg-white px-4 py-2 text-sm"
									>
										<Upload className="h-4 w-4" />
										Upload New
									</button>
									{logoId && (
										<button
											type="button"
											onClick={() => setLogoId(null)}
											className="text-left text-sm text-error hover:underline"
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
					<h2 className="text-grey-900 mb-6 text-xl font-semibold">Theme</h2>

					<div>
						<label
							htmlFor="primary-color"
							className="text-grey-700 mb-2 block text-sm font-medium"
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
								className="text-grey-900 w-32 rounded-lg border border-grey-300 px-3 py-2 uppercase focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
							/>
						</div>
						<p className="mt-1 text-xs text-grey-500">
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
						<div className="flex items-center justify-between border-b border-grey-200 p-4">
							<h3 className="text-lg font-semibold text-primary">
								Select Logo
							</h3>
							<button
								type="button"
								onClick={() => setShowMediaPicker(false)}
								className="hover:text-grey-700 text-grey-500"
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
						<h2 className="mb-4 text-lg font-semibold text-primary">
							Upload Logo
						</h2>
						<MediaUploader
							onUploadComplete={(media) => {
								setShowUploader(false)
								if (media) {
									setLogoId(media.id)
									toast.success("Logo uploaded and selected")
								}
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
