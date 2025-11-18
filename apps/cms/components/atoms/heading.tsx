import { cva, type VariantProps } from "cva"
import { cn } from "@/lib/utils"

const headingVariants = cva("not-italic", {
	variants: {
		size: {
			"6xl": "text-[60px] leading-profile tracking-[-1.2px]",
			"3xl": "text-[30px] leading-[36px] tracking-[-0.6px]",
			xl: "text-[25px] leading-normal tracking-[-0.5px]",
		},
		color: {
			default: "text-alpha-dark-900",
			light: "text-alpha-light-900",
		},
		weight: {
			regular: "font-normal",
			semibold: "font-semibold",
		},
	},
	defaultVariants: {
		size: "3xl",
		color: "default",
		weight: "regular",
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
	weight,
	as: Component = "h2",
	...props
}: HeadingProps) {
	return (
		<Component
			className={cn(headingVariants({ size, color, weight, className }))}
			{...props}
		/>
	)
}
