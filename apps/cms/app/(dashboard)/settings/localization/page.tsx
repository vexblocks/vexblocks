"use client"

import { api } from "@repo/backend/convex/_generated/api"
import { useMutation } from "convex/react"
import {
	AlertTriangle,
	ArrowLeft,
	Globe,
	Plus,
	Save,
	Star,
	Trash2,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useCachedQuery } from "@/lib/use-cached-query"

type Locale = {
	code: string
	name: string
	isDefault: boolean
}

type LocalizationSettings = {
	enabled: boolean
	locales: Locale[]
	defaultLocale: string
}

// Common locale options for quick selection
const COMMON_LOCALES = [
	{ code: "en", name: "English" },
	{ code: "es", name: "Español" },
	{ code: "fr", name: "Français" },
	{ code: "de", name: "Deutsch" },
	{ code: "it", name: "Italiano" },
	{ code: "pt", name: "Português" },
	{ code: "nl", name: "Nederlands" },
	{ code: "pl", name: "Polski" },
	{ code: "ru", name: "Русский" },
	{ code: "ja", name: "日本語" },
	{ code: "ko", name: "한국어" },
	{ code: "zh", name: "中文" },
	{ code: "ar", name: "العربية" },
]

export default function LocalizationSettingsPage() {
	// Use cached query
	const { data: settings } = useCachedQuery(api.cms.settings.get, {
		key: "localization",
	})
	const updateSettings = useMutation(api.cms.settings.update)

	const [locales, setLocales] = useState<Locale[]>([])
	const [defaultLocale, setDefaultLocale] = useState<string>("")
	const [loading, setLoading] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
		null,
	)

	// New locale form
	const [newLocaleCode, setNewLocaleCode] = useState("")
	const [newLocaleName, setNewLocaleName] = useState("")
	const [showAddForm, setShowAddForm] = useState(false)

	// Initialize from settings
	useEffect(() => {
		if (settings) {
			const localizationSettings = settings as LocalizationSettings
			setLocales(localizationSettings.locales || [])
			setDefaultLocale(localizationSettings.defaultLocale || "")
		}
	}, [settings])

	const handleAddLocale = () => {
		if (!newLocaleCode.trim() || !newLocaleName.trim()) {
			toast.error("Please enter both locale code and name")
			return
		}

		// Check for duplicates
		if (locales.some((l) => l.code === newLocaleCode.trim().toLowerCase())) {
			toast.error("This locale code already exists")
			return
		}

		const newLocale: Locale = {
			code: newLocaleCode.trim().toLowerCase(),
			name: newLocaleName.trim(),
			isDefault: locales.length === 0, // First locale is default
		}

		const updatedLocales = [...locales, newLocale]
		setLocales(updatedLocales)

		// Set as default if it's the first locale
		if (updatedLocales.length === 1) {
			setDefaultLocale(newLocale.code)
		}

		// Reset form
		setNewLocaleCode("")
		setNewLocaleName("")
		setShowAddForm(false)

		toast.success(`Added ${newLocale.name} (${newLocale.code})`)
	}

	const handleRemoveLocale = (code: string) => {
		const updatedLocales = locales.filter((l) => l.code !== code)
		setLocales(updatedLocales)

		// If we removed the default locale, set a new default
		if (defaultLocale === code && updatedLocales.length > 0) {
			setDefaultLocale(updatedLocales[0].code)
		} else if (updatedLocales.length === 0) {
			setDefaultLocale("")
		}

		setShowDeleteConfirm(null)
		toast.success("Locale removed")
	}

	const handleSetDefault = (code: string) => {
		setDefaultLocale(code)
		setLocales(
			locales.map((l) => ({
				...l,
				isDefault: l.code === code,
			})),
		)
	}

	const handleQuickAdd = (locale: { code: string; name: string }) => {
		if (locales.some((l) => l.code === locale.code)) {
			toast.error("This locale already exists")
			return
		}

		const newLocale: Locale = {
			...locale,
			isDefault: locales.length === 0,
		}

		const updatedLocales = [...locales, newLocale]
		setLocales(updatedLocales)

		if (updatedLocales.length === 1) {
			setDefaultLocale(locale.code)
		}

		toast.success(`Added ${locale.name}`)
	}

	const handleSave = async () => {
		setLoading(true)

		try {
			const localizationSettings: LocalizationSettings = {
				enabled: locales.length > 0,
				locales: locales.map((l) => ({
					...l,
					isDefault: l.code === defaultLocale,
				})),
				defaultLocale,
			}

			await updateSettings({
				key: "localization",
				value: localizationSettings,
			})

			toast.success("Localization settings saved")
		} catch (error) {
			toast.error("Failed to save settings")
			console.error(error)
		} finally {
			setLoading(false)
		}
	}

	const availableQuickLocales = COMMON_LOCALES.filter(
		(cl) => !locales.some((l) => l.code === cl.code),
	)

	return (
		<div className="mx-auto max-w-4xl">
			{/* Header */}
			<div className="mb-6">
				<Link
					href="/settings"
					className="mb-4 inline-flex items-center gap-2 text-grey-500 hover:text-primary"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Settings
				</Link>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold text-3xl text-primary">Localization</h1>
						<p className="mt-2 text-grey-500">
							Configure languages for your content
						</p>
					</div>
					<button
						type="button"
						onClick={handleSave}
						disabled={loading}
						className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
					>
						<Save className="h-4 w-4" />
						{loading ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</div>

			{/* Info Banner */}
			{locales.length === 0 && (
				<div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
					<div className="flex items-start gap-3">
						<Globe className="mt-0.5 h-5 w-5 text-blue-600" />
						<div>
							<h4 className="font-semibold text-blue-900">
								No locales configured
							</h4>
							<p className="mt-1 text-blue-700 text-sm">
								Your CMS currently operates in single-language mode. Add locales
								below to enable multi-language content. Fields marked as
								"translatable" in your schemas will support multiple languages.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Current Locales */}
			<div className="mb-6 rounded-lg bg-white p-6 shadow">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-semibold text-grey-900 text-lg">
						Active Locales
					</h2>
					<button
						type="button"
						onClick={() => setShowAddForm(true)}
						className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-primary text-sm transition-colors hover:bg-primary/20"
					>
						<Plus className="h-4 w-4" />
						Add Custom Locale
					</button>
				</div>

				{locales.length === 0 ? (
					<div className="rounded-lg border-2 border-grey-200 border-dashed p-8 text-center">
						<Globe className="mx-auto mb-3 h-12 w-12 text-grey-300" />
						<p className="text-grey-500">
							No locales added yet. Add a locale to enable multi-language
							content.
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{locales.map((locale) => (
							<div
								key={locale.code}
								className={`flex items-center justify-between rounded-lg border p-4 ${
									locale.code === defaultLocale
										? "border-primary bg-primary/5"
										: "border-grey-200"
								}`}
							>
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-grey-100 font-mono font-semibold text-grey-700 text-sm uppercase">
										{locale.code}
									</div>
									<div>
										<div className="flex items-center gap-2">
											<span className="font-medium text-grey-900">
												{locale.name}
											</span>
											{locale.code === defaultLocale && (
												<span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs">
													<Star className="h-3 w-3" />
													Default
												</span>
											)}
										</div>
										<span className="text-grey-500 text-sm">{locale.code}</span>
									</div>
								</div>
								<div className="flex items-center gap-2">
									{locale.code !== defaultLocale && (
										<button
											type="button"
											onClick={() => handleSetDefault(locale.code)}
											className="rounded-lg border border-grey-300 px-3 py-1.5 text-grey-700 text-sm transition-colors hover:bg-grey-50"
										>
											Set as Default
										</button>
									)}
									<button
										type="button"
										onClick={() => setShowDeleteConfirm(locale.code)}
										className="rounded-lg p-2 text-grey-500 transition-colors hover:bg-red-50 hover:text-red-600"
										title="Remove locale"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Quick Add */}
			{availableQuickLocales.length > 0 && (
				<div className="mb-6 rounded-lg bg-white p-6 shadow">
					<h2 className="mb-4 font-semibold text-grey-900 text-lg">
						Quick Add Common Locales
					</h2>
					<div className="flex flex-wrap gap-2">
						{availableQuickLocales.map((locale) => (
							<button
								key={locale.code}
								type="button"
								onClick={() => handleQuickAdd(locale)}
								className="flex items-center gap-2 rounded-lg border border-grey-200 px-3 py-2 text-sm transition-colors hover:border-primary hover:bg-primary/5"
							>
								<span className="font-mono text-grey-500 text-xs uppercase">
									{locale.code}
								</span>
								<span className="text-grey-700">{locale.name}</span>
							</button>
						))}
					</div>
				</div>
			)}

			{/* Add Custom Locale Modal */}
			{showAddForm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
						<h3 className="mb-4 font-semibold text-grey-900 text-lg">
							Add Custom Locale
						</h3>
						<div className="space-y-4">
							<div>
								<label
									htmlFor="locale-code"
									className="mb-1 block font-medium text-grey-700 text-sm"
								>
									Locale Code <span className="text-red-500">*</span>
								</label>
								<input
									id="locale-code"
									type="text"
									value={newLocaleCode}
									onChange={(e) =>
										setNewLocaleCode(e.target.value.toLowerCase())
									}
									placeholder="e.g., en-US, pt-BR"
									className="w-full rounded-lg border border-grey-300 px-3 py-2 text-sm"
									maxLength={10}
								/>
								<p className="mt-1 text-grey-500 text-xs">
									Use ISO 639-1 codes (e.g., en, es, fr) or with region (e.g.,
									en-US, pt-BR)
								</p>
							</div>
							<div>
								<label
									htmlFor="locale-name"
									className="mb-1 block font-medium text-grey-700 text-sm"
								>
									Display Name <span className="text-red-500">*</span>
								</label>
								<input
									id="locale-name"
									type="text"
									value={newLocaleName}
									onChange={(e) => setNewLocaleName(e.target.value)}
									placeholder="e.g., English (US), Português (Brasil)"
									className="w-full rounded-lg border border-grey-300 px-3 py-2 text-sm"
								/>
							</div>
						</div>
						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								onClick={() => {
									setShowAddForm(false)
									setNewLocaleCode("")
									setNewLocaleName("")
								}}
								className="rounded-lg border border-grey-300 px-4 py-2 text-grey-700 text-sm transition-colors hover:bg-grey-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleAddLocale}
								className="rounded-lg bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary/90"
							>
								Add Locale
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
						<div className="mb-4 flex items-center gap-3">
							<div className="rounded-full bg-red-100 p-2">
								<AlertTriangle className="h-5 w-5 text-red-600" />
							</div>
							<h3 className="font-semibold text-grey-900 text-lg">
								Remove Locale?
							</h3>
						</div>
						<p className="mb-6 text-grey-600">
							Are you sure you want to remove this locale? Existing translations
							for this locale will remain in the database but won't be editable
							until the locale is re-added.
						</p>
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(null)}
								className="rounded-lg border border-grey-300 px-4 py-2 text-grey-700 text-sm transition-colors hover:bg-grey-50"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => handleRemoveLocale(showDeleteConfirm)}
								className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
							>
								Remove Locale
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Help Section */}
			<div className="rounded-lg border border-grey-200 bg-grey-50 p-6">
				<h3 className="mb-2 font-semibold text-grey-900">
					How Localization Works
				</h3>
				<ul className="space-y-2 text-grey-600 text-sm">
					<li className="flex items-start gap-2">
						<span className="mt-1 text-primary">•</span>
						<span>
							When you add locales, fields marked as "translatable" in your
							schemas can have different values per language.
						</span>
					</li>
					<li className="flex items-start gap-2">
						<span className="mt-1 text-primary">•</span>
						<span>
							Non-translatable fields (like dates, numbers, references) remain
							the same across all locales.
						</span>
					</li>
					<li className="flex items-start gap-2">
						<span className="mt-1 text-primary">•</span>
						<span>
							The default locale is used as a fallback when a translation is
							missing.
						</span>
					</li>
					<li className="flex items-start gap-2">
						<span className="mt-1 text-primary">•</span>
						<span>
							If no locales are configured, the CMS works in single-language
							mode (no changes to existing behavior).
						</span>
					</li>
				</ul>
			</div>
		</div>
	)
}
