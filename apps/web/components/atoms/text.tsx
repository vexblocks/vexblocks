import { cva, type VariantProps } from "cva"
import { cn } from "@/lib/utils"

const textVariants = cva("", {
	variants: {
		variant: {
			body: "font-normal leading-7",
			small: "font-normal text-sm leading-relaxed",
			caption: "font-medium text-xs uppercase tracking-wider",
			lead: "font-normal text-lg leading-8 md:text-xl md:leading-9",
		},
		size: {
			xs: "text-xs",
			sm: "text-sm",
			base: "text-base",
			lg: "text-lg",
			xl: "text-xl",
			"2xl": "text-2xl",
		},
		color: {
			default: "text-gray-600",
			black: "text-black",
			light: "text-white",
			gray: "text-gray-400",
			"gray-500": "text-gray-500",
			"light-70": "text-white/70",
			"dark-700": "text-dark-700",
			"dark-900": "text-dark-900",
			muted: "text-gray-500",
		},
	},
	defaultVariants: {
		variant: "body",
		size: "base",
		color: "default",
	},
})

export type TextProps = React.HTMLAttributes<HTMLParagraphElement> &
	VariantProps<typeof textVariants> & {
		as?: "p" | "span"
	}

export function Text({
	className,
	variant,
	size,
	color,
	as: Component = "p",
	...props
}: TextProps) {
	return (
		<Component
			className={cn(textVariants({ variant, size, color, className }))}
			{...props}
		/>
	)
}
