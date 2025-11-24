import { cva, type VariantProps } from "cva"
import { cn } from "@/lib/utils"

const inputVariants = cva(
	"flex w-full rounded-md border px-3 py-2 text-sm placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "border-gray-700 bg-gray-800 text-white",
				outline: "border-gray-600 bg-transparent text-white",
			},
			size: {
				sm: "h-9 px-3 text-sm",
				md: "h-10 px-4 text-base",
				lg: "h-11 px-5 text-lg",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "md",
		},
	},
)

export interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
		VariantProps<typeof inputVariants> {
	icon?: React.ReactNode
}

export function Input({
	className,
	variant,
	size,
	icon,
	type = "text",
	...props
}: InputProps) {
	return (
		<div className="relative w-full">
			{icon && (
				<div className="-translate-y-1/2 absolute top-1/2 left-3 text-gray-400">
					{icon}
				</div>
			)}
			<input
				type={type}
				className={cn(
					inputVariants({ variant, size, className }),
					icon && "pl-10",
				)}
				{...props}
			/>
		</div>
	)
}
