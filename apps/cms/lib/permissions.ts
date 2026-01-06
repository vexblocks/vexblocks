/**
 * Role-based access control (RBAC) utilities
 */

export type UserRole = "admin" | "editor" | "developer" | "user"

export type DashboardRoute =
	| "dashboard"
	| "schemas"
	| "blocks"
	| "content"
	| "media"
	| "settings"
	| "settings/appearance"
	| "settings/localization"
	| "settings/preview"
	| "settings/users"

/**
 * Permissions matrix
 */
const PERMISSIONS: Record<UserRole, DashboardRoute[]> = {
	admin: [
		"dashboard",
		"schemas",
		"blocks",
		"content",
		"media",
		"settings",
		"settings/appearance",
		"settings/localization",
		"settings/preview",
		"settings/users",
	],
	developer: [
		"dashboard",
		"schemas",
		"blocks",
		"content",
		"media",
		// NO access to any Settings pages
	],
	editor: [
		"dashboard",
		"content",
		"media",
		// Can create, edit, delete content and media
	],
	user: [
		// No CMS access
	],
}

/**
 * Check if a user role has access to a specific route
 */
export function hasAccess(role: UserRole, route: DashboardRoute): boolean {
	return PERMISSIONS[role]?.includes(route) ?? false
}

/**
 * Check if a user role can access the CMS dashboard at all
 */
export function canAccessDashboard(role: UserRole): boolean {
	return role !== "user"
}

/**
 * Get all accessible routes for a role
 */
export function getAccessibleRoutes(role: UserRole): DashboardRoute[] {
	return PERMISSIONS[role] ?? []
}

/**
 * Check if user is admin
 */
export function isAdmin(role: UserRole): boolean {
	return role === "admin"
}

/**
 * Check if user can manage users (invite, disable, delete)
 */
export function canManageUsers(role: UserRole): boolean {
	return role === "admin"
}

/**
 * Check if user can manage settings
 */
export function canManageSettings(role: UserRole): boolean {
	return role === "admin"
}

/**
 * Check if user can create/edit schemas
 */
export function canManageSchemas(role: UserRole): boolean {
	return role === "admin" || role === "developer"
}

/**
 * Check if user can create/edit blocks
 */
export function canManageBlocks(role: UserRole): boolean {
	return role === "admin" || role === "developer"
}

/**
 * Check if user can create/edit content
 */
export function canManageContent(role: UserRole): boolean {
	return role === "admin" || role === "developer" || role === "editor"
}

/**
 * Check if user can upload/manage media
 */
export function canManageMedia(role: UserRole): boolean {
	return role === "admin" || role === "developer" || role === "editor"
}
