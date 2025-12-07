import { atom, useAtom } from "@lfades/atom"

// Atoms for sidebar state
const sidebarCollapsedAtom = atom(false)
const sidebarMobileOpenAtom = atom(false)

/**
 * Hook to manage sidebar state using @lfades/atom
 * No provider needed - atoms are shared globally
 */
export function useSidebar() {
	const [isCollapsed, setIsCollapsed] = useAtom(sidebarCollapsedAtom)
	const [isMobileOpen, setIsMobileOpen] = useAtom(sidebarMobileOpenAtom)

	const toggleCollapsed = () => setIsCollapsed(!isCollapsed)

	return {
		isCollapsed,
		setIsCollapsed,
		isMobileOpen,
		setIsMobileOpen,
		toggleCollapsed,
	}
}
