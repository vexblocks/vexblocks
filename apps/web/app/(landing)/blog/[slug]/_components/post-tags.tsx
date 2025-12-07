"use client"

import type { BlogTagsContent } from "@repo/cms-shared"
import { getStringValue } from "@repo/cms-shared"
import { useQuery } from "convex/react"
import { api } from "vexblocks-backend/convex/_generated/api"
import type { Id } from "vexblocks-backend/convex/_generated/dataModel"

type PostTagsProps = {
	tags?: Array<string | BlogTagsContent>
}

export function PostTags({ tags }: PostTagsProps) {
	if (!tags || tags.length === 0) return null

	return (
		<div className="flex flex-wrap gap-2">
			{tags.map((tag, index) => (
				<TagItem key={index} tag={tag} />
			))}
		</div>
	)
}

function TagItem({ tag }: { tag: string | BlogTagsContent }) {
	const isTagString = typeof tag === "string"

	// Fetch tag if it's an ID string
	const fetchedTag = useQuery(
		api.cms.content.getPublishedById,
		isTagString && tag ? { id: tag as Id<"cmsContent"> } : "skip",
	) as BlogTagsContent | null | undefined

	// Determine which tag data to use
	const tagData: BlogTagsContent | null | undefined = isTagString
		? fetchedTag
		: tag

	const tagName = getStringValue(tagData?.data?.name) || null

	if (!tagName) return null

	return (
		<span className="rounded-full bg-dark-100 px-3 py-2 font-medium text-gray-900 text-sm">
			{tagName}
		</span>
	)
}
