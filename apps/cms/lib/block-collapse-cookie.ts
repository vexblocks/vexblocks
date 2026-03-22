const COOKIE_KEY = "vb_collapsed_blocks"

export function getCollapsedBlockIds(): Set<string> {
	if (typeof document === "undefined") return new Set()
	const match = document.cookie.match(/(?:^|; )vb_collapsed_blocks=([^;]*)/)
	if (!match) return new Set()
	try {
		return new Set(JSON.parse(decodeURIComponent(match[1])))
	} catch {
		return new Set()
	}
}

export function setBlockCollapsed(blockId: string, collapsed: boolean) {
	if (typeof document === "undefined") return
	const ids = getCollapsedBlockIds()
	if (collapsed) {
		ids.add(blockId)
	} else {
		ids.delete(blockId)
	}
	const expires = new Date()
	expires.setDate(expires.getDate() + 7)
	// biome-ignore lint/suspicious/noDocumentCookie: CookieStore API not available in all environments
	document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify([...ids]))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}
