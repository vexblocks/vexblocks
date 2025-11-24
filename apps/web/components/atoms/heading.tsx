import { cva, type VariantProps } from "cva"
import { cn } from "@/lib/utils"

const headingVariants = cva("font-bold", {
	variants: {
		size: {
			"6xl": "text-4xl leading-tight tracking-tight md:text-5xl lg:text-6xl",
			"5xl": "text-3xl leading-tight tracking-tight md:text-4xl lg:text-5xl",
			"4xl": "text-2xl leading-tight tracking-tight md:text-3xl lg:text-4xl",
			"3xl": "text-xl leading-tight tracking-tight md:text-2xl lg:text-3xl",
			"2xl": "text-lg leading-tight tracking-tight md:text-xl lg:text-2xl",
			xl: "text-base leading-tight tracking-tight md:text-lg lg:text-xl",
			lg: "text-base leading-normal md:text-lg",
		},
		color: {
			default: "text-gray-900",
			light: "text-white",
			muted: "text-gray-600",
		},
	},
	defaultVariants: {
		size: "3xl",
		color: "default",
	},
})

export type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> &
	VariantProps<typeof headingVariants> & {
		as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
	}

export function Heading({
	className,
	size,
	color,
	as: Component = "h2",
	...props
}: HeadingProps) {
	return (
		<Component
			className={cn(headingVariants({ size, color, className }))}
			{...props}
		/>
	)
}
