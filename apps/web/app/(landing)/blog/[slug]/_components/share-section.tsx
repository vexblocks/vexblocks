"use client"

import { Facebook, Link2, Linkedin, Twitter } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type ShareSectionProps = {
	title: string
	slug: string
}

export function ShareSection({ title, slug }: ShareSectionProps) {
	const [_copied, setCopied] = useState(false)

	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/blog/${slug}`
			: ""

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(shareUrl)
			setCopied(true)
			toast.success("Link copied to clipboard!")
			setTimeout(() => setCopied(false), 2000)
		} catch (_err) {
			toast.error("Failed to copy link")
		}
	}

	const handleShare = (platform: "linkedin" | "twitter" | "facebook") => {
		const encodedUrl = encodeURIComponent(shareUrl)
		const encodedTitle = encodeURIComponent(title)

		let shareLink = ""

		switch (platform) {
			case "linkedin":
				shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
				break
			case "twitter":
				shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
				break
			case "facebook":
				shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
				break
		}

		window.open(shareLink, "_blank", "noopener,noreferrer,width=600,height=400")
	}

	return (
		<div className="flex flex-col gap-4">
			<h3 className="font-medium text-2xl text-gray-900 tracking-tight">
				Share this post
			</h3>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={handleCopyLink}
					className="flex size-10 items-center justify-center rounded-full bg-white transition-colors hover:bg-gray-50"
					title="Copy link"
				>
					<Link2 className="size-6 text-black" />
				</button>
				<button
					type="button"
					onClick={() => handleShare("linkedin")}
					className="flex size-10 items-center justify-center rounded-full bg-white transition-colors hover:bg-gray-50"
					title="Share on LinkedIn"
				>
					<Linkedin className="size-6 text-black" />
				</button>
				<button
					type="button"
					onClick={() => handleShare("twitter")}
					className="flex size-10 items-center justify-center rounded-full bg-white transition-colors hover:bg-gray-50"
					title="Share on X (Twitter)"
				>
					<Twitter className="size-6 text-black" />
				</button>
				<button
					type="button"
					onClick={() => handleShare("facebook")}
					className="flex size-10 items-center justify-center rounded-full bg-white transition-colors hover:bg-gray-50"
					title="Share on Facebook"
				>
					<Facebook className="size-6 text-black" />
				</button>
			</div>
		</div>
	)
}
