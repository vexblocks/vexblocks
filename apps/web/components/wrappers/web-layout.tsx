import { Footer } from "@/components/organisms/footer"
import { Header } from "@/components/organisms/header"

interface WebLayoutProps {
	children: React.ReactNode
}

export function WebLayout({ children }: WebLayoutProps) {
	return (
		<div className="min-h-screen bg-white">
			<Header />
			<main>{children}</main>
			<Footer />
		</div>
	)
}
