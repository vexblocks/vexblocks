"use client"

import { Suspense } from "react"
import { AIChatTrigger } from "@/components/molecules/ai-chat-trigger"
import { DashboardHeader } from "@/components/molecules/dashboard-header"
import { DashboardSidenav } from "@/components/molecules/dashboard-sidenav"
import { useSidebar } from "@/contexts/sidebar-context"
import { useAuth } from "@/lib/auth-atom"
import { canAccessDashboard } from "@/lib/permissions"

/**
 * Dashboard Layout
 * Uses @lfades/atom for sidebar state - no provider needed
 * Validates user role and redirects if necessary
 */
export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()
	const { user, isLoading, isInitialized } = useAuth()

	// Note: Auth redirects are handled by middleware (proxy.ts)
	// This layout only needs to validate that user has access and show loading state

	// Show loading state while checking auth
	if (isLoading || !isInitialized) {
		return null
	}

	// Don't render dashboard if user doesn't have access
	if (
		!user ||
		user.isActive === false ||
		!canAccessDashboard(user.role as any)
	) {
		return null
	}

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

			{/* AI Chat Assistant */}
			<AIChatTrigger />
		</div>
	)
}
