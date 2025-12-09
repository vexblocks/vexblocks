import { cva, type VariantProps } from "cva"
import { cn } from "@/lib/utils"
import { ArrowRightIcon } from "../icons/arrow-right"

const buttonVariants = cva(
	"group inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			variant: {
				primary:
					"bg-linear-to-b from-teal-600 to-teal-700 text-white shadow-sm hover:from-teal-700 hover:to-teal-800 hover:shadow-md",
				secondary:
					"border border-gray-300 bg-white text-gray-700 shadow-sm hover:border-gray-400 hover:bg-gray-50",
				ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
				link: "text-teal-700 hover:text-teal-800 hover:underline",
			},
			size: {
				sm: "px-3 py-1.5 text-sm",
				md: "px-4 py-2 text-sm",
				lg: "px-6 py-3 text-base",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "md",
		},
	},
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants> & {
		showArrow?: boolean
		icon?: React.ReactNode
	}

export function Button({
	className,
	variant,
	size,
	showArrow = false,
	icon,
	children,
	...props
}: ButtonProps) {
	return (
		<button
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		>
			<span className="leading-4">{children}</span>
			{showArrow && (
				<ArrowRightIcon className="relative top-px h-4 w-4 transition-transform group-hover:translate-x-1" />
			)}
			{icon && icon}
		</button>
	)
}
