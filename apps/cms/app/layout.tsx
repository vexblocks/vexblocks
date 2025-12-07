import type { Metadata } from "next"
import "@/styles/config.css"
import { GeistSans } from "geist/font/sans"
import { Suspense } from "react"
import { Toaster } from "sonner"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ConvexProvider } from "@/components/providers/convex-provider"
import { SessionRecovery } from "@/components/providers/session-recovery"

export const metadata: Metadata = {
	title: "CMS Admin - VexBlocks",
	description: "Headless CMS Administration Panel",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" className={GeistSans.variable}>
			<body className="min-h-screen bg-background font-sans antialiased">
				<ConvexProvider>
					<AuthProvider>
						<Suspense fallback={null}>
							<SessionRecovery>{children}</SessionRecovery>
						</Suspense>
					</AuthProvider>
					<Toaster position="top-right" richColors />
				</ConvexProvider>
			</body>
		</html>
	)
}
