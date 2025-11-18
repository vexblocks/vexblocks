"use client"

import { type ReactNode, useEffect, useId, useRef } from "react"
import { useNavbarTheme } from "@/contexts/navbar-theme-context"

interface SectionColorDetectorProps {
	children: ReactNode
	variant: "light" | "dark"
	className?: string
}

export function SectionColorDetector({
	children,
	variant,
	className,
}: SectionColorDetectorProps) {
	const sectionRef = useRef<HTMLElement>(null)
	const { registerSection, unregisterSection } = useNavbarTheme()
	const sectionId = useId()

	useEffect(() => {
		const section = sectionRef.current
		if (!section) return

		const updatePosition = () => {
			const rect = section.getBoundingClientRect()
			const navbarHeight = 80

			// Check if the navbar area (top 80px) overlaps with this section
			const isOverlapping = rect.top < navbarHeight && rect.bottom > 0

			if (isOverlapping) {
				registerSection(sectionId, variant, rect.top)
			} else {
				unregisterSection(sectionId)
			}
		}

		// Check on scroll
		const handleScroll = () => {
			updatePosition()
		}

		// Check initial position
		updatePosition()

		// Use both scroll and intersection observer for better coverage
		window.addEventListener("scroll", handleScroll, { passive: true })

		const observer = new IntersectionObserver(
			() => {
				updatePosition()
			},
			{
				threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
				rootMargin: "0px",
			},
		)

		observer.observe(section)

		return () => {
			window.removeEventListener("scroll", handleScroll)
			observer.disconnect()
			unregisterSection(sectionId)
		}
	}, [variant, registerSection, unregisterSection, sectionId])

	return (
		<section ref={sectionRef} className={className}>
			{children}
		</section>
	)
}
