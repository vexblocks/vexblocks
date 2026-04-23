"use client"

import {
	Bot,
	Eye,
	KeyRound,
	Languages,
	Palette,
	Settings,
	Users,
} from "lucide-react"
import Link from "next/link"

type SettingCard = {
	title: string
	description: string
	icon: React.ReactNode
	href: string
	badge?: string
}

export default function SettingsPage() {
	const settingCards: SettingCard[] = [
		{
			title: "Users",
			description: "Manage user accounts, roles, and permissions",
			icon: <Users className="h-6 w-6" />,
			href: "/settings/users",
			badge: "Admin Only",
		},
		{
			title: "Localization",
			description: "Configure languages for multi-language content",
			icon: <Languages className="h-6 w-6" />,
			href: "/settings/localization",
		},
		{
			title: "Live Preview",
			description: "Configure live preview for content editing",
			icon: <Eye className="h-6 w-6" />,
			href: "/settings/preview",
			badge: "New",
		},

		{
			title: "Appearance",
			description: "Customize the look and feel of your CMS",
			icon: <Palette className="h-6 w-6" />,
			href: "/settings/appearance",
		},
		{
			title: "AI Assistant (Beta)",
			description: "Learn how to use the AI-powered CMS assistant",
			icon: <Bot className="h-6 w-6" />,
			href: "/settings/ai-assistant",
			badge: "New",
		},
		{
			title: "API Keys",
			description: "Manage REST API keys for external integrations",
			icon: <KeyRound className="h-6 w-6" />,
			href: "/settings/api-keys",
			badge: "Admin Only",
		},
	]

	return (
		<div className="mx-auto max-w-6xl">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-primary">Settings</h1>
				<p className="mt-2 text-grey-500">
					Manage your CMS configuration and preferences
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{settingCards.map((card) => (
					<Link
						key={card.href}
						href={card.href}
						className="group relative overflow-hidden rounded-lg border border-grey-200 bg-white p-6 shadow-sm transition-all hover:border-primary hover:shadow-md"
					>
						<div className="mb-4 flex items-start justify-between">
							<div className="rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
								{card.icon}
							</div>
							{card.badge && (
								<span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
									{card.badge}
								</span>
							)}
						</div>
						<h3 className="text-grey-900 mb-2 text-lg font-semibold">
							{card.title}
						</h3>
						<p className="text-sm text-grey-500">{card.description}</p>
					</Link>
				))}
			</div>

			{/* Quick Info */}
			<div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
				<div className="flex items-start gap-3">
					<div className="rounded-full bg-blue-100 p-2">
						<Settings className="h-5 w-5 text-blue-600" />
					</div>
					<div>
						<h4 className="mb-1 font-semibold text-blue-900">
							Need Help with Settings?
						</h4>
						<p className="text-sm text-blue-700">
							Each setting is designed to give you full control over your CMS.
							Click on any card to configure specific features.
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
