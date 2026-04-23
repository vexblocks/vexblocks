import type { VariantProps } from "cva"
import NextLink from "next/link"
import { cn } from "@/lib/utils"
import { ArrowRightIcon } from "../icons/arrow-right"
import { buttonVariants } from "./button-variants"

export type LinkProps = React.ComponentPropsWithoutRef<typeof NextLink> &
	VariantProps<typeof buttonVariants> & {
		showArrow?: boolean
		icon?: React.ReactNode
	}

export function Link({
	className,
	variant,
	size,
	showArrow = false,
	icon,
	children,
	...props
}: LinkProps) {
	return (
		<NextLink
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		>
			<span className="leading-4">{children}</span>
			{showArrow && (
				<ArrowRightIcon className="relative top-px h-4 w-4 transition-transform group-hover:translate-x-1" />
			)}
			{icon ? icon : null}
		</NextLink>
	)
}
