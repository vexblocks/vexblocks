import type { Metadata } from "next"
import { WebLayout } from "@/components/wrappers/web-layout"

export const metadata: Metadata = {
	title: {
		default: "VexBlocks - Open Source Headless CMS for Convex",
		template: "%s | VexBlocks",
	},
	description:
		"VexBlocks is a powerful, type-safe headless CMS built on Convex and Next.js. Create, manage, and deliver content with real-time updates and zero configuration.",
	keywords: [
		"headless cms",
		"convex",
		"nextjs",
		"typescript",
		"real-time",
		"cms",
		"content management",
		"open source",
	],
	authors: [{ name: "VexBlocks Team" }],
	creator: "VexBlocks",
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://vexblocks.com",
		title: "VexBlocks - Open Source Headless CMS for Convex",
		description:
			"Powerful, type-safe headless CMS built on Convex and Next.js with real-time updates.",
		siteName: "VexBlocks",
	},
	twitter: {
		card: "summary_large_image",
		title: "VexBlocks - Open Source Headless CMS for Convex",
		description:
			"Powerful, type-safe headless CMS built on Convex and Next.js with real-time updates.",
		creator: "@vexblocks",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
}

export default function LandingLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return <WebLayout>{children}</WebLayout>
}
