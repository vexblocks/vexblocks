"use client"

import { useEffect } from "react"
import { useNavbarTheme } from "@/contexts/navbar-theme-context"

interface NavbarThemeInitializerProps {
	theme: "light" | "dark"
	/**
	 * Additional CSS classes to apply to the navbar when scroll is at the top.
	 * These classes will be removed when user scrolls down.
	 */
	additionalClasses?: string
	/**
	 * If true, additional classes will only be applied when scroll position is at the top (scrollY = 0).
	 * When user scrolls down, the classes are removed, allowing SectionColorDetector to take control.
	 * @default false
	 */
	onlyAtTop?: boolean
}

/**
 * Client component to set the initial navbar theme and optional additional classes for a specific page.
 * Place this component at the top of your page to ensure the navbar
 * renders with the correct theme and styles from the start.
 *
 * @example
 * ```tsx
 * export default function MyPage() {
 *   return (
 *     <>
 *       <NavbarThemeInitializer
 *         theme="dark"
 *         additionalClasses="backdrop-blur-sm bg-black/90"
 *         onlyAtTop={true}
 *       />
 *       <YourPageContent />
 *     </>
 *   )
 * }
 * ```
 */
export function NavbarThemeInitializer({
	theme,
	additionalClasses = "",
	onlyAtTop = false,
}: NavbarThemeInitializerProps) {
	const { registerSection, unregisterSection, setAdditionalClasses } =
		useNavbarTheme()

	useEffect(() => {
		const sectionId = "navbar-theme-initializer"

		if (onlyAtTop) {
			// Only register when at top
			const handleScroll = () => {
				const scrolledToTop = window.scrollY === 0

				if (scrolledToTop) {
					registerSection(sectionId, theme, 0)
				} else {
					unregisterSection(sectionId)
				}
			}

			// Set initial state
			handleScroll()

			window.addEventListener("scroll", handleScroll, { passive: true })

			return () => {
				window.removeEventListener("scroll", handleScroll)
				unregisterSection(sectionId)
			}
		}

		// Always register if onlyAtTop is false
		registerSection(sectionId, theme, 0)

		return () => {
			unregisterSection(sectionId)
		}
	}, [theme, onlyAtTop, registerSection, unregisterSection])

	useEffect(() => {
		if (!additionalClasses) return

		if (onlyAtTop) {
			// Track scroll position
			const handleScroll = () => {
				const scrolledToTop = window.scrollY === 0

				// Apply or remove classes based on scroll position
				if (scrolledToTop) {
					setAdditionalClasses(additionalClasses)
				} else {
					setAdditionalClasses("")
				}
			}

			// Set initial state
			handleScroll()

			window.addEventListener("scroll", handleScroll, { passive: true })

			return () => {
				window.removeEventListener("scroll", handleScroll)
				setAdditionalClasses("")
			}
		}

		// Always apply classes if onlyAtTop is false
		setAdditionalClasses(additionalClasses)

		return () => {
			setAdditionalClasses("")
		}
	}, [additionalClasses, onlyAtTop, setAdditionalClasses])

	// This component doesn't render anything
	return null
}
