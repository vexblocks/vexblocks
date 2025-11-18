import { cn } from "@/lib/utils"

export function Container({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) {
	return (
		<div
			className={cn(
				"mx-auto max-w-7xl px-4 md:px-6 lg:px-8 2xl:px-0",
				className,
			)}
		>
			{children}
		</div>
	)
}
