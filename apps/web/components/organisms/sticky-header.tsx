"use client"

import { useEffect, useRef, useState } from "react"
import { useNavbarTheme } from "@/contexts/navbar-theme-context"
import { Banner } from "./banner"
import { Navbar } from "./navbar"

export function StickyHeader() {
	const { theme } = useNavbarTheme()
	const [scrollY, setScrollY] = useState(0)
	const headerRef = useRef<HTMLDivElement>(null)

	const isDark = theme === "dark"

	useEffect(() => {
		const handleScroll = () => {
			setScrollY(window.scrollY)
		}

		handleScroll()
		window.addEventListener("scroll", handleScroll, { passive: true })
		return () => window.removeEventListener("scroll", handleScroll)
	}, [])

	// Calculate when banner should hide (35% of viewport height)
	const hideThreshold =
		typeof window !== "undefined" ? window.innerHeight * 0.35 : 200
	const shouldHideBanner = scrollY > hideThreshold

	// Calculate navbar blur and shadow based on scroll
	const hasScrolled = scrollY > 10

	return (
		<>
			{/* Static spacer - always present to reserve space */}
			<div ref={headerRef} className="w-full">
				<div className="h-10" /> {/* Banner height placeholder */}
				<div className="h-16" />
				{/* Navbar height placeholder */}
			</div>

			{/* Fixed header that overlays the spacer */}
			<div
				className={`fixed top-0 right-0 left-0 z-50 w-full transition-all duration-200 ${
					hasScrolled
						? isDark
							? "border-b border-gray-800 bg-black/95 backdrop-blur-sm"
							: "border-b bg-white/95 shadow-sm backdrop-blur-sm"
						: isDark
							? "border-b border-gray-800 bg-black"
							: "bg-white"
				}`}
			>
				<div
					className={`overflow-hidden transition-all duration-200 ease-in-out ${
						shouldHideBanner ? "max-h-0" : "max-h-10"
					}`}
				>
					<Banner />
				</div>
				<Navbar />
			</div>
		</>
	)
}
