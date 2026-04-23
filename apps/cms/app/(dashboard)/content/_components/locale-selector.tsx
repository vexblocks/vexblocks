"use client"

import { Globe } from "lucide-react"
import type { Locale } from "./types"

type LocaleSelectorProps = {
	locales: Locale[]
	currentLocale: string
	onChange: (locale: string) => void
	defaultLocale: string
}

export function LocaleSelector({
	locales,
	currentLocale,
	onChange,
	defaultLocale,
}: LocaleSelectorProps) {
	if (locales.length === 0) {
		return null
	}

	return (
		<div className="flex items-center gap-2 rounded-lg border border-grey-200 bg-white p-1">
			<Globe className="ml-2 h-4 w-4 text-grey-400" />
			{locales.map((locale) => (
				<button
					key={locale.code}
					type="button"
					onClick={() => onChange(locale.code)}
					className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
						currentLocale === locale.code
							? "bg-primary text-white"
							: "text-grey-600 hover:bg-grey-100"
					}`}
				>
					<span className="flex items-center gap-1.5">
						<span className="font-mono text-xs uppercase opacity-70">
							{locale.code}
						</span>
						{locale.code === defaultLocale && (
							<span
								className={`h-1.5 w-1.5 rounded-full ${
									currentLocale === locale.code ? "bg-white" : "bg-primary"
								}`}
								title="Default locale"
							/>
						)}
					</span>
				</button>
			))}
		</div>
	)
}
