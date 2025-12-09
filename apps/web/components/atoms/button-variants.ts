import { cva } from "cva"

export const buttonVariants = cva(
	"group inline-flex cursor-pointer items-center justify-center gap-1 rounded-md font-medium transition-all focus:outline-none",
	{
		variants: {
			variant: {
				primary:
					"bg-linear-to-b from-teal-600 to-teal-700 text-white shadow-sm hover:from-teal-700 hover:to-teal-800 hover:shadow-md",
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
