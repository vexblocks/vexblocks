import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDownIcon } from "lucide-react"
import type * as React from "react"
import { useNavbarTheme } from "@/contexts/navbar-theme-context"
import { cn } from "@/lib/utils"

function NavigationMenu({
	className,
	children,
	viewport = true,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
	viewport?: boolean
}) {
	return (
		<NavigationMenuPrimitive.Root
			data-slot="navigation-menu"
			data-viewport={viewport}
			className={cn(
				"group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
				className,
			)}
			{...props}
		>
			{children}
			{viewport && <NavigationMenuViewport />}
		</NavigationMenuPrimitive.Root>
	)
}

function NavigationMenuList({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
	return (
		<NavigationMenuPrimitive.List
			data-slot="navigation-menu-list"
			className={cn(
				"group flex flex-1 list-none items-center justify-center gap-1",
				className,
			)}
			{...props}
		/>
	)
}

function NavigationMenuItem({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
	return (
		<NavigationMenuPrimitive.Item
			data-slot="navigation-menu-item"
			className={cn("relative", className)}
			{...props}
		/>
	)
}

const navigationMenuTriggerStyle = cva(
	"group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50",
)

function NavigationMenuTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
	const { theme } = useNavbarTheme()
	const isDark = theme === "dark"

	return (
		<NavigationMenuPrimitive.Trigger
			data-slot="navigation-menu-trigger"
			className={cn(
				navigationMenuTriggerStyle(),
				"group",
				// Remove default hover/focus/state styles and let parent control them
				"bg-transparent!",
				className,
			)}
			{...props}
		>
			{children}{" "}
			<ChevronDownIcon
				className={cn(
					"relative top-px ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180",
					isDark ? "text-gray-300" : "",
				)}
				aria-hidden="true"
			/>
		</NavigationMenuPrimitive.Trigger>
	)
}

function NavigationMenuContent({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
	const { theme } = useNavbarTheme()
	const isDark = theme === "dark"

	return (
		<NavigationMenuPrimitive.Content
			data-slot="navigation-menu-content"
			className={cn(
				"top-0 left-0 w-full p-2 pr-2.5 md:absolute md:w-auto",
				"data-[motion^=from-]:animate-in data-[motion^=from-]:duration-150 data-[motion^=from-]:fade-in data-[motion^=from-]:slide-in-from-top-2",
				"data-[motion^=to-]:animate-out data-[motion^=to-]:duration-100 data-[motion^=to-]:fade-out data-[motion^=to-]:slide-out-to-top-2",
				"**:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none",
				"group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:shadow group-data-[viewport=false]/navigation-menu:duration-150",
				"group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 group-data-[viewport=false]/navigation-menu:data-[state=closed]:zoom-out-95",
				"group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0 group-data-[viewport=false]/navigation-menu:data-[state=open]:zoom-in-95",
				isDark
					? "group-data-[viewport=false]/navigation-menu:border-gray-700 group-data-[viewport=false]/navigation-menu:bg-gray-900 group-data-[viewport=false]/navigation-menu:text-white"
					: "group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground",
				className,
			)}
			{...props}
		/>
	)
}

function NavigationMenuViewport({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
	return (
		<div
			className={cn(
				"absolute top-full left-0 isolate z-50 flex justify-center",
			)}
		>
			<NavigationMenuPrimitive.Viewport
				data-slot="navigation-menu-viewport"
				className={cn(
					"origin-top-center relative mt-1.5 h-(--radix-navigation-menu-viewport-height) w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:zoom-in-90 md:w-(--radix-navigation-menu-viewport-width)",
					className,
				)}
				{...props}
			/>
		</div>
	)
}

function NavigationMenuLink({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
	const { theme } = useNavbarTheme()
	const isDark = theme === "dark"

	return (
		<NavigationMenuPrimitive.Link
			data-slot="navigation-menu-link"
			className={cn(
				"flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 [&_svg:not([class*='size-'])]:size-4",
				isDark
					? "text-gray-100 hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white data-[active=true]:bg-gray-800/50 data-[active=true]:text-white data-[active=true]:hover:bg-gray-800 data-[active=true]:focus:bg-gray-800 [&_svg:not([class*='text-'])]:text-gray-400"
					: "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground data-[active=true]:hover:bg-accent data-[active=true]:focus:bg-accent [&_svg:not([class*='text-'])]:text-muted-foreground",
				className,
			)}
			{...props}
		/>
	)
}

function NavigationMenuIndicator({
	className,
	...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
	return (
		<NavigationMenuPrimitive.Indicator
			data-slot="navigation-menu-indicator"
			className={cn(
				"top-full z-1 flex h-1.5 items-end justify-center overflow-hidden data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:animate-in data-[state=visible]:fade-in",
				className,
			)}
			{...props}
		>
			<div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
		</NavigationMenuPrimitive.Indicator>
	)
}

export {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuIndicator,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	NavigationMenuViewport,
	navigationMenuTriggerStyle,
}
