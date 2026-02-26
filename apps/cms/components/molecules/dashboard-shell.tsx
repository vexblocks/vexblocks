"use client"

import { Suspense } from "react"
import { DashboardHeader } from "@/components/molecules/dashboard-header"
import { DashboardSidenav } from "@/components/molecules/dashboard-sidenav"
import { useSidebar } from "@/contexts/sidebar-context"
import { useAuth } from "@/lib/auth-atom"
import { canAccessDashboard } from "@/lib/permissions"

export function DashboardShell({ children }: { children: React.ReactNode }) {
	const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()
	const { user, isLoading, isInitialized } = useAuth()

	if (isLoading || !isInitialized) {
		return null
	}

	if (
		!user ||
		user.isActive === false ||
		!canAccessDashboard(user.role as any)
	) {
		return null
	}

	return (
		<div className="flex min-h-screen bg-grey-50">
			{isMobileOpen && (
				<div
					role="button"
					tabIndex={0}
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => setIsMobileOpen(false)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							setIsMobileOpen(false)
						}
					}}
				/>
			)}

			<DashboardSidenav
				isOpen={isMobileOpen}
				onClose={() => setIsMobileOpen(false)}
			/>

			<main
				className={`min-w-0 flex-1 transition-all duration-300 ${
					isCollapsed ? "lg:ml-[72px]" : "lg:ml-64"
				}`}
			>
				<DashboardHeader
					isSidebarOpen={isMobileOpen}
					onToggleSidebar={() => setIsMobileOpen(!isMobileOpen)}
				/>

				<div className="p-4 lg:p-8">
					<Suspense fallback={null}>{children}</Suspense>
				</div>
			</main>
		</div>
	)
}
