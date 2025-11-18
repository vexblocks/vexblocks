import { cva, type VariantProps } from "cva"
import { cn } from "@/lib/utils"

const textVariants = cva("", {
	variants: {
		variant: {
			body: "font-normal leading-5.5 tracking-[0.32px]",
			small: "font-normal leading-3.5",
			caption: "font-normal leading-5.5 tracking-[0.32px]",
		},
		size: {
			sm: "text-sm",
			base: "text-base",
			lg: "leading-7 tracking-[0.36px] md:text-lg",
			xl: "text-lg leading-7 md:text-xl",
			"2xl": "text-xl leading-8 tracking-[-0.6px] md:text-2xl",
		},
		color: {
			default: "text-gray-700",
			black: "text-black",
			light: "text-white",
			gray: "text-gray-400",
			"light-70": "text-white/70",
			"dark-700": "text-dark-700",
			"dark-900": "text-dark-900",
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
