"use client"

import { useAtom } from "@lfades/atom"
import { Menu, X } from "lucide-react"
import { authAtom } from "@/lib/auth-atom"

type DashboardHeaderProps = {
	isSidebarOpen: boolean
	onToggleSidebar: () => void
}

/**
 * Dashboard Header Component
 * Shows welcome message and mobile menu toggle
 */
export function DashboardHeader({
	isSidebarOpen,
	onToggleSidebar,
}: DashboardHeaderProps) {
	const [authState] = useAtom(authAtom)
	const currentUser = authState.user

	if (!currentUser) {
		return null
	}

	const firstName = currentUser.name?.split(" ")[0] || "Admin"

	return (
		<header className="sticky top-0 z-30 border-b border-grey-200 bg-white/80 backdrop-blur-sm">
			<div className="flex items-center justify-between px-4 py-4 lg:px-8">
				<div className="flex items-center gap-4">
					<button
						type="button"
						onClick={onToggleSidebar}
						className="rounded-lg p-2 text-grey-500 transition-colors hover:bg-grey-100 lg:hidden"
						aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
					>
						{isSidebarOpen ? (
							<X className="h-6 w-6" />
						) : (
							<Menu className="h-6 w-6" />
						)}
					</button>
					<div>
						<h2 className="text-grey-900 text-lg font-semibold">
							Welcome back, {firstName}!
						</h2>
						<p className="text-sm text-grey-500">
							Manage your content and schemas
						</p>
					</div>
				</div>
			</div>
		</header>
	)
}
