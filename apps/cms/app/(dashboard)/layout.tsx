import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/molecules/dashboard-shell"
import { ClientAuthBoundary } from "@/components/providers/auth-boundary"
import { isAuthenticated } from "@/lib/auth-server"

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	if (!(await isAuthenticated())) {
		redirect("/login")
	}

	return (
		<ClientAuthBoundary>
			<DashboardShell>{children}</DashboardShell>
		</ClientAuthBoundary>
	)
}
