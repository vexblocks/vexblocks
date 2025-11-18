import Image from "next/image"
import Link from "next/link"
import { Container } from "@/components/atoms/container"

export function Footer() {
	return (
		<footer className="mt-20 bg-gray-900 py-12 text-gray-400">
			<Container>
				<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
					<div className="flex items-center gap-2">
						<Image src="/logotype.png" alt="VexBlocks" width={40} height={40} />

						<span className="font-bold text-white">VexBlocks</span>
					</div>

					<div className="flex gap-6">
						<Link href="/" className="transition-colors hover:text-white">
							Home
						</Link>
						<Link href="/blog" className="transition-colors hover:text-white">
							Blog
						</Link>
						<Link
							href="https://github.com"
							className="transition-colors hover:text-white"
						>
							GitHub
						</Link>
					</div>
				</div>
			</Container>
		</footer>
	)
}
