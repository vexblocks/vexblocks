import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
	"inline-flex items-center justify-center gap-2 rounded-full px-2.5 py-2 text-sm leading-3.5 font-medium",
	{
		variants: {
			variant: {
				default:
					"bg-transparent bg-linear-to-r from-dark-100 to-dark-200 text-dark-900",
				dark: "bg-transparent bg-linear-to-r from-gray-700 to-gray-800 text-white",
				black:
					"rounded-lg rounded-br-none bg-transparent bg-linear-to-r from-gray-700 to-gray-800 text-base font-medium text-white",
				outline:
					"bg-linear-to-r from-alpha-light-100 to-alpha-light-200 text-dark-900",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
)

type LabelProps = VariantProps<typeof labelVariants> & {
	children: React.ReactNode
	className?: string
}

export const Label = ({ variant, className, children }: LabelProps) => {
	return (
		<div className={cn(labelVariants({ variant }), className)}>{children}</div>
	)
}
