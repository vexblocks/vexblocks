"use client"

import { ChevronDown, Menu, X } from "lucide-react"
import Link from "next/link"
import type React from "react"
import { useState } from "react"
import { useNavbarTheme } from "@/contexts/navbar-theme-context"
import { Container } from "../atoms/container"
import { ArrowRightIcon } from "../icons/arrow-right"
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "../ui/navigation-menu"

const docsItems = [
	{
		title: "Introduction",
		href: "/docs",
		description: "Welcome to VexBlocks CMS",
	},
	{
		title: "Installation",
		href: "/docs/installation",
		description: "Quick start guide and setup",
	},
	{
		title: "CLI Reference",
		href: "/docs/cli",
		description: "Command-line interface tools",
	},
	{
		title: "Creating Schemas",
		href: "/docs/guides/creating-schemas",
		description: "Build custom content structures",
	},
]

export function Navbar() {
	const { theme, additionalClasses } = useNavbarTheme()
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [expandedSection, setExpandedSection] = useState<string | null>(null)

	const isDark = theme === "dark"

	const toggleSection = (section: string) => {
		setExpandedSection(expandedSection === section ? null : section)
	}

	return (
		<header
			className={`relative flex w-full items-center justify-center px-4 py-4 transition-colors duration-300 md:px-10 lg:px-20 ${
				isDark
					? "border-b border-gray-800 bg-black"
					: "bg-white shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08)]"
			} ${additionalClasses}`}
		>
			<Container className="flex grow items-center justify-between">
				{/* Logo */}
				<Link href="/" className="flex items-center">
					<span
						className={`text-[20px] leading-normal font-semibold tracking-[-0.5px] transition-colors duration-300 md:text-[25px] ${
							isDark ? "text-white" : "text-gray-900"
						}`}
					>
						VexBlocks
					</span>
				</Link>

				{/* Desktop Navigation */}
				<NavigationMenu viewport={false} className="hidden lg:flex">
					<NavigationMenuList className="gap-6">
						{/* Blog */}
						<NavigationMenuItem>
							<Link
								href="/blog"
								className={`bg-transparent px-0 text-sm leading-[22px] tracking-[0.28px] transition-colors ${
									isDark
										? "text-gray-300 hover:text-white"
										: "text-dark-700 hover:text-dark-900"
								}`}
							>
								Blog
							</Link>
						</NavigationMenuItem>

						{/* Documentation with submenu */}
						<NavigationMenuItem>
							<NavigationMenuTrigger
								className={`bg-transparent text-sm leading-[22px] tracking-[0.28px] transition-colors hover:bg-transparent data-[state=open]:bg-transparent ${
									isDark
										? "text-gray-300 hover:text-white data-[state=open]:text-white"
										: "text-dark-700 hover:text-dark-900 data-[state=open]:text-dark-900"
								}`}
							>
								Documentation
							</NavigationMenuTrigger>
							<NavigationMenuContent>
								<ul className="grid w-[320px] gap-2 p-3 md:grid-cols-1 lg:w-[360px]">
									{docsItems.map((item) => (
										<li key={item.title}>
											<NavigationMenuLink asChild>
												<Link href={item.href}>
													<div className="text-sm leading-none font-medium">
														{item.title}
													</div>
													<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
														{item.description}
													</p>
												</Link>
											</NavigationMenuLink>
										</li>
									))}
								</ul>
							</NavigationMenuContent>
						</NavigationMenuItem>

						{/* About */}
						<NavigationMenuItem>
							<Link
								href="/about"
								className={`bg-transparent px-0 text-sm leading-[22px] tracking-[0.28px] transition-colors ${
									isDark
										? "text-gray-300 hover:text-white"
										: "text-dark-700 hover:text-dark-900"
								}`}
							>
								About
							</Link>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>

				{/* Desktop CTA Button */}
				<div className="hidden lg:flex">
					<Link
						href="/cms"
						className="group flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-b from-teal-600 to-teal-700 px-4 py-2 text-sm leading-4 font-medium text-white shadow-sm transition-all hover:from-teal-700 hover:to-teal-800 hover:shadow-md"
					>
						<span>Get Started</span>
						<ArrowRightIcon className="relative top-px h-4 w-4 transition-transform group-hover:translate-x-1" />
					</Link>
				</div>

				{/* Mobile Menu Button */}
				<button
					type="button"
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					className={`flex items-center justify-center p-2 transition-colors duration-300 lg:hidden ${
						isDark ? "text-white" : "text-gray-900"
					}`}
					aria-label="Toggle menu"
				>
					{mobileMenuOpen ? (
						<X className="h-6 w-6" />
					) : (
						<Menu className="h-6 w-6" />
					)}
				</button>
			</Container>

			{/* Mobile Menu */}
			{mobileMenuOpen && (
				<div
					className={`absolute top-full right-0 left-0 z-50 max-h-[calc(100vh-80px)] overflow-y-auto shadow-lg transition-colors duration-300 lg:hidden ${
						isDark ? "bg-black" : "bg-white"
					}`}
					style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
				>
					<div className="flex flex-col gap-2 p-4">
						{/* Blog */}
						<Link
							href="/blog"
							className={`flex min-h-[44px] cursor-pointer touch-manipulation items-center border-b border-gray-200 py-3 text-sm font-semibold transition-colors active:opacity-70 ${
								isDark ? "text-white" : "text-dark-900"
							}`}
							onClick={() => setMobileMenuOpen(false)}
						>
							Blog
						</Link>

						{/* Documentation with submenu */}
						<div className="flex flex-col border-b border-gray-200 pb-2">
							<button
								type="button"
								onClick={() => toggleSection("docs")}
								className="flex w-full items-center justify-between py-2 text-left"
							>
								<span
									className={`text-sm font-semibold transition-colors duration-300 ${
										isDark ? "text-white" : "text-dark-900"
									}`}
								>
									Documentation
								</span>
								<ChevronDown
									className={`h-4 w-4 transition-all duration-300 ${
										expandedSection === "docs" ? "rotate-180" : ""
									} ${isDark ? "text-white" : "text-dark-900"}`}
								/>
							</button>
							{expandedSection === "docs" && (
								<div className="flex flex-col gap-2 pt-2 pl-4">
									{docsItems.map((item) => (
										<Link
											key={item.title}
											href={item.href}
											className="flex min-h-[44px] cursor-pointer touch-manipulation flex-col justify-center gap-0.5 py-1 active:opacity-70"
											onClick={() => setMobileMenuOpen(false)}
										>
											<span
												className={`text-sm font-medium ${
													isDark ? "text-white" : "text-dark-900"
												}`}
											>
												{item.title}
											</span>
											<span className="text-xs text-muted-foreground">
												{item.description}
											</span>
										</Link>
									))}
								</div>
							)}
						</div>

						{/* About */}
						<Link
							href="/about"
							className={`flex min-h-[44px] cursor-pointer touch-manipulation items-center border-b border-gray-200 py-3 text-sm font-semibold transition-colors active:opacity-70 ${
								isDark ? "text-white" : "text-dark-900"
							}`}
							onClick={() => setMobileMenuOpen(false)}
						>
							About
						</Link>

						{/* Mobile CTA */}
						<div className="mt-4">
							<Link
								href="/cms"
								className="group flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-b from-teal-600 to-teal-700 px-3 py-2 text-sm leading-4 font-medium text-white shadow-sm hover:shadow-md"
								onClick={() => setMobileMenuOpen(false)}
							>
								<span>Get Started</span>
								<ArrowRightIcon className="relative top-px h-4 w-4" />
							</Link>
						</div>
					</div>
				</div>
			)}
		</header>
	)
}
