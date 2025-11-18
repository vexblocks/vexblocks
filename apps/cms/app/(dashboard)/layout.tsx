"use client"

import { authClient } from "@repo/backend/better-auth/client"
import { api } from "@repo/backend/convex/_generated/api"
import { useQuery } from "convex/react"
import {
	FileCode,
	FileText,
	Image as ImageIcon,
	Layers,
	LayoutDashboard,
	LogOut,
	Menu,
	Settings,
	X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AuthGuard } from "@/components/providers/auth-guard"

function DashboardContent({ children }: { children: React.ReactNode }) {
	const router = useRouter()
	const currentUser = useQuery(api.auth.getCurrentUser)
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)
	const [isLoggingOut, setIsLoggingOut] = useState(false)

	const handleLogout = async () => {
		setIsLoggingOut(true)
		try {
			await authClient.signOut()
			router.push("/login")
		} catch (error) {
			console.error("Logout failed:", error)
			setIsLoggingOut(false)
		}
	}

	const navItems = [
		{ href: "/", icon: LayoutDashboard, label: "Dashboard" },
		{ href: "/schemas", icon: FileCode, label: "Schemas" },
		{ href: "/blocks", icon: Layers, label: "Blocks" },
		{ href: "/content", icon: FileText, label: "Content" },
		{ href: "/media", icon: ImageIcon, label: "Media" },
		{ href: "/settings", icon: Settings, label: "Settings" },
	]

	// At this point, currentUser is guaranteed to be defined and have role === "admin"
	// because AuthGuard has already verified it
	if (!currentUser) {
		return null
	}

	return (
		<div className="flex min-h-screen bg-grey-50">
			{/* Mobile Sidebar Overlay */}
			{isSidebarOpen && (
				<div
					role="button"
					tabIndex={0}
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}

			{/* Sidebar - Fixed on all screen sizes */}
			<aside
				className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
					isSidebarOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				{/* Logo */}
				<div className="flex items-center gap-3 border-grey-200 border-b px-6 py-4.5">
					<Image src="/logotype.png" alt="VexBlocks" width={40} height={40} />
					<div>
						<h1 className="font-bold text-grey-900 text-xl">VexBlocks</h1>
						<p className="text-grey-500 text-xs">Headless CMS</p>
					</div>
				</div>

				{/* Navigation */}
				<nav className="space-y-1 p-4">
					{navItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="flex items-center gap-3 rounded-lg px-4 py-3 text-grey-700 transition-all hover:bg-primary/5 hover:text-primary"
							onClick={() => setIsSidebarOpen(false)}
						>
							<item.icon className="h-5 w-5" />
							<span className="font-medium">{item.label}</span>
						</Link>
					))}
				</nav>

				{/* User Section */}
				<div className="absolute right-0 bottom-0 left-0 border-grey-200 border-t p-4">
					<div className="mb-3 rounded-lg bg-grey-50 p-3">
						<p className="font-medium text-grey-500 text-xs">Signed in as</p>
						<p className="truncate font-semibold text-grey-900 text-sm">
							{currentUser.name || currentUser.email}
						</p>
					</div>
					<button
						type="button"
						onClick={handleLogout}
						disabled={isLoggingOut}
						className="flex w-full items-center justify-center gap-2 rounded-lg bg-grey-900 px-4 py-2.5 font-medium text-sm text-white transition-colors hover:bg-grey-800 disabled:opacity-50"
					>
						<LogOut className="h-4 w-4" />
						{isLoggingOut ? "Signing out..." : "Sign Out"}
					</button>
				</div>
			</aside>

			{/* Main content - Add left margin to account for fixed sidebar */}
			<main className="flex-1 overflow-y-auto lg:ml-64">
				{/* Header */}
				<header className="sticky top-0 z-30 border-grey-200 border-b bg-white/80 backdrop-blur-sm">
					<div className="flex items-center justify-between px-4 py-4 lg:px-8">
						<div className="flex items-center gap-4">
							<button
								type="button"
								onClick={() => setIsSidebarOpen(!isSidebarOpen)}
								className="rounded-lg p-2 text-grey-500 transition-colors hover:bg-grey-100 lg:hidden"
							>
								{isSidebarOpen ? (
									<X className="h-6 w-6" />
								) : (
									<Menu className="h-6 w-6" />
								)}
							</button>
							<div>
								<h2 className="font-semibold text-grey-900 text-lg">
									Welcome back, {currentUser.name?.split(" ")[0] || "Admin"}!
								</h2>
								<p className="text-grey-500 text-sm">
									Manage your content and schemas
								</p>
							</div>
						</div>
					</div>
				</header>

				{/* Page Content */}
				<div className="p-4 lg:p-8">{children}</div>
			</main>
		</div>
	)
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<AuthGuard>
			<DashboardContent>{children}</DashboardContent>
		</AuthGuard>
	)
}
