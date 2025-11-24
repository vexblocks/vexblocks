import { cva, type VariantProps } from "cva"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-1 rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
	{
		variants: {
			variant: {
				primary:
					"bg-linear-to-b from-red-600 to-red-700 text-white shadow-sm hover:shadow-md hover:from-red-700 hover:to-red-800",
				ghost: "text-gray-400 hover:text-white",
				link: "text-white hover:underline",
			},
			size: {
				sm: "gap-1 px-3 py-2 text-[14px]",
				md: "gap-1.5 px-4 py-2.5 text-[16px]",
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
			{showArrow && <ArrowRight className="h-4 w-4" />}
			{icon && icon}
		</button>
	)
}
