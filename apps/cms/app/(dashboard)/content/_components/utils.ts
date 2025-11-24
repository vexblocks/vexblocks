// Helper to get nested value from contentData
export function getNestedValue(obj: any, path: string): any {
	const keys = path.split(/\.|\[|\]/).filter(Boolean)
	let current = obj
	for (const key of keys) {
		if (current === undefined || current === null) return undefined
		current = current[key]
	}
	return current
}

// Helper to set nested value in contentData (with deep cloning for arrays)
export function setNestedValue(obj: any, path: string, value: any): any {
	const keys = path.split(/\.|\[|\]/).filter(Boolean)

	// Deep clone using JSON (more reliable for nested structures)
	const newObj = JSON.parse(JSON.stringify(obj))
	let current = newObj

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i]
		if (!(key in current)) {
			const nextKey = keys[i + 1]
			current[key] = /^\d+$/.test(nextKey) ? [] : {}
		}
		current = current[key]
	}

	const lastKey = keys[keys.length - 1]
	current[lastKey] = value

	return newObj
}
