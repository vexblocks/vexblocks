"use client"

import { Suspense, useState } from "react"
import { DashboardHeader } from "@/components/molecules/dashboard-header"
import { DashboardSidenav } from "@/components/molecules/dashboard-sidenav"

/**
 * The actual dashboard UI - only renders after auth is verified
 */
function DashboardContent({ children }: { children: React.ReactNode }) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)

	return (
		<div className="flex min-h-screen bg-grey-50">
			{/* Mobile Sidebar Overlay */}
			{isSidebarOpen && (
				<div
					role="button"
					tabIndex={0}
					className="fixed inset-0 z-40 bg-black/50 lg:hidden"
					onClick={() => setIsSidebarOpen(false)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							setIsSidebarOpen(false)
						}
					}}
				/>
			)}

			{/* Sidebar */}
			<DashboardSidenav
				isOpen={isSidebarOpen}
				onClose={() => setIsSidebarOpen(false)}
			/>

			{/* Main content - Add left margin to account for fixed sidebar */}
			<main className="flex-1 overflow-y-auto lg:ml-64">
				{/* Header */}
				<DashboardHeader
					isSidebarOpen={isSidebarOpen}
					onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
				/>

				{/* Page Content */}
				<div className="p-4 lg:p-8">
					<Suspense fallback={null}>{children}</Suspense>
				</div>
			</main>
		</div>
	)
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return <DashboardContent>{children}</DashboardContent>
}
