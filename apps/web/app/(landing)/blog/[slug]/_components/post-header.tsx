"use client"

import type { ContentLibraryContent } from "@repo/cms-shared"

type PostHeaderProps = {
	post: ContentLibraryContent
}

export function PostHeader({ post }: PostHeaderProps) {
	return (
		<header className="mb-7 lg:mb-10">
			<h1 className="font-normal font-serif text-3xl text-gray-900 leading-tight tracking-tight md:text-6xl lg:text-5xl">
				{post.data.title}
			</h1>
		</header>
	)
}
