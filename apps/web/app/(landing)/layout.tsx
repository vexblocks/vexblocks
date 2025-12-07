import { PreviewBanner, PreviewProvider, VisualEditing } from "@repo/cms-shared"
import { Toaster } from "sonner"
import { Footer } from "@/components/organisms/footer"
import { StickyHeader } from "@/components/organisms/sticky-header"

export default function LandingLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<PreviewProvider>
			{/* VisualEditing handles clicks on data-cms-field elements globally */}
			<VisualEditing />
			<PreviewBanner />
			<main>
				<StickyHeader />

				{children}

				<Footer />
				<Toaster />
			</main>
		</PreviewProvider>
	)
}
