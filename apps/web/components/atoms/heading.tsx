import { cva, type VariantProps } from "cva"
import { cn } from "@/lib/utils"

const headingVariants = cva("font-serif", {
	variants: {
		size: {
			"6xl": "text-6xl leading-14 tracking-[-1.2px]",
			"4xl": "text-3xl leading-10.5 tracking-[-0.75px] md:text-4xl",
			"3xl": "text-2xl leading-9 tracking-[-0.75px] md:text-3xl",
			"2xl": "text-xl leading-8 tracking-[-0.5px] md:text-2xl",
			xl: "text-xl leading-normal tracking-[-0.5px]",
			lg: "font-bold text-lg leading-7 tracking-normal md:text-xl",
		},
		color: {
			default: "text-dark-900",
			light: "text-white",
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
