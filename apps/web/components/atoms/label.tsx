import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
	"inline-flex items-center justify-center gap-2 rounded-full px-2.5 py-2 font-medium text-sm leading-3.5",
	{
		variants: {
			variant: {
				default:
					"bg-linear-to-r bg-transparent from-dark-100 to-dark-200 text-dark-900",
				dark: "bg-linear-to-r bg-transparent from-gray-700 to-gray-800 text-white",
				black:
					"rounded-lg rounded-br-none bg-linear-to-r bg-transparent from-gray-700 to-gray-800 font-medium text-base text-white",
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
