import Image from "next/image"
import Link from "next/link"
import { Container } from "@/components/atoms/container"

export function Header() {
	return (
		<nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
			<Container>
				<div className="flex h-16 items-center justify-between">
					<Link href="/" className="flex items-center gap-2">
						<Image src="/logotype.png" alt="VexBlocks" width={40} height={40} />
						<span className="text-xl font-bold">VexBlocks</span>
					</Link>
					<div className="flex items-center gap-6">
						<Link
							href="/"
							className="text-sm font-medium transition-colors hover:text-teal-700"
						>
							Home
						</Link>
						<Link
							href="/docs"
							className="text-sm font-medium transition-colors hover:text-teal-700"
						>
							Docs
						</Link>
						<Link
							href="/blog"
							className="text-sm font-medium transition-colors hover:text-teal-700"
						>
							Blog
						</Link>
						<a
							href="http://localhost:3001"
							target="_blank"
							className="text-sm font-medium transition-colors hover:text-teal-700"
							rel="noopener"
						>
							Get Started
						</a>
					</div>
				</div>
			</Container>
		</nav>
	)
}
