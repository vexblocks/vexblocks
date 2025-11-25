import NextLink from "next/link"
import { Link } from "../atoms/atoms"

const POST_URL = "/blog"

export function Banner() {
	return (
		<>
			{/* Mobile: entire banner is clickable */}
			<NextLink
				href={POST_URL}
				className="flex w-full flex-col items-center justify-center gap-2 overflow-hidden bg-gray-900 px-4 py-2 text-sm md:hidden"
			>
				<p className="text-center text-white leading-3.5">
					VexBlocks CMS - Build blazing fast headless content systems
				</p>
			</NextLink>

			{/* Desktop: separate "Read more" link */}
			<div className="hidden w-full flex-row items-center justify-center gap-4 overflow-hidden bg-primary px-10 text-sm md:flex lg:px-20">
				<p className="text-left text-white leading-3.5">
					VexBlocks CMS - Build blazing fast headless content systems
				</p>
				<Link
					href={POST_URL}
					className="border-none bg-linear-to-r bg-transparent from-transparent to-transparent px-2 text-sm text-white/70 shadow-none hover:from-transparent hover:to-transparent hover:text-white"
					showArrow
				>
					Read more
				</Link>
			</div>
		</>
	)
}
