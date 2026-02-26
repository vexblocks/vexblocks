import type { Metadata } from "next"
import "@/styles/config.css"
import { GeistSans } from "geist/font/sans"
import { Suspense } from "react"
import { Toaster } from "sonner"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ConvexProvider } from "@/components/providers/convex-provider"
import { SessionRecovery } from "@/components/providers/session-recovery"
import { getToken } from "@/lib/auth-server"

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
				<Suspense>
					<ConvexProviderWithToken>{children}</ConvexProviderWithToken>
				</Suspense>
				<Toaster position="top-right" richColors />
			</body>
		</html>
	)
}

async function ConvexProviderWithToken({
	children,
}: {
	children: React.ReactNode
}) {
	const initialToken = (await getToken()) ?? null
	return (
		<ConvexProvider initialToken={initialToken}>
			<AuthProvider>
				<Suspense fallback={null}>
					<SessionRecovery>{children}</SessionRecovery>
				</Suspense>
			</AuthProvider>
		</ConvexProvider>
	)
}
