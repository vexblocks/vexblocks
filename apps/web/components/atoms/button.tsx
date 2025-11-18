import { cva, type VariantProps } from "cva"
import { cn } from "@/lib/utils"
import { ArrowRightIcon } from "../icons/arrow-right"

const buttonVariants = cva(
	"group inline-flex cursor-pointer items-center justify-center gap-1 rounded-md font-medium transition-all focus:outline-none",
	{
		variants: {
			variant: {
				primary:
					"bg-linear-to-b from-blue-700 to-blue-800 text-white shadow-[0px_1px_4px_0px_rgba(24,55,236,0.32),0px_1px_1px_0px_rgba(0,12,72,0.2),0px_0px_0px_0.5px_rgba(24,55,236,0.16)] hover:from-[#1531d1] hover:to-[#162b82]",
				ghost: "text-gray-400 hover:text-white",
				link: "text-white hover:underline",
			},
			size: {
				sm: "gap-1 px-3 py-2 text-sm",
				md: "h-10.5 gap-1.5 px-4 py-3 text-base",
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
