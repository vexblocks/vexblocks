import "@/styles/config.css"
import { GeistSans } from "geist/font/sans"
import localFont from "next/font/local"
import { ConvexProvider } from "@/components/providers/convex-provider"
import { NavbarThemeProvider } from "@/contexts/navbar-theme-context"

const gtSuper = localFont({
	src: "../public/fonts/gt-super-regular.woff",
	variable: "--font-serif",
	display: "swap",
})

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${GeistSans.variable} ${gtSuper.variable}`}
		>
			<head />
			<body className="min-h-screen bg-background font-sans antialiased">
				<ConvexProvider>
					<NavbarThemeProvider>{children}</NavbarThemeProvider>
				</ConvexProvider>
			</body>
		</html>
	)
}
