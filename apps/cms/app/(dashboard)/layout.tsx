"use client"

import { Suspense } from "react"
import { DashboardHeader } from "@/components/molecules/dashboard-header"
import { DashboardSidenav } from "@/components/molecules/dashboard-sidenav"
import { useSidebar } from "@/contexts/sidebar-context"

/**
 * Dashboard Layout
 * Uses @lfades/atom for sidebar state - no provider needed
 */
export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()

	return (
		<div className="flex min-h-screen bg-grey-50">
			{/* Mobile Sidebar Overlay */}
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

			{/* Sidebar */}
			<DashboardSidenav
				isOpen={isMobileOpen}
				onClose={() => setIsMobileOpen(false)}
			/>

			{/* Main content - Add left margin to account for fixed sidebar */}
			<main
				className={`flex-1 transition-all duration-300 ${
					isCollapsed ? "lg:ml-[72px]" : "lg:ml-64"
				}`}
			>
				{/* Header */}
				<DashboardHeader
					isSidebarOpen={isMobileOpen}
					onToggleSidebar={() => setIsMobileOpen(!isMobileOpen)}
				/>

				{/* Page Content */}
				<div className="p-4 lg:p-8">
					<Suspense fallback={null}>{children}</Suspense>
				</div>
			</main>
		</div>
	)
}
