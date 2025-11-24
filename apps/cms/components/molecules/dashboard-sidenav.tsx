"use client"

import { useAtom } from "@lfades/atom"
import { authClient } from "@repo/backend/better-auth/client"
import { api } from "@repo/backend/convex/_generated/api"
import { CFImage } from "@repo/cms-shared/src"
import { useQuery } from "convex/react"
import {
	FileCode,
	FileText,
	Image,
	Layers,
	LayoutDashboard,
	LogOut,
	Settings,
} from "lucide-react"
import NextImage from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authAtom } from "@/lib/auth-atom"

type NavItem = {
	href: string
	icon: React.ComponentType<{ className?: string }>
	label: string
}

const navItems: NavItem[] = [
	{ href: "/", icon: LayoutDashboard, label: "Dashboard" },
	{ href: "/schemas", icon: FileCode, label: "Schemas" },
	{ href: "/blocks", icon: Layers, label: "Blocks" },
	{ href: "/content", icon: FileText, label: "Content" },
	{ href: "/media", icon: Image, label: "Media" },
	{ href: "/settings", icon: Settings, label: "Settings" },
]

type DashboardSidenavProps = {
	isOpen: boolean
	onClose: () => void
}

/**
 * Dashboard Sidenav Component
 * Main navigation sidebar with user info and logout
 */
export function DashboardSidenav({ isOpen, onClose }: DashboardSidenavProps) {
	const router = useRouter()
	const [authState] = useAtom(authAtom)
	const settings = useQuery(api.settings.getPublic, { key: "appearance" })
	const logoId = settings?.logoId
	const logoMedia = useQuery(
		api.cms.media.getPublic,
		logoId ? { id: logoId as any } : "skip",
	)

	const currentUser = authState.user

	const handleLogout = async () => {
		try {
			// Reset atom immediately
			authAtom.set({
				user: null,
				isLoading: false,
				isInitialized: true,
			})

			// Sign out from Better Auth
			await authClient.signOut()

			// Redirect to login
			router.replace("/login")
		} catch (error) {
			console.error("Logout failed:", error)
		}
	}

	if (!currentUser) {
		return null
	}

	const _primaryColor = settings?.primaryColor || "#3b82f6"

	return (
		<aside
			className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
				isOpen ? "translate-x-0" : "-translate-x-full"
			}`}
		>
			{/* Logo */}
			<div className="flex items-center gap-3 border-grey-200 border-b px-6 py-4.5">
				{logoMedia ? (
					<CFImage
						assetId={logoMedia.cloudflareId}
						alt="Logo"
						width={32}
						height={32}
						className="object-contain"
					/>
				) : (
					<NextImage
						src="/vexblocks-logotype.png"
						alt="Logo"
						width={32}
						height={32}
						className="object-contain"
					/>
				)}
				<div>
					<h2 className="font-bold text-grey-900 text-xl">
						{settings?.dashboardName || "VexBlocks"}
					</h2>
					<p className="text-grey-500 text-xs">Headless CMS</p>
				</div>
			</div>

			{/* Navigation Links - flex-1 makes it take available space */}
			<nav className="flex-1 space-y-1 overflow-y-auto p-4">
				{navItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className="flex items-center gap-3 rounded-lg px-4 py-3 text-grey-700 transition-all hover:bg-primary/5 hover:text-primary"
						onClick={onClose}
					>
						<item.icon className="h-5 w-5" />
						<span className="font-medium">{item.label}</span>
					</Link>
				))}
			</nav>

			{/* User Section with Logout - Always at bottom */}
			<div className="mt-auto border-grey-200 border-t p-4">
				<div className="mb-3 rounded-lg bg-grey-50 p-3">
					<p className="font-medium text-grey-500 text-xs">Signed in as</p>
					<p className="truncate font-semibold text-grey-900 text-sm">
						{currentUser.name || currentUser.email}
					</p>
				</div>
				<button
					type="button"
					onClick={handleLogout}
					className="flex w-full cursor-pointer items-center gap-2 rounded-lg p-2 pl-2.5 text-grey-700 transition-all hover:bg-grey-100"
				>
					<LogOut className="h-4 w-4" />
					<span className="font-medium text-sm">Sign Out</span>
				</button>
			</div>
		</aside>
	)
}
