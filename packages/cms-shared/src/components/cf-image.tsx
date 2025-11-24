"use client"

import Image from "next/image"

/**
 * CFImage is a component that renders an image using the Next.js Image component.
 * It uses Cloudflare Images for optimized delivery with variants.
 *
 * @param {string} assetId - The ID of the image asset to be displayed.
 * @param {string} alt - The alt text for the image.
 * @param {number} width - The width of the image (required unless fill is true).
 * @param {number} height - The height of the image (required unless fill is true).
 * @param {'avatar' | 'public'} variant - The variant of the image. Defaults to 'public'.
 * @param {boolean} isPrivate - Whether the image is private (bypasses CDN).
 * @param {boolean} draggable - Whether the image is draggable.
 * @param {string} className - The CSS class to apply to the image.
 * @param {boolean} fill - Whether to fill the parent container.
 *
 * @example
 * <CFImage assetId="123" alt="An example image" variant="public" width={400} height={300} />
 */

export type CFImageProps = {
	assetId: string
	alt: string
	width?: number
	height?: number
	variant?: "avatar" | "public"
	isPrivate?: boolean | null | undefined
	draggable?: boolean
	className?: string
	fill?: boolean
}

export function CFImage({
	assetId,
	width,
	height,
	alt,
	variant = "public",
	className,
	draggable = false,
	isPrivate = false,
	fill = false,
}: CFImageProps) {
	return (
		<Image
			loader={({ src }) =>
				isPrivate
					? src
					: `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/${src}/${variant}`
			}
			src={assetId}
			alt={alt || "CMS Image"}
			width={width}
			fill={fill}
			height={height}
			className={className}
			draggable={draggable}
			unoptimized={!!isPrivate} // Use Cloudflare variants for optimization
		/>
	)
}
