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
import { useSidebar } from "@/contexts/sidebar-context"
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
 * Supports collapsed mode with icon-only view and hover tooltips
 */
export function DashboardSidenav({ isOpen, onClose }: DashboardSidenavProps) {
	const router = useRouter()
	const [authState] = useAtom(authAtom)
	const { isCollapsed } = useSidebar()
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
			className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-xl transition-all duration-300 ease-in-out lg:translate-x-0 ${
				isOpen ? "translate-x-0" : "-translate-x-full"
			} ${isCollapsed ? "lg:w-[72px]" : "w-64"}`}
		>
			{/* Logo */}
			<div
				className={`flex items-center border-grey-200 border-b py-4.5 ${
					isCollapsed ? "justify-center px-3" : "gap-3 px-6"
				}`}
			>
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
				{!isCollapsed && (
					<div>
						<h2 className="font-bold text-grey-900 text-xl">
							{settings?.dashboardName || "VexBlocks"}
						</h2>
						<p className="text-grey-500 text-xs">Headless CMS</p>
					</div>
				)}
			</div>

			{/* Navigation Links - flex-1 makes it take available space */}
			<nav
				className={`flex-1 space-y-1 overflow-y-auto ${isCollapsed ? "p-2" : "p-4"}`}
			>
				{navItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className={`group relative flex items-center rounded-lg text-grey-700 transition-all hover:bg-primary/5 hover:text-primary ${
							isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
						}`}
						onClick={onClose}
						title={isCollapsed ? item.label : undefined}
					>
						<item.icon className="h-5 w-5 shrink-0" />
						{!isCollapsed && <span className="font-medium">{item.label}</span>}
						{/* Tooltip on hover when collapsed */}
						{isCollapsed && (
							<div className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-lg bg-grey-900 px-3 py-2 font-medium text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100">
								{item.label}
								{/* Arrow */}
								<div className="-left-1 -translate-y-1/2 absolute top-1/2 border-8 border-transparent border-r-grey-900" />
							</div>
						)}
					</Link>
				))}
			</nav>

			{/* User Section with Logout - Always at bottom */}
			<div
				className={`mt-auto border-grey-200 border-t ${isCollapsed ? "p-2" : "p-4"}`}
			>
				{!isCollapsed && (
					<div className="mb-3 rounded-lg bg-grey-50 p-3">
						<p className="font-medium text-grey-500 text-xs">Signed in as</p>
						<p className="truncate font-semibold text-grey-900 text-sm">
							{currentUser.name || currentUser.email}
						</p>
					</div>
				)}
				<button
					type="button"
					onClick={handleLogout}
					className={`group relative flex w-full cursor-pointer items-center rounded-lg text-grey-700 transition-all hover:bg-grey-100 ${
						isCollapsed ? "justify-center p-3" : "gap-2 p-2 pl-2.5"
					}`}
					title={isCollapsed ? "Sign Out" : undefined}
				>
					<LogOut className="h-4 w-4 shrink-0" />
					{!isCollapsed && (
						<span className="font-medium text-sm">Sign Out</span>
					)}
					{/* Tooltip on hover when collapsed */}
					{isCollapsed && (
						<div className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-lg bg-grey-900 px-3 py-2 font-medium text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100">
							Sign Out
							<div className="-left-1 -translate-y-1/2 absolute top-1/2 border-8 border-transparent border-r-grey-900" />
						</div>
					)}
				</button>
			</div>
		</aside>
	)
}
