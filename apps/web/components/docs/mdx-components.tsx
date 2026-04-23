import { generateHeadingId } from "@/lib/generate-heading-id"
import { cn } from "@/lib/utils"

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement>

export const H2 = ({ children, className, ...props }: HeadingProps) => {
	const id =
		typeof children === "string" ? generateHeadingId(children) : undefined
	return (
		<h2
			id={id}
			className={cn(
				"mt-12 scroll-mt-24 border-b pb-3 text-3xl font-bold tracking-tight first:mt-0",
				className,
			)}
			{...props}
		>
			{children}
		</h2>
	)
}

export const H3 = ({ children, className, ...props }: HeadingProps) => {
	const id =
		typeof children === "string" ? generateHeadingId(children) : undefined
	return (
		<h3
			id={id}
			className={cn(
				"mt-8 scroll-mt-24 text-2xl font-semibold tracking-tight",
				className,
			)}
			{...props}
		>
			{children}
		</h3>
	)
}

export const CodeBlock = ({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLPreElement>) => {
	return (
		<pre
			className={cn(
				"my-6 overflow-x-auto rounded-lg border bg-zinc-950 px-4 py-4 dark:bg-zinc-900",
				className,
			)}
			{...props}
		>
			<code className="relative rounded font-mono text-sm text-white">
				{children}
			</code>
		</pre>
	)
}

export const InlineCode = ({
	className,
	children,
	...props
}: React.HTMLAttributes<HTMLElement>) => {
	return (
		<code
			className={cn(
				"relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
				className,
			)}
			{...props}
		>
			{children}
		</code>
	)
}

export const Callout = ({
	type = "info",
	children,
}: {
	type?: "info" | "warning" | "danger" | "success"
	children: React.ReactNode
}) => {
	const styles = {
		info: "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
		warning: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30",
		danger: "border-red-500 bg-red-50 dark:bg-red-950/30",
		success: "border-green-500 bg-green-50 dark:bg-green-950/30",
	}

	return (
		<div className={cn("my-6 rounded-r-lg border-l-4 p-4", styles[type])}>
			{children}
		</div>
	)
}

export const Steps = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="mt-6 mb-12 ml-4 border-l pl-6 [counter-reset:step]">
			{children}
		</div>
	)
}

export const Step = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="relative mb-12 ml-4 [counter-increment:step]">
			<div className="absolute -left-[2.2rem] flex h-8 w-8 items-center justify-center rounded-full border-4 border-background bg-muted font-mono text-sm font-medium">
				<span className="before:content-[counter(step)]" />
			</div>
			<div className="pl-2">{children}</div>
		</div>
	)
}
