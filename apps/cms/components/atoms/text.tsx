import { cva, type VariantProps } from "cva"
import { cn } from "@/lib/utils"

const textVariants = cva("", {
	variants: {
		variant: {
			body: "font-normal leading-[22px] tracking-[0.32px]",
			small: "font-normal leading-[14px]",
			caption: "font-normal leading-[22px] tracking-[0.32px]",
		},
		size: {
			sm: "text-sm",
			base: "text-base",
		},
		color: {
			default: "text-gray-700",
			light: "text-alpha-light-900",
			gray: "text-gray-400",
			"light-70": "text-white/70",
			black: "text-alpha-dark-900",
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
