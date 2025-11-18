"use client"

import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react"

type NavbarTheme = "light" | "dark"

interface SectionInfo {
	id: string
	variant: NavbarTheme
	top: number
}

interface NavbarThemeContextType {
	theme: NavbarTheme
	additionalClasses: string
	registerSection: (id: string, variant: NavbarTheme, top: number) => void
	unregisterSection: (id: string) => void
	setAdditionalClasses: (classes: string) => void
}

const NavbarThemeContext = createContext<NavbarThemeContextType | undefined>(
	undefined,
)

export function NavbarThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<NavbarTheme>("light")
	const [additionalClasses, setAdditionalClasses] = useState<string>("")
	const sectionsRef = useRef<Map<string, SectionInfo>>(new Map())

	const updateTheme = useCallback(() => {
		const sections = Array.from(sectionsRef.current.values())
		if (sections.length === 0) return

		// Find the section that is closest to the top of the viewport (but still overlapping with navbar)
		// Filter sections that are overlapping with navbar (top < 80 and bottom > 0)
		const overlappingSections = sections.filter((section) => section.top < 80)

		if (overlappingSections.length > 0) {
			// Get the section with the highest top value (closest to navbar)
			const topSection = overlappingSections.reduce((prev, current) =>
				current.top > prev.top ? current : prev,
			)
			setTheme(topSection.variant)
		}
	}, [])

	const registerSection = useCallback(
		(id: string, variant: NavbarTheme, top: number) => {
			sectionsRef.current.set(id, { id, variant, top })
			updateTheme()
		},
		[updateTheme],
	)

	const unregisterSection = useCallback(
		(id: string) => {
			sectionsRef.current.delete(id)
			updateTheme()
		},
		[updateTheme],
	)

	return (
		<NavbarThemeContext.Provider
			value={{ 
				theme, 
				additionalClasses, 
				registerSection, 
				unregisterSection,
				setAdditionalClasses 
			}}
		>
			{children}
		</NavbarThemeContext.Provider>
	)
}

export function useNavbarTheme() {
	const context = useContext(NavbarThemeContext)
	if (context === undefined) {
		throw new Error("useNavbarTheme must be used within a NavbarThemeProvider")
	}
	return context
}
